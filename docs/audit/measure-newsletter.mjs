// docs/audit/measure-newsletter.mjs
//
// Phase 9.1 — "Determine whether subscription works end to end right now. Either confirm it
// works with evidence, or give me exact step-by-step instructions to confirm it myself. Do
// not guess."
//
// So this does not guess. It drives the real form, reads the real document, follows the
// real confirm link and the real unsubscribe link, and reports what each one did. The one
// thing it CANNOT establish from here is whether Resend delivers to a real inbox; that is
// stated as a limit rather than glossed, and the steps to check it are printed at the end.
//
// Everything it creates is deleted and the deletion is verified.
//
//   node docs/audit/measure-newsletter.mjs
//
import { chromium } from '@playwright/test'
import fs from 'node:fs'

const BASE = process.env.BASE || 'http://127.0.0.1:3000'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split(String.fromCharCode(10)).map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]))
const { NEXT_PUBLIC_SANITY_PROJECT_ID: P, NEXT_PUBLIC_SANITY_DATASET: D, SANITY_API_WRITE_TOKEN: T } = env
const API = `https://${P}.api.sanity.io/v2025-02-27`
const AUTH = { Authorization: `Bearer ${T}`, 'Content-Type': 'application/json' }

const EMAIL = `probe+news${Date.now()}@example.invalid`

let pass = 0, fail = 0, unknown = 0
const check = (ok, name, detail) => {
  if (ok) { pass++; console.log(`  PASS   ${name}${detail ? '  -- ' + detail : ''}`) }
  else { fail++; console.log(`  FAIL   ${name}${detail ? '  -- ' + detail : ''}`) }
}
const cannot = (name, why) => { unknown++; console.log(`  UNKNOWN ${name}  -- ${why}`) }

const groq = (q, params = {}) =>
  fetch(`${API}/data/query/${D}?perspective=raw&query=${encodeURIComponent(q)}` +
    Object.entries(params).map(([k, v]) => `&$${k}=${encodeURIComponent(JSON.stringify(v))}`).join(''), { headers: AUTH })
    .then((r) => r.json()).then((r) => r.result)

const mutate = (m) =>
  fetch(`${API}/data/mutate/${D}`, { method: 'POST', headers: AUTH, body: JSON.stringify({ mutations: m }) }).then((r) => r.json())

const browser = await chromium.launch()
try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  const page = await ctx.newPage()

  console.log('\n## 1. Does the form exist, and where\n')
  await page.goto(`${BASE}/blog`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(2500)
  await page.evaluate(() => document.querySelectorAll('[data-sonner-toaster], [data-sonner-toast]').forEach((el) => el.remove()))
  const forms = await page.evaluate(() =>
    Array.from(document.querySelectorAll('form')).filter((f) => f.querySelector('input[type="email"]')).map((f) => ({
      hasHoneypot: !!f.querySelector('input[name="website"]'),
      emailRequired: !!f.querySelector('input[type="email"]')?.required,
      source: f.querySelector('input[name="source"]')?.value ?? null,
    })))
  check(forms.length > 0, 'a subscribe form is on /blog', `${forms.length} found`)
  check(forms.every((f) => f.hasHoneypot), 'every one carries the honeypot field')
  check(forms.every((f) => f.emailRequired), 'and the email field is required')

  console.log('\n## 2. Does submitting store the address, and where\n')
  const before = await groq(`count(*[_type == "subscriber"])`)
  await page.evaluate((email) => {
    const f = Array.from(document.querySelectorAll('form')).find((x) => x.querySelector('input[type="email"]'))
    f.querySelector('input[type="email"]').value = email
    f.requestSubmit()
  }, EMAIL)
  await page.waitForTimeout(5000)

  const sub = await groq(
    `*[_type == "subscriber" && email == $e][0]{ _id, email, status, source, token, createdAt, confirmedAt, unsubscribedAt }`,
    { e: EMAIL })
  check(!!sub, 'the address is stored', sub ? `as a "subscriber" document, ${sub._id}` : 'NOTHING was stored')
  const after = await groq(`count(*[_type == "subscriber"])`)
  check(after === before + 1, 'exactly one document is created', `${before} → ${after}`)
  check(sub?.status === 'pending', 'and it starts PENDING, which is what makes it double opt-in', sub?.status)
  check(typeof sub?.token === 'string' && sub.token.length >= 24, 'a confirmation token is issued', sub?.token ? `${sub.token.length} chars` : 'none')
  check(!!sub?.createdAt, 'and the signup time is recorded', sub?.createdAt)

  console.log('\n## 3. Is there a confirmation email\n')
  const hasResend = !!env.RESEND_API_KEY
  check(hasResend, 'RESEND_API_KEY is configured in this environment')
  // The action awaits the Resend send and returns an error state if it throws. A stored
  // document with a success message on screen therefore means the send did not throw.
  const formText = await page.evaluate(() => {
    const f = Array.from(document.querySelectorAll('form')).find((x) => x.querySelector('input[type="email"]'))
    return f?.parentElement?.innerText ?? ''
  })
  check(/inbox|confirm/i.test(formText), 'the form tells the reader to check their inbox',
    formText.split('\n').filter(Boolean).slice(-2).join(' | '))
  cannot('the email actually ARRIVES', 'a probe address cannot receive mail. See the steps at the end.')

  console.log('\n## 4. Double opt-in: does the confirm link work\n')
  await page.goto(`${BASE}/api/subscribe/confirm?token=${sub.token}`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2000)
  const afterConfirm = await groq(`*[_type == "subscriber" && email == $e][0]{ status, confirmedAt }`, { e: EMAIL })
  check(afterConfirm?.status === 'confirmed', 'the confirm link moves it to CONFIRMED', afterConfirm?.status)
  check(!!afterConfirm?.confirmedAt, 'and records when', afterConfirm?.confirmedAt)
  check(page.url().includes('subscribed=1'), 'and the reader lands somewhere that says so', page.url())

  // A bad token must not confirm anything.
  await page.goto(`${BASE}/api/subscribe/confirm?token=definitely-not-a-real-token`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1200)
  check(page.url().includes('invalid'), 'an unrecognised token is refused', page.url())

  console.log('\n## 5. Unsubscribe -- a legal requirement, not a feature\n')
  const res = await page.goto(`${BASE}/api/subscribe/unsubscribe?token=${sub.token}`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1500)
  const body = await page.evaluate(() => document.body.innerText)
  check(res?.status() === 200, 'the unsubscribe link responds', `HTTP ${res?.status()}`)
  check(/unsubscribed/i.test(body), 'and says so in plain words', body.split('\n').filter(Boolean)[0])
  const afterUnsub = await groq(`*[_type == "subscriber" && email == $e][0]{ status, unsubscribedAt }`, { e: EMAIL })
  check(afterUnsub?.status === 'unsubscribed', 'the document is marked unsubscribed', afterUnsub?.status)
  check(!!afterUnsub?.unsubscribedAt, 'and records when', afterUnsub?.unsubscribedAt)

  // RFC 8058 one-click unsubscribe is a POST, not a GET. Mail clients use it.
  const postRes = await fetch(`${BASE}/api/subscribe/unsubscribe?token=${sub.token}`, { method: 'POST' })
  check(postRes.status === 200, 'POST works too, which RFC 8058 one-click unsubscribe requires', `HTTP ${postRes.status}`)

  console.log('\n## 6. The honeypot\n')
  const beforeBot = await groq(`count(*[_type == "subscriber"])`)
  await page.goto(`${BASE}/blog`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2500)
  await page.evaluate(() => {
    const f = Array.from(document.querySelectorAll('form')).find((x) => x.querySelector('input[type="email"]'))
    f.querySelector('input[name="website"]').value = 'http://spam.example'
    f.querySelector('input[type="email"]').value = 'bot-probe@example.invalid'
    f.requestSubmit()
  })
  await page.waitForTimeout(3000)
  const afterBot = await groq(`count(*[_type == "subscriber"])`)
  check(afterBot === beforeBot, 'a honeypot submission stores nothing', `${beforeBot} → ${afterBot}`)

  await ctx.close()
} finally {
  await browser.close()
  await mutate([{ delete: { query: `*[_type == "subscriber" && email match "*@example.invalid"]` } }])
  const left = await groq(`count(*[_type == "subscriber" && email match "*@example.invalid"])`)
  const total = await groq(`count(*[_type == "subscriber"])`)
  console.log(`\n  cleanup: ${left} probe subscribers remain (must be 0); ${total} real subscribers untouched`)
}

console.log(`\n${pass} passed, ${fail} failed, ${unknown} not establishable from here`)
console.log(`
## The one thing this cannot answer, and how to answer it yourself

Whether Resend DELIVERS. Everything above proves the site does its half: the address is
stored, the token is issued, the send does not throw, the confirm link works and the
unsubscribe link works. Delivery is between Resend and the receiving mail server.

  1. Open stefanpeele.com/blog and subscribe with an address you can read.
  2. Expect an email from the address in SITE.bookingEmail, subject
     "Confirm your subscription".
     - Nothing after a few minutes: check Resend's dashboard for the send, and whether the
       FROM domain is verified there. An unverified sending domain is the usual cause.
     - In spam: the domain needs SPF and DKIM records. Resend's dashboard lists them.
  3. Click the button. You should land on /blog?subscribed=1 and the Studio should show
     your subscriber document as "Confirmed".
  4. Click "Remove my address" in the footer of the same email. You should get a page
     saying you are unsubscribed, and the document should read "Unsubscribed".

Step 2 is the only step that can fail for reasons outside this repository.`)
process.exit(fail ? 1 : 0)
