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

// 8.4 is measured on the FIXTURE, which is a draft, because it is the only document on this
// site carrying sidenotes. Same preview-secret dance the other draft harnesses use.
const SECRET_ID = 'sanity-preview-url-secret.comments-harness'
const previewSecret = createHmac('sha256', String(Date.now())).update('comments').digest('hex').slice(0, 48)

async function cleanup() {
  await mutate([
    { delete: { query: `*[_type == "comment" && (body match "${MARK}*" || email == "${EMAIL}")]` } },
    { delete: { query: `*[_type == "rateBucket"]` } },
    { delete: { query: `*[_type == "blocklist" && email == "${EMAIL}"]` } },
    { delete: { id: SECRET_ID } },
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
  await mutate([{ createOrReplace: { _id: SECRET_ID, _type: 'sanity.previewUrlSecret', secret: previewSecret, studioUrl: '/studio' } }])

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

  console.log('\n## Threading: one level, enforced at WRITE time (8.3)\n')
  //
  // The rule is that a reply to a reply is re-parented to the ROOT, so the stored data can
  // never form a tree and no future query has to flatten one. A rendering-time flatten
  // would leave the data able to nest and the next person to write a query would get it
  // wrong -- which is why this is measured in the DOCUMENTS, not in the DOM.
  //
  // The address has now confirmed once, so everything below publishes immediately. That is
  // the trust rule from 8.1 doing its job and it is asserted rather than assumed.
  const rootId = stored._id
  const postReply = async (parentId, mark) => {
    // Clear the rate buckets between posts. Three in ten minutes is the limit and it is
    // tested on its own below; here it would just be noise in a threading test.
    await mutate([{ delete: { query: `*[_type == "rateBucket"]` } }])
    await page.goto(ARTICLE, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2600)
    await page.waitForTimeout(3400)
    return page.evaluate(async ([pid, m, email]) => {
      const f = document.querySelector('#comments form')
      // The reply form is rendered inline by the thread, but posting through the foot form
      // with a parentId is the same server path and does not depend on a click target.
      const hidden = document.createElement('input')
      hidden.type = 'hidden'; hidden.name = 'parentId'; hidden.value = pid
      f.appendChild(hidden)
      f.querySelector('textarea[name="body"]').value = m
      f.querySelector('input[name="email"]').value = email
      f.querySelector('input[name="name"]').value = 'Probe Person'
      f.requestSubmit()
    }, [parentId, mark, EMAIL])
  }

  await postReply(rootId, `${MARK} reply one`)
  await page.waitForTimeout(4500)
  const reply1 = await groq(`*[_type == "comment" && body match $b][0]{ _id, status, "parentId": parent._ref }`, { b: `${MARK} reply one*` })
  check(!!reply1, 'a reply is written', reply1 ? `status=${reply1.status}` : 'nothing')
  check(reply1?.status === 'published', 'and a trusted address publishes immediately, with no second email', reply1?.status)
  check(reply1?.parentId === rootId, 'the reply is parented to the comment it answers')

  await postReply(reply1._id, `${MARK} reply two`)
  await page.waitForTimeout(4500)
  const reply2 = await groq(`*[_type == "comment" && body match $b][0]{ _id, "parentId": parent._ref }`, { b: `${MARK} reply two*` })
  check(!!reply2, 'a reply to a reply is written')
  check(reply2?.parentId === rootId,
    'and it is RE-PARENTED to the root, not nested under the reply -- one level, in the data',
    `parent=${reply2?.parentId === rootId ? 'root' : reply2?.parentId}`)
  // The depth invariant stated as a property rather than as one case: no comment anywhere
  // may have a parent that itself has a parent.
  const nested = await groq(`count(*[_type == "comment" && defined(parent) && defined(parent->parent)])`)
  check(nested === 0, 'no comment in the dataset has a grandparent', `${nested} found`)

  console.log('\n## Rate limiting is DURABLE (8.7)\n')
  await mutate([{ delete: { query: `*[_type == "rateBucket"]` } }])
  let refusedAt = 0
  for (let i = 1; i <= 4; i++) {
    await page.goto(ARTICLE, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2400)
    await page.waitForTimeout(3300)
    await page.evaluate(([m, email, i]) => {
      const f = document.querySelector('#comments form')
      f.querySelector('textarea[name="body"]').value = `${m} rate ${i}`
      f.querySelector('input[name="email"]').value = email
      f.requestSubmit()
    }, [MARK, EMAIL, i])
    await page.waitForTimeout(3500)
    const msg = await page.evaluate(() => document.getElementById('comments')?.innerText ?? '')
    if (/three comments in ten minutes/i.test(msg) && !refusedAt) refusedAt = i
  }
  check(refusedAt === 4, 'the fourth comment in ten minutes is refused, the first three are not', `refused at #${refusedAt || 'never'}`)
  const buckets = await groq(`*[_type == "rateBucket"]{ count, key }`)
  check(buckets.length > 0, 'and the bucket is a DOCUMENT, so it survives a cold start', JSON.stringify(buckets))
  check(!buckets.some((b) => /\d+\.\d+\.\d+\.\d+/.test(b.key ?? '')), 'keyed by a hash, never by an address')

  console.log('\n## Sidenote-anchored comments (8.4)\n')
  //
  // The premise this rests on is that a sidenote has a STABLE key. It nearly did not: the
  // only identifier on the anchor was a useId(), which is per-render wiring between the
  // prose and the margin column and changes every time the page renders. A comment anchored
  // to one would have pointed at nothing on the next deploy. `data-sidenote-key` is the
  // markDef's own key and is what these assertions are about.
  // Measured on the FIXTURE, in draft mode, because it is the only document on this site
  // with sidenotes -- the published probe article has none, and the first version of this
  // section ran there and reported "0 anchors" while three of its assertions PASSED anyway.
  // `[].every()` is true. An assertion that cannot fail on an empty set is not an assertion,
  // and the precondition below is what stops that happening again.
  const fixturePath = '/blog/fixture-kitchen-sink'
  await page.goto(`${BASE}/api/draft-mode/enable?sanity-preview-secret=${previewSecret}&sanity-preview-pathname=${encodeURIComponent(fixturePath)}`,
    { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(3000)
  const onFixture = new URL(page.url()).pathname === fixturePath
  check(onFixture, 'draft mode lands on the fixture, which is the only document with sidenotes', page.url())

  const keys = onFixture ? await page.evaluate(() => Array.from(document.querySelectorAll('[data-sidenote-key]')).map((el) => ({
    key: el.getAttribute('data-sidenote-key'),
    id: el.id,
  }))) : []
  check(keys.length > 0, 'sidenote anchors carry a stable key', `${keys.length} anchors`)
  check(keys.length > 0 && keys.every((k) => k.key && !k.key.startsWith('«') && !/^:r/.test(k.key)),
    'and it is NOT a React useId -- those change on every render', keys[0] ? keys[0].key : 'none')
  check(keys.length > 0 && keys.every((k) => k.id === `sn-${k.key}`),
    'each anchor is addressable as #sn-<key>, so a backlink can land on it')

  // The key must be the same on a SECOND render. This is the whole claim, and one render
  // cannot make it.
  await page.goto(`${BASE}${fixturePath}?again=1`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2800)
  const keysAgain = await page.evaluate(() => Array.from(document.querySelectorAll('[data-sidenote-key]')).map((el) => el.getAttribute('data-sidenote-key')))
  check(keysAgain.length > 0 && JSON.stringify(keysAgain) === JSON.stringify(keys.map((k) => k.key)),
    'and the SAME keys come back on a second render of the same article',
    `${keysAgain.length} keys`)

  const fixtureId = await groq(`*[_id == "drafts.fixture-kitchen-sink"][0]._id`)
  const anchorKey = keys[0]?.key
  if (anchorKey && fixtureId) {
    await mutate([{ delete: { query: `*[_type == "rateBucket"]` } }])
    // Arrive the way a reader arrives: the margin note's Respond link is a plain href.
    await page.goto(`${BASE}${fixturePath}?respond=${encodeURIComponent(anchorKey)}#comments`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2600)
    const formText = await page.evaluate(() => document.getElementById('comments')?.innerText ?? '')
    check(/margin note/i.test(formText), 'arriving with ?respond= tells the reader which note they are answering',
      formText.split('\n').find((l) => /margin note/i.test(l)))
    const hiddenAnchor = await page.evaluate(() => {
      const forms = Array.from(document.querySelectorAll('#comments form'))
      const f = forms[forms.length - 1]
      return f?.querySelector('input[name="anchor"]')?.value ?? null
    })
    check(hiddenAnchor === anchorKey, 'and the form carries the anchor with no JavaScript involved', hiddenAnchor)

    await page.waitForTimeout(3300)
    await page.evaluate(([m, email]) => {
      const forms = Array.from(document.querySelectorAll('#comments form'))
      const f = forms[forms.length - 1]
      f.querySelector('textarea[name="body"]').value = `${m} anchored to a margin note`
      f.querySelector('input[name="email"]').value = email
      f.requestSubmit()
    }, [MARK, EMAIL])
    await page.waitForTimeout(4500)
    const anchored = await groq(`*[_type == "comment" && body match $b][0]{ anchor, status }`, { b: `${MARK} anchored*` })
    check(anchored?.anchor === anchorKey, 'the comment stores the sidenote key', anchored?.anchor)

    await fireWebhook({ _type: 'comment', post: { _ref: fixtureId } })
    await page.goto(`${BASE}${fixturePath}`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3200)
    const back = await page.evaluate((key) => {
      const el = document.getElementById('comments')
      const link = el?.querySelector(`a[href="#sn-${key}"]`)
      const margin = document.querySelector('.margin-note-responses')
      return { hasBacklink: !!link, marginText: margin?.textContent ?? null }
    }, anchorKey)
    check(back.hasBacklink, 'the comment renders a backlink to the passage, not just a label')
    check(back.marginText !== null && /1/.test(back.marginText),
      'and the margin note shows the response count', back.marginText)
    // The count is TEXT in an aria-hidden column. A focusable element in there would be
    // reachable by keyboard and invisible to a screen reader, which is worse than absent.
    const focusableInMargin = await page.evaluate(() =>
      document.querySelectorAll('.margin-notes a, .margin-notes button:not(.margin-note-more)').length)
    check(focusableInMargin === 0, 'and nothing new is focusable inside the aria-hidden margin column',
      `${focusableInMargin} focusable`)
  } else {
    check(false, 'a sidenote exists to anchor to', 'none found — 8.4 unmeasured, NOT passed')
  }
  // Back to the published article for everything that follows.
  await page.goto(ARTICLE, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2500)

  console.log('\n## Blocking (8.7) -- the behaviour, not the button\n')
  //
  // The Studio action is one click; what matters is what the ACCEPT PATH does afterwards.
  // A blocked address must be answered exactly like a successful post: it learns nothing,
  // retries nothing, and moves on. An error message would be free tuning for whoever is
  // trying to get through.
  await mutate([
    { delete: { query: `*[_type == "rateBucket"]` } },
    { create: { _type: 'blocklist', email: EMAIL, reason: 'probe', createdAt: new Date().toISOString() } },
  ])
  const beforeBlocked = await groq(`count(*[_type == "comment" && email == $e])`, { e: EMAIL })
  await page.goto(ARTICLE, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2500)
  await page.waitForTimeout(3300)
  await page.evaluate(([m, email]) => {
    const f = document.querySelector('#comments form')
    f.querySelector('textarea[name="body"]').value = `${m} this must never be stored`
    f.querySelector('input[name="email"]').value = email
    f.requestSubmit()
  }, [MARK, EMAIL])
  await page.waitForTimeout(4000)
  const afterBlocked = await groq(`count(*[_type == "comment" && email == $e])`, { e: EMAIL })
  const blockedMsg = await page.evaluate(() => document.getElementById('comments')?.innerText ?? '')
  check(afterBlocked === beforeBlocked, 'a blocked address writes NOTHING', `${beforeBlocked} → ${afterBlocked}`)
  check(!/blocked|refused|not allowed/i.test(blockedMsg),
    'and is never told it is blocked -- the reply is indistinguishable from success')
  check(/posted|thanks/i.test(blockedMsg), 'it reads as a normal success',
    blockedMsg.split('\n').filter((l) => /posted|thanks/i.test(l))[0])
  await mutate([{ delete: { query: `*[_type == "blocklist" && email == "${EMAIL}"]` } }])
  const blocklistLeft = await groq(`count(*[_type == "blocklist" && email == $e])`, { e: EMAIL })
  check(blocklistLeft === 0, 'and unblocking is deleting one document', `${blocklistLeft} left`)

  console.log('\n## The moderation webhook reaches the article\n')
  const hook = await fireWebhook({ _type: 'comment', post: { _ref: postId } })
  check(hook.status === 200, 'a signed comment webhook is accepted', JSON.stringify(hook.body ?? hook))
  check(!!hook.body?.paths?.some((p) => p.includes(SLUG)),
    'and it revalidates the ARTICLE, resolved from post._ref -- a comment has no slug of its own',
    (hook.body?.paths ?? []).join(', '))
  // A DELETE payload carries no document body. Proven in production: deleting a comment left
  // it on the live article indefinitely, because the rule had no post._ref to resolve and
  // revalidated nothing -- and Vercel's Data Cache survives deployments, so it did not clear
  // on its own or on a redeploy.
  const del = await fireWebhook({ _type: 'comment' })
  check(!!del.body?.paths?.some((p) => p.includes('[slug]')),
    'a comment webhook with NO post._ref still revalidates every article -- which is what a delete sends',
    (del.body?.paths ?? []).join(', '))

  const noise = await fireWebhook({ _type: 'rateBucket' })
  check(Array.isArray(noise.body?.paths) && noise.body.paths.length === 0,
    'a rateBucket write revalidates NOTHING -- or every refused spam attempt revalidates the whole site',
    JSON.stringify(noise.body?.paths))

  console.log('\n## Anonymity\n')
  await mutate([{ patch: { id: rootId, set: { anonymous: true, authorName: 'Real Name Do Not Show' } } }])
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
    await mutate([{ patch: { id: rootId, set: { status } } }])
    await fireWebhook({ _type: 'comment', post: { _ref: postId } })
    await page.goto(ARTICLE, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2600)
    const t = await page.evaluate(() => document.getElementById('comments')?.innerText ?? '')
    const h = await page.content()
    check(t.includes(expected), `${status} reads "${expected}"`)
    check(!h.includes(`${MARK} this is a probe comment`), `and the ${status} body is not in the payload at all`)
  }

  await ctx.close()
} finally {
  await browser.close()
  await cleanup()
}

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
