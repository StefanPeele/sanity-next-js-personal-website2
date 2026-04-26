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

const ADDON_LABEL_TO_AIRTABLE: Record<string, string> = {
  'Extra 30 minutes (+$50)':               'Extra 30 min',
  'Extra 1 hour (+$90)':                   'Extra 1 hour',
  'Extra 2 hours (+$180)':                 'Extra 2 hours',
  'Same-day social pack (+$45)':           'Same-day social pack',
  'Rushed full delivery (+$40)':           'Rushed delivery',
  'High-res digital upgrade (+$25)':       'High-res digital upgrade',
  'Full RAW file delivery (+$50)':         'Full RAW delivery',
  'Softcover photobook (20 pages) (+$55)': 'Softcover photobook',
  'Hardcover photobook (20 pages) (+$75)': 'Hardcover photobook',
  'Framed print set (8×10) (+$45)':        'Framed print set',
}

function parseAddOns(addOnsString: string): string[] {
  if (!addOnsString || addOnsString === 'None selected') return []
  return addOnsString
    .split(', ')
    .map((item) => {
      if (ADDON_LABEL_TO_AIRTABLE[item]) return ADDON_LABEL_TO_AIRTABLE[item]
      const baseLabel = item.split(' (+')[0]
      const match = Object.entries(ADDON_LABEL_TO_AIRTABLE).find(([key]) =>
        key.startsWith(baseLabel)
      )
      return match ? match[1] : null
    })
    .filter((v): v is string => v !== null)
}

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

// Strips price parentheses AND any surrounding quotes from package names
// e.g. "Specialty · Headshot Mini (from $65 NJIT / $85 public)"
//   → Specialty · Headshot Mini
function cleanPackageName(pkg: string): string {
  return pkg
    .replace(/^["']|["']$/g, '')   // strip surrounding quotes first
    .replace(/\s*\(.*?\)\s*/g, '') // then remove (price) part
    .trim()
}

function notificationEmailHtml(data: {
  name: string
  email: string
  phone: string
  preferredDate: string
  pkg: string
  addOns: string
  discount: string
  njit: string
  message: string
}): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:'Courier New',monospace;background:#0a0a0a;color:#d6d3d1;padding:32px;margin:0;">
  <div style="max-width:560px;margin:0 auto;">
    <p style="font-size:10px;text-transform:uppercase;letter-spacing:0.3em;color:#78716c;margin-bottom:24px;">
      NEW BOOKING INQUIRY // STEFAN PEELE PHOTOGRAPHY
    </p>
    <h1 style="font-family:Georgia,serif;font-size:28px;color:#fff;margin:0 0 24px 0;">
      ${data.name}
    </h1>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      ${[
        ['Email',          data.email],
        ['Phone',          data.phone || '—'],
        ['Preferred Date', data.preferredDate || '—'],
        ['Package',        data.pkg],
        ['NJIT Affiliate', data.njit],
        ['Add-ons',        data.addOns || 'None'],
        ['Discount',       data.discount || 'None'],
      ].map(([label, value]) => `
        <tr>
          <td style="font-size:9px;text-transform:uppercase;letter-spacing:0.3em;color:#78716c;padding:8px 16px 8px 0;white-space:nowrap;vertical-align:top;">${label}</td>
          <td style="font-size:12px;color:#d6d3d1;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">${value}</td>
        </tr>
      `).join('')}
    </table>
    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:16px;margin-bottom:24px;">
      <p style="font-size:9px;text-transform:uppercase;letter-spacing:0.3em;color:#78716c;margin:0 0 8px 0;">Message</p>
      <p style="font-size:13px;color:#a8a29e;margin:0;line-height:1.6;">${data.message}</p>
    </div>
    <p style="font-size:10px;color:#57534e;border-top:1px solid rgba(255,255,255,0.05);padding-top:16px;">
      Record created in Airtable automatically. Reply to ${data.email} to follow up.
    </p>
  </div>
</body>
</html>`
}

function confirmationEmailHtml(
  name: string,
  pkg: string,
  addOns: string,
  preferredDate: string
): string {
  const isEvent = pkg.toLowerCase().includes('event')

  const prepItems = isEvent ? `
    <li>A run of show or event agenda if available</li>
    <li>Contact for the event coordinator on the day</li>
    <li>Any VIP attendees or key people to prioritize</li>
    <li>Signage, branding, or details you want captured</li>
  ` : `
    <li>1–2 outfit options — solids photograph better than busy patterns</li>
    <li>Any props relevant to your brand or profession</li>
    <li>Grooming done in advance — hair, skin, anything relevant</li>
    <li>References or poses you like on your phone</li>
    <li>Arrive 5–10 minutes early so we're not rushing in</li>
  `

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:'Courier New',monospace;background:#0a0a0a;color:#d6d3d1;padding:32px;margin:0;">
  <div style="max-width:560px;margin:0 auto;">
    <p style="font-size:10px;text-transform:uppercase;letter-spacing:0.3em;color:#78716c;margin-bottom:24px;">
      STEFAN PEELE PHOTOGRAPHY // INQUIRY RECEIVED
    </p>
    <h1 style="font-family:Georgia,serif;font-size:28px;color:#fff;margin:0 0 8px 0;">
      Got it, ${name.split(' ')[0]}.
    </h1>
    <p style="font-size:14px;color:#a8a29e;margin:0 0 32px 0;line-height:1.6;">
      Your inquiry has been received. I'll follow up within 24 hours to confirm availability and lock in your date.
    </p>
    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:20px;margin-bottom:24px;">
      <p style="font-size:9px;text-transform:uppercase;letter-spacing:0.3em;color:#78716c;margin:0 0 12px 0;">Your selection</p>
      <p style="font-size:14px;color:#fff;margin:0 0 6px 0;font-family:Georgia,serif;">${cleanPackageName(pkg)}</p>
      ${preferredDate ? `<p style="font-size:11px;color:#78716c;margin:0 0 4px 0;">Preferred date: ${preferredDate}</p>` : ''}
      ${addOns && addOns !== 'None selected' ? `<p style="font-size:11px;color:#78716c;margin:0;">Add-ons: ${addOns}</p>` : ''}
    </div>
    <div style="margin-bottom:24px;">
      <p style="font-size:9px;text-transform:uppercase;letter-spacing:0.3em;color:#78716c;margin:0 0 12px 0;">To prepare for your session</p>
      <ul style="font-size:13px;color:#a8a29e;line-height:1.8;padding-left:20px;margin:0;">${prepItems}</ul>
    </div>
    <div style="border-top:1px solid rgba(255,255,255,0.08);padding-top:20px;">
      <p style="font-size:12px;color:#a8a29e;margin:0 0 4px 0;">Stefan Peele</p>
      <p style="font-size:10px;color:#57534e;margin:0;">stefanpeele.com &nbsp;·&nbsp; swp9@njit.edu</p>
    </div>
  </div>
</body>
</html>`
}

export async function submitBooking(formData: FormData): Promise<BookingResult> {
  const name          = (formData.get('name')            as string)?.trim()
  const email         = (formData.get('email')           as string)?.trim().toLowerCase()
  const phone         = (formData.get('phone')           as string)?.trim() ?? ''
  const preferredDate = (formData.get('preferred_date')  as string)?.trim() ?? ''
  const pkg = (formData.get('package') as string) ?? ''
  console.log('RAW PKG VALUE:', JSON.stringify(pkg))
  const addOnsRaw     = (formData.get('add_ons')         as string) ?? 'None selected'
  const message       = (formData.get('message')         as string)?.trim()
  const discount      = (formData.get('discount_earned') as string) ?? 'None'
  const njit          = (formData.get('njit_affiliate')  as string) ?? 'No'

  if (!name || !email || !message) {
    return { success: false, error: 'Missing required fields.' }
  }

  const addOnsArray = parseAddOns(addOnsRaw)

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
      'Shoot Title':    `${name} — ${cleanPackageName(pkg)}`,
      'Client':         [clientId],
      'Package':        cleanPackageName(pkg),
      'Rate Type':      getRateType(pkg),
      'Status':         '🟡 Inquiry',
      'Internal Notes': `Package: ${pkg}\nAdd-ons: ${addOnsRaw}\nNJIT: ${njit}\nDiscount: ${discount}\n\nClient message:\n${message}`,
    }

    if (preferredDate)          shootFields['Shoot Date']      = preferredDate
    if (addOnsArray.length > 0) shootFields['Add-ons']         = addOnsArray
    if (discountOption)         shootFields['Discount Earned'] = discountOption

    await airtableCreate(SHOOTS_TABLE, shootFields)

    // ── 3. Notify Stefan ───────────────────────────────────────────
    await resend.emails.send({
      from:    'Stefan Peele Photography <bookings@stefanpeele.com>',
      to:      'swp9@njit.edu',
      subject: `📸 New inquiry: ${name} — ${cleanPackageName(pkg)}`,
      html:    notificationEmailHtml({
        name, email, phone, preferredDate,
        pkg, addOns: addOnsRaw, discount, njit, message,
      }),
    })

    // ── 4. Confirm to client ───────────────────────────────────────
    await resend.emails.send({
      from:    'Stefan Peele <bookings@stefanpeele.com>',
      to:      email,
      replyTo: 'swp9@njit.edu',
      subject: 'Your inquiry — Stefan Peele Photography',
      html:    confirmationEmailHtml(name, pkg, addOnsRaw, preferredDate),
    })

    return { success: true }

  } catch (err) {
    console.error('Booking submission error:', err)
    return { success: false, error: 'Something went wrong. Please email swp9@njit.edu directly.' }
  }
}