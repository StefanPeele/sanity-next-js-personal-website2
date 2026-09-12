// docs/audit/render-hero-h1-options.mjs
//
// Phase 7.3 (hero image) and 7.4 (the h1, re-rendered against the 7.2 layout).
//
// Both are "render the options and measure them" items, so the options are SYNTHESISED in
// the page at capture time -- the same method the three aura intensities and the two mobile
// sidenote options used -- rather than shipped as code for the variants being argued
// against. Nothing here changes the site.
//
// The number that decides 7.3 is not the hero's width. It is where the FIRST LINE OF PROSE
// lands, because a bigger hero pushes the article further below the fold and the brief is
// explicit that the fold "should improve, not worsen". So every option is measured for
// hero height AND first-prose-y at all three breakpoints, and the two are reported
// together.
//
//   node docs/audit/render-hero-h1-options.mjs
//
import { chromium } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const BASE = process.env.BASE || 'http://127.0.0.1:3000'
const OUT = path.join('docs', 'audit', 'screenshots', 'phase-7')
const SLUG = process.env.SLUG || 'the-field-the-moment-and-what-it-means-for-us-networking-industry'
// 7.4 is a question about a MEASURE, and a measure can only be judged against titles of
// different lengths. The decision doc it supersedes was measured against one title -- the
// 77-character one -- and its own closing caveat says so: "a much longer title would still
// wrap to 4 lines". All three published titles, shortest to longest.
const H1_SLUGS = [
  ['short-43', 'the-creation-of-my-personal-portfolio-site'],
  ['mid-69', 'the-field-the-moment-and-what-it-means-for-us-networking-industry'],
  ['long-77', 'building-my-physical-home-lab-week-2-documentation-and-extensive-researching'],
]

// ── The options ───────────────────────────────────────────────────
// Each is a function run in the page. `fig` is the hero figure, `block` its 52rem parent.
const HERO = {
  A: {
    label: 'A — as shipped after 7.2 (the `wide` tier, 52rem)',
    apply: () => {},
  },
  B: {
    label: 'B — the full reading column',
    apply: () => {
      const fig = document.querySelector('header figure')
      const main = document.getElementById('content')
      if (!fig || !main) return
      const target = main.getBoundingClientRect().width
      const own = fig.parentElement.getBoundingClientRect().width
      const bleed = (target - own) / 2
      fig.style.width = `${target}px`
      fig.style.marginInline = `${-bleed}px`
    },
  },
  C: {
    label: 'C — the full container, spanning the margin column too',
    apply: () => {
      const fig = document.querySelector('header figure')
      // The grid is the figure's GRANDPARENT -- addressing it as `header > div` picked up a
      // different element at 768 and reported a hero NARROWER than doing nothing, which is
      // not a thing any "widen it" option can do. Walk up from the figure instead.
      const grid = fig?.parentElement?.parentElement
      if (!fig || !grid) return
      const cs = getComputedStyle(grid)
      const target = grid.getBoundingClientRect().width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
      const own = fig.parentElement.getBoundingClientRect().width
      const bleed = (target - own) / 2
      fig.style.width = `${target}px`
      fig.style.marginInline = `${-bleed}px`
    },
  },
  D: {
    label: 'D — full-bleed to the viewport edge',
    apply: () => {
      const fig = document.querySelector('header figure')
      if (!fig) return
      fig.style.width = '100vw'
      fig.style.marginLeft = 'calc(50% - 50vw)'
      fig.style.marginRight = 'calc(50% - 50vw)'
      fig.style.borderRadius = '0'
      const img = fig.querySelector('img')
      if (img) img.style.borderRadius = '0'
    },
  },
  F: {
    label: 'F — the full reading column, cropped to 21:9',
    apply: () => {
      const fig = document.querySelector('header figure')
      const main = document.getElementById('content')
      if (!fig || !main) return
      const target = main.getBoundingClientRect().width
      const own = fig.parentElement.getBoundingClientRect().width
      fig.style.width = `${target}px`
      fig.style.marginInline = `${-(target - own) / 2}px`
      fig.style.aspectRatio = '21 / 9'
      fig.style.overflow = 'hidden'
      const img = fig.querySelector('img')
      if (img) { img.style.height = '100%'; img.style.objectFit = 'cover' }
    },
  },
  G: {
    label: 'G — unchanged width, cropped to 21:9 (the mobile lever)',
    apply: () => {
      const fig = document.querySelector('header figure')
      if (!fig) return
      fig.style.aspectRatio = '21 / 9'
      fig.style.overflow = 'hidden'
      const img = fig.querySelector('img')
      if (img) { img.style.height = '100%'; img.style.objectFit = 'cover' }
    },
  },
  E: {
    label: 'E — full-bleed, cropped to 21:9 (height capped, not width)',
    apply: () => {
      const fig = document.querySelector('header figure')
      if (!fig) return
      fig.style.width = '100vw'
      fig.style.marginLeft = 'calc(50% - 50vw)'
      fig.style.marginRight = 'calc(50% - 50vw)'
      fig.style.borderRadius = '0'
      fig.style.aspectRatio = '21 / 9'
      fig.style.overflow = 'hidden'
      const img = fig.querySelector('img')
      if (img) { img.style.height = '100%'; img.style.objectFit = 'cover'; img.style.borderRadius = '0' }
    },
  },
}

// 7.4. The three options in docs/audit/decisions/README.md were measured against a 36rem
// header block; 7.2 made that block 52rem, so option C -- "give the h1 an explicit 52rem" --
// is now what the h1 inherits by doing nothing. These are the options that exist AFTER that.
const H1 = {
  A: { label: "A — as shipped after 7.2 (inherits the 52rem block, 48px)", apply: () => {} },
  B: {
    label: 'B — the full reading column, 48px',
    apply: () => {
      const h1 = document.querySelector('header h1')
      const main = document.getElementById('content')
      if (!h1 || !main) return
      const target = main.getBoundingClientRect().width
      const own = h1.parentElement.getBoundingClientRect().width
      h1.style.width = `${target}px`
      h1.style.marginInline = `${-(target - own) / 2}px`
    },
  },
  C: {
    label: 'C — flush with the prose measure',
    apply: () => {
      const h1 = document.querySelector('header h1')
      const p = document.querySelector('[data-article] > p')
      if (!h1 || !p) return
      h1.style.width = `${p.getBoundingClientRect().width}px`
    },
  },
  D: {
    // Gated at lg, like the `lg:text-5xl` it would replace. An ungated 40px is a different
    // option entirely: it makes the title BIGGER at 768 and 390, where the shipped sizes are
    // 36px and 30px, and the first run of this harness reported D wrapping to 5 and 6 lines
    // at 390 for exactly that reason. Those numbers described my synthesis, not the option.
    label: 'D — the 52rem block at 40px (lg and up only)',
    apply: () => {
      const h1 = document.querySelector('header h1')
      if (h1 && window.innerWidth >= 1024) h1.style.fontSize = '40px'
    },
  },
}

const MEASURE = () => {
  const r = (el) => (el ? el.getBoundingClientRect() : null)
  const fig = document.querySelector('header figure')
  const h1 = document.querySelector('header h1')
  const p = document.querySelector('[data-article] > p')
  const figR = r(fig), h1R = r(h1), pR = r(p)
  // Lines in the h1, counted from line boxes rather than height / line-height.
  let h1Lines = null
  if (h1) {
    const range = document.createRange()
    range.selectNodeContents(h1)
    h1Lines = new Set(Array.from(range.getClientRects()).filter((b) => b.height > 2).map((b) => Math.round(b.top))).size
  }
  return {
    heroWidth: figR ? Math.round(figR.width) : null,
    heroHeight: figR ? Math.round(figR.height) : null,
    h1Width: h1R ? Math.round(h1R.width) : null,
    h1Height: h1R ? Math.round(h1R.height) : null,
    h1Lines,
    h1FontSize: h1 ? Math.round(parseFloat(getComputedStyle(h1).fontSize)) : null,
    firstProseY: pR ? Math.round(pR.top + window.scrollY) : null,
    docScrollX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }
}

fs.mkdirSync(OUT, { recursive: true })
const browser = await chromium.launch()
const rows = []
try {
  for (const bp of [{ w: 1440, h: 1000 }, { w: 768, h: 1024 }, { w: 390, h: 844 }]) {
    const passes = [
      ...Object.entries(HERO).map(([key, opt]) => ({ kind: 'hero', key, opt, slug: SLUG, title: '' })),
      ...H1_SLUGS.flatMap(([title, slug]) => Object.entries(H1).map(([key, opt]) => ({ kind: 'h1', key, opt, slug, title }))),
    ]
    {
      for (const { kind, key, opt, slug, title } of passes) {
        // A FRESH page per option. Re-using one and undoing the styles leaves residue --
        // a cleared inline width is not the same as never having had one once the image
        // has loaded at a different size — and the residue looks like a real measurement.
        const ctx = await browser.newContext({ viewport: { width: bp.w, height: bp.h } })
        const page = await ctx.newPage()
        await page.goto(`${BASE}/blog/${slug}`, { waitUntil: 'domcontentloaded', timeout: 60000 })
        await page.waitForTimeout(2200)
        await page.evaluate(() => document.querySelectorAll('[data-sonner-toaster], [data-sonner-toast]').forEach((el) => el.remove()))
        await page.evaluate(opt.apply)
        await page.waitForTimeout(700)
        const m = await page.evaluate(MEASURE)
        rows.push({ bp: bp.w, kind, key, title, label: opt.label, ...m })
        // Only the mid-length title is captured for h1, or three titles x four options x
        // three breakpoints is 36 frames of the same header.
        if (kind === 'hero' || title === 'mid-69') {
          await page.screenshot({ path: path.join(OUT, `${kind}-${key}-${bp.w}.jpg`), type: 'jpeg', quality: 76 })
        }
        await ctx.close()
      }
    }
  }
} finally {
  await browser.close()
}

const fold = { 1440: 1000, 768: 1024, 390: 844 }
for (const kind of ['hero', 'h1']) {
  console.log(`\n## ${kind === 'hero' ? '7.3 — hero image' : '7.4 — the h1, against the 7.2 layout'}\n`)
  console.log('  bp     opt  title      hero w×h        h1 w/lines/size     first prose y   vs fold')
  for (const r of rows.filter((x) => x.kind === kind)) {
    const delta = r.firstProseY - fold[r.bp]
    console.log(`  ${String(r.bp).padEnd(6)} ${r.key.padEnd(4)} ${(r.title || '-').padEnd(10)} ${`${r.heroWidth}×${r.heroHeight}`.padEnd(15)} ${`${r.h1Width}/${r.h1Lines}/${r.h1FontSize}`.padEnd(19)} ${String(r.firstProseY).padStart(6)}        ${delta > 0 ? `${delta}px BELOW` : `${-delta}px above`}${r.docScrollX > 0 ? `  H-SCROLL ${r.docScrollX}px` : ''}`)
  }
}

fs.writeFileSync(path.join('docs', 'audit', 'hero-h1-options.json'), JSON.stringify(rows, null, 2))
console.log(`\nFrames in ${OUT} as hero-<opt>-<bp>.jpg and h1-<opt>-<bp>.jpg; raw numbers in docs/audit/hero-h1-options.json`)
