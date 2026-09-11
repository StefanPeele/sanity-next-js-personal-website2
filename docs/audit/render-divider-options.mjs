// docs/audit/render-divider-options.mjs — Phase 2.5.
// Renders the section-divider options against production with runtime CSS. The brief
// asks for both "strengthen" and "replace with space", rendered, so it can be chosen
// from the page rather than from an argument.
import { chromium } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const OUT = path.join('docs', 'audit', 'screenshots', 'divider-options')
const BASE = 'https://stefanpeele.com/blog'
const BPS = [{ n: '1440', w: 1440, h: 1100 }, { n: '768', w: 768, h: 1200 }, { n: '390', w: 390, h: 1200 }]

// Measured state: the header rule is border-edge-faint (white 5%), the card footer rules
// and the series/strip panels use border-edge (white 10%). §1.1 counted 16 bordered
// blocks >200px on our page against 0-4 for every comparable essay site.
const OPTIONS = {
  'A-baseline': '',

  // Strengthen: raise the divider tokens so the sections read as deliberately separated.
  'B-strengthened': `
    :root { --edge-faint: rgb(255 255 255 / 0.14) !important; }
    main header { padding-bottom: 2.5rem !important; }
  `,

  // Replace with space: remove the section rules entirely and pay for them in margin.
  // This is what Increment (0 bordered blocks), Asterisk (2), Aeon (2), Ars (2),
  // 404 Media (3) and Quanta (4) do.
  'C-space-only': `
    main > header { border-bottom: 0 !important; padding-bottom: 0 !important; margin-bottom: 5rem !important; }
    main section[aria-labelledby="series-rail"] { margin-bottom: 5rem !important; }
    main .sp-cardfoot { border-top: 0 !important; padding-top: 0.75rem !important; }
  `,

  // Space, and the section labels given room to act as the separator instead.
  'D-space-plus-label': `
    main > header { border-bottom: 0 !important; padding-bottom: 0 !important; margin-bottom: 5rem !important; }
    main section[aria-labelledby="series-rail"] { margin-bottom: 5rem !important; }
    main .sp-cardfoot { border-top: 0 !important; padding-top: 0.75rem !important; }
    .section-label { font-size: 12px !important; font-family: var(--font-mono), monospace !important;
      text-transform: uppercase !important; letter-spacing: 0.12em !important;
      color: rgb(168,162,158) !important; margin-bottom: 1.25rem !important; }
  `,
}

const TAG = () => {
  // mark the card footer rules so the CSS can reach them
  for (const a of document.querySelectorAll('a[href^="/blog/"]')) {
    const h3 = a.querySelector('h3')
    if (!h3) continue
    const foot = a.querySelector('.border-t')
    if (foot) foot.classList.add('sp-cardfoot')
  }
  const anchor = document.querySelector('[aria-labelledby="series-rail"]') || document.querySelector('main')
  anchor?.scrollIntoView({ block: 'start' })
  window.scrollBy(0, -120)
  return document.querySelectorAll('.sp-cardfoot').length
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
    await page.waitForTimeout(600)
    const count = await page.evaluate(() => {
      let rules = 0
      for (const e of document.querySelectorAll('main *')) {
        const r = e.getBoundingClientRect()
        if (r.width < 200) continue
        const cs = getComputedStyle(e)
        const bt = parseFloat(cs.borderTopWidth), bb = parseFloat(cs.borderBottomWidth)
        if ((bt > 0 && cs.borderTopStyle !== 'none') || (bb > 0 && cs.borderBottomStyle !== 'none')) rules++
      }
      return rules
    })
    await page.screenshot({ path: path.join(OUT, `${name}-${bp.n}.jpg`), type: 'jpeg', quality: 82 })
    if (bp.n === '1440') console.log(`${name.padEnd(22)} card footers tagged=${n}  bordered blocks >200px in <main>: ${count}`)
    await ctx.close()
  }
}
await browser.close()
console.log('\nwrote ' + OUT)
