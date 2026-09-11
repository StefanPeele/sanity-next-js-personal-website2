// docs/audit/measure-cards.mjs — Phase 2.6.
// Measures ONE post card: every text element inside it, its size, weight, colour and the
// vertical gap to the element above. The brief's question is whether "every element
// carries similar weight with similar spacing", so this reports the actual spread.
//
//   node docs/audit/measure-cards.mjs <name> <url> <cardSelector>
import { chromium } from '@playwright/test'

const args = process.argv.slice(2)
const jobs = []
for (let i = 0; i < args.length; i += 3) jobs.push([args[i], args[i + 1], args[i + 2]])

const PROBE = (sel) => {
  const px = (v) => Math.round(parseFloat(v) * 10) / 10
  const cards = [...document.querySelectorAll(sel)].filter((e) => {
    const r = e.getBoundingClientRect()
    return r.width > 150 && r.height > 120
  })
  if (!cards.length) return { error: 'no card matched ' + sel }
  // pick the card with the most text descendants — the most representative
  const card = cards.map((c) => ({ c, n: c.querySelectorAll('*').length })).sort((a, b) => b.n - a.n)[0].c
  const cr = card.getBoundingClientRect()

  const rows = []
  const walk = document.createTreeWalker(card, NodeFilter.SHOW_TEXT)
  const seen = new Set()
  let n
  while ((n = walk.nextNode())) {
    const t = (n.textContent || '').trim()
    if (!t) continue
    const e = n.parentElement
    if (!e || seen.has(e)) continue
    const r = e.getBoundingClientRect()
    if (r.width < 2 || r.height < 2) continue
    seen.add(e)
    const cs = getComputedStyle(e)
    rows.push({
      text: t.slice(0, 30),
      size: px(cs.fontSize),
      weight: cs.fontWeight,
      face: cs.fontFamily.split(',')[0].replace(/["']/g, ''),
      color: cs.color,
      transform: cs.textTransform,
      top: Math.round(r.top - cr.top),
      height: Math.round(r.height),
    })
  }
  rows.sort((a, b) => a.top - b.top)
  // vertical gap from the previous element's bottom
  for (let i = 1; i < rows.length; i++) rows[i].gap = rows[i].top - (rows[i - 1].top + rows[i - 1].height)

  const sizes = rows.map((r) => r.size)
  const uniq = [...new Set(sizes)].sort((a, b) => b - a)
  const gaps = rows.slice(1).map((r) => r.gap).filter((g) => g >= 0)
  return {
    cardSize: `${Math.round(cr.width)}x${Math.round(cr.height)}`,
    rows,
    distinctSizes: uniq,
    sizeSpread: uniq.length > 1 ? Math.round((uniq[0] / uniq[uniq.length - 1]) * 100) / 100 : 1,
    gaps,
  }
}

const b = await chromium.launch()
for (const [name, url, sel] of jobs) {
  const ctx = await b.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  })
  const p = await ctx.newPage()
  try {
    await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 })
    await p.waitForTimeout(3000)
    const d = await p.evaluate(PROBE, sel)
    if (d.error) { console.log(`\n### ${name}  -- ${d.error}`); await ctx.close(); continue }
    console.log(`\n### ${name}   card ${d.cardSize}`)
    console.log(`    sizes ${d.distinctSizes.join(' / ')}   largest:smallest = ${d.sizeSpread}x   gaps ${d.gaps.join(', ')}`)
    for (const r of d.rows) {
      console.log(`      ${String(r.size).padStart(5)}px w${String(r.weight).padEnd(4)} ${r.face.slice(0, 16).padEnd(17)} gap ${String(r.gap ?? '-').padStart(4)}  ${r.color.padEnd(22)} "${r.text}"`)
    }
  } catch (e) {
    console.log(`\n### ${name}  ERR ${String(e).split('\n')[0].slice(0, 80)}`)
  }
  await ctx.close()
}
await b.close()
