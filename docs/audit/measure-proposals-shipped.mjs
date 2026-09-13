// docs/audit/measure-proposals-shipped.mjs
//
// The four PROPOSALS items shipped without Stefan on 2026-09-13, verified on the rendered
// page rather than in the diff. Each was chosen for being small, reversible, and a defect
// fix rather than a taste call; this is what makes that claim checkable.
//
//   node docs/audit/measure-proposals-shipped.mjs
//
import { chromium } from '@playwright/test'

const BASE = process.env.BASE || 'http://127.0.0.1:3000'
const ARROW = String.fromCharCode(0x2192)
let pass = 0, fail = 0
const check = (label, cond, detail = '') => {
  if (cond) { pass++; console.log(`  PASS  ${label}${detail ? ' — ' + detail : ''}`) }
  else { fail++; console.log(`  FAIL  ${label}${detail ? ' — ' + detail : ''}`) }
}

const browser = await chromium.launch()
try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  const page = await ctx.newPage()
  await page.goto(`${BASE}/blog`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(1200)

  // ── 2.5: "Featured" must appear ONCE, not twice ────────────────────────
  const featured = await page.evaluate(() => {
    const hits = []
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    for (let n = walk.nextNode(); n; n = walk.nextNode()) {
      if (!/^\s*featured\s*$/i.test(n.textContent || '')) continue
      const el = n.parentElement
      if (!el || !el.getBoundingClientRect().width) continue
      const cs = getComputedStyle(el)
      hits.push({ tag: el.tagName, bg: cs.backgroundColor, cls: String(el.className).slice(0, 40) })
    }
    return hits
  })
  console.log(`\n  "Featured" text nodes on /blog: ${featured.length}`)
  featured.forEach((h) => console.log(`     <${h.tag}> bg=${h.bg} class="${h.cls}"`))
  check('"Featured" renders exactly once (the section label), not twice', featured.length === 1, `${featured.length} node(s)`)
  check('no white-filled FEATURED badge survives', !featured.some((h) => /255,\s*255,\s*255/.test(h.bg)))

  // ── 2.4: card reading time is 14px sans and says "read" ────────────────
  const rt = await page.evaluate(() => {
    const els = [...document.querySelectorAll('span')].filter((e) => /^\d+\s*min(\s*read)?$/i.test((e.textContent || '').trim()))
    return els.map((e) => {
      const cs = getComputedStyle(e)
      return { text: (e.textContent || '').trim(), size: cs.fontSize, family: cs.fontFamily.split(',')[0], transform: cs.textTransform }
    })
  })
  console.log(`\n  reading-time nodes: ${rt.length}`)
  rt.forEach((r) => console.log(`     "${r.text}"  ${r.size}  ${r.family}  ${r.transform}`))
  const cards = rt.filter((r) => /read/i.test(r.text))
  check('at least one card reading time is present', cards.length > 0, `${cards.length}`)
  check('every reading time on the index says "N min read"', rt.every((r) => /read/i.test(r.text)),
    rt.filter((r) => !/read/i.test(r.text)).map((r) => r.text).join(', ') || 'all say read')
  check('card reading time is 14px', cards.every((r) => r.size === '14px'), [...new Set(cards.map((r) => r.size))].join(', '))
  check('card reading time is not uppercased', cards.every((r) => r.transform === 'none'), [...new Set(cards.map((r) => r.transform))].join(', '))

  // ── 2.4: the "Read" arrow is its own element, gap in CSS not a space ───
  const arrows = await page.evaluate((arrow) => {
    const out = []
    for (const e of document.querySelectorAll('span[aria-hidden="true"]')) {
      if ((e.textContent || '').trim() !== arrow) continue
      const cs = getComputedStyle(e)
      out.push({
        ml: cs.marginLeft,
        display: cs.display,
        transition: cs.transitionProperty,
        prevEndsWithSpace: /\s$/.test(e.previousSibling?.textContent || ''),
      })
    }
    return out
  }, ARROW)
  console.log(`\n  dedicated arrow elements: ${arrows.length}`)
  arrows.forEach((a) => console.log(`     ml=${a.ml} display=${a.display} transition=${a.transition} prevSpace=${a.prevEndsWithSpace}`))
  check('the arrow is its own aria-hidden element', arrows.length > 0, `${arrows.length}`)
  check('the gap is a CSS margin, not a literal space in the JSX',
    arrows.every((a) => a.ml !== '0px' && !a.prevEndsWithSpace))
  check('the hero arrow transitions transform', arrows.some((a) => /transform/.test(a.transition)))

  // ── 2.4: filter-row labels wear the mono label face and still fit ──────
  const filtersBtn = page.locator('button', { hasText: /^Filters$/i }).first()
  if (await filtersBtn.count()) { await filtersBtn.click().catch(() => {}); await page.waitForTimeout(500) }
  const labels = await page.evaluate(() => {
    const box = document.querySelector('#blog-facets')
    if (!box) return null
    return [...box.querySelectorAll(':scope > div > span:first-child')].map((e) => {
      const cs = getComputedStyle(e)
      const r = e.getBoundingClientRect()
      // Natural width: the same text, unconstrained, so an overflow is measured rather
      // than inferred from a box that clips silently.
      const probe = document.createElement('span')
      probe.style.cssText = `position:absolute;visibility:hidden;white-space:nowrap;font:${cs.font};letter-spacing:${cs.letterSpacing};text-transform:${cs.textTransform}`
      probe.textContent = e.textContent
      document.body.appendChild(probe)
      const natural = probe.getBoundingClientRect().width
      probe.remove()
      return {
        text: (e.textContent || '').trim(), size: cs.fontSize, family: cs.fontFamily.split(',')[0],
        transform: cs.textTransform, boxW: Math.round(r.width), natural: Math.round(natural), h: Math.round(r.height),
      }
    })
  })
  if (!labels) {
    check('the facet row is reachable', false, 'no #blog-facets after clicking Filters')
  } else {
    console.log(`\n  filter-row labels: ${labels.length}`)
    labels.forEach((l) => console.log(`     "${l.text}"  ${l.size} ${l.family} ${l.transform}  box=${l.boxW}px natural=${l.natural}px h=${l.h}px`))
    check('there are filter labels to check', labels.length > 0, `${labels.length}`)
    check('each wears the mono label face', labels.every((l) => /mono|plex/i.test(l.family)), [...new Set(labels.map((l) => l.family))].join(', '))
    check('each is uppercase', labels.every((l) => l.transform === 'uppercase'))
    // This asserted 12px when the labels were first moved onto `.meta-label`, and that was
    // correct at the time: 2.4's recommendation was to change the FACE and not the size.
    // Stefan then overrode the size question separately, taking the brief's 14px meta floor
    // against the measured 10-15px band, so the floor now supersedes it. Recorded rather
    // than quietly edited, because a test that changes to match the code is worth a reason.
    check('each is on the 14px meta floor', labels.every((l) => l.size === '14px'), [...new Set(labels.map((l) => l.size))].join(', '))
    check('none overflows its column', labels.every((l) => l.natural <= l.boxW),
      labels.filter((l) => l.natural > l.boxW).map((l) => `${l.text} ${l.natural}>${l.boxW}`).join(', ') || 'all fit')
    check('none wrapped to a second line', labels.every((l) => l.h <= 20), [...new Set(labels.map((l) => l.h))].join(', '))
  }

  // ── no layout regression at three breakpoints ──────────────────────────
  console.log('')
  for (const w of [1440, 768, 390]) {
    await page.setViewportSize({ width: w, height: 900 })
    await page.waitForTimeout(400)
    const o = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
      h1: document.querySelectorAll('h1').length,
    }))
    check(`${w}px: no horizontal overflow, exactly one h1`, o.scroll <= o.client + 1 && o.h1 === 1,
      `scroll=${o.scroll} client=${o.client} h1=${o.h1}`)
  }
  await ctx.close()
} finally {
  await browser.close()
}
console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
