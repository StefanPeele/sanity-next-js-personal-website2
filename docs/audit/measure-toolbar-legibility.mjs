// docs/audit/measure-toolbar-legibility.mjs
//
// The EXPANDED reading toolbar, read as a reader reads it: every text node in the open
// panel with its size, weight and composited contrast, at 1440 and at 390.
//
// Why a harness rather than an opinion. "More readable" is the kind of claim that gets
// shipped as a vibe and argued about afterwards. The panel is a dense stack of group
// labels, chips, switch labels and rows, and the question is answerable: how small is the
// smallest thing, how close in size are a group heading and the controls under it, and does
// anything drop under the contrast bar. Run it before and after a change and the diff is
// the argument.
//
// The composite step matters here more than anywhere else on the site: the panel is
// bg-surface-raised inside a fixed rail over the article, and its chips are
// rgb(255 255 255 / 0.05) fills over that. A raw color-vs-color ratio would be fiction.
//
//   node docs/audit/measure-toolbar-legibility.mjs                # local build on :3000
//   BASE=https://stefanpeele.com node docs/audit/measure-toolbar-legibility.mjs
//
import { chromium } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const BASE = process.env.BASE || 'http://127.0.0.1:3000'
const OUT = path.join('docs', 'audit', 'screenshots', 'toolbar')
// 1024 is here because it is the width at which the panel becomes a dropdown in the
// margin: the narrowest case where it can collide with the prose it is meant to be
// setting. 1440 is the design target, 390 the bottom sheet.
const WIDTHS = [1440, 1024, 390]

// 12px is the site-wide floor (CLAUDE.md) and it is for a mono micro-label above a block of
// text. NOTHING in this panel is that: every line here is either a control, a label for one,
// or the single sentence explaining how to bring the toolbar back. So the floor inside the
// panel is 14, and the harness holds it there rather than to the site minimum.
const MIN_SIZE = 14
const MIN_CONTROL_SIZE = 14
const MIN_RATIO = 4.5

let pass = 0
let fail = 0
const failures = []
const check = (ok, name, detail) => {
  if (ok) { pass++; console.log(`  PASS  ${name}${detail ? '  -- ' + detail : ''}`) }
  else { fail++; failures.push(`${name} -- ${detail}`); console.log(`  FAIL  ${name}${detail ? '  -- ' + detail : ''}`) }
}

/** Runs in the page. Every text leaf inside `root`, composited. */
const SCAN = (rootSelector) => {
  const parse = (c) => {
    const m = /rgba?\(([^)]+)\)/.exec(c || '')
    if (!m) return null
    const parts = m[1].split(/[,\s/]+/).filter(Boolean).map(Number)
    return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 }
  }
  const over = (src, dst) => ({
    r: src.r * src.a + dst.r * (1 - src.a),
    g: src.g * src.a + dst.g * (1 - src.a),
    b: src.b * src.a + dst.b * (1 - src.a),
    a: 1,
  })
  const lum = ({ r, g, b }) => {
    const f = (v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4) }
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
  }
  const ratio = (a, b) => {
    const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
    return (hi + 0.05) / (lo + 0.05)
  }
  const groundOf = (el) => {
    const stack = []
    let n = el
    while (n && n !== document.documentElement) {
      const bg = parse(getComputedStyle(n).backgroundColor)
      if (bg && bg.a > 0) stack.push(bg)
      n = n.parentElement
    }
    const htmlBg = parse(getComputedStyle(document.documentElement).backgroundColor)
    const bodyBg = parse(getComputedStyle(document.body).backgroundColor)
    let base = { r: 255, g: 255, b: 255, a: 1 }
    if (htmlBg && htmlBg.a > 0) base = over(htmlBg, base)
    if (bodyBg && bodyBg.a > 0) base = over(bodyBg, base)
    for (let i = stack.length - 1; i >= 0; i--) base = over(stack[i], base)
    return base
  }

  const root = document.querySelector(rootSelector)
  if (!root) return null
  const out = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const seen = new Set()
  const els = []
  let node
  while ((node = walker.nextNode())) {
    if (!(node.nodeValue || '').trim()) continue
    const el = node.parentElement
    if (el && !seen.has(el)) { seen.add(el); els.push(el) }
  }
  els.forEach((el) => {
    const text = (el.textContent || '').trim()
    if (!text) return
    const cs = getComputedStyle(el)
    if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) === 0) return
    if (el.closest('[aria-hidden="true"]')) return
    const r = el.getBoundingClientRect()
    if (r.width <= 1 || r.height <= 1) return
    const fg = parse(cs.color)
    if (!fg) return
    const ground = groundOf(el)
    const composited = fg.a < 1 ? over(fg, ground) : fg
    // What KIND of text this is, which is what decides the bar it is held to.
    const control = !!el.closest('button, [role="switch"], [role="radio"], a')
    const groupLabel = el.tagName === 'H3'
    out.push({
      text: text.slice(0, 38),
      tag: el.tagName,
      cls: String(el.className).slice(0, 30),
      size: Math.round(parseFloat(cs.fontSize) * 10) / 10,
      weight: parseInt(cs.fontWeight, 10),
      control,
      groupLabel,
      ratio: Math.round(ratio(composited, ground) * 100) / 100,
      color: cs.color,
    })
  })
  return out
}

fs.mkdirSync(OUT, { recursive: true })
const browser = await chromium.launch()
const report = { base: BASE, when: new Date().toISOString(), widths: {} }

try {
  // The newest post. EVERY non-article route under /blog has to be excluded by hand, and the
  // list is the one in tests/helpers.ts -- including `osi-model`, which is a standing page
  // rather than a post and which this harness pointed at on its first run, reporting that the
  // toolbar did not exist. It did; the page it was asked about has never had one.
  const sitemap = await fetch(`${BASE}/sitemap.xml`).then((r) => r.text())
  const NOT_POSTS = ['series', 'digests', 'featured', 'feed', 'osi-model']
  const slug = (sitemap.match(/\/blog\/([a-z0-9-]+)</g) || [])
    .map((m) => m.slice(6, -1))
    .find((s) => !NOT_POSTS.includes(s))
  if (!slug) { console.error('no article slug in the sitemap'); process.exit(2) }
  console.log(`article: /blog/${slug}\n`)

  for (const width of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' })
    const page = await ctx.newPage()
    await page.goto(`${BASE}/blog/${slug}`, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await page.waitForTimeout(900)

    // Open the panel through the real control, not by setting its storage key: the point is
    // the panel a reader sees after clicking the thing on the page.
    const opened = await page.evaluate(() => {
      const btn = document.querySelector('.reading-toolbar-trigger')
      if (!btn) return false
      btn.click()
      return true
    })
    check(opened, `${width}: the toolbar trigger exists and opens`)
    await page.waitForTimeout(600)

    const nodes = await page.evaluate(SCAN, '.reader-menu-panel')
    if (!nodes) { check(false, `${width}: the panel is in the DOM once opened`, 'no .reader-menu-panel'); await ctx.close(); continue }

    // PRECONDITION. A panel with three labels in it would pass every assertion below while
    // proving nothing, which is the shape of trap #24 in the artifact log.
    check(nodes.length >= 20, `${width}: the panel has enough text to judge`, `${nodes.length} text nodes`)

    const controls = nodes.filter((n) => n.control)
    const groups = nodes.filter((n) => n.groupLabel)
    check(controls.length >= 10, `${width}: and enough of it is control labels`, `${controls.length} control nodes`)
    check(groups.length >= 4, `${width}: and it has group headings`, `${groups.length} group headings`)

    const smallest = nodes.reduce((a, b) => (b.size < a.size ? b : a))
    const smallestControl = controls.reduce((a, b) => (b.size < a.size ? b : a))
    const worst = nodes.reduce((a, b) => (b.ratio < a.ratio ? b : a))

    check(smallest.size >= MIN_SIZE, `${width}: nothing in the panel is under ${MIN_SIZE}px`,
      `smallest ${smallest.size}px "${smallest.text}"`)
    check(smallestControl.size >= MIN_CONTROL_SIZE, `${width}: no CONTROL label under ${MIN_CONTROL_SIZE}px`,
      `smallest ${smallestControl.size}px "${smallestControl.text}"`)
    check(worst.ratio >= MIN_RATIO, `${width}: every text node meets ${MIN_RATIO}:1`,
      `worst ${worst.ratio}:1 "${worst.text}" (${worst.color})`)

    // A group heading has to be TELLABLE from the controls under it, by size or by weight or
    // by colour. Identical on all three is the state that makes a dense panel read as one
    // undifferentiated list, which is the actual complaint about this panel.
    if (groups.length && controls.length) {
      const g = groups[0]
      const c = controls.find((n) => n.size) ?? controls[0]
      const distinct = g.size !== c.size || g.weight !== c.weight || g.color !== c.color
      check(distinct, `${width}: group headings are distinguishable from their controls`,
        `heading ${g.size}px/${g.weight}/${g.color} vs control ${c.size}px/${c.weight}/${c.color}`)
      // And distinguishable in the RIGHT DIRECTION. A heading that differs from its contents
      // by being smaller and dimmer is still distinguishable; it was also what this panel
      // did, and it is why nine groups read as one list.
      const outranks = g.size > c.size || g.weight > c.weight
      check(outranks, `${width}: and they OUTRANK them rather than sitting under them`,
        `heading ${g.size}px w${g.weight} vs control ${c.size}px w${c.weight}`)
    }

    // The panel opens into the margin above lg. If it reaches the prose it is covering the
    // thing it exists to adjust, which is the one failure a wider panel could introduce.
    //
    // HORIZONTALLY, and against the TEXT rather than against `[data-article]`. Two things
    // make the obvious version of this check worthless. The container is far wider than the
    // measure -- 964px against ~600px of prose at 1440 -- so a panel can overlap the box
    // while sitting in empty space beside the text. And a box-intersection test run at the
    // top of the page passes for a reason that evaporates on the first scroll: the article
    // starts below the fold, so nothing intersects yet. This scrolls into the prose first and
    // then compares x ranges only, which is the geometry that actually holds as the reader
    // moves down the page.
    if (width >= 1024) {
      await page.evaluate(() => {
        const el = document.querySelector('[data-article]')
        if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + 400, behavior: 'instant' })
      })
      await page.waitForTimeout(400)
      const geom = await page.evaluate(() => {
        const panel = document.querySelector('.reader-menu-panel')
        const prose = Array.from(document.querySelectorAll('[data-article] > p, [data-article] > h2, [data-article] > h3, [data-article] > ul, [data-article] > ol'))
        if (!panel || !prose.length) return null
        const p = panel.getBoundingClientRect()
        const right = Math.max(...prose.map((el) => el.getBoundingClientRect().right))
        return { panelLeft: Math.round(p.left), panelRight: Math.round(p.right), proseRight: Math.round(right), blocks: prose.length }
      })
      const clears = geom && geom.panelLeft >= geom.proseRight
      if (width >= 1280) {
        check(clears, `${width}: the open panel clears the prose, measured against the text`,
          geom ? `prose ends at x ${geom.proseRight}, panel starts at x ${geom.panelLeft} (${geom.blocks} blocks measured)` : 'panel or prose missing')
      } else {
        // MEASURED, NOT ASSERTED, and the difference is deliberate.
        //
        // Phase 5.4 put the rail "OUTSIDE the reading measure... it can never overlap prose".
        // That holds from 1280 up. At 1024 it does not and never did: the margin to the right
        // of the text is about 310px, the rail takes ~56 of it, and the panel is 320px wide,
        // so an open panel sits over the last stretch of every line. It is behind a scrim and
        // one click outside closes it, which is why it has gone unnoticed, and it is NOT
        // something this legibility pass introduced -- the panel is the same 320px at 1024 as
        // it was before.
        //
        // Asserting it here would fail the harness on a pre-existing design compromise and
        // invite someone to widen the assertion until it passed. Reporting the number keeps
        // it visible instead. The fix, when it is worth doing, is to keep the bottom sheet
        // until xl rather than switching to a dropdown at lg.
        const by = geom ? geom.proseRight - geom.panelLeft : null
        console.log(`  NOTE  ${width}: the open panel overlaps the prose by ${by}px ` +
          `(prose ends x ${geom?.proseRight}, panel starts x ${geom?.panelLeft}). ` +
          `Pre-existing at this breakpoint; see the comment in this harness.`)
      }
      check(geom && geom.panelRight <= width,
        `${width}: and it is fully on screen`,
        geom ? `panel right edge x ${geom.panelRight} in a ${width}px viewport` : 'panel missing')
    }

    console.log(`\n  ── ${width}px, every text node in the panel ──`)
    const sorted = [...nodes].sort((a, b) => a.size - b.size || a.ratio - b.ratio)
    for (const n of sorted) {
      console.log(
        `    ${String(n.size).padStart(5)}px  w${n.weight}  ${String(n.ratio).padStart(6)}:1  ` +
        `${n.control ? 'control ' : n.groupLabel ? 'GROUP   ' : '        '}${n.text}`,
      )
    }
    console.log('')

    await page.screenshot({ path: path.join(OUT, `panel-${width}.jpg`), type: 'jpeg', quality: 82 })
    report.widths[width] = { nodes, smallest, smallestControl, worst }
    await ctx.close()
  }
} finally {
  await browser.close()
}

fs.writeFileSync(path.join('docs', 'audit', 'toolbar-legibility.json'), JSON.stringify(report, null, 2))
console.log(`${pass} passed, ${fail} failed`)
if (failures.length) { console.log('\nFAILURES:'); failures.forEach((f) => console.log('  ' + f)) }
console.log(`raw: docs/audit/toolbar-legibility.json  ·  screenshots: ${OUT}`)
process.exit(fail ? 1 : 0)
