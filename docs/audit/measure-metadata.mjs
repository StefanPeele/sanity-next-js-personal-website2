// docs/audit/measure-metadata.mjs — Phase 1.3.
// Finds byline / date / reading-time / section text on a page and reports how each is
// rendered and where it sits relative to the nearest headline. Answers the brief's
// question "who shows reading time, who doesn't, and where do they put it?" by looking
// rather than by recalling.
//
//   node docs/audit/measure-metadata.mjs <outdir> <name> <url> [...]
import { chromium } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const [, , outdir, ...rest] = process.argv
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
  const leaves = [...document.querySelectorAll('body *')].filter(
    (e) => vis(e) && e.children.length === 0 && (e.textContent || '').trim().length > 0,
  )

  const PATTERNS = {
    readingTime: /\b\d+\s*(min|minute)s?\s*(read)?\b/i,
    byline: /^(by\s+|words\s+by\s+)/i,
    absoluteDate: /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s*(\d{4})?\b|\b\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i,
    relativeDate: /\b(\d+\s*(m|h|d|hours?|minutes?|days?|weeks?|months?)\s*ago|yesterday|today|just now)\b/i,
    updated: /\b(updated|last updated|revised|edited)\b/i,
  }

  const hits = {}
  for (const [key, re] of Object.entries(PATTERNS)) {
    hits[key] = []
    for (const e of leaves) {
      const t = (e.textContent || '').trim()
      if (t.length > 90 || !re.test(t)) continue
      const cs = getComputedStyle(e)
      const r = e.getBoundingClientRect()
      // nearest larger text = the headline this metadata belongs to
      let head = null
      for (const h of leaves) {
        const hs = px(getComputedStyle(h).fontSize)
        if (hs < px(cs.fontSize) * 1.3) continue
        const hr = h.getBoundingClientRect()
        const dy = r.top - hr.bottom
        const dyAbove = hr.top - r.bottom
        if (dy >= -4 && dy < 80 && Math.abs(hr.left - r.left) < 60) { head = { pos: 'below', dy: Math.round(dy), size: hs }; break }
        if (dyAbove >= -4 && dyAbove < 80 && Math.abs(hr.left - r.left) < 60) { head = { pos: 'above', dy: Math.round(dyAbove), size: hs }; break }
      }
      hits[key].push({
        text: t.slice(0, 46),
        size: px(cs.fontSize),
        face: cs.fontFamily.split(',')[0].replace(/["']/g, ''),
        weight: cs.fontWeight,
        transform: cs.textTransform,
        ls: cs.letterSpacing,
        color: cs.color,
        rel: head,
      })
      if (hits[key].length >= 6) break
    }
  }

  // How are adjacent metadata items separated?
  const seps = {}
  for (const e of leaves) {
    const t = (e.textContent || '').trim()
    if (t.length > 3) continue
    if (['·', '•', '|', '/', '—', '–', '-', '∙'].includes(t)) seps[t] = (seps[t] || 0) + 1
  }

  const body = (() => {
    const counts = {}
    for (const e of leaves) {
      const t = (e.textContent || '').trim()
      if (t.length < 40) continue
      const s = px(getComputedStyle(e).fontSize)
      counts[s] = (counts[s] || 0) + 1
    }
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
    return top ? parseFloat(top[0]) : null
  })()

  return { hits, separators: seps, bodySize: body, url: location.href }
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
    await page.waitForTimeout(3000)
    rec.data = await page.evaluate(PROBE)
    const h = rec.data.hits
    console.log(`ok    ${name.padEnd(20)} ${rec.status}  readTime:${h.readingTime.length} byline:${h.byline.length} absDate:${h.absoluteDate.length} relDate:${h.relativeDate.length} updated:${h.updated.length}  seps:${JSON.stringify(rec.data.separators)}`)
  } catch (e) {
    rec.error = String(e).split('\n')[0].slice(0, 140)
    console.log(`FAIL  ${name.padEnd(20)} ${rec.error}`)
  }
  fs.writeFileSync(path.join(outdir, `${name}.json`), JSON.stringify(rec, null, 2))
  await ctx.close()
}
await browser.close()
