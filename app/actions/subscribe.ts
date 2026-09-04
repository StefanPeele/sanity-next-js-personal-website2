'use server'

import { randomBytes } from 'node:crypto'
import { Resend } from 'resend'
import { z } from 'zod'
import { escapeHtml, getClientIp, rateLimit } from '@/lib/security'
import { absoluteUrl, SITE } from '@/lib/site'
import { getWriteClient } from '@/sanity/lib/writeClient'
// app/actions/subscribe.ts
// Newsletter double opt-in:
//   1. validate + honeypot + rate limit (5 per 10 min per IP)
//   2. upsert a `subscriber` document in Sanity (dedupe by email)
//   3. email a confirmation link → /api/subscribe/confirm?token=…
// Unsubscribe links point at /api/subscribe/unsubscribe?token=…

export type SubscribeState = {
  status: 'idle' | 'success' | 'error'
  message?: string
}

const schema = z.object({
  email: z.email({ message: 'Enter a valid email address.' }).max(254),
  source: z.string().max(64).optional(),
  // Honeypot — real users never fill this in.
  website: z.string().max(0).optional(),
})

const FROM = `Stefan Peele <${SITE.bookingEmail}>`

function confirmationEmailHtml(confirmUrl: string, unsubscribeUrl: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:'Courier New',monospace;background:#0a0a0a;color:#d6d3d1;padding:32px;margin:0;">
  <div style="max-width:560px;margin:0 auto;">
    <p style="font-size:10px;text-transform:uppercase;letter-spacing:0.3em;color:#a8a29e;margin-bottom:24px;">
      STEFANPEELE.COM // CONFIRM YOUR SUBSCRIPTION
    </p>
    <h1 style="font-family:Georgia,serif;font-size:28px;color:#fff;margin:0 0 12px 0;">One more step.</h1>
    <p style="font-size:14px;color:#a8a29e;margin:0 0 28px 0;line-height:1.6;">
      Confirm that you want new writing from Stefan Peele — network engineering deep dives,
      field notes and the occasional photo essay. No more than a few emails a month.
    </p>
    <p style="margin:0 0 28px 0;">
      <a href="${escapeHtml(confirmUrl)}" style="display:inline-block;background:#fff;color:#0a0a0a;text-decoration:none;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;padding:14px 24px;">Confirm subscription</a>
    </p>
    <p style="font-size:11px;color:#a8a29e;margin:0 0 6px 0;line-height:1.6;">
      If the button does not work, open this link:<br>
      <a href="${escapeHtml(confirmUrl)}" style="color:#d6d3d1;">${escapeHtml(confirmUrl)}</a>
    </p>
    <p style="font-size:11px;color:#78716c;margin:24px 0 0 0;border-top:1px solid rgba(255,255,255,0.08);padding-top:16px;line-height:1.6;">
      Didn't sign up? Ignore this email — nothing is sent until you confirm.
      <a href="${escapeHtml(unsubscribeUrl)}" style="color:#a8a29e;">Remove my address</a>.
    </p>
  </div>
</body></html>`
}

export async function subscribe(_prev: SubscribeState, formData: FormData): Promise<SubscribeState> {
  const parsed = schema.safeParse({
    email: String(formData.get('email') ?? '').trim().toLowerCase(),
    source: String(formData.get('source') ?? 'site'),
    website: String(formData.get('website') ?? ''),
  })

  if (!parsed.success) {
    // Honeypot filled: pretend success so bots move on.
    if (String(formData.get('website') ?? '').length > 0) {
      return { status: 'success', message: 'Check your inbox to confirm.' }
    }
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const ip = await getClientIp()
  const limit = rateLimit(`subscribe:${ip}`, 5, 10 * 60 * 1000)
  if (!limit.ok) {
    return {
      status: 'error',
      message: `Too many attempts. Try again in ${Math.ceil(limit.retryAfterSeconds / 60)} min.`,
    }
  }

  const client = getWriteClient()
  if (!client) {
    console.error('[subscribe] SANITY_API_WRITE_TOKEN is not set')
    return {
      status: 'error',
      message: `Subscriptions are offline right now. Email ${SITE.email} and I'll add you by hand.`,
    }
  }
  if (!process.env.RESEND_API_KEY) {
    console.error('[subscribe] RESEND_API_KEY is not set')
    return { status: 'error', message: 'Email delivery is not configured yet. Try again later.' }
  }

  const { email, source } = parsed.data

  try {
    const existing = await client.fetch<{ _id: string; status: string; token?: string } | null, { email: string }>(
      `*[_type == "subscriber" && email == $email][0]{ _id, status, token }`,
      { email },
    )

    if (existing?.status === 'confirmed') {
      return { status: 'success', message: "You're already on the list." }
    }

    const token = existing?.token || randomBytes(24).toString('base64url')
    const now = new Date().toISOString()

    if (existing) {
      await client
        .patch(existing._id)
        .set({ status: 'pending', token, source, createdAt: now, unsubscribedAt: null })
        .commit()
    } else {
      await client.create({
        _type: 'subscriber',
        email,
        status: 'pending',
        source,
        token,
        createdAt: now,
      })
    }

    const confirmUrl = absoluteUrl(`/api/subscribe/confirm?token=${encodeURIComponent(token)}`)
    const unsubscribeUrl = absoluteUrl(`/api/subscribe/unsubscribe?token=${encodeURIComponent(token)}`)

    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error } = await resend.emails.send({
      from: FROM,
      to: email,
      replyTo: SITE.email,
      subject: 'Confirm your subscription — stefanpeele.com',
      html: confirmationEmailHtml(confirmUrl, unsubscribeUrl),
      headers: { 'List-Unsubscribe': `<${unsubscribeUrl}>` },
    })
    if (error) throw error

    return { status: 'success', message: 'Check your inbox to confirm.' }
  } catch (err) {
    console.error('[subscribe] failed', err)
    return { status: 'error', message: `Something went wrong. Email ${SITE.email} and I'll add you by hand.` }
  }
}
