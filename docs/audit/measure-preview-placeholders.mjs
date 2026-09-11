// docs/audit/measure-preview-placeholders.mjs
//
// Phase 4.6 (hover preview) and 4.2 (planned-post placeholders).
//
// 4.2's items are empty by default -- shipping invented post titles would be fake content on
// a site whose subject is not doing that. So this harness TEMPORARILY patches the blogPage
// singleton with two entries, captures both visual treatments, and puts the original value
// back. The original is read first and restored in a `finally`, and the restore is verified
// by re-reading, not assumed.
import { chromium } from '@playwright/test'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]))
const { NEXT_PUBLIC_SANITY_PROJECT_ID: P, NEXT_PUBLIC_SANITY_DATASET: D, SANITY_API_WRITE_TOKEN: T } = env
const API = `https://${P}.api.sanity.io/v2025-02-27`
const BASE = 'http://127.0.0.1:3000'
const OUT = path.join('docs', 'audit', 'screenshots', 'placeholders')
const SECRET_ID = 'sanity-preview-url-secret.capture-harness'
const secret = crypto.randomBytes(24).toString('hex')

const query = async (groq) => {
  const r = await fetch(`${API}/data/query/${D}?query=${encodeURIComponent(groq)}&perspective=raw`,
    { headers: { Authorization: `Bearer ${T}` } })
  const j = await r.json()
  if (j.error) throw new Error(JSON.stringify(j.error))
  return j.result
}
const mutate = async (mutations) => {
  const r = await fetch(`${API}/data/mutate/${D}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${T}` },
    body: JSON.stringify({ mutations }),
  })
  const j = await r.json()
  if (j.error) throw new Error(JSON.stringify(j.error))
  return j
}

let pass = 0
let fail = 0
const check = (ok, name, detail) => {
  if (ok) { pass++; console.log(`  PASS  ${name}${detail ? '  -- ' + detail : ''}`) }
  else { fail++; console.log(`  FAIL  ${name}${detail ? '  -- ' + detail : ''}`) }
}

fs.mkdirSync(OUT, { recursive: true })
const originalPlanned = await query(`*[_id == "blogPage"][0].planned`)
console.log(`blogPage.planned before: ${JSON.stringify(originalPlanned) ?? 'undefined'}`)

const DEMO = {
  enabled: true,
  heading: 'Planned',
  note: 'Written up next. These are the gaps I already know about.',
  label: 'Not written yet',
  treatment: 'dark',
  items: [
    { _type: 'plannedPost', _key: 'demo1', topic: 'What the lab switch replacement actually cost, in hours', lane: 'lab-notes' },
    { _type: 'plannedPost', _key: 'demo2', topic: 'Why spanning tree is still the thing that breaks first', lane: 'concept-deep-dive' },
  ],
}

await mutate([{ createOrReplace: { _id: SECRET_ID, _type: 'sanity.previewUrlSecret', secret, studioUrl: '/studio' } }])
const browser = await chromium.launch()
try {
  // ── 4.6 — the hover preview ────────────────────────────────────────────────
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  const page = await ctx.newPage()
  await page.goto(`${BASE}/blog`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(2000)

  console.log('\nA. 4.6 — it does not fire on a pass-through')
  const card = page.locator('a[href^="/blog/"]').filter({ has: page.locator('h3') }).first()
  await card.hover()
  await page.waitForTimeout(150)
  const early = await page.locator('.post-preview').count()
  check(early === 0, 'nothing at 150ms — a pointer crossing the grid opens nothing', `${early} panel(s)`)
  // Move away before the 350ms threshold, the way an accidental pass-through does.
  await page.mouse.move(5, 5)
  await page.waitForTimeout(600)
  const afterPassThrough = await page.locator('.post-preview').count()
  check(afterPassThrough === 0, 'and still nothing after leaving before the threshold', `${afterPassThrough}`)

  console.log('\nB. 4.6 — it opens on a deliberate hover')
  await card.hover()
  await page.waitForTimeout(700)
  const open = await page.locator('.post-preview').count()
  check(open === 1, 'exactly one panel opens after the delay', `${open}`)

  const box = await page.evaluate(() => {
    const el = document.querySelector('.post-preview')
    if (!el) return null
    const r = el.getBoundingClientRect()
    const cs = getComputedStyle(el)
    return {
      x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
      vw: window.innerWidth, vh: window.innerHeight,
      pointerEvents: cs.pointerEvents, zIndex: cs.zIndex, role: el.getAttribute('role'),
      docW: document.documentElement.scrollWidth,
      text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 90),
      marks: el.querySelectorAll('svg').length,
    }
  })
  console.log(`  panel: ${JSON.stringify(box)}`)
  check(!!box && box.w <= 320, 'SMALL: the panel is at most 320px wide', box && `${box.w}px`)
  check(!!box && box.x >= 0 && box.x + box.w <= box.vw, 'it stays inside the viewport horizontally',
    box && `${box.x}..${box.x + box.w} of ${box.vw}`)
  check(!!box && box.y >= 0 && box.y + box.h <= box.vh + 1, 'and vertically', box && `${box.y}..${box.y + box.h} of ${box.vh}`)
  check(!!box && box.docW <= box.vw, 'it introduces no horizontal page scroll', box && `${box.docW} vs ${box.vw}`)
  check(!!box && box.pointerEvents === 'none', 'it cannot swallow a click meant for the card', box && box.pointerEvents)
  check(!!box && box.role === 'tooltip', 'it is announced as a tooltip', box && box.role)

  console.log('\nC. 4.6 — the RIGHTMOST card flips rather than overflowing')
  // The edge case the brief names: positioning logic that keeps it on-screen near edges.
  const cards = page.locator('a[href^="/blog/"]').filter({ has: page.locator('h3') })
  const n = await cards.count()
  const last = cards.nth(n - 1)
  await page.mouse.move(5, 5)
  await page.waitForTimeout(400)
  await last.hover()
  await page.waitForTimeout(700)
  const edge = await page.evaluate(() => {
    const el = document.querySelector('.post-preview')
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { x: Math.round(r.x), right: Math.round(r.right), vw: window.innerWidth, docW: document.documentElement.scrollWidth }
  })
  check(!!edge && edge.x >= 0 && edge.right <= edge.vw, 'the last card in the row keeps its panel on screen',
    edge && `${edge.x}..${edge.right} of ${edge.vw}`)
  check(!!edge && edge.docW <= edge.vw, 'still no horizontal scroll', edge && `${edge.docW}`)

  console.log('\nD. 4.6 — keyboard and dismissal')
  await page.keyboard.press('Escape')
  await page.waitForTimeout(250)
  check(await page.locator('.post-preview').count() === 0, 'Escape closes it', '')
  await page.mouse.move(5, 5)
  await page.waitForTimeout(400)
  // Focus the card link the way a keyboard user reaches it.
  await card.focus()
  await page.waitForTimeout(700)
  const byKeyboard = await page.locator('.post-preview').count()
  check(byKeyboard === 1, 'focus alone opens it — the keyboard equivalent exists', `${byKeyboard}`)
  const described = await card.getAttribute('aria-describedby')
  check(!!described, 'and the LINK carries aria-describedby, so it is announced', String(described).slice(0, 20))

  console.log('\nE. 4.6 — absent where there is no hover')
  await ctx.close()
  const narrow = await browser.newContext({ viewport: { width: 390, height: 900 } })
  const np = await narrow.newPage()
  await np.goto(`${BASE}/blog`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await np.waitForTimeout(1500)
  const narrowCard = np.locator('a[href^="/blog/"]').filter({ has: np.locator('h3') }).first()
  await narrowCard.hover()
  await np.waitForTimeout(700)
  const visibleNarrow = await np.evaluate(() => {
    const el = document.querySelector('.post-preview')
    return el ? getComputedStyle(el).display : 'absent'
  })
  check(visibleNarrow === 'none' || visibleNarrow === 'absent',
    'nothing renders at 390px, where there is no hover to begin with', visibleNarrow)
  await narrow.close()

  // ── 3.3's fifth surface, in draft mode ─────────────────────────────────────
  // The published posts carry no status, so the check above measured a preview with zero
  // marks -- true, and useless as evidence. 3.3 claims the preview shows THE SAME mark the
  // card does, and only the draft fixtures can show that.
  console.log(String.fromCharCode(10) + "E2. 3.3 fifth surface -- the preview carries the card's status mark")
  const dctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  const dp = await dctx.newPage()
  await dp.goto(`${BASE}/api/draft-mode/enable?sanity-preview-secret=${encodeURIComponent(secret)}&sanity-preview-pathname=${encodeURIComponent('/blog')}`,
    { waitUntil: 'domcontentloaded', timeout: 60000 })
  await dp.waitForLoadState('load').catch(() => {})
  await dp.waitForTimeout(3500)
  const ksCard = dp.locator('a[href="/blog/fixture-kitchen-sink"]').first()
  const cardMarks = await ksCard.evaluate((el) =>
    Array.from(el.querySelectorAll('span[title]')).filter((s) => s.querySelector('svg')).map((s) => s.getAttribute('title')))
  await ksCard.hover()
  await dp.waitForTimeout(800)
  const previewMarks = await dp.evaluate(() => {
    const el = document.querySelector('.post-preview')
    if (!el) return null
    return Array.from(el.querySelectorAll('span[title]')).map((s) => s.getAttribute('title'))
  })
  console.log(`  card: ${JSON.stringify(cardMarks)}`)
  console.log(`  preview: ${JSON.stringify(previewMarks)}`)
  check(!!previewMarks && previewMarks.length > 0, 'the preview renders status marks at all', String(previewMarks?.length))
  check(JSON.stringify(previewMarks) === JSON.stringify(cardMarks),
    "and they are EXACTLY the card's marks, in the same order", `${JSON.stringify(previewMarks)} vs ${JSON.stringify(cardMarks)}`)
  const srLabels = await dp.evaluate(() => {
    const el = document.querySelector('.post-preview')
    return el ? Array.from(el.querySelectorAll('.sr-only')).map((s) => s.textContent?.trim()) : []
  })
  check(srLabels.length === (previewMarks?.length ?? -1), 'each mark carries an sr-only full label, as on the card',
    JSON.stringify(srLabels))
  await dctx.close()

  // ── 4.2 — placeholders ─────────────────────────────────────────────────────
  console.log('\nF. 4.2 — placeholders, with the singleton temporarily populated')
  for (const treatment of ['dark', 'glass']) {
    await mutate([{ patch: { id: 'blogPage', set: { planned: { ...DEMO, treatment } } } }])
    // The page is statically cached; draft mode bypasses that and re-fetches.
    const c = await browser.newContext({ viewport: { width: 1440, height: 1100 } })
    const p = await c.newPage()
    await p.goto(`${BASE}/api/draft-mode/enable?sanity-preview-secret=${encodeURIComponent(secret)}&sanity-preview-pathname=${encodeURIComponent('/blog')}`,
      { waitUntil: 'domcontentloaded', timeout: 60000 })
    await p.waitForLoadState('load').catch(() => {})
    await p.waitForTimeout(3500)

    const r = await p.evaluate(() => {
      const sec = document.querySelector('[aria-labelledby="planned-heading"]')
      const cards = sec ? Array.from(sec.querySelectorAll('li')) : []
      return {
        found: !!sec,
        nosnippet: sec ? sec.hasAttribute('data-nosnippet') : false,
        count: cards.length,
        // 4.2: must be announced as placeholders, NOT as links.
        links: sec ? sec.querySelectorAll('a').length : -1,
        buttons: sec ? sec.querySelectorAll('button').length : -1,
        focusables: sec ? sec.querySelectorAll('a, button, [tabindex]').length : -1,
        treatment: cards[0]?.getAttribute('data-treatment') ?? null,
        tileBg: cards[0] ? getComputedStyle(cards[0].querySelector('.placeholder-tile')).backgroundImage.slice(0, 40) : null,
        tileBorder: cards[0] ? getComputedStyle(cards[0].querySelector('.placeholder-tile')).borderStyle : null,
        text: sec ? (sec.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 160) : null,
      }
    })
    if (treatment === 'dark') {
      check(r.found, 'the planned section renders', `${r.count} cards`)
      check(r.count === 2, 'one card per planned item', `${r.count}`)
      check(r.links === 0, 'NOT links — nothing in it is announced as a link', `${r.links} anchors`)
      check(r.focusables === 0, 'and nothing is focusable, so it is inert by construction', `${r.focusables}`)
      check(r.nosnippet, 'data-nosnippet keeps it out of search snippets', '')
      check(/not written yet/i.test(r.text || ''), 'every card says it is not written yet', '')
      check(/lab switch replacement/i.test(r.text || ''), 'the intended topic shows — it doubles as a roadmap', '')
      check(r.tileBorder === 'dashed', 'the tile is dashed, the one convention read as "placeholder"', String(r.tileBorder))
    }
    check(r.treatment === treatment, `treatment "${treatment}" is applied`, String(r.treatment))
    const sec = p.locator('[aria-labelledby="planned-heading"]')
    await sec.screenshot({ path: path.join(OUT, `planned-${treatment}-1440.jpg`, ), type: 'jpeg', quality: 92 })
    console.log(`  captured planned-${treatment}-1440.jpg`)
    await c.close()
  }
} finally {
  await browser.close()
  // Put the singleton back exactly as it was, and PROVE it rather than assuming.
  if (originalPlanned === undefined || originalPlanned === null) {
    await mutate([{ patch: { id: 'blogPage', unset: ['planned'] } }])
  } else {
    await mutate([{ patch: { id: 'blogPage', set: { planned: originalPlanned } } }])
  }
  const restored = await query(`*[_id == "blogPage"][0].planned`)
  const same = JSON.stringify(restored ?? null) === JSON.stringify(originalPlanned ?? null)
  console.log(`\nblogPage.planned restored: ${same ? 'yes, identical to before' : 'NO — differs from the original'}`)
  if (!same) { console.log(`  before: ${JSON.stringify(originalPlanned)}`); console.log(`  after:  ${JSON.stringify(restored)}`); fail++ }
  await mutate([{ delete: { id: SECRET_ID } }])
}

console.log(`\n${pass} passed / ${fail} failed`)
process.exit(fail ? 1 : 0)
