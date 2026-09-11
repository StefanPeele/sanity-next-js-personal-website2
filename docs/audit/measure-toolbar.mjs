// docs/audit/measure-toolbar.mjs
//
// Phase 5.1 / 5.3 / 5.4 — the reading toolbar.
//
// The load-bearing test here is C: THE RAIL MUST NOT MOVE WHEN THE PAGE SCROLLS.
// app/template.tsx wraps every page in `motion-safe:animate-page-enter`, whose keyframe is
// declared `both` and therefore holds `transform: translateY(0)` forever. Any transform --
// including an identity one -- makes that element a containing block for `position: fixed`
// descendants, so a rail left in the tree resolves against a div as tall as the document and
// scrolls away. The component portals to document.body to escape it, and this is the test
// that would catch a regression.
//
// It is also measured with reduced motion ON, because `motion-safe:` means the transform is
// ABSENT for those readers: without the portal the bug would appear for most people and not
// for the ones most likely to report it.
import { chromium } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const BASE = 'http://127.0.0.1:3000'
const OUT = path.join('docs', 'audit', 'screenshots', 'toolbar')
const SLUG = 'the-field-the-moment-and-what-it-means-for-us-networking-industry'

let pass = 0
let fail = 0
const check = (ok, name, detail) => {
  if (ok) { pass++; console.log(`  PASS  ${name}${detail ? '  -- ' + detail : ''}`) }
  else { fail++; console.log(`  FAIL  ${name}${detail ? '  -- ' + detail : ''}`) }
}

const RAIL = () => {
  const el = document.querySelector('.reading-toolbar')
  const trigger = document.querySelector('.reading-toolbar-trigger')
  if (!el || !trigger) return null
  const r = trigger.getBoundingClientRect()
  const cs = getComputedStyle(el)
  const prose = document.querySelector('[data-article]')
  const p = prose ? prose.getBoundingClientRect() : null
  return {
    x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
    right: Math.round(r.right), bottom: Math.round(r.bottom),
    position: cs.position,
    opacity: parseFloat(getComputedStyle(trigger).opacity),
    // Portalled? Its parent chain must reach body without passing through the animated
    // wrapper that holds a transform.
    parentIsBody: el.parentElement === document.body,
    transformedAncestor: (() => {
      let n = el.parentElement
      while (n && n !== document.documentElement) {
        if (getComputedStyle(n).transform !== 'none') return n.tagName + '.' + String(n.className).slice(0, 40)
        n = n.parentElement
      }
      return null
    })(),
    proseRight: p ? Math.round(p.right) : null,
    vw: window.innerWidth, vh: window.innerHeight,
    docW: document.documentElement.scrollWidth,
    panels: document.querySelectorAll('.reader-menu-panel').length,
    expanded: trigger.getAttribute('aria-expanded'),
    name: trigger.getAttribute('aria-label') || trigger.textContent?.trim(),
  }
}

fs.mkdirSync(OUT, { recursive: true })
const browser = await chromium.launch()
try {
  for (const reduced of [false, true]) {
    const label = reduced ? 'reduced motion' : 'normal motion'
    console.log(String.fromCharCode(10) + `═══ ${label} ═══`)
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: reduced ? 'reduce' : 'no-preference' })
    const page = await ctx.newPage()
    await page.goto(`${BASE}/blog/${SLUG}`, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await page.waitForTimeout(2500)
    await page.evaluate(() => document.querySelectorAll('[data-sonner-toaster], [data-sonner-toast]').forEach((el) => el.remove()))

    console.log('A. it exists, collapsed, outside the prose')
    const a = await page.evaluate(RAIL)
    console.log(`  ${JSON.stringify({ x: a?.x, y: a?.y, w: a?.w, h: a?.h, pos: a?.position, parentIsBody: a?.parentIsBody })}`)
    check(!!a, 'the rail renders', a ? 'yes' : 'MISSING')
    check(!!a && a.position === 'fixed', 'it is position: fixed', a?.position)
    check(!!a && a.parentIsBody, 'it is portalled to <body>', String(a?.parentIsBody))
    check(!!a && a.transformedAncestor === null,
      'no transformed ancestor between it and the root — the containing-block trap',
      a?.transformedAncestor ?? 'none')
    check(!!a && a.w >= 44 && a.h >= 44, 'the collapsed trigger is at least 44px', `${a?.w}x${a?.h}`)
    check(!!a && a.panels === 0, '5.3: COLLAPSED by default', `${a?.panels} panel(s)`)
    check(!!a && a.proseRight !== null && a.x > a.proseRight,
      '5.4: it sits entirely to the right of the prose column, never over it',
      `rail x=${a?.x} vs prose right=${a?.proseRight}`)
    check(!!a && a.right <= a.vw && a.x >= 0, 'it is inside the viewport', `${a?.x}..${a?.right} of ${a?.vw}`)

    console.log('B. the accessible name survived the move')
    check(!!a && /reading options/i.test(a.name || ''), 'it is still named "Reading options"', a?.name ?? '')

    console.log('C. IT DOES NOT MOVE WHEN THE PAGE SCROLLS')
    const before = a
    await page.evaluate(() => window.scrollTo(0, 1400))
    await page.waitForTimeout(500)
    const scrolled = await page.evaluate(() => ({ y: window.scrollY, ...(() => {
      const t = document.querySelector('.reading-toolbar-trigger')
      const r = t.getBoundingClientRect()
      return { x: Math.round(r.x), ry: Math.round(r.y) }
    })() }))
    // Positive control first: if the page did not scroll, "it did not move" proves nothing.
    check(scrolled.y > 800, 'positive control: the page actually scrolled', `scrollY=${scrolled.y}`)
    check(Math.abs(scrolled.ry - (before?.y ?? -999)) <= 2 && Math.abs(scrolled.x - (before?.x ?? -999)) <= 2,
      'the rail is in the same viewport position after scrolling 1400px',
      `before y=${before?.y} after y=${scrolled.ry}`)
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(300)

    console.log('D. expand, persist, dismiss')
    await page.locator('.reading-toolbar-trigger').click()
    await page.waitForTimeout(400)
    const open = await page.evaluate(RAIL)
    check(open?.panels === 1, 'clicking opens exactly one panel', `${open?.panels}`)
    check(open?.expanded === 'true', 'aria-expanded follows', String(open?.expanded))
    const groups = await page.evaluate(() =>
      Array.from(document.querySelectorAll('.reader-menu-panel h3')).map((h) => h.textContent?.trim()))
    console.log(`  groups: ${groups.join(' | ')}`)
    check(groups.length >= 6, 'the panel carries every group the old menu had, plus its own', `${groups.length}`)
    check(groups.some((g) => /this toolbar/i.test(g || '')), '5.3: it offers to hide itself', '')
    await page.screenshot({ path: path.join(OUT, `toolbar-open-1440${reduced ? '-reduced' : ''}.jpg`), type: 'jpeg', quality: 82 })

    // 5.3 state memory: the open/closed choice survives a reload.
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2200)
    const remembered = await page.evaluate(RAIL)
    check(remembered?.panels === 1, '5.3: the expanded state is remembered across a reload', `${remembered?.panels}`)

    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
    check((await page.evaluate(RAIL))?.panels === 0, 'Escape closes it', '')

    console.log('E. dismissible entirely, and recoverable')
    await page.locator('.reading-toolbar-trigger').click()
    await page.waitForTimeout(350)
    await page.locator('.reader-menu-panel button', { hasText: /hide the toolbar/i }).first().click()
    await page.waitForTimeout(400)
    const gone = await page.evaluate(() => ({
      rails: document.querySelectorAll('.reading-toolbar').length,
      stored: localStorage.getItem('sp_toolbar_hidden'),
    }))
    check(gone.rails === 0, 'it is gone entirely — no stub left behind', `${gone.rails} rail(s)`)
    check(gone.stored === 'true', 'and the dismissal persists', String(gone.stored))
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2200)
    check(await page.locator('.reading-toolbar').count() === 0, 'still gone after a reload', '')
    const restore = page.locator('footer button', { hasText: /reading controls/i })
    check(await restore.count() === 1, 'the footer offers it back', `${await restore.count()}`)
    await restore.first().click()
    await page.waitForTimeout(2500)
    check(await page.locator('.reading-toolbar').count() === 1, 'and restores it', '')
    await ctx.close()
  }

  // ── narrow ─────────────────────────────────────────────────────────────────
  console.log(String.fromCharCode(10) + '═══ 390px ═══')
  const nctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const np = await nctx.newPage()
  await np.goto(`${BASE}/blog/${SLUG}`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await np.waitForTimeout(2500)
  // Local-only artifact, already in the trap list: on 127.0.0.1 SanityLive cannot reach the
  // dataset and sonner raises an error toast, bottom-right -- exactly where the trigger docks
  // at this width. It intercepts the click and looks like the trigger being unclickable. It
  // does not exist in production, so it is removed rather than worked around.
  await np.evaluate(() => document.querySelectorAll('[data-sonner-toaster], [data-sonner-toast]').forEach((el) => el.remove()))
  const n = await np.evaluate(RAIL)
  console.log(`  ${JSON.stringify({ x: n?.x, y: n?.y, right: n?.right, bottom: n?.bottom, vw: n?.vw, vh: n?.vh })}`)
  check(!!n, 'the rail renders at 390', n ? 'yes' : 'MISSING')
  check(!!n && n.right <= n.vw && n.x >= 0, 'inside the viewport horizontally', `${n?.x}..${n?.right} of ${n?.vw}`)
  check(!!n && n.bottom <= n.vh, '5.4: it FITS — docked to the bottom-right, not forcing layout', `bottom=${n?.bottom} vh=${n?.vh}`)
  check(!!n && n.docW <= n.vw, 'and adds no horizontal scroll', `${n?.docW} vs ${n?.vw}`)
  await np.locator('.reading-toolbar-trigger').click()
  await np.waitForTimeout(400)
  const sheet = await np.evaluate(() => {
    const p = document.querySelector('.reader-menu-panel')
    if (!p) return null
    const r = p.getBoundingClientRect()
    return { x: Math.round(r.x), w: Math.round(r.width), bottom: Math.round(r.bottom), vw: window.innerWidth, vh: window.innerHeight, docW: document.documentElement.scrollWidth }
  })
  check(!!sheet && sheet.x >= 0 && sheet.x + sheet.w <= sheet.vw, 'the panel is a bottom sheet that fits the width',
    sheet && `${sheet.x}..${sheet.x + sheet.w} of ${sheet.vw}`)
  check(!!sheet && sheet.docW <= sheet.vw, 'no horizontal overflow with it open', sheet && `${sheet.docW}`)
  await np.screenshot({ path: path.join(OUT, 'toolbar-open-390.jpg'), type: 'jpeg', quality: 85 })
  await nctx.close()
} finally {
  await browser.close()
}

console.log(String.fromCharCode(10) + `${pass} passed / ${fail} failed`)
process.exit(fail ? 1 : 0)
