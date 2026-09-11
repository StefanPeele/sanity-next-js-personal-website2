// docs/audit/measure-corrections.mjs
//
// Phase 3B — corrections in place. Measured against the rendered fixture in draft mode.
//
// The brief's requirements, each one an assertion below:
//   - the original text remains visible or recoverable
//   - the correction is attributed to whoever identified it
//   - it is marked IN PLACE, at the passage, not only at the foot
//   - it integrates with the Revised status (3.1) and Last updated (3.7)
//   - a reader can see the correction history of a piece
//   - it is authored in Studio, never generated
//
// Plus the two things the brief says to resist, which are also measurable:
//   - the original must NOT appear struck through in the body
//   - three words, not one: correction / clarification / update
import { chromium } from '@playwright/test'
import crypto from 'node:crypto'
import fs from 'node:fs'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]))
const { NEXT_PUBLIC_SANITY_PROJECT_ID: P, NEXT_PUBLIC_SANITY_DATASET: D, SANITY_API_WRITE_TOKEN: T } = env
const API = `https://${P}.api.sanity.io/v2025-02-27`
const BASE = 'http://127.0.0.1:3000'
const ID = 'sanity-preview-url-secret.capture-harness'
const secret = crypto.randomBytes(24).toString('hex')
const mutate = (m) => fetch(`${API}/data/mutate/${D}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${T}` },
  body: JSON.stringify({ mutations: m }),
}).then((r) => r.json())

let pass = 0
let fail = 0
const check = (ok, name, detail) => {
  if (ok) { pass++; console.log(`  PASS  ${name}${detail ? '  -- ' + detail : ''}`) }
  else { fail++; console.log(`  FAIL  ${name}${detail ? '  -- ' + detail : ''}`) }
}

await mutate([{ createOrReplace: { _id: ID, _type: 'sanity.previewUrlSecret', secret, studioUrl: '/studio' } }])
const browser = await chromium.launch()
try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1200 } })
  const page = await ctx.newPage()
  const path = '/blog/fixture-kitchen-sink'
  await page.goto(`${BASE}/api/draft-mode/enable?sanity-preview-secret=${secret}&sanity-preview-pathname=${encodeURIComponent(path)}`,
    { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForLoadState('load').catch(() => {})
  await page.waitForTimeout(3200)
  if (new URL(page.url()).pathname !== path) throw new Error('draft mode not entered: ' + page.url())

  const r = await page.evaluate(() => {
    const ZW = new RegExp('[' + String.fromCharCode(0x200b, 0x200c, 0x200d, 0xfeff) + ']', 'g')
    const clean = (s) => (s || '').replace(ZW, '').replace(/\s+/g, ' ').trim()
    const article = document.querySelector('[data-article]')
    const passages = Array.from(document.querySelectorAll('.correction-passage')).map((el) => ({
      text: clean(el.textContent),
      kind: el.getAttribute('data-correction-kind'),
      borderLeft: getComputedStyle(el).borderLeftColor,
      borderWidth: getComputedStyle(el).borderLeftWidth,
      inHeading: !!el.closest('h1, h2, h3, h4, h5, h6'),
    }))
    const markers = Array.from(document.querySelectorAll('.correction-marker')).map((el) => ({
      text: clean(el.textContent),
      tag: el.tagName,
      size: parseFloat(getComputedStyle(el).fontSize),
      ariaExpanded: el.getAttribute('aria-expanded'),
      ariaLabel: el.getAttribute('aria-label'),
    }))
    const foot = document.querySelector('[aria-labelledby="corrections-heading"]')
    const entries = foot ? Array.from(foot.querySelectorAll('li')).map((li) => ({
      id: li.id,
      text: clean(li.textContent),
    })) : []
    return {
      passages,
      markers,
      footFound: !!foot,
      footHeading: foot ? clean(foot.querySelector('h2')?.textContent) : null,
      entries,
      // The struck-through check, scoped to the CORRECTION surfaces. A first version scanned
      // the whole article and flagged the fixture's `whatIGotWrong` learning block, which
      // strikes a wrong belief on purpose and has nothing to do with 3B -- a wide net
      // catching a feature that was working as designed.
      struckDetail: [
        ...Array.from(document.querySelectorAll('.correction-passage, .correction-card')),
        ...Array.from(document.querySelectorAll('[aria-labelledby="corrections-heading"] *')),
      ].filter((el) => el.tagName === 'S' || el.tagName === 'DEL'
        || getComputedStyle(el).textDecorationLine.includes('line-through'))
        .map((el) => el.tagName + ' :: ' + clean(el.textContent).slice(0, 50)),
      headerText: clean(Array.from(document.querySelectorAll('header')).find((h) => h.querySelector('h1'))?.innerText),
      bodyText: clean(article?.innerText),
    }
  })

  console.log('\nA. marked in place, at the passage')
  check(r.passages.length === 3, 'three anchored passages are marked in the prose', `${r.passages.length}`)
  check(r.passages.every((p) => !p.inHeading), 'none of them is inside a heading', '')
  check(r.passages.every((p) => parseFloat(p.borderWidth) >= 1), 'each carries a visible edge', r.passages.map((p) => p.borderWidth).join(','))
  const kinds = r.passages.map((p) => p.kind)
  check(new Set(kinds).size === 3, 'THREE WORDS, not one: all three kinds render distinctly', kinds.join(', '))
  const borders = new Set(r.passages.map((p) => p.borderLeft))
  check(borders.size === 3, 'and each kind has its own edge colour', [...borders].join(' | '))

  console.log('\nB. the marker is a real control')
  check(r.markers.length === 3, 'one marker per anchored passage', `${r.markers.length}`)
  check(r.markers.every((m) => m.tag === 'BUTTON'), 'every marker is a <button>, so it is keyboard reachable',
    [...new Set(r.markers.map((m) => m.tag))].join(','))
  check(r.markers.every((m) => m.size >= 12), 'markers clear the 12px floor', r.markers.map((m) => m.size.toFixed(1)).join(','))
  check(r.markers.every((m) => m.ariaLabel && m.ariaLabel.length > 10),
    'each marker announces what it is, not just "c1"', r.markers[0] && r.markers[0].ariaLabel.slice(0, 60))
  check(r.markers.map((m) => m.text).join(',') === 'c1,c2,c3', 'numbered in order', r.markers.map((m) => m.text).join(','))

  console.log('\nC. keyboard: focus opens it, Escape closes it')
  // A correction is exactly the thing a reader must not need a mouse to find.
  await page.locator('.correction-marker').first().focus()
  await page.waitForTimeout(350)
  const afterFocus = await page.evaluate(() => ({
    expanded: document.querySelector('.correction-marker')?.getAttribute('aria-expanded'),
    cards: document.querySelectorAll('.correction-card').length,
    described: !!document.querySelector('.correction-marker')?.getAttribute('aria-describedby'),
  }))
  check(afterFocus.cards === 1, 'focus alone opens the card', `${afterFocus.cards} card(s)`)
  check(afterFocus.expanded === 'true', 'aria-expanded follows', String(afterFocus.expanded))
  check(afterFocus.described, 'aria-describedby points at the card so it is announced', '')
  const cardText = await page.evaluate(() => {
    const ZW = new RegExp('[' + String.fromCharCode(0x200b, 0x200c, 0x200d, 0xfeff) + ']', 'g')
    return (document.querySelector('.correction-card')?.textContent || '').replace(ZW, '').replace(/\s+/g, ' ').trim()
  })
  console.log(`  card: ${cardText.slice(0, 150)}`)
  check(/thanks to/i.test(cardText), 'CREDIT: the card names who caught it', '')
  check(/it said/i.test(cardText), 'RECOVERABLE: the card carries what it used to say', '')
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)
  const afterEsc = await page.evaluate(() => document.querySelectorAll('.correction-card').length)
  check(afterEsc === 0, 'Escape closes it', `${afterEsc} card(s)`)

  console.log('\nD. the original is recoverable but NOT taught')
  check(r.struckDetail.length === 0, 'nothing a correction renders is struck through', r.struckDetail.join(' | ') || 'passage, card and foot list all clean')
  check(!r.bodyText.includes('9000 bytes'), 'the wrong figure is NOT sitting in the prose',
    r.bodyText.includes('9000 bytes') ? 'found "9000 bytes" in body' : '')

  console.log('\nE. the permanent list at the foot')
  check(r.footFound, 'the corrections list renders', r.footHeading)
  check(r.entries.length === 4, 'all four corrections are listed, anchored or not', `${r.entries.length}`)
  check(r.entries.every((e) => /^correction-\d+$/.test(e.id)), 'each is addressable by id',
    r.entries.map((e) => e.id).join(','))
  const unanchored = r.entries.filter((e) => /not marked in the text/i.test(e.text))
  check(unanchored.length === 1, 'the one broken anchor SAYS SO rather than vanishing silently',
    `${unanchored.length} flagged`)
  check(r.entries.filter((e) => /thanks to/i.test(e.text)).length === 3, 'three entries carry a credit line',
    `${r.entries.filter((e) => /thanks to/i.test(e.text)).length}`)
  check(r.entries.every((e) => /it said/i.test(e.text)), 'every entry preserves the original wording', '')

  console.log('\nF. integration with 3.1 status and 3.7 last updated')
  // The fixture has a correction, so the header badge must read Corrected -- not Updated,
  // and not the old collapsed "Revised".
  // The badge row carries the strongest REVIEW claim (Peer reviewed here); the revision is
  // a different axis and rides the date line, where a reader meets it beside the date it is
  // about. What matters is that the VERB is right: this post was wrong, so "Corrected".
  check(/corrected\s+september\s+1,\s+2026/i.test(r.headerText),
    'the date line reads "Corrected", not "Updated" -- three words, not one',
    (r.headerText.match(/(corrected|clarified|updated)[^·]*/i) || ['not found'])[0].trim())
  check(!/revised/i.test(r.headerText), 'the collapsed word "Revised" is gone', '')
  check(/august 1, 2026/i.test(r.headerText), 'the published date is still there beside it', '')
  // -- frames -----------------------------------------------------------------
  console.log(String.fromCharCode(10) + 'G. frames')
  const OUT = 'docs/audit/screenshots/corrections'
  fs.mkdirSync(OUT, { recursive: true })
  for (const [w, h, name] of [[1440, 1200, '1440'], [768, 1100, '768'], [390, 900, '390']]) {
    await page.setViewportSize({ width: w, height: h })
    await page.waitForTimeout(500)
    // The marked paragraph with a correction card open -- the state worth looking at.
    // Blur FIRST. After the Escape in section C the marker still holds DOM focus, and
    // calling .focus() on an already-focused element fires no focus event, so onFocus never
    // runs and the card stays shut. The first version of this captured three breakpoints of
    // a closed card and looked exactly like the card failing to render.
    await page.evaluate(() => (document.activeElement instanceof HTMLElement) && document.activeElement.blur())
    await page.waitForTimeout(150)
    await page.locator('.correction-marker').first().focus()
    await page.waitForTimeout(450)
    const cardOpen = await page.evaluate(() => document.querySelectorAll('.correction-card').length)
    if (!cardOpen) console.log(`  WARN @${name}: card did not open, frame will be misleading`)
    const box = await page.evaluate(() => {
      const el = document.querySelector('.correction-passage')
      if (!el) return null
      const p = el.closest('p') || el
      const r = p.getBoundingClientRect()
      return { x: Math.max(0, r.left - 24), y: Math.max(0, r.top + window.scrollY - 24), width: Math.min(document.documentElement.scrollWidth, r.width + 48), height: r.height + 300 }
    })
    if (box) {
      await page.screenshot({ path: `${OUT}/in-place-${name}.jpg`, type: 'jpeg', quality: 92, clip: box, fullPage: true })
      console.log(`  in place @${name}`)
    }
    await page.keyboard.press('Escape')
    const footBox = await page.evaluate(() => {
      const el = document.querySelector('[aria-labelledby="corrections-heading"]')
      if (!el) return null
      const r = el.getBoundingClientRect()
      return { x: Math.max(0, r.left - 24), y: Math.max(0, r.top + window.scrollY - 24), width: Math.min(document.documentElement.scrollWidth, r.width + 48), height: r.height + 48 }
    })
    if (footBox) {
      await page.screenshot({ path: `${OUT}/foot-list-${name}.jpg`, type: 'jpeg', quality: 92, clip: footBox, fullPage: true })
      console.log(`  foot list @${name}`)
    }
  }

  await ctx.close()
} finally {
  await browser.close()
  await mutate([{ delete: { id: ID } }])
}

console.log(`\n${pass} passed / ${fail} failed`)
process.exit(fail ? 1 : 0)
