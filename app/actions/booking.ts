'use server'

// app/actions/booking.ts
// Photography inquiry: validate → rate-limit → Airtable (client + shoot) → Resend.
// Every user-supplied string is validated with zod and HTML-escaped before it
// touches an email. Airtable formulas are escaped separately.

import Airtable from 'airtable'
import { Resend } from 'resend'
import { z } from 'zod'
import { ADD_ONS, ADD_ON_IDS, NOT_SURE_ID, PACKAGE_IDS, getAddOn, getPackage, packageLabel } from '@/lib/pricing'
import { escapeHtml, getClientIp, rateLimit } from '@/lib/security'
import { SITE } from '@/lib/site'
import { bulletList, emailShell, eyebrow, kvTable, panel, paragraph } from './email-templates'

export interface BookingResult {
  success: boolean
  error?: string
}

// ── Validation ────────────────────────────────────────────────────
const BookingSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name.').max(100, 'Name is too long.').transform((s) => s.replace(/s+/g, ' ')),
  email: z.email('Please enter a valid email address.').trim().toLowerCase().max(200),
  phone: z.string().trim().max(40, 'Phone number is too long.').default(''),
  preferredDate: z
    .string()
    .trim()
    .regex(/^(\d{4}-\d{2}-\d{2})?$/, 'Preferred date must be a calendar date.')
    .default(''),
  zoomAvailability: z.string().trim().max(300, 'Availability note is too long.').default(''),
  package: z.enum([NOT_SURE_ID, ...PACKAGE_IDS] as [string, ...string[]], { error: 'Please choose a package.' }),
  addOns: z.array(z.enum(ADD_ON_IDS as [string, ...string[]])).max(ADD_ON_IDS.length),
  njit: z.boolean(),
  message: z.string().trim().min(1, 'Tell me a little about the occasion.').max(2000, 'Message is too long (2000 characters max).'),
  /** Honeypot — real users never see or fill this. */
  website: z.string().max(0),
})

type BookingInput = z.infer<typeof BookingSchema>

// ── Shoot-type copy ───────────────────────────────────────────────
type ShootType = 'grad' | 'headshot' | 'brand' | 'club' | 'event' | 'portrait' | 'general'

function detectShootType(packageId: string): ShootType {
  switch (packageId) {
    case 'graduation': return 'grad'
    case 'headshot-mini': return 'headshot'
    case 'personal-brand': return 'brand'
    case 'club-headshot-day': return 'club'
    case 'event-core':
    case 'event-premium': return 'event'
    case 'portrait-core':
    case 'portrait-premium': return 'portrait'
    default: return 'general'
  }
}

const SHOOT_LABEL: Record<ShootType, string> = {
  grad: 'Graduation Session',
  headshot: 'Headshot Session',
  brand: 'Personal Brand / Content Session',
  club: 'Club / Organization Headshot Day',
  event: 'Event Coverage',
  portrait: 'Portrait Session',
  general: 'Photography Session',
}

const PREP_HINTS: Record<ShootType, string[]> = {
  grad: [
    'Cap and gown — steamed in advance (it shows in full-body frames)',
    'Bobby pins to secure your cap for the toss (one take only)',
    'Diploma cover, stoles, honor cords, any regalia you want in the shots',
    'Solid, neutral outfit underneath — black, white, cream, or navy works best',
    'Touch-up kit if you use one. Water. Clean shoes (they show).',
    'Family and friends are encouraged — they make the session better',
  ],
  headshot: [
    '1–2 outfit options — solids photograph better than busy patterns or large logos',
    'Think about where the headshot will live — LinkedIn, website, firm directory',
    'Grooming done in advance. Bring a touch-up kit if you use one.',
    "Arrive 5 minutes early so we're not rushing into the shoot",
  ],
  brand: [
    "2–3 outfit options that reflect your brand's aesthetic",
    'Think about the platforms these photos will live on and what energy you want',
    'Any props relevant to your work — laptop, product, tools of your trade',
    'Reference images or a Pinterest board are helpful but not required',
  ],
  club: [
    'Confirm your headcount and share a roster with me before the day',
    'Share the dress code or styling guidelines with your members in advance',
    'Have a point of contact on the day to manage the rotation schedule',
    'Each person gets ~15 minutes — being on time is the only ask',
  ],
  event: [
    'Share a run of show or event agenda if available',
    'Flag any VIP attendees or key moments not to miss',
    'A point of contact on the day helps me stay oriented',
    'Signage, branding, or detail shots you want — let me know in advance',
  ],
  portrait: [
    '1–2 outfit options — solids photograph better than busy patterns',
    'Any props relevant to your brand or profession',
    'Reference images or poses you like — save them on your phone',
    'Grooming done in advance. Arrive 5–10 minutes early.',
  ],
  general: [
    "Reply to this email with any questions — I'll answer before we book",
    'Have a rough date, location, and the occasion in mind for the call',
  ],
}

// ── Airtable ──────────────────────────────────────────────────────
/** Escape a string for use inside a double-quoted Airtable formula literal. */
function airtableString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

function getAirtable() {
  const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_CLIENTS_TABLE_ID, AIRTABLE_SHOOTS_TABLE_ID } = process.env
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !AIRTABLE_CLIENTS_TABLE_ID || !AIRTABLE_SHOOTS_TABLE_ID) return null
  const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID)
  return { base, clients: AIRTABLE_CLIENTS_TABLE_ID, shoots: AIRTABLE_SHOOTS_TABLE_ID }
}

type Base = ReturnType<Airtable['base']>

function airtableSelect(base: Base, tableId: string, formula: string): Promise<Airtable.Records<Airtable.FieldSet>> {
  return new Promise((resolve, reject) => {
    base(tableId)
      .select({ filterByFormula: formula, maxRecords: 1 })
      .firstPage((err, records) => (err ? reject(err) : resolve(records ?? [])))
  })
}

function airtableCreate(base: Base, tableId: string, fields: Airtable.FieldSet): Promise<Airtable.Record<Airtable.FieldSet>> {
  return new Promise((resolve, reject) => {
    base(tableId).create([{ fields }], (err, records) => {
      if (err || !records?.[0]) reject(err ?? new Error('Airtable returned no record'))
      else resolve(records[0])
    })
  })
}

function airtableUpdate(base: Base, tableId: string, recordId: string, fields: Airtable.FieldSet): Promise<void> {
  return new Promise((resolve, reject) => {
    base(tableId).update([{ id: recordId, fields }], (err) => (err ? reject(err) : resolve()))
  })
}

// ── Emails ────────────────────────────────────────────────────────
function notificationEmail(input: BookingInput, packageName: string, shootType: ShootType): string {
  const addOns = input.addOns.map((id) => getAddOn(id)?.label ?? id).join(', ') || 'None'
  const e = escapeHtml
  return emailShell({
    preheader: `New inquiry // ${e(SHOOT_LABEL[shootType]).toUpperCase()}`,
    title: e(input.name),
    body:
      kvTable([
        ['Email', `<a href="mailto:${e(input.email)}" style="color:#d6d3d1;">${e(input.email)}</a>`],
        ['Phone', e(input.phone) || '—'],
        ['Session type', e(SHOOT_LABEL[shootType])],
        ['Package', e(packageName)],
        ['Preferred date', e(input.preferredDate) || '—'],
        ['Zoom availability', e(input.zoomAvailability) || '—'],
        ['NJIT affiliate', input.njit ? 'Yes' : 'No'],
        ['Add-ons', e(addOns)],
      ]) +
      panel(eyebrow('Message') + `<p style="font-size:13px;color:#a8a29e;margin:0;line-height:1.6;white-space:pre-wrap;">${e(input.message)}</p>`) +
      `<p style="font-size:10px;color:#78716c;">Record created in Airtable automatically. Reply to ${e(input.email)} to follow up.</p>`,
    signoff: 'stefanpeele.com booking system',
  })
}

function confirmationEmail(input: BookingInput, packageName: string, shootType: ShootType): string {
  const e = escapeHtml
  const firstName = input.name.split(/\s+/)[0] ?? input.name
  const addOns = input.addOns.map((id) => getAddOn(id)?.label ?? id)
  const label = SHOOT_LABEL[shootType]

  return emailShell({
    preheader: 'Stefan Peele Photography // Inquiry received',
    title: `Got it, ${e(firstName)}.`,
    body:
      paragraph(
        `Your inquiry for a <strong style="color:#fff;">${e(label)}</strong> has been received. I'll follow up within 24 hours to confirm availability and schedule our consultation.`,
      ) +
      panel(
        eyebrow('Your selection') +
          `<p style="font-family:Lora,Georgia,serif;font-size:15px;color:#fff;margin:0 0 6px 0;">${e(packageName)}</p>` +
          (input.preferredDate ? `<p style="font-size:11px;color:#78716c;margin:0 0 4px 0;">Preferred date: ${e(input.preferredDate)}</p>` : '') +
          (input.zoomAvailability ? `<p style="font-size:11px;color:#78716c;margin:0 0 4px 0;">Zoom availability: ${e(input.zoomAvailability)}</p>` : '') +
          (addOns.length ? `<p style="font-size:11px;color:#78716c;margin:0;">Add-ons: ${e(addOns.join(', '))}</p>` : ''),
      ) +
      panel(
        eyebrow("What's included — every session") +
          bulletList([
            'Full gallery of edited JPEGs — high-res, color-graded, via Pixieset',
            '5 hero shots as print-ready TIFFs at full native resolution',
            'Social media pack — Instagram, Stories, and LinkedIn formats',
            "Physical product — we'll choose yours during the consultation",
          ]),
      ) +
      eyebrow(`To prepare for your ${e(label.toLowerCase())}`) +
      bulletList(PREP_HINTS[shootType]) +
      paragraph('Your full session guide — moodboard, session flow, and delivery details — arrives once we confirm the consultation.'),
  })
}

// ── Main server action ────────────────────────────────────────────
export async function submitBooking(formData: FormData): Promise<BookingResult> {
  const parsed = BookingSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone') ?? '',
    preferredDate: formData.get('preferred_date') ?? '',
    zoomAvailability: formData.get('zoom_availability') ?? '',
    package: formData.get('package'),
    addOns: formData.getAll('add_ons').map(String),
    njit: formData.get('njit_affiliate') === 'on' || formData.get('njit_affiliate') === 'Yes',
    message: formData.get('message'),
    website: formData.get('website') ?? '',
  })

  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    // A filled honeypot is a bot: pretend it worked and drop it.
    if (issue?.path[0] === 'website') return { success: true }
    return { success: false, error: issue?.message ?? 'Please check the form and try again.' }
  }
  const input = parsed.data

  // Rate limit: 3 per 10 minutes per IP, and one inquiry per email per 10 minutes.
  const ip = await getClientIp()
  const ipLimit = rateLimit(`booking:ip:${ip}`, 3, 10 * 60 * 1000)
  if (!ipLimit.ok) {
    return { success: false, error: `Too many inquiries from this connection. Try again in ${Math.ceil(ipLimit.retryAfterSeconds / 60)} minutes.` }
  }
  const emailLimit = rateLimit(`booking:email:${input.email}`, 1, 10 * 60 * 1000)
  if (!emailLimit.ok) {
    return { success: false, error: "Looks like you already sent an inquiry a moment ago. I'll be in touch — check your inbox." }
  }

  const airtable = getAirtable()
  const resendKey = process.env.RESEND_API_KEY
  if (!airtable || !resendKey) {
    console.error('[booking] Missing env: AIRTABLE_* and/or RESEND_API_KEY')
    return { success: false, error: `Booking is temporarily unavailable. Please email ${SITE.bookingEmail} directly.` }
  }
  const resend = new Resend(resendKey)

  const pkg = getPackage(input.package)
  const packageName = pkg ? pkg.airtableName : 'Not sure yet'
  const packageDisplay = pkg ? packageLabel(pkg) : 'Not sure yet — I have questions'
  const shootType = detectShootType(input.package)
  const addOnAirtable = input.addOns.map((id) => getAddOn(id)?.airtableName).filter((v): v is string => !!v)
  const addOnLabels = input.addOns.map((id) => ADD_ONS.find((a) => a.id === id)?.label ?? id)

  try {
    // 1. Find or create the client
    const existing = await airtableSelect(airtable.base, airtable.clients, `{Email} = "${airtableString(input.email)}"`)
    let clientId: string
    if (existing.length > 0) {
      clientId = existing[0]!.id
      const existingPhone = existing[0]!.fields['Phone']
      if (input.phone && !existingPhone) await airtableUpdate(airtable.base, airtable.clients, clientId, { Phone: input.phone })
    } else {
      const fields: Airtable.FieldSet = {
        Name: input.name,
        Email: input.email,
        Status: '🟡 Inquiry',
        Notes: input.message,
        'Last Contact': new Date().toISOString().slice(0, 10),
        'NJIT Affiliate': input.njit,
      }
      if (input.phone) fields['Phone'] = input.phone
      clientId = (await airtableCreate(airtable.base, airtable.clients, fields)).id
    }

    // 2. Create the shoot record
    const shootFields: Airtable.FieldSet = {
      'Shoot Title': `${input.name} — ${packageName}`,
      Client: [clientId],
      Package: packageName,
      'Rate Type': input.njit ? 'NJIT' : 'Public',
      Status: '🟡 Inquiry',
      'Internal Notes': [
        `Package: ${packageDisplay}`,
        `Add-ons: ${addOnLabels.join(', ') || 'None'}`,
        `NJIT: ${input.njit ? 'Yes' : 'No'}`,
        `Zoom availability: ${input.zoomAvailability || '—'}`,
        '',
        'Client message:',
        input.message,
      ].join('\n'),
    }
    if (input.preferredDate) shootFields['Shoot Date'] = input.preferredDate
    if (addOnAirtable.length) shootFields['Add-ons'] = addOnAirtable
    await airtableCreate(airtable.base, airtable.shoots, shootFields)
  } catch (err) {
    console.error('[booking] Airtable error:', err)
    return { success: false, error: `Something went wrong saving your inquiry. Please email ${SITE.bookingEmail} directly.` }
  }

  // 3. Notify Stefan, 4. confirm to client (validation already passed)
  try {
    await resend.emails.send({
      from: `Stefan Peele Photography <${SITE.bookingEmail}>`,
      to: SITE.email,
      replyTo: input.email,
      subject: `New inquiry: ${input.name} — ${packageName} (${SHOOT_LABEL[shootType]})`,
      html: notificationEmail(input, packageDisplay, shootType),
    })
    await resend.emails.send({
      from: `Stefan Peele <${SITE.bookingEmail}>`,
      to: input.email,
      replyTo: SITE.email,
      subject: `Your inquiry — Stefan Peele Photography (${SHOOT_LABEL[shootType]})`,
      html: confirmationEmail(input, packageDisplay, shootType),
    })
  } catch (err) {
    // The record exists; do not fail the whole submission over email delivery.
    console.error('[booking] Resend error:', err)
  }

  return { success: true }
}
