// docs/audit/measure-comments.mjs
//
// Phase 8, end to end, against a running build.
//
// This drives the real form and the real confirm route, and it checks the one thing that
// matters more than any of the rendering: **nothing private reaches the browser.** The
// reviewer anonymity work found real names readable in view-source while no pixel showed
// them, and a comment system stores an email address for every person who writes one.
//
// Everything it creates is deleted at the end and the deletion is verified.
//
//   node docs/audit/measure-comments.mjs
//
import { chromium } from '@playwright/test'
import { createHmac } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const BASE = process.env.BASE || 'http://127.0.0.1:3000'
const OUT = path.join('docs', 'audit', 'screenshots', 'phase-8')
const SLUG = process.env.SLUG || 'the-field-the-moment-and-what-it-means-for-us-networking-industry'
const ARTICLE = `${BASE}/blog/${SLUG}`

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split(String.fromCharCode(10)).map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]))
const { NEXT_PUBLIC_SANITY_PROJECT_ID: P, NEXT_PUBLIC_SANITY_DATASET: D, SANITY_API_WRITE_TOKEN: T } = env
const API = `https://${P}.api.sanity.io/v2025-02-27`
const AUTH = { Authorization: `Bearer ${T}`, 'Content-Type': 'application/json' }

const MARK = `probe-${Date.now()}`
const EMAIL = `probe+${Date.now()}@example.invalid`

let pass = 0, fail = 0
const check = (ok, name, detail) => {
  if (ok) { pass++; console.log(`  PASS  ${name}${detail ? '  -- ' + detail : ''}`) }
  else { fail++; console.log(`  FAIL  ${name}${detail ? '  -- ' + detail : ''}`) }
}

const groq = (query, params = {}) =>
  fetch(`${API}/data/query/${D}?perspective=raw&query=${encodeURIComponent(query)}` +
    Object.entries(params).map(([k, v]) => `&$${k}=${encodeURIComponent(JSON.stringify(v))}`).join(''), { headers: AUTH })
    .then((r) => r.json()).then((r) => r.result)

const mutate = (mutations) =>
  fetch(`${API}/data/mutate/${D}`, { method: 'POST', headers: AUTH, body: JSON.stringify({ mutations }) })
    .then((r) => r.json())

/**
 * Fire the REAL revalidation webhook, signed the way Sanity signs it.
 *
 * A moderator's change happens in the Studio, and locally there is no webhook to hear it --
 * so without this the page keeps serving the render Next cached before the change, and the
 * harness reports the FEATURE as broken. That same cache hid a genuine bug earlier in this
 * phase, which is exactly why this calls the real endpoint with a real signature instead of
 * working around it: the webhook's own comment rules get tested at the same time.
 */
async function fireWebhook(doc) {
  const secret = env.SANITY_REVALIDATE_SECRET
  if (!secret) return { skipped: 'no SANITY_REVALIDATE_SECRET' }
  const body = JSON.stringify(doc)
  const ts = Date.now()
  const sig = createHmac('sha256', secret).update(`${ts}.${body}`).digest('base64url')
  const res = await fetch(`${BASE}/api/draft-mode/enable/revalidate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'sanity-webhook-signature': `t=${ts},v1=${sig}` },
    body,
  })
  return { status: res.status, body: await res.json().catch(() => null) }
}

async function cleanup() {
  await mutate([
    { delete: { query: `*[_type == "comment" && (body match "${MARK}*" || email == "${EMAIL}")]` } },
    { delete: { query: `*[_type == "rateBucket"]` } },
  ])
  const left = await groq(`count(*[_type == "comment" && (body match "${MARK}*" || email == "${EMAIL}")])`)
  console.log(`\n  cleanup: ${left} probe comments remain (must be 0)`)
  return left
}

fs.mkdirSync(OUT, { recursive: true })
const browser = await chromium.launch()
try {
  const postId = await groq(`*[_type == "post" && slug.current == $s][0]._id`, { s: SLUG })
  if (!postId) throw new Error(`no post with slug ${SLUG}`)

  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  const page = await ctx.newPage()
  await page.goto(ARTICLE, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(2500)
  await page.evaluate(() => document.querySelectorAll('[data-sonner-toaster], [data-sonner-toast]').forEach((el) => el.remove()))

  console.log('\n## The section renders and invites\n')
  const section = await page.evaluate(() => {
    const el = document.getElementById('comments')
    if (!el) return null
    return {
      text: el.innerText,
      y: Math.round(el.getBoundingClientRect().top + window.scrollY),
      labels: Array.from(el.querySelectorAll('input[name="label"]')).map((b) => b.value),
      nativeRadios: el.querySelectorAll('input[name="label"][type="radio"]').length,
    }
  })
  check(!!section, 'the comments section exists on the article', section ? `at y=${section.y}` : 'missing')
  check((section?.labels?.length ?? 0) === 5, 'five labels, not four', section?.labels?.join(' | '))
  check(section?.nativeRadios === 5, 'and they are native radios, so the form works without JS',
    `${section?.nativeRadios} input[name=label]`)
  check(/Anonymous|anonymous|without my name/i.test(section?.text ?? ''), 'the anonymity option is offered')
  check(/never shown|never shared/i.test(section?.text ?? ''), 'and the form says what the email is for',
    (section?.text ?? '').split('\n').find((l) => /never shown/i.test(l)))

  console.log('\n## Posting: the honeypot and the timing check are answered like a success\n')
  // A bot fills the honeypot. The server must reply as if nothing happened AND write nothing.
  const beforeHoney = await groq(`count(*[_type == "comment"])`)
  await page.evaluate(() => {
    const f = document.querySelector('#comments form')
    f.querySelector('input[name="website"]').value = 'http://spam.example'
    f.querySelector('textarea[name="body"]').value = 'honeypot probe'
    f.querySelector('input[name="email"]').value = 'bot@example.invalid'
    f.requestSubmit()
  })
  await page.waitForTimeout(2500)
  const afterHoney = await groq(`count(*[_type == "comment"])`)
  check(afterHoney === beforeHoney, 'a honeypot submission writes nothing', `${beforeHoney} → ${afterHoney}`)

  console.log('\n## Posting a real comment\n')
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2500)
  // Wait past the three-second timing gate, which is the point of it.
  await page.waitForTimeout(3400)
  await page.evaluate(([mark, email]) => {
    const f = document.querySelector('#comments form')
    f.querySelector('textarea[name="body"]').value = `${mark} this is a probe comment about the MTU claim`
    f.querySelector('input[name="email"]').value = email
    f.querySelector('input[name="name"]').value = 'Probe Person'
    // A native radio, set directly. The first version clicked a button that drove React
    // state into a hidden input and submitted in the same tick, so the hidden input still
    // held the previous value -- the harness reported the wrong label stored and it was
    // right to. The form now uses real radios, which is also why this line is this simple.
    const correction = f.querySelector('input[name="label"][value="correction"]')
    if (correction) correction.checked = true
    f.requestSubmit()
  }, [MARK, EMAIL])
  await page.waitForTimeout(4000)

  const stored = await groq(
    `*[_type == "comment" && email == $e][0]{ _id, status, label, authorName, anonymous, body, token, ipHash, "hasToken": defined(token) }`,
    { e: EMAIL })
  check(!!stored, 'the comment is written', stored ? `status=${stored.status} label=${stored.label}` : 'nothing stored')
  check(stored?.status === 'pending', 'a first-time address is held pending, not published', stored?.status)
  check(stored?.label === 'correction', 'the chosen label is stored', stored?.label)
  check(stored?.hasToken === true, 'a confirmation token is issued')
  check(typeof stored?.ipHash === 'string' && stored.ipHash.length === 32, 'the IP is stored as a hash, not an address', stored?.ipHash)
  check(!/\d+\.\d+\.\d+\.\d+/.test(stored?.ipHash ?? ''), 'and the hash does not contain an address')

  const pendingText = await page.evaluate(() => document.getElementById('comments')?.innerText ?? '')
  check(/inbox/i.test(pendingText), 'the reader is told to check their inbox',
    pendingText.split('\n').find((l) => /inbox/i.test(l)))
  check(!pendingText.includes(MARK), 'and the pending comment is NOT shown to anyone yet')

  console.log('\n## Confirming\n')
  await page.goto(`${BASE}/api/comments/confirm?token=${stored.token}`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(3000)
  const landed = new URL(page.url())
  check(landed.pathname === `/blog/${SLUG}`, 'the confirm link lands on the article, not a confirmation page', landed.pathname)
  check(landed.hash.startsWith('#comment-'), 'and on the comment itself', landed.hash)

  const confirmed = await groq(`*[_type == "comment" && email == $e][0]{ status, "hasToken": defined(token) }`, { e: EMAIL })
  check(confirmed?.status === 'published', 'the comment is published', confirmed?.status)
  check(confirmed?.hasToken === false, 'and the token is spent, so the link cannot be replayed')

  console.log('\n## The redaction contract -- the part that matters most\n')
  await page.goto(ARTICLE, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(3000)
  const visible = await page.evaluate(() => document.getElementById('comments')?.innerText ?? '')
  check(visible.includes(MARK), 'the published comment is now on the page')
  check(/Probe Person/.test(visible), 'with the name that was given')

  // view-source, not innerText. The RSC payload is where the leak would be and where the
  // reviewer bug actually was -- no pixel showed those names either.
  const html = await page.content()
  check(!html.includes(EMAIL), 'the EMAIL ADDRESS is nowhere in the served HTML or the RSC payload')
  check(!html.includes(stored.ipHash), 'and neither is the IP hash')
  check(!html.includes(stored.token ?? 'no-token-xyz'), 'and neither is the token')

  // Scroll to the section before capturing, and clear the toast again: it is re-created on
  // every navigation, so removing it once at the top of the run is not enough. The first
  // version of this line captured the top of the article -- a frame of the thing it was not
  // testing, filed as evidence of the thing it was.
  await page.evaluate(() => {
    document.querySelectorAll('[data-sonner-toaster], [data-sonner-toast]').forEach((el) => el.remove())
    const el = document.getElementById('comments')
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: 'instant' })
  })
  await page.waitForTimeout(600)
  await page.screenshot({ path: path.join(OUT, 'comments-1440.jpg'), type: 'jpeg', quality: 80 })

  console.log('\n## The moderation webhook reaches the article\n')
  const hook = await fireWebhook({ _type: 'comment', post: { _ref: postId } })
  check(hook.status === 200, 'a signed comment webhook is accepted', JSON.stringify(hook.body ?? hook))
  check(!!hook.body?.paths?.some((p) => p.includes(SLUG)),
    'and it revalidates the ARTICLE, resolved from post._ref -- a comment has no slug of its own',
    (hook.body?.paths ?? []).join(', '))
  const noise = await fireWebhook({ _type: 'rateBucket' })
  check(Array.isArray(noise.body?.paths) && noise.body.paths.length === 0,
    'a rateBucket write revalidates NOTHING -- or every refused spam attempt revalidates the whole site',
    JSON.stringify(noise.body?.paths))

  console.log('\n## Anonymity\n')
  await mutate([{ patch: { query: `*[_type == "comment" && email == "${EMAIL}"]`, set: { anonymous: true, authorName: 'Real Name Do Not Show' } } }])
  await fireWebhook({ _type: 'comment', post: { _ref: postId } })
  await page.goto(ARTICLE, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(3000)
  const anonHtml = await page.content()
  const anonText = await page.evaluate(() => document.getElementById('comments')?.innerText ?? '')
  check(/Anonymous/.test(anonText), 'an anonymous comment renders as Anonymous', anonText.split('\n').find((l) => /Anonymous/.test(l)))
  check(!anonHtml.includes('Real Name Do Not Show'),
    'and the real name is NOT in the payload -- redacted on the server, not hidden with CSS')

  console.log('\n## Removal states are visibly distinct (8.5)\n')
  for (const [status, expected] of [['removed', 'Removed by Stefan'], ['withdrawn', 'Withdrawn by the commenter']]) {
    await mutate([{ patch: { query: `*[_type == "comment" && email == "${EMAIL}"]`, set: { status } } }])
    await fireWebhook({ _type: 'comment', post: { _ref: postId } })
    await page.goto(ARTICLE, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2600)
    const t = await page.evaluate(() => document.getElementById('comments')?.innerText ?? '')
    const h = await page.content()
    check(t.includes(expected), `${status} reads "${expected}"`)
    check(!h.includes(MARK), `and the ${status} body is not in the payload at all`)
  }

  await ctx.close()
} finally {
  await browser.close()
  await cleanup()
}

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
