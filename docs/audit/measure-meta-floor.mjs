// docs/audit/measure-meta-floor.mjs
//
// 2.4. Stefan's call: run the 14px floor for blog meta, against the measured 10-15px band.
// This lists every text node under 14px on the blog surfaces so the floor is applied to a
// measured set rather than a remembered one, and re-run after, so the claim "nothing is
// below 14px" is checkable.
//
//   node docs/audit/measure-meta-floor.mjs
//
import { chromium } from '@playwright/test'

const BASE = process.env.BASE || 'http://127.0.0.1:3000'
const ROUTES = ['/blog', '/blog/series']
const FLOOR = 14

const browser = await chromium.launch()
try {
  for (const width of [1440, 390]) {
    const ctx = await browser.newContext({ viewport: { width, height: 1000 } })
    const page = await ctx.newPage()
    for (const route of ROUTES) {
      await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 60000 })
      await page.waitForTimeout(900)
      // Open the facet row, otherwise the filter labels are not in the document.
      const btn = page.locator('button', { hasText: /^Filters$/i }).first()
      if (await btn.count()) { await btn.click().catch(() => {}); await page.waitForTimeout(400) }

      const nodes = await page.evaluate((floor) => {
        const out = []
        const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
        for (let n = walk.nextNode(); n; n = walk.nextNode()) {
          const text = (n.textContent || '').trim()
          if (!text) continue
          const el = n.parentElement
          if (!el) continue
          const r = el.getBoundingClientRect()
          if (r.width < 1 || r.height < 1) continue
          const cs = getComputedStyle(el)
          if (cs.visibility === 'hidden' || cs.display === 'none') continue
          const size = parseFloat(cs.fontSize)
          if (size >= floor) continue
          out.push({
            text: text.slice(0, 28),
            size,
            family: cs.fontFamily.split(',')[0].replace(/"/g, ''),
            transform: cs.textTransform,
            cls: String(el.className).slice(0, 46),
          })
        }
        return out
      }, FLOOR)

      console.log(`\n── ${width}px ${route} — ${nodes.length} node(s) under ${FLOOR}px`)
      const grouped = new Map()
      for (const n of nodes) {
        const key = `${n.size}px ${n.family} ${n.transform} | ${n.cls}`
        if (!grouped.has(key)) grouped.set(key, [])
        grouped.get(key).push(n.text)
      }
      for (const [key, texts] of grouped) {
        console.log(`   ${String(texts.length).padStart(3)}x  ${key}`)
        console.log(`        e.g. ${texts.slice(0, 3).map((t) => JSON.stringify(t)).join(', ')}`)
      }
      if (!nodes.length) console.log('   nothing below the floor')
    }
    await ctx.close()
  }
} finally {
  await browser.close()
}
