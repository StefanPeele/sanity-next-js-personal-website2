// docs/audit/measure-sidenotes.mjs — Phase 1.5.
// Measures the prose measure, the marginal column, and their relationship on sites that
// use sidenotes. Answers "column width relative to the main measure" with numbers.
//
//   node docs/audit/measure-sidenotes.mjs <outdir> <name> <url> [...]
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
    return r.width > 1 && r.height > 1 && getComputedStyle(e).visibility !== 'hidden'
  }

  // The prose measure: the most common width among long paragraphs.
  const paras = [...document.querySelectorAll('p')].filter((e) => vis(e) && (e.textContent || '').trim().length > 120)
  const widths = {}
  for (const p of paras) {
    const w = Math.round(p.getBoundingClientRect().width / 5) * 5
    widths[w] = (widths[w] || 0) + 1
  }
  const measure = Object.entries(widths).sort((a, b) => b[1] - a[1])[0]
  const measureW = measure ? parseInt(measure[0], 10) : null
  const measureLeft = paras.length ? Math.round(Math.min(...paras.map((p) => p.getBoundingClientRect().left))) : null

  // Characters per line on the measure, from a real paragraph.
  let cpl = null
  if (paras.length) {
    const p = paras[0]
    const cs = getComputedStyle(p)
    const probe = document.createElement('span')
    probe.style.font = cs.font
    probe.style.visibility = 'hidden'
    probe.style.position = 'absolute'
    probe.style.whiteSpace = 'pre'
    probe.textContent = 'abcdefghijklmnopqrstuvwxyz'
    document.body.appendChild(probe)
    const perChar = probe.getBoundingClientRect().width / 26
    probe.remove()
    cpl = Math.round(p.getBoundingClientRect().width / perChar)
  }

  // Sidenote candidates: common selectors plus anything narrow sitting outside the measure.
  const SEL = ['.sidenote', '.marginnote', '.margin-note', 'aside', '.footnote', '.sidenote-column',
    '[class*="sidenote"]', '[class*="marginnote"]', '[class*="margin-note"]', '[id*="sidenote"]']
  const found = new Map()
  for (const s of SEL) {
    for (const e of document.querySelectorAll(s)) {
      if (!vis(e)) continue
      const r = e.getBoundingClientRect()
      if (r.width > 600) continue
      if (!found.has(e)) found.set(e, s)
    }
  }
  const notes = [...found.entries()].slice(0, 8).map(([e, sel]) => {
    const r = e.getBoundingClientRect()
    const cs = getComputedStyle(e)
    return {
      selector: sel,
      cls: (e.className || '').toString().slice(0, 50),
      width: Math.round(r.width),
      left: Math.round(r.left),
      fontSize: px(cs.fontSize),
      lineHeight: px(cs.lineHeight),
      color: cs.color,
      float: cs.float,
      position: cs.position,
      side: measureLeft != null ? (r.left < measureLeft ? 'left' : r.left > measureLeft + (measureW ?? 0) - 20 ? 'right' : 'inside') : null,
      ratioToMeasure: measureW ? Math.round((r.width / measureW) * 100) / 100 : null,
      text: (e.textContent || '').trim().slice(0, 50),
    }
  })

  // Numbering: superscript markers in the prose.
  const sups = [...document.querySelectorAll('sup, .sidenote-number, [class*="ref"]')].filter(vis).length

  const bodySize = paras.length ? px(getComputedStyle(paras[0]).fontSize) : null

  return {
    measureWidth: measureW, measureLeft, charsPerLine: cpl, bodySize,
    paragraphCount: paras.length,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    sidenotes: notes, sidenoteCount: found.size, supMarkers: sups,
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
    await page.waitForTimeout(3000)
    rec.data = await page.evaluate(PROBE)
    const d = rec.data
    console.log(`ok    ${name.padEnd(18)} ${rec.status}  measure ${d.measureWidth}px (~${d.charsPerLine}cpl, ${d.bodySize}px)  sidenotes ${d.sidenoteCount}  sup ${d.supMarkers}`)
    for (const n of d.sidenotes.slice(0, 3)) {
      console.log(`         ${n.side?.padEnd(6)} w${String(n.width).padStart(4)} (${n.ratioToMeasure}x measure) ${n.fontSize}px float=${n.float} pos=${n.position}  ${n.cls.slice(0, 28)}`)
    }
  } catch (e) {
    rec.error = String(e).split('\n')[0].slice(0, 140)
    console.log(`FAIL  ${name.padEnd(18)} ${rec.error}`)
  }
  fs.writeFileSync(path.join(outdir, `${name}.json`), JSON.stringify(rec, null, 2))
  await ctx.close()
}
await browser.close()
