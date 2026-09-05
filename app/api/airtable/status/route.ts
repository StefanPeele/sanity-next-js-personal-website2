// app/api/airtable/status/route.ts
// Airtable → client status emails.
//
// Point an Airtable automation at this endpoint:
//   1. Automations → "When record matches conditions" on the Shoots table
//      (Status is one of: Confirmed, Editing, Delivered, Complete).
//   2. Action: "Run a script" (or "Send webhook" if available on your plan) with
//        await fetch("https://stefanpeele.com/api/airtable/status", {
//          method: "POST",
//          headers: {
//            "content-type": "application/json",
//            "x-webhook-secret": "<AIRTABLE_WEBHOOK_SECRET>"
//          },
//          body: JSON.stringify({
//            recordId: record.id,
//            status: "Confirmed",              // Confirmed | Editing | Delivered | Complete
//            email: record.getCellValueAsString("Client Email"),
//            name: record.getCellValueAsString("Client Name"),
//            shootType: record.getCellValueAsString("Package"),
//            deliveryUrl: record.getCellValueAsString("Delivery Link") // optional
//          })
//        })
//   3. Set AIRTABLE_WEBHOOK_SECRET (any long random string) in Vercel and in the script.
//
// The endpoint is idempotent per (recordId, status) for 24h so a re-run of the
// automation does not double-email a client.

import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { z } from 'zod'
import { escapeHtml, rateLimit, safeEqual } from '@/lib/security'
import { SITE } from '@/lib/site'
import { bulletList, button, emailShell, eyebrow, panel, paragraph } from '@/app/actions/email-templates'

export const runtime = 'nodejs'

const STATUSES = ['Confirmed', 'Editing', 'Delivered', 'Complete'] as const
type Status = (typeof STATUSES)[number]

const PayloadSchema = z.object({
  recordId: z.string().trim().min(1).max(64),
  status: z.enum(STATUSES),
  email: z.email().trim().toLowerCase().max(200),
  name: z.string().trim().min(1).max(100),
  shootType: z.string().trim().max(120).optional().default(''),
  deliveryUrl: z.union([z.url().max(500), z.literal('')]).optional().default(''),
})

function firstName(name: string): string {
  return name.split(/\s+/)[0] ?? name
}

function buildEmail(status: Status, name: string, shootType: string, deliveryUrl: string): { subject: string; html: string } {
  const e = escapeHtml
  const fn = e(firstName(name))
  const what = shootType ? e(shootType) : 'session'
  const galleryButton = deliveryUrl ? `<p style="margin:0 0 24px 0;">${button(deliveryUrl, 'Open your gallery')}</p>` : ''

  switch (status) {
    case 'Confirmed':
      return {
        subject: `Confirmed — your ${shootType || 'session'} with Stefan Peele`,
        html: emailShell({
          preheader: 'Stefan Peele Photography · Booking confirmed',
          title: `We're on, ${fn}.`,
          body:
            paragraph(`Your <strong style="color:#fff;">${what}</strong> is confirmed. Date, location and the plan we talked through are locked in on my end.`) +
            panel(
              eyebrow('Between now and the shoot') +
                bulletList([
                  "I'll send a reminder with the meeting point 48 hours before",
                  'Reply to this email any time if plans shift — earlier is always easier',
                  'Wardrobe and prep notes are in your session guide',
                ]),
            ) +
            paragraph('Thanks for trusting me with this. See you soon.'),
        }),
      }
    case 'Editing':
      return {
        subject: `In the darkroom — your ${shootType || 'session'} is being edited`,
        html: emailShell({
          preheader: 'Stefan Peele Photography · Editing',
          title: `Your frames are on the bench, ${fn}.`,
          body:
            paragraph(`The shoot is done and the culling is finished. I'm now color-grading and retouching your <strong style="color:#fff;">${what}</strong>.`) +
            panel(
              eyebrow('What happens next') +
                bulletList([
                  'A sneak peek lands in your inbox first',
                  'The full gallery follows within the turnaround we agreed on',
                  'TIFF hero files and the social pack ship with the gallery',
                ]),
            ),
        }),
      }
    case 'Delivered':
      return {
        subject: `Delivered — your ${shootType || 'session'} gallery is ready`,
        html: emailShell({
          preheader: 'Stefan Peele Photography · Delivered',
          title: `It's ready, ${fn}.`,
          body:
            paragraph(`Your <strong style="color:#fff;">${what}</strong> gallery is live. Full-resolution JPEGs, your hero TIFFs and the social media pack are all inside.`) +
            galleryButton +
            panel(
              eyebrow('A few notes') +
                bulletList([
                  'Download everything you want to keep — galleries are not permanent storage',
                  'Print-ready TIFFs are in their own folder, labeled for the lab',
                  'Want a re-edit or a different crop on any frame? Just reply.',
                ]),
            ),
        }),
      }
    case 'Complete':
      return {
        subject: `Thank you — ${shootType || 'session'} complete`,
        html: emailShell({
          preheader: 'Stefan Peele Photography · Complete',
          title: `That's a wrap, ${fn}.`,
          body:
            paragraph(`Your <strong style="color:#fff;">${what}</strong> is marked complete on my end — physical product included, if you chose one.`) +
            galleryButton +
            paragraph('If the photos did their job, a short note I can share with future clients means a lot. And if anything fell short, tell me — I make it right.') +
            paragraph(`Next time you need coverage, you know where to find me: <a href="${SITE.url}/services" style="color:#fff;">${SITE.url.replace(/^https?:\/\//, '')}/services</a>.`),
        }),
      }
  }
}

export async function POST(req: Request) {
  const secret = process.env.AIRTABLE_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ ok: false, error: 'Webhook not configured' }, { status: 503 })

  const provided = req.headers.get('x-webhook-secret') ?? req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? ''
  if (!safeEqual(provided, secret)) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = PayloadSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Invalid payload', issues: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`) }, { status: 400 })
  }
  const { recordId, status, email, name, shootType, deliveryUrl } = parsed.data

  // Idempotency: one email per record per status per day.
  const dedupe = rateLimit(`airtable:${recordId}:${status}`, 1, 24 * 60 * 60 * 1000)
  if (!dedupe.ok) return NextResponse.json({ ok: true, skipped: 'duplicate' })

  const key = process.env.RESEND_API_KEY
  if (!key) return NextResponse.json({ ok: false, error: 'RESEND_API_KEY missing' }, { status: 503 })

  const { subject, html } = buildEmail(status, name, shootType, deliveryUrl)
  try {
    await new Resend(key).emails.send({
      from: `Stefan Peele <${SITE.bookingEmail}>`,
      to: email,
      replyTo: SITE.email,
      subject,
      html,
    })
  } catch (err) {
    console.error('[airtable/status] Resend error:', err)
    return NextResponse.json({ ok: false, error: 'Email send failed' }, { status: 502 })
  }
  return NextResponse.json({ ok: true, status, recordId })
}
