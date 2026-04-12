'use server'

import Airtable from 'airtable'
import { Resend } from 'resend'
// app/actions/booking.ts

const airtable = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
const base     = airtable.base(process.env.AIRTABLE_BASE_ID!)
const resend   = new Resend(process.env.RESEND_API_KEY)

// ── Env shortcuts ─────────────────────────────────────────────────
const CLIENTS_TABLE = process.env.AIRTABLE_CLIENTS_TABLE_ID!
const SHOOTS_TABLE  = process.env.AIRTABLE_SHOOTS_TABLE_ID!

// ── Types ─────────────────────────────────────────────────────────
export interface BookingResult {
  success: boolean
  error?: string
}

// ── Helpers ───────────────────────────────────────────────────────

// Wrap Airtable callbacks in promises
function airtableSelect(tableId: string, formula: string): Promise<Airtable.Records<Airtable.FieldSet>> {
  return new Promise((resolve, reject) => {
    base(tableId).select({
      filterByFormula: formula,
      maxRecords: 1,
    }).firstPage((err, records) => {
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

// Map form discount string → Airtable select option
function mapDiscount(discount: string): string | undefined {
  if (discount.includes('15%')) return '15% off next portrait (Core Event)'
  if (discount.includes('30%')) return '30% off next portrait (Premium Event)'
  return undefined
}

// Determine rate type from package label
function getRateType(pkg: string): 'NJIT' | 'Public' {
  return pkg.toLowerCase().includes('njit') ? 'NJIT' : 'Public'
}

// Pull just the package name (e.g. "Portrait · Core") without the price
function cleanPackageName(pkg: string): string {
  return pkg.replace(/\s*\(.*?\)\s*/g, '').trim()
}

// ── Email HTML ─────────────────────────────────────────────────────

function notificationEmailHtml(data: {
  name: string
  email: string
  pkg: string
  addOns: string
  discount: string
  message: string
}): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: 'Courier New', monospace; background: #0a0a0a; color: #d6d3d1; padding: 32px; margin: 0;">
  <div style="max-width: 560px; margin: 0 auto;">
    <p style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.3em; color: #78716c; margin-bottom: 24px;">
      NEW BOOKING INQUIRY // STEFAN PEELE PHOTOGRAPHY
    </p>

    <h1 style="font-family: Georgia, serif; font-size: 28px; color: #ffffff; margin: 0 0 24px 0; font-weight: 700;">
      ${data.name}
    </h1>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
      ${[
        ['Email',     data.email],
        ['Package',   data.pkg],
        ['Add-ons',   data.addOns || 'None'],
        ['Discount',  data.discount || 'None'],
      ].map(([label, value]) => `
        <tr>
          <td style="font-size: 9px; text-transform: uppercase; letter-spacing: 0.3em; color: #78716c; padding: 8px 16px 8px 0; white-space: nowrap; vertical-align: top;">
            ${label}
          </td>
          <td style="font-size: 12px; color: #d6d3d1; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
            ${value}
          </td>
        </tr>
      `).join('')}
    </table>

    <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 16px; margin-bottom: 24px;">
      <p style="font-size: 9px; text-transform: uppercase; letter-spacing: 0.3em; color: #78716c; margin: 0 0 8px 0;">
        Message from client
      </p>
      <p style="font-size: 13px; color: #a8a29e; margin: 0; line-height: 1.6;">
        ${data.message}
      </p>
    </div>

    <p style="font-size: 10px; color: #57534e; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 16px;">
      Record created in Airtable automatically. Reply to ${data.email} to follow up.
    </p>
  </div>
</body>
</html>`
}

function confirmationEmailHtml(name: string, pkg: string, addOns: string): string {
  const isEvent    = pkg.toLowerCase().includes('event')
  const isPortrait = pkg.toLowerCase().includes('portrait') || pkg.toLowerCase().includes('headshot') || pkg.toLowerCase().includes('grad') || pkg.toLowerCase().includes('brand')

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
<body style="font-family: 'Courier New', monospace; background: #0a0a0a; color: #d6d3d1; padding: 32px; margin: 0;">
  <div style="max-width: 560px; margin: 0 auto;">
    <p style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.3em; color: #78716c; margin-bottom: 24px;">
      STEFAN PEELE PHOTOGRAPHY // INQUIRY RECEIVED
    </p>

    <h1 style="font-family: Georgia, serif; font-size: 28px; color: #ffffff; margin: 0 0 8px 0;">
      Got it, ${name.split(' ')[0]}.
    </h1>
    <p style="font-size: 14px; color: #a8a29e; margin: 0 0 32px 0; line-height: 1.6;">
      Your inquiry has been received. I'll follow up within 24 hours to confirm availability and lock in your date.
    </p>

    <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <p style="font-size: 9px; text-transform: uppercase; letter-spacing: 0.3em; color: #78716c; margin: 0 0 12px 0;">
        Your selection
      </p>
      <p style="font-size: 13px; color: #ffffff; margin: 0 0 6px 0; font-family: Georgia, serif;">
        ${cleanPackageName(pkg)}
      </p>
      ${addOns && addOns !== 'None selected' ? `
      <p style="font-size: 11px; color: #78716c; margin: 0;">
        Add-ons: ${addOns}
      </p>` : ''}
    </div>

    <div style="margin-bottom: 24px;">
      <p style="font-size: 9px; text-transform: uppercase; letter-spacing: 0.3em; color: #78716c; margin: 0 0 12px 0;">
        To prepare for your session
      </p>
      <ul style="font-size: 13px; color: #a8a29e; line-height: 1.8; padding-left: 20px; margin: 0;">
        ${prepItems}
      </ul>
    </div>

    <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 20px;">
      <p style="font-size: 12px; color: #a8a29e; margin: 0 0 4px 0;">Stefan Peele</p>
      <p style="font-size: 10px; color: #57534e; margin: 0;">
        stefanpeele.com &nbsp;·&nbsp; swp9@njit.edu
      </p>
    </div>
  </div>
</body>
</html>`
}

// ── Main server action ─────────────────────────────────────────────
export async function submitBooking(formData: FormData): Promise<BookingResult> {
  const name     = (formData.get('name')     as string)?.trim()
  const email    = (formData.get('email')    as string)?.trim().toLowerCase()
  const pkg      = (formData.get('package')  as string) ?? ''
  const addOns   = (formData.get('add_ons')  as string) ?? 'None selected'
  const message  = (formData.get('message')  as string)?.trim()
  const discount = (formData.get('discount_earned') as string) ?? 'None'

  if (!name || !email || !message) {
    return { success: false, error: 'Missing required fields.' }
  }

  try {

    // ── 1. Find or create client ───────────────────────────────────
    const safeEmail    = email.replace(/"/g, '\\"')
    const existingRows = await airtableSelect(
      CLIENTS_TABLE,
      `{Email} = "${safeEmail}"`
    )

    let clientId: string

    if (existingRows.length > 0) {
      clientId = existingRows[0].id
    } else {
      const newClient = await airtableCreate(CLIENTS_TABLE, {
        'Name':         name,
        'Email':        email,
        'Status':       '🟡 Inquiry',
        'Notes':        message,
        'Last Contact': new Date().toISOString().split('T')[0],
      })
      clientId = newClient.id
    }

    // ── 2. Create shoot record ─────────────────────────────────────
    const discountOption = mapDiscount(discount)
    const shootFields: Airtable.FieldSet = {
      'Shoot Title':     `${name} — ${cleanPackageName(pkg)}`,
      'Client':          [clientId],
      'Package':         cleanPackageName(pkg),
      'Rate Type':       getRateType(pkg),
      'Status':          '🟡 Inquiry',
      'Internal Notes':  `Package: ${pkg}\nAdd-ons: ${addOns}\nDiscount earned: ${discount}\n\nClient message:\n${message}`,
    }

    // Only set Add-ons and Discount Earned if they have values
    if (addOns && addOns !== 'None selected') {
      shootFields['Add-ons'] = addOns
    }
    if (discountOption) {
      shootFields['Discount Earned'] = discountOption
    }

    await airtableCreate(SHOOTS_TABLE, shootFields)

    // ── 3. Email Stefan — new inquiry notification ─────────────────
    // NOTE: Until you verify stefanpeele.com on resend.com,
    // change 'from' to 'onboarding@resend.dev' for testing
    await resend.emails.send({
      from:    'Stefan Peele Photography <bookings@stefanpeele.com>',
      to:      'swp9@njit.edu',
      subject: `📸 New inquiry: ${name} — ${cleanPackageName(pkg)}`,
      html:    notificationEmailHtml({ name, email, pkg, addOns, discount, message }),
    })

    // ── 4. Auto-reply to client ────────────────────────────────────
    await resend.emails.send({
      from:    'Stefan Peele <bookings@stefanpeele.com>',
      to:      email,
      replyTo: 'swp9@njit.edu',
      subject: 'Your inquiry — Stefan Peele Photography',
      html:    confirmationEmailHtml(name, pkg, addOns),
    })

    return { success: true }

  } catch (err) {
    console.error('Booking submission error:', err)
    return { success: false, error: 'Something went wrong. Please email swp9@njit.edu directly.' }
  }
}