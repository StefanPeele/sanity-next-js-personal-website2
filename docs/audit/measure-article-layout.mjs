// docs/audit/measure-article-layout.mjs
//
// Phase 7.2 — the article layout, measured as SHIPPED.
//
// measure-prose-width.mjs answered 7.1 by injecting candidate widths onto the page. This
// measures what the page actually renders, with no style injection at all: it drives the
// reader's own controls (the `data-width` attribute and the `--article-fs` variable that
// ArticleProvider writes) and reads back real geometry.
//
// Three things it checks, because 7.2 has three claims:
//
//   1. THE MEASURE HOLDS. Real characters ÷ real lines, the same method §1.5 used on five
//      reference sites, at 3 width settings × 3 text sizes. `ch` is only worth having if
//      the CPL is the same number at 15px and at 21px.
//   2. THE TIERS ARE DISTINCT AND ORDERED. prose < wide < full, with every block landing on
//      the tier it was assigned. A tier system where two tiers measure the same is a
//      system that does nothing.
//   3. NOTHING OVERFLOWS OR COLLIDES. No element wider than its container, no horizontal
//      document scroll, and the reading column still clear of the margin column.
//
// Lines come from client rects rather than height ÷ line-height: a paragraph carrying a
// sidenote or a correction mark has boxes of differing heights and the division is wrong
// exactly where the markup is interesting.
//
//   node docs/audit/measure-article-layout.mjs
//
import { chromium } from '@playwright/test'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

// The fixture is the only document carrying every block type, and it is a DRAFT -- so a
// production server 404s it and every tier measures null. Same preview-secret dance the
// other draft harnesses use; the secret is deleted in the finally block.
const env = Object.fromEntries(
  // Split on a character code rather than a backslash escape: the escape arrived here as a
  // real carriage return through a shell heredoc and ended the regex literal mid-line.
  // tests/stega.spec.ts carries the same note for the same reason.
  fs.readFileSync('.env.local', 'utf8').split(String.fromCharCode(10)).map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]))
const { NEXT_PUBLIC_SANITY_PROJECT_ID: P, NEXT_PUBLIC_SANITY_DATASET: D, SANITY_API_WRITE_TOKEN: T } = env
const API = `https://${P}.api.sanity.io/v2025-02-27`
const SECRET_ID = 'sanity-preview-url-secret.layout-harness'
const secret = crypto.randomBytes(24).toString('hex')
const mutate = (m) => fetch(`${API}/data/mutate/${D}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${T}` },
  body: JSON.stringify({ mutations: m }),
}).then((r) => r.json())

const BASE = process.env.BASE || 'http://127.0.0.1:3000'
const OUT = path.join('docs', 'audit', 'screenshots', 'phase-7')
const SLUG = process.env.SLUG || 'the-field-the-moment-and-what-it-means-for-us-networking-industry'
const FIXTURE = 'fixture-kitchen-sink'

const SIZES = [
  { label: '15', value: '0.9375rem' },
  { label: '19', value: '1.1875rem' },
  { label: '21', value: '1.3125rem' },
]
const WIDTHS = ['narrow', 'standard', 'wide']

/** Median characters per line of the prose, measured from rects. */
const MEASURE_CPL = () => {
  const prose = document.querySelector('[data-article]')
  if (!prose) return null
  const ps = Array.from(prose.querySelectorAll(':scope > p'))
  const cpls = []
  // Zero-width characters are stega payload, not text: counting them inflates CPL.
  const ZW = new RegExp('[' + String.fromCharCode(0x200b, 0x200c, 0x200d, 0xfeff) + ']', 'g')
  for (const p of ps) {
    const text = (p.textContent || '').replace(ZW, '').trim()
    if (text.length < 140) continue
    // A Range over the contents, NOT p.getClientRects(): a block element returns ONE border
    // box from getClientRects and every paragraph then measures as a single line, which
    // silently drops every paragraph from the sample and reports a null median. Rects on
    // the same visual line share a top, within a pixel of rounding.
    const range = document.createRange()
    range.selectNodeContents(p)
    const tops = new Set()
    for (const r of Array.from(range.getClientRects())) {
      if (r.height < 2 || r.width < 1) continue
      tops.add(Math.round(r.top))
    }
    const lines = tops.size
    if (lines < 2) continue
    cpls.push(text.length / lines)
  }
  cpls.sort((a, b) => a - b)
  const mid = Math.floor(cpls.length / 2)
  const median = cpls.length === 0 ? null : cpls.length % 2 ? cpls[mid] : (cpls[mid - 1] + cpls[mid]) / 2
  const first = ps[0]
  const cs = first ? getComputedStyle(first) : null
  const main = document.getElementById('content')
  const mainWidth = main ? Math.round(main.getBoundingClientRect().width) : null
  const proseWidth = first ? Math.round(first.getBoundingClientRect().width) : null
  return {
    paragraphs: cpls.length,
    cpl: median ? Math.round(median * 10) / 10 : null,
    proseWidth,
    mainWidth,
    // The measure is a max-width, so it stops being the thing that decides the column as
    // soon as the column is narrower than it. Where that happens, CPL is a function of the
    // viewport and comparing it across text sizes says nothing about `ch`.
    clamped: proseWidth != null && mainWidth != null && proseWidth >= mainWidth - 1,
    fontSize: cs ? Math.round(parseFloat(cs.fontSize) * 10) / 10 : null,
    firstProseY: first ? Math.round(first.getBoundingClientRect().top + window.scrollY) : null,
  }
}

/** Geometry of every tier, plus overflow and collision. */
const MEASURE_TIERS = () => {
  const w = (el) => (el ? Math.round(el.getBoundingClientRect().width) : null)
  const box = (el) => {
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width) }
  }
  const prose = document.querySelector('[data-article]')
  const main = document.getElementById('content')
  const firstP = prose?.querySelector(':scope > p')
  const wideEl = prose?.querySelector(':scope > [data-span="wide"]')
  const fullEl = prose?.querySelector(':scope > [data-span="full"]')
  const figure = prose?.querySelector(':scope > figure[data-span="full"]')
  const quote = prose?.querySelector(':scope > blockquote')
  // The apparatus: main's children that are not the prose.
  const apparatus = main
    ? Array.from(main.children).filter((el) => !el.hasAttribute('data-article') && el.getBoundingClientRect().width > 0)
    : []
  const toc = document.querySelector('[data-toc="sidebar"]')

  // Overflow: any element inside the reading column wider than the column itself.
  //
  // Ancestors that scroll are EXCLUDED, and that exclusion is the difference between a
  // finding and an artifact. A code block and the packet animator are deliberately
  // `overflow-x: auto`, so their contents are wider than the column BY DESIGN and measure
  // the same 958px at a 390px viewport as at 768 — the tell that they are not laid out
  // against the page at all. Counting them reported 2 defects where there were 0.
  const overflowing = []
  const scrollers = []
  if (main) {
    const limit = main.getBoundingClientRect().width + 1
    const clipped = (el) => {
      for (let p = el.parentElement; p && p !== main.parentElement; p = p.parentElement) {
        const o = getComputedStyle(p)
        if (o.overflowX === 'auto' || o.overflowX === 'scroll' || o.overflowX === 'hidden') return true
      }
      return false
    }
    for (const el of main.querySelectorAll('*')) {
      const r = el.getBoundingClientRect()
      if (r.width <= limit) continue
      const label = `${el.tagName.toLowerCase()}.${(el.className || '').toString().split(' ')[0]} ${Math.round(r.width)}px`
      if (clipped(el)) scrollers.push(label)
      else overflowing.push(label)
    }
  }

  // Every direct child of the prose that carries NO data-span must land on exactly the
  // paragraph's column. This is the assertion that catches the failure mode the whole
  // design depends on avoiding: a measure written in `ch` re-resolving against a child's
  // own font size. When @property registration failed, the paragraphs were right and the
  // headings were 1343 / 1060 / 848 / 707 / 628px — one column per heading level, and
  // every other number in this harness still looked correct.
  const offMeasure = []
  const target = firstP ? Math.round(firstP.getBoundingClientRect().width) : null
  if (prose && target) {
    for (const el of Array.from(prose.children)) {
      if (el.hasAttribute('data-span') || el.tagName === 'BLOCKQUOTE') continue
      const width = Math.round(el.getBoundingClientRect().width)
      if (Math.abs(width - target) > 2) {
        offMeasure.push(`${el.tagName.toLowerCase()} ${width}px (measure ${target})`)
      }
    }
  }

  return {
    viewport: window.innerWidth,
    container: w(main?.parentElement),
    offMeasure: offMeasure.slice(0, 8),
    offMeasureCount: offMeasure.length,
    main: w(main),
    prose: w(firstP),
    wide: w(wideEl),
    full: w(fullEl),
    figure: w(figure),
    quote: w(quote),
    apparatus: apparatus.length ? Math.max(...apparatus.map((el) => Math.round(el.getBoundingClientRect().width))) : null,
    mainBox: box(main),
    tocBox: box(toc),
    docScrollX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    overflowing: overflowing.slice(0, 6),
    scrollers: scrollers.slice(0, 6),
  }
}

fs.mkdirSync(OUT, { recursive: true })
await mutate([{ createOrReplace: { _id: SECRET_ID, _type: 'sanity.previewUrlSecret', secret, studioUrl: '/studio' } }])
const browser = await chromium.launch()
const cplRows = []
const tierRows = []
const problems = []

try {
  for (const bp of [{ w: 1440, h: 1000 }, { w: 768, h: 1024 }, { w: 390, h: 844 }]) {
    const ctx = await browser.newContext({ viewport: { width: bp.w, height: bp.h } })
    const page = await ctx.newPage()

    // ── the real article, for CPL ──────────────────────────────────
    await page.goto(`${BASE}/blog/${SLUG}`, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await page.waitForTimeout(2500)
    // The local dev toast docks bottom-right and intercepts clicks there. A local artifact,
    // removed so it cannot appear in a committed frame.
    await page.evaluate(() => document.querySelectorAll('[data-sonner-toaster], [data-sonner-toast]').forEach((el) => el.remove()))

    for (const width of WIDTHS) {
      for (const size of SIZES) {
        // Driven the way the reader drives it: the attribute the toolbar sets and the
        // variable the provider writes. No max-width is injected anywhere.
        await page.evaluate(([wv, fs]) => {
          const main = document.getElementById('content')
          const prose = document.querySelector('[data-article]')
          if (main) main.dataset.width = wv
          if (prose) prose.style.setProperty('--article-fs', fs)
        }, [width, size.value])
        await page.waitForTimeout(420)
        const m = await page.evaluate(MEASURE_CPL)
        if (m) cplRows.push({ bp: bp.w, width, size: size.label, ...m })
      }
    }
    // back to the defaults before anything is captured or measured for tiers
    await page.evaluate(() => {
      const main = document.getElementById('content')
      const prose = document.querySelector('[data-article]')
      if (main) main.dataset.width = 'standard'
      if (prose) prose.style.removeProperty('--article-fs')
    })
    await page.waitForTimeout(420)
    await page.screenshot({ path: path.join(OUT, `article-${bp.w}.jpg`), type: 'jpeg', quality: 82 })
    await page.screenshot({ path: path.join(OUT, `article-full-${bp.w}.jpg`), type: 'jpeg', quality: 40, fullPage: true })

    // ── the fixture, for the tiers: it is the only document carrying every block type ──
    const fixturePath = `/blog/${FIXTURE}`
    await page.goto(`${BASE}/api/draft-mode/enable?sanity-preview-secret=${secret}&sanity-preview-pathname=${encodeURIComponent(fixturePath)}`,
      { waitUntil: 'domcontentloaded', timeout: 60000 })
    if (new URL(page.url()).pathname !== fixturePath) {
      problems.push(`${bp.w}: draft mode did not land on the fixture (at ${page.url()})`)
      await ctx.close()
      continue
    }
    await page.waitForTimeout(3000)
    await page.evaluate(() => document.querySelectorAll('[data-sonner-toaster], [data-sonner-toast]').forEach((el) => el.remove()))
    const t = await page.evaluate(MEASURE_TIERS)
    tierRows.push({ bp: bp.w, ...t })
    await page.screenshot({ path: path.join(OUT, `fixture-${bp.w}.jpg`), type: 'jpeg', quality: 82 })
    await page.screenshot({ path: path.join(OUT, `fixture-full-${bp.w}.jpg`), type: 'jpeg', quality: 40, fullPage: true })
    await ctx.close()
  }
} finally {
  await browser.close()
  await mutate([{ delete: { id: SECRET_ID } }])
}

// ── report ────────────────────────────────────────────────────────
console.log('\n## CPL, measured on the rendered prose — no injected styles\n')
console.log('  bp     width      size   CPL    prose px   n')
for (const r of cplRows) {
  console.log(`  ${String(r.bp).padEnd(6)} ${r.width.padEnd(10)} ${r.size.padEnd(6)} ${String(r.cpl).padEnd(6)} ${String(r.proseWidth).padStart(4)}px      ${r.paragraphs}`)
}

console.log('\n## Does the measure hold across text sizes? (the whole reason for `ch`)\n')
for (const bp of [1440, 768, 390]) {
  for (const width of WIDTHS) {
    const set = cplRows.filter((r) => r.bp === bp && r.width === width && r.cpl != null)
    if (set.length < 2) continue
    const cpls = set.map((r) => r.cpl)
    const spread = Math.round((Math.max(...cpls) - Math.min(...cpls)) * 10) / 10
    const px = set.map((r) => r.proseWidth)
    const ok = spread <= 2
    // A clamped column is the viewport talking, not the measure. The claim `ch` makes is
    // "the same CPL at every text size WHERE THE COLUMN CAN HOLD IT"; asserting it where
    // the column physically cannot would be asserting something no width setting can do.
    const clamped = set.some((r) => r.clamped)
    if (!ok && !clamped) problems.push(`${bp} ${width}: CPL spread ${spread} across text sizes, unclamped`)
    const verdict = ok ? 'HOLDS' : clamped ? 'clamped by the viewport' : 'MOVES'
    console.log(`  ${String(bp).padEnd(6)} ${width.padEnd(10)} CPL ${cpls.join(' / ').padEnd(22)} spread ${String(spread).padEnd(5)} px ${px.join(' → ').padEnd(20)} ${verdict}`)
  }
}

console.log('\n## Tiers, on the fixture (every block type in one document)\n')
for (const r of tierRows) {
  console.log(`  ${r.bp}: container ${r.container}  main ${r.main}  prose ${r.prose}  quote ${r.quote}  wide ${r.wide}  full ${r.full}  figure ${r.figure}  apparatus ${r.apparatus}`)
  console.log(`        doc overflow ${r.docScrollX}px   main ${r.mainBox?.left}–${r.mainBox?.right}   toc ${r.tocBox ? `${r.tocBox.left}–${r.tocBox.right}` : 'hidden'}`)
  if (r.offMeasureCount) console.log(`        OFF THE MEASURE (${r.offMeasureCount}): ${r.offMeasure.join(', ')}`)
  else console.log(`        every unspanned prose child is on the measure`)
  if (r.offMeasureCount) problems.push(`${r.bp}: ${r.offMeasureCount} prose child(ren) not on the measure — ${r.offMeasure[0]}`)
  if (r.scrollers.length) console.log(`        inside a scroller, by design: ${r.scrollers.join(', ')}`)
  if (r.overflowing.length) console.log(`        WIDER THAN THE COLUMN: ${r.overflowing.join(', ')}`)
  if (r.docScrollX > 0) problems.push(`${r.bp}: document scrolls horizontally by ${r.docScrollX}px`)
  if (r.overflowing.length) problems.push(`${r.bp}: ${r.overflowing.length} element(s) wider than the reading column`)
  if (r.bp >= 1024) {
    if (!(r.prose < r.wide && r.wide < r.full)) problems.push(`${r.bp}: tiers not strictly ordered — prose ${r.prose} wide ${r.wide} full ${r.full}`)
    if (r.tocBox && r.mainBox && r.mainBox.right > r.tocBox.left) problems.push(`${r.bp}: reading column overlaps the margin column`)
  }
}

fs.writeFileSync(path.join('docs', 'audit', 'article-layout.json'), JSON.stringify({ cplRows, tierRows }, null, 2))
console.log(`\nFrames in ${OUT}, raw numbers in docs/audit/article-layout.json`)
console.log(problems.length ? `\nPROBLEMS (${problems.length}):\n  ${problems.join('\n  ')}` : '\nNo problems found.')
process.exit(problems.length ? 1 : 0)
