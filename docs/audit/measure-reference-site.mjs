// docs/audit/measure-reference-site.mjs
// Phase 1 research harness. Loads a reference index page and reports what is actually
// on it -- computed type sizes, the headline/body/meta ratios, kicker candidates,
// section separators, above-the-fold density -- rather than what I remember about it.
//
//   node docs/audit/measure-reference-site.mjs <outdir> <name> <url> [<name> <url> ...]
//
// Writes <outdir>/<name>.json and <outdir>/<name>-1440.jpg.
// Sites that paywall, bot-block or time out are recorded with their failure, not
// silently dropped -- a missing site must be visible in the output.
import { chromium } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const [, , outdir, ...rest] = process.argv
if (!outdir || rest.length < 2) {
  console.error('usage: node docs/audit/measure-reference-site.mjs <outdir> <name> <url> [...]')
  process.exit(1)
}
fs.mkdirSync(outdir, { recursive: true })
const pairs = []
for (let i = 0; i < rest.length; i += 2) pairs.push([rest[i], rest[i + 1]])

const PROBE = () => {
  const px = (v) => Math.round(parseFloat(v) * 10) / 10
  const vis = (e) => {
    const r = e.getBoundingClientRect()
    const cs = getComputedStyle(e)
    return r.width > 1 && r.height > 1 && cs.visibility !== 'hidden' && cs.opacity !== '0'
  }
  const textNodes = [...document.querySelectorAll('body *')].filter(
    (e) => vis(e) && e.children.length === 0 && (e.textContent || '').trim().length > 1,
  )

  // The type scale actually in use, by how much page area each size occupies.
  const sizes = {}
  for (const e of textNodes) {
    const cs = getComputedStyle(e)
    const r = e.getBoundingClientRect()
    const k = `${px(cs.fontSize)}`
    sizes[k] = sizes[k] || { px: px(cs.fontSize), count: 0, area: 0, faces: {}, weights: {}, samples: [] }
    sizes[k].count++
    sizes[k].area += Math.round(r.width * r.height)
    const face = cs.fontFamily.split(',')[0].replace(/["']/g, '')
    sizes[k].faces[face] = (sizes[k].faces[face] || 0) + 1
    sizes[k].weights[cs.fontWeight] = (sizes[k].weights[cs.fontWeight] || 0) + 1
    if (sizes[k].samples.length < 3) sizes[k].samples.push((e.textContent || '').trim().slice(0, 60))
  }

  // Headlines: the real <h*> and anything link-wrapped that renders large.
  const heads = [...document.querySelectorAll('h1,h2,h3,h4,a')]
    .filter(vis)
    .map((e) => {
      const cs = getComputedStyle(e)
      const r = e.getBoundingClientRect()
      return {
        tag: e.tagName.toLowerCase(),
        size: px(cs.fontSize),
        weight: cs.fontWeight,
        face: cs.fontFamily.split(',')[0].replace(/["']/g, ''),
        lh: px(cs.lineHeight),
        ls: cs.letterSpacing,
        transform: cs.textTransform,
        color: cs.color,
        top: Math.round(r.top + window.scrollY),
        w: Math.round(r.width),
        text: (e.textContent || '').trim().slice(0, 70),
      }
    })
    .filter((h) => h.text.length > 3)
    .sort((a, b) => b.size - a.size)

  // Kicker candidates: small, uppercase or wide-tracked, sitting directly above
  // something much larger.
  const kickers = []
  for (const e of textNodes) {
    const cs = getComputedStyle(e)
    const s = px(cs.fontSize)
    if (s > 16) continue
    const upper = cs.textTransform === 'uppercase' || (e.textContent || '').trim() === (e.textContent || '').trim().toUpperCase()
    const tracked = parseFloat(cs.letterSpacing) > 0.3
    if (!upper && !tracked) continue
    const r = e.getBoundingClientRect()
    // find the nearest larger text below it
    let best = null
    for (const h of textNodes) {
      const hr = h.getBoundingClientRect()
      const hs = px(getComputedStyle(h).fontSize)
      if (hs < s * 1.4) continue
      const dy = hr.top - r.bottom
      if (dy < -2 || dy > 60) continue
      if (Math.abs(hr.left - r.left) > 40) continue
      if (!best || dy < best.dy) best = { dy: Math.round(dy), size: hs, text: (h.textContent || '').trim().slice(0, 50) }
    }
    if (best) {
      kickers.push({
        text: (e.textContent || '').trim().slice(0, 40),
        size: s, weight: cs.fontWeight, ls: cs.letterSpacing, transform: cs.textTransform,
        color: cs.color, face: cs.fontFamily.split(',')[0].replace(/["']/g, ''),
        gapToHeadline: best.dy, headlineSize: best.size,
        ratio: Math.round((s / best.size) * 1000) / 1000,
        headline: best.text,
      })
    }
  }

  // Section separators actually present.
  const rules = [...document.querySelectorAll('hr')].filter(vis).length
  let borderRules = 0
  for (const e of [...document.querySelectorAll('body *')].slice(0, 4000)) {
    if (!vis(e)) continue
    const cs = getComputedStyle(e)
    const r = e.getBoundingClientRect()
    if (r.width < 200) continue
    const bt = parseFloat(cs.borderTopWidth), bb = parseFloat(cs.borderBottomWidth)
    if ((bt > 0 && cs.borderTopStyle !== 'none') || (bb > 0 && cs.borderBottomStyle !== 'none')) borderRules++
  }

  const fold = window.innerHeight
  const aboveFold = textNodes.filter((e) => e.getBoundingClientRect().top < fold)
  const linksAboveFold = [...document.querySelectorAll('a')].filter((e) => vis(e) && e.getBoundingClientRect().top < fold).length

  return {
    title: document.title,
    bodyBg: getComputedStyle(document.body).backgroundColor,
    bodyColor: getComputedStyle(document.body).color,
    typeScale: Object.values(sizes).sort((a, b) => b.area - a.area).slice(0, 14).map((s) => ({
      px: s.px, count: s.count, areaPct: s.area,
      face: Object.entries(s.faces).sort((a, b) => b[1] - a[1])[0][0],
      weight: Object.entries(s.weights).sort((a, b) => b[1] - a[1])[0][0],
      sample: s.samples[0],
    })),
    distinctSizes: Object.keys(sizes).length,
    headlines: heads.slice(0, 12),
    kickers: kickers.slice(0, 12),
    hrCount: rules,
    borderedBlocks: borderRules,
    aboveFold: { textNodes: aboveFold.length, links: linksAboveFold, viewport: `${window.innerWidth}x${window.innerHeight}` },
  }
}

const browser = await chromium.launch()
for (const [name, url] of pairs) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  })
  const page = await ctx.newPage()
  const rec = { name, url }
  try {
    const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 })
    rec.status = resp?.status() ?? null
    await page.waitForTimeout(3500)
    rec.data = await page.evaluate(PROBE)
    await page.screenshot({ path: path.join(outdir, `${name}-1440.jpg`), type: 'jpeg', quality: 70 })
    console.log(`ok    ${name.padEnd(18)} ${rec.status}  ${rec.data.distinctSizes} sizes, ${rec.data.headlines.length} headlines, ${rec.data.kickers.length} kicker candidates`)
  } catch (e) {
    rec.error = String(e).split('\n')[0].slice(0, 160)
    console.log(`FAIL  ${name.padEnd(18)} ${rec.error}`)
  }
  fs.writeFileSync(path.join(outdir, `${name}.json`), JSON.stringify(rec, null, 2))
  await ctx.close()
}
await browser.close()
