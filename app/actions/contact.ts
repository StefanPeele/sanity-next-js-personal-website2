'use server'

// app/actions/contact.ts
// Professional contact form (recruiters, collaborators). Sends one email to
// Stefan via Resend. No CRM write — photography clients use the booking form.

import { Resend } from 'resend'
import { z } from 'zod'
import { escapeHtml, getClientIp, rateLimit } from '@/lib/security'
import { SITE } from '@/lib/site'
import { emailShell, eyebrow, kvTable, panel } from './email-templates'

export interface ContactResult {
  success: boolean
  error?: string
}

const ContactSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name.').max(100, 'Name is too long.').transform((s) => s.replace(/\s+/g, ' ')),
  email: z.email('Please enter a valid email address.').trim().toLowerCase().max(200),
  company: z.string().trim().max(120, 'Company is too long.').default(''),
  message: z.string().trim().min(10, 'A sentence or two helps me reply well.').max(2000, 'Message is too long (2000 characters max).'),
  website: z.string().max(0),
})

export async function contactAction(formData: FormData): Promise<ContactResult> {
  const parsed = ContactSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    company: formData.get('company') ?? '',
    message: formData.get('message'),
    website: formData.get('website') ?? '',
  })
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    if (issue?.path[0] === 'website') return { success: true }
    return { success: false, error: issue?.message ?? 'Please check the form and try again.' }
  }
  const input = parsed.data

  const ip = await getClientIp()
  const limit = rateLimit(`contact:ip:${ip}`, 3, 10 * 60 * 1000)
  if (!limit.ok) {
    return { success: false, error: `Too many messages from this connection. Try again in ${Math.ceil(limit.retryAfterSeconds / 60)} minutes.` }
  }
  const emailLimit = rateLimit(`contact:email:${input.email}`, 1, 10 * 60 * 1000)
  if (!emailLimit.ok) return { success: false, error: 'You already sent a message a moment ago — I have it.' }

  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.error('[contact] RESEND_API_KEY missing')
    return { success: false, error: `The form is temporarily unavailable. Email me directly at ${SITE.email}.` }
  }

  const e = escapeHtml
  try {
    await new Resend(key).emails.send({
      from: `stefanpeele.com <${SITE.bookingEmail}>`,
      to: SITE.email,
      replyTo: input.email,
      subject: `Contact: ${input.name}${input.company ? ` (${input.company})` : ''}`,
      html: emailShell({
        preheader: 'Contact form // stefanpeele.com',
        title: e(input.name),
        body:
          kvTable([
            ['Email', `<a href="mailto:${e(input.email)}" style="color:#d6d3d1;">${e(input.email)}</a>`],
            ['Company', e(input.company) || '—'],
          ]) +
          panel(eyebrow('Message') + `<p style="font-size:13px;color:#a8a29e;margin:0;line-height:1.6;white-space:pre-wrap;">${e(input.message)}</p>`),
        signoff: 'stefanpeele.com contact form',
      }),
    })
  } catch (err) {
    console.error('[contact] Resend error:', err)
    return { success: false, error: `Something went wrong. Email me directly at ${SITE.email}.` }
  }
  return { success: true }
}
