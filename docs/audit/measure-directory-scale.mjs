// docs/audit/measure-directory-scale.mjs
//
// Phase 4.1 / 4.4 / 4.5. The brief asks for a directory that works "at 3 posts and at 50
// posts" and for an explicit statement of what changes between those states. Both states
// exist here rather than being argued about:
//
//   PUBLISHED  3 real posts. The page must be ONE grid -- no secondary, no lane sections,
//              no river. Three sections of one card each is chrome, not navigation.
//   DRAFT      those 3 plus 47 draft scale fixtures = 50. Lead, secondary, lane sections,
//              river, in that order.
//
// Run `node scripts/seed-scale-fixtures.mjs --apply` first, and `--delete` afterwards.
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
const OUT = path.join('docs', 'audit', 'screenshots', 'directory')
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

const READ = () => {
  const ZW = new RegExp('[' + String.fromCharCode(0x200b, 0x200c, 0x200d, 0xfeff) + ']', 'g')
  const clean = (s) => (s || '').replace(ZW, '').replace(/\s+/g, ' ').trim()
  const sections = Array.from(document.querySelectorAll('section[aria-labelledby^="lane-"]')).map((s) => ({
    key: s.getAttribute('aria-labelledby').replace('lane-', ''),
    heading: clean(s.querySelector('h3')?.textContent),
    cards: s.querySelectorAll('a[href^="/blog/"]').length,
    seeAll: clean(s.querySelector('button')?.textContent),
  }))
  const riverSec = document.querySelector('section[aria-labelledby="river-heading"]')
  const cardsAll = Array.from(document.querySelectorAll('a[href^="/blog/"]')).filter((a) => a.querySelector('h3'))
  return {
    countText: clean(document.querySelector('[aria-live="polite"]')?.textContent),
    findInput: !!document.querySelector('#blog-find'),
    filtersButton: clean(Array.from(document.querySelectorAll('button')).find((b) => /filters/i.test(b.textContent || ''))?.textContent) || null,
    facetsOpen: !!document.querySelector('#blog-facets'),
    // The lane chip row must be GONE -- 4.4's answer is that sections subsume it.
    laneRow: !!document.querySelector('[aria-label="Filter by lane"]'),
    sections,
    riverRows: riverSec ? riverSec.querySelectorAll('li').length : 0,
    riverHeading: riverSec ? clean(riverSec.querySelector('h3')?.textContent) : null,
    totalCards: cardsAll.length,
    docW: document.documentElement.scrollWidth,
    vw: window.innerWidth,
    h1s: document.querySelectorAll('h1').length,
  }
}

fs.mkdirSync(OUT, { recursive: true })
await mutate([{ createOrReplace: { _id: ID, _type: 'sanity.previewUrlSecret', secret, studioUrl: '/studio' } }])
const browser = await chromium.launch()
try {
  // ── 3 posts ────────────────────────────────────────────────────────────────
  console.log(String.fromCharCode(10) + 'A. AT 3 POSTS (published) — one grid, nothing else')
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1200 } })
  const page = await ctx.newPage()
  await page.goto(`${BASE}/blog`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(2200)
  const small = await page.evaluate(READ)
  console.log(`  ${JSON.stringify({ count: small.countText, cards: small.totalCards, sections: small.sections.length, river: small.riverRows })}`)
  check(small.sections.length === 0, 'no lane sections', `${small.sections.length}`)
  check(small.riverRows === 0, 'no river', `${small.riverRows}`)
  check(!small.laneRow, 'the lane chip row is gone — sections subsume it (4.4)', '')
  check(small.findInput, 'the search field is present at every size', '')
  check(small.h1s === 1, 'exactly one h1', `${small.h1s}`)
  check(small.docW <= small.vw, 'no horizontal overflow', `${small.docW} vs ${small.vw}`)
  await page.screenshot({ path: path.join(OUT, 'scale-3-posts-1440.jpg'), type: 'jpeg', quality: 80, fullPage: true })
  await ctx.close()

  // ── 50 posts ───────────────────────────────────────────────────────────────
  console.log(String.fromCharCode(10) + 'B. AT 50 POSTS (draft) — lead, secondary, sections, river')
  for (const [w, h, name] of [[1440, 1400, '1440'], [768, 1200, '768'], [390, 900, '390']]) {
    const c = await browser.newContext({ viewport: { width: w, height: h } })
    const p2 = await c.newPage()
    await p2.goto(`${BASE}/api/draft-mode/enable?sanity-preview-secret=${secret}&sanity-preview-pathname=${encodeURIComponent('/blog')}`,
      { waitUntil: 'domcontentloaded', timeout: 60000 })
    await p2.waitForLoadState('load').catch(() => {})
    await p2.waitForTimeout(3800)
    const big = await p2.evaluate(READ)
    if (name === '1440') {
      console.log(`  ${JSON.stringify({ count: big.countText, sections: big.sections.map((s) => `${s.key}:${s.cards}/${s.seeAll}`), river: big.riverRows })}`)
      check(big.sections.length === 3, 'one section per lane', `${big.sections.length}`)
      check(big.sections.every((s) => s.cards <= 6), 'each section shows at most 6', big.sections.map((s) => s.cards).join(','))
      check(big.sections.every((s) => /All \d+/.test(s.seeAll || '')), 'each links to the rest of its lane',
        big.sections.map((s) => s.seeAll).join(' | '))
      check(big.riverRows > 0, 'the river carries the tail', `${big.riverRows} rows`)
      // Nothing may appear twice: a post in a section must not also be in the river.
      const dupes = await p2.evaluate(() => {
        const hrefs = Array.from(document.querySelectorAll('a[href^="/blog/"]')).map((a) => a.getAttribute('href'))
        const seen = new Map()
        hrefs.forEach((h) => seen.set(h, (seen.get(h) ?? 0) + 1))
        return [...seen.entries()].filter(([, n]) => n > 1).map(([h, n]) => `${h}×${n}`)
      })
      check(dupes.length === 0, 'no post appears in more than one place', dupes.join(', ') || 'none')
      check(!big.laneRow, 'still no lane chip row', '')
      check(big.h1s === 1, 'exactly one h1', `${big.h1s}`)
    }
    check(big.docW <= big.vw, `no horizontal overflow at ${name}`, `${big.docW} vs ${big.vw}`)
    await p2.screenshot({ path: path.join(OUT, `scale-50-posts-${name}.jpg`), type: 'jpeg', quality: 72, fullPage: true })
    console.log(`  captured scale-50-posts-${name}.jpg`)
    await c.close()
  }

  // ── the facets, folded ─────────────────────────────────────────────────────
  console.log(String.fromCharCode(10) + 'C. 4.4 — filtering folded into the search row')
  const fc = await browser.newContext({ viewport: { width: 1440, height: 1200 } })
  const fp = await fc.newPage()
  await fp.goto(`${BASE}/api/draft-mode/enable?sanity-preview-secret=${secret}&sanity-preview-pathname=${encodeURIComponent('/blog')}`,
    { waitUntil: 'domcontentloaded', timeout: 60000 })
  await fp.waitForLoadState('load').catch(() => {})
  await fp.waitForTimeout(3800)
  const before = await fp.evaluate(READ)
  check(!before.facetsOpen, 'the facets are COLLAPSED by default — one row, not four', '')
  check(!!before.filtersButton, 'a single Filters control opens them', before.filtersButton)
  await fp.locator('button', { hasText: /^Filters/ }).first().click()
  await fp.waitForTimeout(400)
  const opened = await fp.evaluate(READ)
  check(opened.facetsOpen, 'and they open on demand', '')

  // Typing narrows the list, and sections collapse back to one grid while it does.
  await fp.locator('#blog-find').fill('Observability')
  await fp.waitForTimeout(600)
  const searched = await fp.evaluate(READ)
  console.log(`  search "Observability": ${searched.countText}, sections=${searched.sections.length}, river=${searched.riverRows}`)
  check(searched.sections.length === 0 && searched.riverRows === 0,
    'a narrowed set is ONE grid — sectioning a result answers a question the reader stopped asking', '')
  const n = parseInt((searched.countText || '').replace(/\D+/g, ''), 10)
  check(n > 0 && n < 50, 'the search actually narrowed it', searched.countText)
  await fp.locator('#blog-find').fill('zzzzz-no-such-post')
  await fp.waitForTimeout(600)
  const none = await fp.evaluate(READ)
  check(none.totalCards === 0, 'a search matching nothing empties the list rather than being ignored', `${none.totalCards}`)
  await fc.close()
} finally {
  await browser.close()
  await mutate([{ delete: { id: ID } }])
}

console.log(String.fromCharCode(10) + `${pass} passed / ${fail} failed`)
process.exit(fail ? 1 : 0)
