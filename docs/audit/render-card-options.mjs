// docs/audit/render-card-options.mjs — Phase 2.6.
// Renders the post-card options against PRODUCTION by injecting CSS at runtime. No
// application code changes; this is the same technique docs/audit/decisions used.
//
//   node docs/audit/render-card-options.mjs <outdir>
import { chromium } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const OUT = path.join('docs', 'audit', 'screenshots', process.argv[2] ?? 'card-options')
const BASE = 'https://stefanpeele.com/blog'
const BPS = [{ n: '1440', w: 1440, h: 1000 }, { n: '768', w: 768, h: 1100 }, { n: '390', w: 390, h: 1100 }]

// The grid card's h3 is `text-xl font-serif` (20px, weight 400). Options raise the
// title's size and weight; C additionally quiets the pill row so the title is not
// outnumbered by 12px chrome.
const OPTIONS = {
  'A-baseline': '',
  'B-title-24-semibold': `
    .sp-opt h3 { font-size: 24px !important; font-weight: 600 !important; line-height: 1.2 !important; }
  `,
  'C-title-24-semibold-one-pill': `
    .sp-opt h3 { font-size: 24px !important; font-weight: 600 !important; line-height: 1.2 !important; }
    .sp-opt .sp-pillrow > div > span:nth-child(n+2) { display: none !important; }
    .sp-opt .sp-pillrow > div > span:first-child {
      border: 0 !important; background: transparent !important; padding: 0 !important;
      font-family: var(--font-mono), monospace !important; text-transform: uppercase !important;
      letter-spacing: 0.08em !important; font-size: 12px !important;
    }
  `,
  'D-title-28-semibold-one-pill': `
    .sp-opt h3 { font-size: 28px !important; font-weight: 600 !important; line-height: 1.15 !important; }
    .sp-opt .sp-pillrow > div > span:nth-child(n+2) { display: none !important; }
    .sp-opt .sp-pillrow > div > span:first-child {
      border: 0 !important; background: transparent !important; padding: 0 !important;
      font-family: var(--font-mono), monospace !important; text-transform: uppercase !important;
      letter-spacing: 0.08em !important; font-size: 12px !important;
    }
  `,
}

// Tag the grid cards and their pill rows so the CSS above can reach them without
// depending on hashed class names.
const TAG = () => {
  const cards = [...document.querySelectorAll('a[href^="/blog/"]')].filter((a) => a.querySelector('h3'))
  for (const c of cards) {
    c.classList.add('sp-opt')
    const row = c.querySelector('h3')?.previousElementSibling
    if (row) row.classList.add('sp-pillrow')
  }
  const first = cards[0]
  if (!first) return null
  first.scrollIntoView({ block: 'center' })
  return cards.length
}

fs.mkdirSync(OUT, { recursive: true })
const browser = await chromium.launch()
for (const [name, css] of Object.entries(OPTIONS)) {
  for (const bp of BPS) {
    const ctx = await browser.newContext({ viewport: { width: bp.w, height: bp.h } })
    const page = await ctx.newPage()
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 45000 })
    const n = await page.evaluate(TAG)
    if (css) await page.addStyleTag({ content: css })
    await page.waitForTimeout(700)
    // measure what the option actually produced
    const m = await page.evaluate(() => {
      const h = document.querySelector('.sp-opt h3')
      if (!h) return null
      const cs = getComputedStyle(h)
      const card = h.closest('.sp-opt')
      const sizes = new Set()
      for (const e of card.querySelectorAll('*')) {
        if (e.children.length === 0 && (e.textContent || '').trim()) sizes.add(Math.round(parseFloat(getComputedStyle(e).fontSize) * 10) / 10)
      }
      const arr = [...sizes].sort((a, b) => b - a)
      return { title: `${Math.round(parseFloat(cs.fontSize))}px w${cs.fontWeight}`, sizes: arr, spread: Math.round((arr[0] / arr[arr.length - 1]) * 100) / 100 }
    })
    const file = path.join(OUT, `${name}-${bp.n}.jpg`)
    await page.screenshot({ path: file, type: 'jpeg', quality: 82 })
    if (bp.n === '1440') console.log(`${name.padEnd(30)} cards=${n}  title ${m?.title}  sizes ${m?.sizes.join('/')}  spread ${m?.spread}x`)
    await ctx.close()
  }
}
await browser.close()
console.log('\nwrote ' + OUT)
