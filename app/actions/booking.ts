'use server'

import Airtable from 'airtable'
import { Resend } from 'resend'
// app/actions/booking.ts

const airtable = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
const base     = airtable.base(process.env.AIRTABLE_BASE_ID!)
const resend   = new Resend(process.env.RESEND_API_KEY)

const CLIENTS_TABLE = process.env.AIRTABLE_CLIENTS_TABLE_ID!
const SHOOTS_TABLE  = process.env.AIRTABLE_SHOOTS_TABLE_ID!

export interface BookingResult {
  success: boolean
  error?: string
}

// ── Package → Airtable option mapping ────────────────────────────
function resolvePackageName(pkg: string): string {
  const stripped = pkg.replace(/^["']+|["']+$/g, '').trim()
  const match    = stripped.match(/^(Portrait|Event|Specialty)\s*[·•\-]\s*([^(]+)/)
  if (match) return `${match[1].trim()} · ${match[2].trim()}`
  return stripped.replace(/\s*\(.*?\)\s*/g, '').trim()
}

// ── Add-on mapping ────────────────────────────────────────────────
const ADDON_LABEL_TO_AIRTABLE: Record<string, string> = {
  'Additional session time (+$75/hr)': 'Extra 1 hour',
  'Rush delivery (+$40)':              'Rushed delivery',
  'Social media pack — same-day (+$45)': 'Same-day social pack',
  'Physical product upgrade (Discussed in consultation)': 'Framed print set',
}

function parseAddOns(addOnsString: string): string[] {
  if (!addOnsString || addOnsString === 'None selected') return []
  return addOnsString
    .split(', ')
    .map((item) => {
      if (ADDON_LABEL_TO_AIRTABLE[item]) return ADDON_LABEL_TO_AIRTABLE[item]
      const baseLabel = item.split(' (+')[0]
      const match = Object.entries(ADDON_LABEL_TO_AIRTABLE).find(([key]) => key.startsWith(baseLabel))
      return match ? match[1] : null
    })
    .filter((v): v is string => v !== null)
}

// ── Shoot type detection ──────────────────────────────────────────
type ShootType = 'grad' | 'headshot' | 'brand' | 'club' | 'event' | 'portrait' | 'general'

function detectShootType(pkg: string): ShootType {
  const p = pkg.toLowerCase()
  if (p.includes('grad'))                        return 'grad'
  if (p.includes('headshot mini'))               return 'headshot'
  if (p.includes('personal brand'))              return 'brand'
  if (p.includes('club') || p.includes('frat')) return 'club'
  if (p.includes('event'))                       return 'event'
  if (p.includes('portrait'))                    return 'portrait'
  return 'general'
}

// ── Shoot-type prep content ───────────────────────────────────────
// Brief hints in the confirmation email that echo what's in each PDF guide
function getShootPrepHints(shootType: ShootType): string {
  switch (shootType) {
    case 'grad':
      return `
        <p style="font-size:13px;color:#a8a29e;margin:0 0 12px 0;line-height:1.6;">
          A few things to have ready for your graduation session:
        </p>
        <ul style="font-size:13px;color:#a8a29e;line-height:1.8;padding-left:20px;margin:0 0 12px 0;">
          <li>Cap and gown — steamed in advance (it shows in full-body frames)</li>
          <li>Bobby pins to secure your cap for the toss (one take only)</li>
          <li>Diploma cover, stoles, honor cords, any regalia you want in the shots</li>
          <li>Solid, neutral outfit underneath — black, white, cream, or navy works best</li>
          <li>Touch-up kit if you use one. Water. Clean shoes (they show).</li>
          <li>Family and friends are encouraged — they make the session better</li>
        </ul>
        <p style="font-size:13px;color:#a8a29e;margin:0;line-height:1.6;">
          Your full session guide — including the moodboard, session flow, and delivery details — is attached to this email.
        </p>`

    case 'headshot':
      return `
        <p style="font-size:13px;color:#a8a29e;margin:0 0 12px 0;line-height:1.6;">
          A few things to have ready for your headshot session:
        </p>
        <ul style="font-size:13px;color:#a8a29e;line-height:1.8;padding-left:20px;margin:0 0 12px 0;">
          <li>1–2 outfit options — solids photograph better than busy patterns or large logos</li>
          <li>Think about where the headshot will live — LinkedIn, website, firm directory</li>
          <li>Grooming done in advance. Bring a touch-up kit if you use one.</li>
          <li>Arrive 5 minutes early so we're not rushing into the shoot</li>
        </ul>
        <p style="font-size:13px;color:#a8a29e;margin:0;line-height:1.6;">
          Sessions are efficient by design — we shoot until we get it right, not until the clock runs out.
        </p>`

    case 'brand':
      return `
        <p style="font-size:13px;color:#a8a29e;margin:0 0 12px 0;line-height:1.6;">
          A few things to prepare for your personal brand session:
        </p>
        <ul style="font-size:13px;color:#a8a29e;line-height:1.8;padding-left:20px;margin:0 0 12px 0;">
          <li>2–3 outfit options that reflect your brand's aesthetic</li>
          <li>Think about the platforms these photos will live on and what energy you want</li>
          <li>Any props relevant to your work — laptop, product, tools of your trade</li>
          <li>Reference images or a Pinterest board are helpful but not required</li>
          <li>We'll build a shot list together during the consultation call</li>
        </ul>
        <p style="font-size:13px;color:#a8a29e;margin:0;line-height:1.6;">
          Your full session guide arrives after our consultation is confirmed.
        </p>`

    case 'club':
      return `
        <p style="font-size:13px;color:#a8a29e;margin:0 0 12px 0;line-height:1.6;">
          A few things to coordinate before your headshot day:
        </p>
        <ul style="font-size:13px;color:#a8a29e;line-height:1.8;padding-left:20px;margin:0 0 12px 0;">
          <li>Confirm your headcount and share a roster with me before the day</li>
          <li>Share the dress code or styling guidelines with your members in advance</li>
          <li>Have a point of contact on the day to manage the rotation schedule</li>
          <li>Each person gets ~15 minutes — being on time is the only ask</li>
        </ul>
        <p style="font-size:13px;color:#a8a29e;margin:0;line-height:1.6;">
          We'll finalize scheduling and location during the consultation.
        </p>`

    case 'event':
      return `
        <p style="font-size:13px;color:#a8a29e;margin:0 0 12px 0;line-height:1.6;">
          A few things that help make event coverage stronger:
        </p>
        <ul style="font-size:13px;color:#a8a29e;line-height:1.8;padding-left:20px;margin:0 0 12px 0;">
          <li>Share a run of show or event agenda if available</li>
          <li>Flag any VIP attendees or key moments not to miss</li>
          <li>A point of contact on the day helps me stay oriented</li>
          <li>Signage, branding, or detail shots you want — let me know in advance</li>
        </ul>
        <p style="font-size:13px;color:#a8a29e;margin:0;line-height:1.6;">
          We'll build a shot list together during the consultation or pre-event call.
        </p>`

    case 'portrait':
    default:
      return `
        <p style="font-size:13px;color:#a8a29e;margin:0 0 12px 0;line-height:1.6;">
          A few things to prepare for your portrait session:
        </p>
        <ul style="font-size:13px;color:#a8a29e;line-height:1.8;padding-left:20px;margin:0 0 12px 0;">
          <li>1–2 outfit options — solids photograph better than busy patterns</li>
          <li>Any props relevant to your brand or profession</li>
          <li>Reference images or poses you like — save them on your phone</li>
          <li>Grooming done in advance. Arrive 5–10 minutes early.</li>
        </ul>
        <p style="font-size:13px;color:#a8a29e;margin:0;line-height:1.6;">
          Your full session guide arrives after we confirm your consultation.
        </p>`
  }
}

function getShootTypeLabel(shootType: ShootType): string {
  const labels: Record<ShootType, string> = {
    grad:     'Graduation Session',
    headshot: 'Headshot Session',
    brand:    'Personal Brand / Content Session',
    club:     'Club / Organization Headshot Day',
    event:    'Event Coverage',
    portrait: 'Portrait Session',
    general:  'Photography Session',
  }
  return labels[shootType]
}

// ── Airtable helpers ──────────────────────────────────────────────
function airtableSelect(tableId: string, formula: string): Promise<Airtable.Records<Airtable.FieldSet>> {
  return new Promise((resolve, reject) => {
    base(tableId).select({ filterByFormula: formula, maxRecords: 1 })
      .firstPage((err, records) => {
        if (err) reject(err)
        else resolve(records ?? [])
      })
  })
}

function airtableCreate(tableId: string, fields: Airtable.FieldSet): Promise<Airtable.Record<Airtable.FieldSet>> {
  return new Promise((resolve, reject) => {
    base(tableId).create([{ fields }], (err, records) => {
      if (err) reject(err)
      else resolve((records as Airtable.Records<Airtable.FieldSet>)[0])
    })
  })
}

function airtableUpdate(tableId: string, recordId: string, fields: Airtable.FieldSet): Promise<void> {
  return new Promise((resolve, reject) => {
    base(tableId).update([{ id: recordId, fields }], (err) => {
      if (err) reject(err)
      else resolve()
    })
  })
}

function mapDiscount(discount: string): string | undefined {
  if (discount.includes('15%')) return '15% off next portrait (Core Event)'
  if (discount.includes('30%')) return '30% off next portrait (Premium Event)'
  return undefined
}

function getRateType(pkg: string): string {
  return pkg.toLowerCase().includes('njit') ? 'NJIT' : 'Public'
}

// ── Email templates ───────────────────────────────────────────────
function notificationEmailHtml(data: {
  name: string; email: string; phone: string; preferredDate: string
  zoomAvailability: string; pkg: string; addOns: string
  discount: string; njit: string; message: string; shootType: ShootType
}): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:'Courier New',monospace;background:#0a0a0a;color:#d6d3d1;padding:32px;margin:0;">
  <div style="max-width:560px;margin:0 auto;">
    <p style="font-size:10px;text-transform:uppercase;letter-spacing:0.3em;color:#78716c;margin-bottom:24px;">
      NEW INQUIRY // STEFAN PEELE PHOTOGRAPHY — ${getShootTypeLabel(data.shootType).toUpperCase()}
    </p>
    <h1 style="font-family:Georgia,serif;font-size:28px;color:#fff;margin:0 0 24px 0;">${data.name}</h1>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      ${[
        ['Email',           data.email],
        ['Phone',           data.phone || '—'],
        ['Session type',    getShootTypeLabel(data.shootType)],
        ['Package',         data.pkg],
        ['Preferred date',  data.preferredDate || '—'],
        ['Zoom availability', data.zoomAvailability || '—'],
        ['NJIT Affiliate',  data.njit],
        ['Add-ons',         data.addOns || 'None'],
        ['Discount',        data.discount || 'None'],
      ].map(([label, value]) => `
        <tr>
          <td style="font-size:9px;text-transform:uppercase;letter-spacing:0.3em;color:#78716c;padding:8px 16px 8px 0;white-space:nowrap;vertical-align:top;">${label}</td>
          <td style="font-size:12px;color:#d6d3d1;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">${value}</td>
        </tr>`).join('')}
    </table>
    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:16px;margin-bottom:24px;">
      <p style="font-size:9px;text-transform:uppercase;letter-spacing:0.3em;color:#78716c;margin:0 0 8px 0;">Message</p>
      <p style="font-size:13px;color:#a8a29e;margin:0;line-height:1.6;">${data.message}</p>
    </div>
    <p style="font-size:10px;color:#57534e;border-top:1px solid rgba(255,255,255,0.05);padding-top:16px;">
      Record created in Airtable automatically. Reply to ${data.email} to follow up.
    </p>
  </div>
</body></html>`
}

function confirmationEmailHtml(
  name: string, pkg: string, addOns: string,
  preferredDate: string, zoomAvailability: string, shootType: ShootType
): string {
  const cleanedPkg  = resolvePackageName(pkg)
  const shootLabel  = getShootTypeLabel(shootType)
  const prepContent = getShootPrepHints(shootType)

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:'Courier New',monospace;background:#0a0a0a;color:#d6d3d1;padding:32px;margin:0;">
  <div style="max-width:560px;margin:0 auto;">
    <p style="font-size:10px;text-transform:uppercase;letter-spacing:0.3em;color:#78716c;margin-bottom:24px;">
      STEFAN PEELE PHOTOGRAPHY // INQUIRY RECEIVED
    </p>
    <h1 style="font-family:Georgia,serif;font-size:28px;color:#fff;margin:0 0 8px 0;">
      Got it, ${name.split(' ')[0]}.
    </h1>
    <p style="font-size:14px;color:#a8a29e;margin:0 0 32px 0;line-height:1.6;">
      Your inquiry for a <strong style="color:#fff;">${shootLabel}</strong> has been received.
      I'll follow up within 24 hours to confirm availability and schedule our consultation.
    </p>

    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:20px;margin-bottom:24px;">
      <p style="font-size:9px;text-transform:uppercase;letter-spacing:0.3em;color:#78716c;margin:0 0 12px 0;">Your selection</p>
      <p style="font-size:14px;color:#fff;margin:0 0 6px 0;font-family:Georgia,serif;">${cleanedPkg}</p>
      ${preferredDate ? `<p style="font-size:11px;color:#78716c;margin:0 0 4px 0;">Preferred date: ${preferredDate}</p>` : ''}
      ${zoomAvailability ? `<p style="font-size:11px;color:#78716c;margin:0 0 4px 0;">Zoom availability: ${zoomAvailability}</p>` : ''}
      ${addOns && addOns !== 'None selected' ? `<p style="font-size:11px;color:#78716c;margin:0;">Add-ons: ${addOns}</p>` : ''}
    </div>

    <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:20px;margin-bottom:24px;">
      <p style="font-size:9px;text-transform:uppercase;letter-spacing:0.3em;color:#78716c;margin:0 0 12px 0;">
        What's included — every session
      </p>
      <ul style="font-size:13px;color:#a8a29e;line-height:1.8;padding-left:20px;margin:0;">
        <li>Full gallery of edited JPEGs — high-res, color-graded, via Pixieset</li>
        <li>5 hero shots as print-ready TIFFs at full native resolution</li>
        <li>Social media pack — Instagram, Stories, and LinkedIn formats</li>
        <li>Physical product — we'll choose yours during the consultation</li>
      </ul>
    </div>

    <div style="margin-bottom:24px;">
      <p style="font-size:9px;text-transform:uppercase;letter-spacing:0.3em;color:#78716c;margin:0 0 12px 0;">
        To prepare for your ${shootLabel.toLowerCase()}
      </p>
      ${prepContent}
    </div>

    <div style="border-top:1px solid rgba(255,255,255,0.08);padding-top:20px;">
      <p style="font-size:12px;color:#a8a29e;margin:0 0 4px 0;">Stefan Peele</p>
      <p style="font-size:10px;color:#57534e;margin:0;">stefanpeele.com &nbsp;·&nbsp; swp9@njit.edu &nbsp;·&nbsp; @stefs.lens</p>
    </div>
  </div>
</body></html>`
}

// ── Main server action ────────────────────────────────────────────
export async function submitBooking(formData: FormData): Promise<BookingResult> {
  const name             = (formData.get('name')             as string)?.trim()
  const email            = (formData.get('email')            as string)?.trim().toLowerCase()
  const phone            = (formData.get('phone')            as string)?.trim() ?? ''
  const preferredDate    = (formData.get('preferred_date')   as string)?.trim() ?? ''
  const zoomAvailability = (formData.get('zoom_availability') as string)?.trim() ?? ''
  const pkg              = (formData.get('package')          as string) ?? ''
  const addOnsRaw        = (formData.get('add_ons')          as string) ?? 'None selected'
  const message          = (formData.get('message')          as string)?.trim()
  const discount         = (formData.get('discount_earned')  as string) ?? 'None'
  const njit             = (formData.get('njit_affiliate')   as string) ?? 'No'

  if (!name || !email || !message) {
    return { success: false, error: 'Missing required fields.' }
  }

  const addOnsArray = parseAddOns(addOnsRaw)
  const cleanedPkg  = resolvePackageName(pkg)
  const shootType   = detectShootType(pkg)

  try {
    // ── 1. Find or create client ───────────────────────────────────
    const safeEmail    = email.replace(/"/g, '\\"')
    const existingRows = await airtableSelect(CLIENTS_TABLE, `{Email} = "${safeEmail}"`)
    let clientId: string

    if (existingRows.length > 0) {
      clientId = existingRows[0].id
      const existingPhone = existingRows[0].fields['Phone'] as string
      if (phone && !existingPhone) {
        await airtableUpdate(CLIENTS_TABLE, clientId, { 'Phone': phone })
      }
    } else {
      const clientFields: Airtable.FieldSet = {
        'Name':           name,
        'Email':          email,
        'Status':         '🟡 Inquiry',
        'Notes':          message,
        'Last Contact':   new Date().toISOString().split('T')[0],
        'NJIT Affiliate': njit === 'Yes',
      }
      if (phone) clientFields['Phone'] = phone
      const newClient = await airtableCreate(CLIENTS_TABLE, clientFields)
      clientId = newClient.id
    }

    // ── 2. Create shoot record ─────────────────────────────────────
    const discountOption = mapDiscount(discount)
    const shootFields: Airtable.FieldSet = {
      'Shoot Title':    `${name} — ${cleanedPkg}`,
      'Client':         [clientId],
      'Package':        cleanedPkg,
      'Rate Type':      getRateType(pkg),
      'Status':         '🟡 Inquiry',
      'Internal Notes': `Package: ${pkg}\nAdd-ons: ${addOnsRaw}\nNJIT: ${njit}\nDiscount: ${discount}\nZoom availability: ${zoomAvailability}\n\nClient message:\n${message}`,
    }

    if (preferredDate)          shootFields['Shoot Date']      = preferredDate
    if (addOnsArray.length > 0) shootFields['Add-ons']         = addOnsArray
    if (discountOption)         shootFields['Discount Earned'] = discountOption

    await airtableCreate(SHOOTS_TABLE, shootFields)

    // ── 3. Notify Stefan ───────────────────────────────────────────
    await resend.emails.send({
      from:    'Stefan Peele Photography <bookings@stefanpeele.com>',
      to:      'swp9@njit.edu',
      subject: `📸 New inquiry: ${name} — ${cleanedPkg} (${getShootTypeLabel(shootType)})`,
      html:    notificationEmailHtml({
        name, email, phone, preferredDate, zoomAvailability,
        pkg, addOns: addOnsRaw, discount, njit, message, shootType,
      }),
    })

    // ── 4. Confirm to client ───────────────────────────────────────
    await resend.emails.send({
      from:    'Stefan Peele <bookings@stefanpeele.com>',
      to:      email,
      replyTo: 'swp9@njit.edu',
      subject: `Your inquiry — Stefan Peele Photography (${getShootTypeLabel(shootType)})`,
      html:    confirmationEmailHtml(name, pkg, addOnsRaw, preferredDate, zoomAvailability, shootType),
    })

    return { success: true }

  } catch (err) {
    console.error('Booking submission error:', err)
    return { success: false, error: 'Something went wrong. Please email swp9@njit.edu directly.' }
  }
}