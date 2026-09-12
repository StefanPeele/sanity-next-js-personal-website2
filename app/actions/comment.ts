'use server'

import { randomBytes } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { Resend } from 'resend'
import { z } from 'zod'
import { escapeHtml, getClientIp } from '@/lib/security'
import { clientHash, rateLimitDurable } from '@/lib/rateStore'
import { absoluteUrl, SITE } from '@/lib/site'
import { getWriteClient } from '@/sanity/lib/writeClient'
import { COMMENT_LABEL_VALUES, COMMENT_LIMITS } from '@/lib/comments'
// app/actions/comment.ts — Phase 8.1.
//
// The same double opt-in round trip app/actions/subscribe.ts already runs, with one
// addition that does most of the anti-spam work: an address that has confirmed a comment
// before skips the round trip entirely and publishes immediately.
//
//   1. validate + honeypot + timing check + link heuristic
//   2. DURABLE rate limit (lib/rateStore.ts, not the in-memory one -- see below)
//   3. write the comment as `pending`
//   4. if the address has published before, publish it now; otherwise email a confirm link
//
// The comment is written BEFORE verification rather than held in the token. A pending
// comment is invisible to every read query, so it costs an unconfirmed row, and it makes
// "you wrote this, go and confirm it" recoverable instead of lost in a URL.

export type CommentState = {
  status: 'idle' | 'success' | 'pending' | 'error'
  message?: string
}

const schema = z.object({
  postId: z.string().min(1).max(80),
  slug: z.string().min(1).max(200),
  label: z.enum(COMMENT_LABEL_VALUES as [string, ...string[]]),
  body: z.string().trim().min(COMMENT_LIMITS.body.min).max(COMMENT_LIMITS.body.max),
  email: z.email({ message: 'Enter a valid email address.' }).max(COMMENT_LIMITS.email.max),
  name: z.string().trim().max(COMMENT_LIMITS.name.max).optional(),
  anonymous: z.boolean().optional(),
  parentId: z.string().max(80).optional(),
  anchor: z.string().max(64).optional(),
  // Honeypot — real people never fill this in.
  website: z.string().max(0).optional(),
  // Milliseconds between the form rendering and the submit. A human cannot read an article,
  // form a thought and type it in under three seconds.
  elapsed: z.coerce.number().optional(),
})

const FROM = `Stefan Peele <${SITE.bookingEmail}>`

function confirmEmailHtml(confirmUrl: string, body: string): string {
  const excerpt = body.length > 220 ? `${body.slice(0, 220)}…` : body
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:'Courier New',monospace;background:#0a0a0a;color:#d6d3d1;padding:32px;margin:0;">
  <div style="max-width:560px;margin:0 auto;">
    <p style="font-size:10px;text-transform:uppercase;letter-spacing:0.3em;color:#a8a29e;margin-bottom:24px;">
      STEFANPEELE.COM // CONFIRM YOUR COMMENT
    </p>
    <h1 style="font-family:Georgia,serif;font-size:28px;color:#fff;margin:0 0 12px 0;">One click and it is posted.</h1>
    <p style="font-size:14px;color:#a8a29e;margin:0 0 20px 0;line-height:1.6;">
      This confirms it is really your address. It is the only time you will be asked —
      anything you write afterwards from this address posts straight away.
    </p>
    <blockquote style="border-left:2px solid rgba(255,255,255,0.18);margin:0 0 24px 0;padding:4px 0 4px 16px;font-size:13px;color:#d6d3d1;line-height:1.6;">
      ${escapeHtml(excerpt)}
    </blockquote>
    <p style="margin:0 0 28px 0;">
      <a href="${escapeHtml(confirmUrl)}" style="display:inline-block;background:#fff;color:#0a0a0a;text-decoration:none;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;padding:14px 24px;">Post my comment</a>
    </p>
    <p style="font-size:11px;color:#a8a29e;margin:0 0 6px 0;line-height:1.6;">
      If the button does not work, open this link:<br>
      <a href="${escapeHtml(confirmUrl)}" style="color:#d6d3d1;">${escapeHtml(confirmUrl)}</a>
    </p>
    <p style="font-size:11px;color:#78716c;margin:24px 0 0 0;border-top:1px solid rgba(255,255,255,0.08);padding-top:16px;line-height:1.6;">
      Didn't write this? Ignore this email — nothing is posted until you click, and the
      draft is deleted after a week. Your address is never shown to anyone.
    </p>
  </div>
</body></html>`
}

/** Two or more links in a comment from an address with no history is the highest-precision
 *  spam signal available without a third party (§1.7). It HOLDS, it does not reject —
 *  a genuine comment citing two sources is exactly the comment worth waiting for. */
function linkCount(text: string): number {
  return (text.match(/https?:\/\//gi) ?? []).length
}

export async function postComment(_prev: CommentState, formData: FormData): Promise<CommentState> {
  const raw = {
    postId: String(formData.get('postId') ?? ''),
    slug: String(formData.get('slug') ?? ''),
    label: String(formData.get('label') ?? ''),
    body: String(formData.get('body') ?? ''),
    email: String(formData.get('email') ?? '').trim().toLowerCase(),
    name: String(formData.get('name') ?? '').trim(),
    anonymous: formData.get('anonymous') === 'on' || formData.get('anonymous') === 'true',
    parentId: String(formData.get('parentId') ?? '') || undefined,
    anchor: String(formData.get('anchor') ?? '') || undefined,
    website: String(formData.get('website') ?? ''),
    elapsed: formData.get('elapsed') ?? undefined,
  }

  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    // Honeypot filled: report success so the bot moves on instead of retrying.
    if (raw.website.length > 0) return { status: 'success', message: 'Thanks — your comment is posted.' }
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Something in that was not valid.' }
  }
  const v = parsed.data

  // Same treatment as the honeypot: a submission faster than a person can type is answered
  // with success and dropped, because telling a bot which check it failed is free tuning.
  if (typeof v.elapsed === 'number' && v.elapsed > 0 && v.elapsed < 3000) {
    return { status: 'success', message: 'Thanks — your comment is posted.' }
  }

  const write = getWriteClient()
  if (!write) return { status: 'error', message: 'Comments are unavailable right now.' }

  const ip = await getClientIp()

  // DURABLE, not lib/security.ts's in-memory limiter: on Vercel that one is per instance and
  // resets on every cold start, which on an open comment box is the difference between a
  // limit and the appearance of one. fallbackOpen stays false -- if the limiter cannot work,
  // a comment is refused rather than waved through during the outage nobody is watching.
  const limit = await rateLimitDurable('comment', ip, 3, 10 * 60 * 1000)
  if (!limit.ok) {
    return {
      status: 'error',
      message: limit.degraded
        ? 'Comments are unavailable right now. Try again shortly.'
        : `That is three comments in ten minutes. Try again in ${Math.ceil(limit.retryAfterSeconds / 60)} min.`,
    }
  }

  try {
    // One query answers both spam questions: is this address blocked, and has it posted
    // before? Two round trips here would double the cost of the one path a stranger can hit.
    const history = await write.fetch<{ blocked: number; published: number }, { email: string; ipHash: string }>(
      `{
        "blocked": count(*[_type == "blocklist" && (email == $email || ipHash == $ipHash)]),
        "published": count(*[_type == "comment" && email == $email && status == "published"])
      }`,
      { email: v.email, ipHash: clientHash(ip) },
    )

    // A blocked address is answered exactly like a successful post. It learns nothing.
    if (history.blocked > 0) return { status: 'success', message: 'Thanks — your comment is posted.' }

    // 8.3: one level, enforced at WRITE time. If the comment being replied to is itself a
    // reply, the new one is re-parented to that comment's root, so the stored data can never
    // form a tree and no future query has to flatten one.
    let parentRef: string | undefined
    if (v.parentId) {
      const p = await write.fetch<{ _id: string; parentId: string | null } | null, { id: string }>(
        `*[_type == "comment" && _id == $id][0]{ _id, "parentId": parent._ref }`,
        { id: v.parentId },
      )
      if (p) parentRef = p.parentId ?? p._id
    }

    const trusted = history.published > 0
    const links = linkCount(v.body)
    // Trust is per address, but a first comment carrying two links is held regardless.
    const publishNow = trusted && links < 2
    const token = randomBytes(24).toString('hex')
    const now = new Date().toISOString()

    const doc = await write.create({
      _type: 'comment',
      post: { _type: 'reference', _ref: v.postId, _weak: true },
      ...(parentRef ? { parent: { _type: 'reference', _ref: parentRef, _weak: true } } : {}),
      ...(v.anchor ? { anchor: v.anchor } : {}),
      label: v.label,
      authorName: v.anonymous ? null : v.name || null,
      anonymous: !!v.anonymous,
      email: v.email,
      body: v.body,
      status: publishNow ? 'published' : 'pending',
      token,
      createdAt: now,
      ...(publishNow ? { publishedAt: now } : {}),
      ipHash: clientHash(ip),
    })

    if (publishNow) {
      // Same reason as the confirm route: a published comment that the page's fetch cache
      // does not know about is a comment nobody sees.
      revalidatePath(`/blog/${v.slug}`)
      return { status: 'success', message: 'Posted.' }
    }

    const confirmUrl = absoluteUrl(`/api/comments/confirm?token=${token}`)
    const key = process.env.RESEND_API_KEY
    if (!key) {
      console.error('[comment] RESEND_API_KEY missing; comment left pending', doc._id)
      return { status: 'error', message: 'Could not send the confirmation email. Try again later.' }
    }
    await new Resend(key).emails.send({
      from: FROM,
      to: v.email,
      subject: 'Confirm your comment on stefanpeele.com',
      html: confirmEmailHtml(confirmUrl, v.body),
    })

    return {
      status: 'pending',
      message: 'Check your inbox — one click and it is posted. This is the only time you will be asked.',
    }
  } catch (err) {
    console.error('[comment] failed', err)
    return { status: 'error', message: 'Something went wrong posting that. Try again.' }
  }
}
