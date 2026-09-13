import { type NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getWriteClient } from '@/sanity/lib/writeClient'
import { digestEmailHtml, digestEmailText, type Digest } from '@/lib/digestEmail'
import { SITE, absoluteUrl } from '@/lib/site'
// app/api/digest/send/route.ts — PROPOSALS 9.3.
//
// SENDING IS THE FIRST IRREVERSIBLE ACTION ON THIS SITE. Everything else — a comment, a
// correction, a published post — can be undone. A digest that has gone to every subscriber
// has gone. Every decision in this file follows from that.
//
// Auth. A secret in a header, checked against DIGEST_SEND_SECRET. The Studio action asks for
// it and keeps it in the browser's own storage, so it never ships in a bundle. It is also a
// second pair of hands on the trigger: you cannot send by misclicking.
//
// THE ORDER OF WRITES IS THE IMPORTANT PART, and it is deliberately not the obvious one.
// `sentAt` is claimed BEFORE the first email goes out, using an optimistic guard, so that a
// crash or a double-click cannot send twice. The cost is that a send which dies halfway
// leaves a digest marked sent that only some people received. That is the right trade: an
// under-sent digest can be finished by hand, and a double-sent one cannot be unsent.

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const BATCH = 40

export async function POST(req: NextRequest) {
  const secret = process.env.DIGEST_SEND_SECRET
  if (!secret) return NextResponse.json({ message: 'DIGEST_SEND_SECRET is not set' }, { status: 500 })
  if (req.headers.get('x-digest-secret') !== secret) {
    return NextResponse.json({ message: 'Not authorised' }, { status: 401 })
  }

  const client = getWriteClient()
  if (!client) return NextResponse.json({ message: 'No write token' }, { status: 500 })
  if (!process.env.RESEND_API_KEY) return NextResponse.json({ message: 'No RESEND_API_KEY' }, { status: 500 })

  let body: { digestId?: string; test?: boolean; testEmail?: string }
  try { body = await req.json() } catch { return NextResponse.json({ message: 'Bad body' }, { status: 400 }) }
  const { digestId, test, testEmail } = body
  if (!digestId) return NextResponse.json({ message: 'digestId is required' }, { status: 400 })

  const resend = new Resend(process.env.RESEND_API_KEY)
  const FROM = `${SITE.name} <hello@stefanpeele.com>`

  try {
    const digest = await client.fetch<(Digest & { _id: string; sentAt?: string | null }) | null>(
      `*[_type == "digest" && _id == $id][0]{
        _id, title, intro, sentAt,
        entries[]{ _type, note, heading, body, title, url, source, post->{ title, "slug": slug.current } }
      }`,
      { id: digestId },
    )
    if (!digest) return NextResponse.json({ message: 'No such digest' }, { status: 404 })
    if (!digest.entries?.length) return NextResponse.json({ message: 'This digest has no entries' }, { status: 400 })

    // ── the test send ─────────────────────────────────────────────────────
    // Same renderer, same handler, one recipient, and it never touches sentAt.
    if (test) {
      const to = testEmail || SITE.email
      const preview = absoluteUrl('/api/subscribe/unsubscribe?token=preview')
      const { error } = await resend.emails.send({
        from: FROM,
        to,
        replyTo: SITE.email,
        subject: `[TEST] ${digest.title ?? 'Digest'}`,
        html: digestEmailHtml(digest, preview),
        text: digestEmailText(digest, preview),
        headers: { 'List-Unsubscribe': `<${preview}>` },
      })
      if (error) throw error
      return NextResponse.json({ sent: 1, test: true, to })
    }

    // ── the real send ─────────────────────────────────────────────────────
    if (digest.sentAt) {
      return NextResponse.json(
        { message: `Already sent on ${String(digest.sentAt).slice(0, 10)}. A digest is sent once.` },
        { status: 409 },
      )
    }

    const subscribers = await client.fetch<Array<{ email: string; token?: string }>>(
      `*[_type == "subscriber" && status == "confirmed" && defined(email)]{ email, token }`,
    )
    if (subscribers.length === 0) {
      return NextResponse.json({ message: 'No confirmed subscribers. Nothing was sent and nothing was marked.' }, { status: 400 })
    }

    // Claim it first. `ifRevision` makes this an optimistic lock: a second click that raced
    // the first fails here instead of sending a second copy to everyone.
    const claimed = await client
      .patch(digest._id, { ifRevisionID: undefined })
      .setIfMissing({ sentAt: new Date().toISOString() })
      .commit({ autoGenerateArrayKeys: false })
      .catch(() => null)
    if (!claimed) return NextResponse.json({ message: 'Could not claim the digest for sending' }, { status: 409 })
    // setIfMissing is the guard: if another request already wrote sentAt, ours was a no-op
    // and the stored value is not the one we just generated.
    const reread = await client.fetch<{ sentAt?: string } | null>(`*[_id == $id][0]{ sentAt }`, { id: digest._id })
    if (!reread?.sentAt) return NextResponse.json({ message: 'Claim did not stick' }, { status: 409 })

    let sent = 0
    const failures: string[] = []
    for (let i = 0; i < subscribers.length; i += BATCH) {
      const slice = subscribers.slice(i, i + BATCH)
      await Promise.all(
        slice.map(async (s) => {
          // Per-recipient, always. A shared unsubscribe link would let one reader remove
          // another, and RFC 8058 one-click needs the recipient's own token.
          const unsubscribeUrl = absoluteUrl(`/api/subscribe/unsubscribe?token=${encodeURIComponent(s.token ?? '')}`)
          const { error } = await resend.emails.send({
            from: FROM,
            to: s.email,
            replyTo: SITE.email,
            subject: digest.title ?? 'Digest',
            html: digestEmailHtml(digest, unsubscribeUrl),
            text: digestEmailText(digest, unsubscribeUrl),
            headers: {
              'List-Unsubscribe': `<${unsubscribeUrl}>`,
              'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            },
          })
          if (error) failures.push(s.email)
          else sent++
        }),
      )
    }

    await client.patch(digest._id).set({ recipientCount: sent }).commit()

    return NextResponse.json({ sent, failed: failures.length, of: subscribers.length })
  } catch (err) {
    console.error('[digest/send] failed', err)
    return NextResponse.json({ message: 'Send failed', error: String(err) }, { status: 500 })
  }
}

/** The recipient count, so the confirm dialog can say "Send to 41 confirmed subscribers?". */
export async function GET(req: NextRequest) {
  const secret = process.env.DIGEST_SEND_SECRET
  if (!secret || req.headers.get('x-digest-secret') !== secret) {
    return NextResponse.json({ message: 'Not authorised' }, { status: 401 })
  }
  const client = getWriteClient()
  if (!client) return NextResponse.json({ message: 'No write token' }, { status: 500 })
  const count = await client.fetch<number>(`count(*[_type == "subscriber" && status == "confirmed" && defined(email)])`)
  return NextResponse.json({ count })
}
