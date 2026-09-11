// docs/audit/measure-prose-width.mjs
//
// Phase 7.1 — the prose measure, as a candidate for widening.
//
// The brief's original instruction here was WRONG, and it was wrong because of a number
// nobody had measured: it asserted 65 characters per line and forbade widening. Measured
// directly it is 56 — the narrowest of five long-form sites and below the classical 60–75
// optimum. So this does the one thing that settles it: renders the candidate widths and
// measures the REAL character count of each rather than predicting it.
//
// METHOD, the same one §1.5 used across five sites so the numbers are comparable:
// real characters divided by real LINES, per paragraph, median over every qualifying
// paragraph. Lines are counted from client rects, not from height ÷ line-height — a
// paragraph containing an inline mark, a sidenote or a correction has boxes of differing
// heights and the division is wrong exactly where the markup is interesting.
//
// CPL depends on FONT SIZE as well as column width, and the reader now controls the size
// (seven steps, 5.2). Everything below is at the 19px default, which is decision D1, and the
// harness prints the size it measured so a future run cannot compare across two of them.
import { chromium } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const BASE = 'http://127.0.0.1:3000'
const OUT = path.join('docs', 'audit', 'screenshots', 'measure')
const SLUG = 'the-field-the-moment-and-what-it-means-for-us-networking-industry'

// The current 36rem, the 40rem that SECTION-LOG rejected on a bad number, and two wider.
const CANDIDATES = [
  { name: '36rem-current', css: '36rem' },
  { name: '40rem', css: '40rem' },
  { name: '44rem', css: '44rem' },
  { name: '48rem', css: '48rem' },
  // 7.1 asks for "a target measure with a stated character count, not a pixel width", and
  // `ch` is literally that: the advance width of "0" in the current font, so a column set in
  // ch scales WITH the reader's text size instead of against it. Every rem candidate above
  // holds its CPL only at one of the seven sizes 5.2 gave the reader.
  { name: '60ch', css: '60ch' },
  { name: '66ch', css: '66ch' },
  { name: '70ch', css: '70ch' },
  // ...and the same values applied to [data-article] instead of #content. `ch` resolves
  // against the font size of the element it is written on, and --article-fs lives on
  // [data-article], not on the <main> that carries the max-width. Written on <main> a ch is
  // a constant number of pixels and scales with nothing, which is why the three above swing
  // as widely as the rem candidates. `onProse` is the whole difference.
  { name: '60ch-on-prose', css: '60ch', onProse: true },
  { name: '66ch-on-prose', css: '66ch', onProse: true },
  { name: '70ch-on-prose', css: '70ch', onProse: true },
  // ...and finally with [data-article] ALSO given `font-size: var(--article-fs)`.
  // --article-fs is only a VARIABLE on that element; the size is applied per block by a
  // `text-[length:var(--article-fs)]` utility in CustomPortableText, so the container itself
  // stays at the inherited 16px and a `ch` written on it is 16px-worth of "0" whatever the
  // reader chose. This is the version that tests the actual hypothesis.
  { name: '60ch-sized', css: '60ch', onProse: true, sizeProse: true },
  { name: '66ch-sized', css: '66ch', onProse: true, sizeProse: true },
  { name: '70ch-sized', css: '70ch', onProse: true, sizeProse: true },
  // The three PROPOSED settings, replacing narrow 34rem / standard 36rem / wide 44rem.
  // Measured rather than extrapolated from the 60ch result: the ch-to-CPL ratio depends on
  // the font's "0" advance against its average prose character, and reading it off one data
  // point and multiplying is how a confident wrong number gets written down.
  { name: 'narrow-51ch', css: '51ch', onProse: true, sizeProse: true },
  { name: 'standard-56ch', css: '56ch', onProse: true, sizeProse: true },
  { name: 'wide-64ch', css: '64ch', onProse: true, sizeProse: true },
]

const MEASURE = () => {
  const article = document.querySelector('[data-article]')
  if (!article) return null
  const ps = Array.from(article.querySelectorAll('p'))
    .filter((p) => (p.textContent || '').trim().length > 140)
  const ZW = new RegExp('[' + String.fromCharCode(0x200b, 0x200c, 0x200d, 0xfeff) + ']', 'g')

  const cpls = []
  for (const p of ps) {
    const text = (p.textContent || '').replace(ZW, '')
    // Count LINES from client rects. A paragraph with an inline annotation produces boxes of
    // different heights, so height / line-height is wrong precisely where the markup is
    // interesting. Rects on the same visual line share a top, within a pixel of rounding.
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
  const median = cpls.length ? cpls[Math.floor(cpls.length / 2)] : null

  const first = ps[0]
  const cs = first ? getComputedStyle(first) : null
  return {
    paragraphs: cpls.length,
    cpl: median ? Math.round(median * 10) / 10 : null,
    min: cpls.length ? Math.round(cpls[0] * 10) / 10 : null,
    max: cpls.length ? Math.round(cpls[cpls.length - 1] * 10) / 10 : null,
    widthPx: first ? Math.round(first.getBoundingClientRect().width) : null,
    fontSize: cs ? Math.round(parseFloat(cs.fontSize) * 10) / 10 : null,
    lineHeight: cs ? Math.round(parseFloat(cs.lineHeight) * 10) / 10 : null,
    // Where the first line of prose lands — 7.3 asks about the fold and this is the number.
    firstProseY: first ? Math.round(first.getBoundingClientRect().top + window.scrollY) : null,
  }
}

fs.mkdirSync(OUT, { recursive: true })
const browser = await chromium.launch()
const rows = []
try {
  for (const bp of [{ w: 1440, h: 1000 }, { w: 768, h: 1024 }, { w: 390, h: 844 }]) {
    const ctx = await browser.newContext({ viewport: { width: bp.w, height: bp.h } })
    const page = await ctx.newPage()
    await page.goto(`${BASE}/blog/${SLUG}`, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await page.waitForTimeout(2500)
    await page.evaluate(() => document.querySelectorAll('[data-sonner-toaster], [data-sonner-toast]').forEach((el) => el.remove()))

    for (const c of CANDIDATES) {
      // Applied the way the page applies it: the prose column is a max-width on <main>.
      await page.evaluate(([v, onProse, sizeProse]) => {
        const main = document.getElementById('content')
        const prose = document.querySelector('[data-article]')
        if (main) main.style.maxWidth = onProse ? 'none' : v
        if (prose) {
          prose.style.maxWidth = onProse ? v : 'none'
          prose.style.fontSize = sizeProse ? 'var(--article-fs)' : ''
        }
      }, [c.css, !!c.onProse, !!c.sizeProse])
      await page.waitForTimeout(450)
      const m = await page.evaluate(MEASURE)
      if (!m) continue
      rows.push({ bp: bp.w, candidate: c.name, size: 'default', ...m })
      if (bp.w === 1440) {
        await page.screenshot({ path: path.join(OUT, `width-${c.name}-1440.jpg`), type: 'jpeg', quality: 80 })
      }

      // THE INTERACTION THE BRIEF POINTS AT. CPL depends on font size as well as column
      // width, and since 5.2 the reader picks the size from seven steps. A column chosen to
      // sit at 70 CPL for the default 19px is a different column at 15px, and the reader who
      // makes the text smaller is not asking for longer lines — they get them anyway.
      // Measured at both ends of the range so the recommendation accounts for it.
      if (bp.w !== 1440) continue
      for (const [idx, label] of [[0, '15px'], [6, '21px']]) {
        await page.evaluate((i) => localStorage.setItem('sp_font_size', String(i)), idx)
        await page.reload({ waitUntil: 'domcontentloaded' })
        await page.waitForTimeout(1600)
        await page.evaluate(([v, onProse, sizeProse]) => {
          const main = document.getElementById('content')
          const prose = document.querySelector('[data-article]')
          if (main) main.style.maxWidth = onProse ? 'none' : v
          if (prose) {
            prose.style.maxWidth = onProse ? v : 'none'
            prose.style.fontSize = sizeProse ? 'var(--article-fs)' : ''
          }
        }, [c.css, !!c.onProse, !!c.sizeProse])
        await page.waitForTimeout(400)
        const mm = await page.evaluate(MEASURE)
        if (mm) rows.push({ bp: bp.w, candidate: c.name, size: label, ...mm })
      }
      await page.evaluate(() => localStorage.removeItem('sp_font_size'))
      await page.reload({ waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(1500)
      await page.evaluate(() => document.querySelectorAll('[data-sonner-toaster], [data-sonner-toast]').forEach((el) => el.remove()))
    }
    await ctx.close()
  }
} finally {
  await browser.close()
}

console.log(String.fromCharCode(10) + 'PROSE MEASURE, real characters per line (median)')
console.log('  the 60-75 band is the target; * marks a candidate inside it')
console.log('')
console.log('  bp     candidate        setting   width   px    CPL     range         first prose y')
for (const r of rows) {
  const inBand = r.cpl !== null && r.cpl >= 60 && r.cpl <= 75
  console.log(
    `  ${String(r.bp).padEnd(6)} ${r.candidate.padEnd(16)} ${String(r.size).padEnd(9)} ${String(r.widthPx).padStart(4)}px  ${String(r.fontSize).padStart(4)}  `
    + `${String(r.cpl).padStart(5)}${inBand ? ' *' : '  '} ${String(r.min).padStart(5)}-${String(r.max).padEnd(6)} ${String(r.firstProseY).padStart(5)}`
    + `  n=${r.paragraphs}`,
  )
}

fs.writeFileSync(path.join(OUT, 'prose-width.json'), JSON.stringify(rows, null, 2))
console.log(String.fromCharCode(10) + `wrote ${path.join(OUT, 'prose-width.json')}`)
