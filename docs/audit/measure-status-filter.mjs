// docs/audit/measure-status-filter.mjs
//
// Phase 3.5, status as a filter. Two states matter and they are opposites:
//
//   PUBLISHED  no post carries a status, so the row must not exist at all.
//   DRAFT      the two fixtures carry statuses, so the row appears, counts correctly,
//              filters correctly, and clears correctly.
//
// The published case is the one worth measuring: a filter bar offering nothing to filter by
// is worse than no filter bar, and it is the state production is in today.
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

// Everything about the status filter row, read from the live DOM.
const READ = () => {
  const row = document.querySelector('[aria-label="Filter by review status"]')
  const chips = row ? Array.from(row.querySelectorAll('button')).map((b) => ({
    text: (b.innerText || '').replace(/\s+/g, ' ').trim(),
    pressed: b.getAttribute('aria-pressed'),
    icon: !!b.querySelector('svg'),
  })) : []
  const cards = Array.from(document.querySelectorAll('a[href^="/blog/"]')).filter((a) => a.querySelector('h3'))
  const count = document.querySelector('[aria-live="polite"]')
  return {
    rowExists: !!row,
    rowVisible: !!row && row.getClientRects().length > 0,
    chips,
    cardSlugs: cards.map((c) => (c.getAttribute('href') || '').replace('/blog/', '')),
    countText: count ? (count.innerText || '').trim() : null,
    // The ARCHIVE header's h2, which carries activeLabel -- not the first h2 on the page,
    // which is the "Featured" section and made this read "Featured" on every run. It is the
    // h2 that shares a parent with the live post count.
    heading: (count?.parentElement?.querySelector('h2')?.textContent ?? '')
      .replace(new RegExp('[' + String.fromCharCode(0x200b, 0x200c, 0x200d, 0xfeff) + ']', 'g'), '').trim() || null,
  }
}

await mutate([{ createOrReplace: { _id: ID, _type: 'sanity.previewUrlSecret', secret, studioUrl: '/studio' } }])
const browser = await chromium.launch()
try {
  // -- PUBLISHED: the row must not exist ---------------------------------------
  console.log('\nA. published /blog — no post carries a status')
  const pubCtx = await browser.newContext({ viewport: { width: 1440, height: 1200 } })
  const pub = await pubCtx.newPage()
  await pub.goto(`${BASE}/blog`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await pub.waitForTimeout(2000)
  const pubR = await pub.evaluate(READ)
  check(!pubR.rowExists, 'the status filter row is absent entirely', `${pubR.cardSlugs.length} published cards`)
  // Positive control: the OTHER filter rows must be there, or "absent" just means the page
  // did not render.
  const otherRows = await pub.evaluate(() =>
    Array.from(document.querySelectorAll('[role="group"][aria-label^="Filter by"], [role="group"][aria-label="Sort"]'))
      .map((el) => el.getAttribute('aria-label')))
  check(otherRows.length >= 2, 'positive control: the other filter rows DID render', otherRows.join(' | '))
  await pubCtx.close()

  // -- DRAFT: the row appears and works ----------------------------------------
  console.log('\nB. draft /blog — two fixtures carry statuses')
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1200 } })
  const page = await ctx.newPage()
  await page.goto(`${BASE}/api/draft-mode/enable?sanity-preview-secret=${secret}&sanity-preview-pathname=${encodeURIComponent('/blog')}`,
    { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForLoadState('load').catch(() => {})
  await page.waitForTimeout(3200)
  const r = await page.evaluate(READ)

  check(r.rowExists && r.rowVisible, 'the status filter row appears', `${r.chips.length} chips`)
  const facets = r.chips.slice(1) // chip 0 is "All"
  console.log(`  chips: ${r.chips.map((c) => c.text).join(' | ')}`)
  // kitchen-sink: peer-reviewed, fact-checked, seeking-review, open-to-comment + derived
  // revised = 5. minimal: seeking-review = 1. So seeking-review should count 2.
  check(facets.length === 5, 'one chip per status actually present', `${facets.length}`)
  check(facets.every((c) => c.icon), 'every chip carries the same icon the card mark uses', '')
  const seeking = facets.find((c) => /seeking/i.test(c.text))
  check(!!seeking && /\b2\b/.test(seeking.text), 'seeking-review counts 2 — both fixtures carry it', seeking && seeking.text)
  const peer = facets.find((c) => /peer reviewed/i.test(c.text))
  check(!!peer && /\b1\b/.test(peer.text), 'peer-reviewed counts 1', peer && peer.text)
  const revised = facets.find((c) => /revised/i.test(c.text))
  check(!!revised, 'the DERIVED revised status is offered as a filter, not just rendered', revised && revised.text)

  // -- filtering actually narrows ----------------------------------------------
  console.log('\nC. selecting a status narrows the list')
  const before = r.cardSlugs
  await page.goto(`${BASE}/blog?status=peer-reviewed`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(2500)
  const onlyPeer = await page.evaluate(READ)
  check(onlyPeer.cardSlugs.length === 1 && onlyPeer.cardSlugs[0] === 'fixture-kitchen-sink',
    'status=peer-reviewed leaves exactly the one post that has it',
    `${before.length} -> ${onlyPeer.cardSlugs.length}: ${onlyPeer.cardSlugs.join(', ')}`)
  const pressed = onlyPeer.chips.find((c) => c.pressed === 'true')
  check(!!pressed && /peer reviewed/i.test(pressed.text), 'that chip reads as pressed', pressed && pressed.text)
  check(/\b1\b/.test(onlyPeer.countText || ''), 'the live count agrees', onlyPeer.countText)

  await page.goto(`${BASE}/blog?status=seeking-review`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(2500)
  const seek = await page.evaluate(READ)
  check(seek.cardSlugs.length === 2, 'status=seeking-review leaves both fixtures', seek.cardSlugs.join(', '))

  // A status no post has must empty the list rather than be ignored.
  await page.goto(`${BASE}/blog?status=nonexistent-status`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(2500)
  const none = await page.evaluate(READ)
  check(none.cardSlugs.length === 0, 'an unknown status filters to nothing rather than being ignored',
    `${none.cardSlugs.length} cards`)

  // -- combines with another filter --------------------------------------------
  console.log('\nD. it combines with the existing filters')
  await page.goto(`${BASE}/blog?status=seeking-review&lane=field-notes`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(2500)
  const combo = await page.evaluate(READ)
  check(combo.cardSlugs.length === 1 && combo.cardSlugs[0] === 'fixture-minimal',
    'status + lane intersect rather than one overriding the other', combo.cardSlugs.join(', '))
  check(/seeking peer review/i.test(combo.heading || ''), 'the heading names the status too',
    combo.heading)
  await ctx.close()
} finally {
  await browser.close()
  await mutate([{ delete: { id: ID } }])
}

console.log(`\n${pass} passed / ${fail} failed`)
process.exit(fail ? 1 : 0)
