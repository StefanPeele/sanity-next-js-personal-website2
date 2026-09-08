import { chromium } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const BASE = 'https://stefanpeele.com'
const ROOT = path.join('docs', 'audit', 'screenshots', 'site-inventory')
const BPS = [{ n: '1440', w: 1440, h: 900 }, { n: '768', w: 768, h: 1024 }, { n: '390', w: 390, h: 844 }]
const ART = '/blog/building-my-physical-home-lab-week-2-documentation-and-extensive-researching'

const ROUTES = [
  '/', '/blog', ART, '/blog/osi-model', '/blog/series',
  '/blog/the-creation-of-my-personal-portfolio-site',
  '/blog/the-field-the-moment-and-what-it-means-for-us-networking-industry',
  '/contact', '/garden', '/glossary', '/graph', '/library', '/now', '/offline',
  '/photography', '/photography/albums', '/photography/alex-andrew-moises-photoshoot',
  '/photography/grad-shoots', '/photography/headshots', '/photography/mvb-04-13-2026',
  '/photography/mvb-25', '/photography/turkish-student-association-photoshoot', '/photography/wtn',
  '/projects', '/projects/my-digital-archive-a-high-performance-headless-portfolio',
  '/resume', '/services', '/studio', '/test', '/uses', '/404-does-not-exist',
]

const slug = (r) => (r === '/' ? 'home' : r.replace(/^\//, '').replace(/\//g, '--')).slice(0, 70)
const log = []
let n = 0

async function shot(page, route, bp, name, opts = {}) {
  const f = path.join(ROOT, slug(route), bp, `${name}.jpg`)
  fs.mkdirSync(path.dirname(f), { recursive: true })
  try {
    await page.screenshot({ path: f, type: 'jpeg', quality: 72, caret: 'hide', ...opts })
    n++
  } catch (e) { log.push(`SHOT-FAIL ${route} ${bp} ${name}: ${String(e).slice(0, 70)}`) }
}

const settle = async (p) => {
  try {
    await p.evaluate(() => (document.fonts ? document.fonts.ready.then(() => undefined) : undefined))
    await p.evaluate(() => new Promise((r) => { let y = 0; const t = () => { scrollTo(0, y); y += 900; if (y < document.documentElement.scrollHeight && y < 30000) setTimeout(t, 25); else { scrollTo(0, 0); setTimeout(r, 120) } }; t() }))
  } catch { /* ignore */ }
  await p.waitForTimeout(500)
}

/** Generic state probes — each no-ops when the pattern is absent. */
async function genericStates(page, route, bp) {
  // primary button hover + focus-visible
  try {
    const btn = page.locator('main button, main a[class*="bg-white"], main button[type="submit"]').first()
    if (await btn.count() && await btn.isVisible()) {
      await btn.scrollIntoViewIfNeeded(); await btn.hover(); await page.waitForTimeout(90)
      await shot(page, route, bp, 'state-button-hover')
      await btn.evaluate((e) => e.focus()); await page.waitForTimeout(150)
      await shot(page, route, bp, 'state-button-focus-visible')
      await page.mouse.move(0, 0)
    }
  } catch { /* ignore */ }
  // first link focus ring
  try {
    await page.evaluate(() => { const a = document.querySelector('main a[href]'); a?.focus() })
    await page.waitForTimeout(150)
    await shot(page, route, bp, 'state-link-focus-visible')
    await page.evaluate(() => document.activeElement?.blur())
  } catch { /* ignore */ }
  // <details> disclosures opened
  try {
    const d = page.locator('details:not([open])').first()
    if (await d.count()) {
      await d.locator('summary').first().click({ timeout: 3000 })
      await page.waitForTimeout(120); await shot(page, route, bp, 'state-details-open-mid120ms')
      await page.waitForTimeout(400); await shot(page, route, bp, 'state-details-open')
    }
  } catch { /* ignore */ }
  // search modal: closed-trigger hover, open, typed, no-results
  try {
    const t = page.getByRole('button', { name: /search the site/i }).first()
    if (await t.count()) {
      await t.click({ timeout: 3000 })
      await page.waitForTimeout(90);  await shot(page, route, bp, 'state-search-open-mid90ms')
      await page.waitForTimeout(500); await shot(page, route, bp, 'state-search-open-empty')
      await page.keyboard.type('network', { delay: 25 }); await page.waitForTimeout(1200)
      await shot(page, route, bp, 'state-search-results')
      for (let i = 0; i < 7; i++) await page.keyboard.press('Backspace')
      await page.keyboard.type('zzzzqqq', { delay: 25 }); await page.waitForTimeout(1400)
      await shot(page, route, bp, 'state-search-no-results')
      await page.keyboard.press('Escape'); await page.waitForTimeout(300)
    }
  } catch { /* ignore */ }
  // mobile nav
  if (bp === '390') {
    try {
      const m = page.getByRole('button', { name: /menu|navigation/i }).first()
      if (await m.count() && await m.isVisible()) {
        await m.click({ timeout: 3000 })
        await page.waitForTimeout(100); await shot(page, route, bp, 'state-navmenu-mid100ms')
        await page.waitForTimeout(450); await shot(page, route, bp, 'state-navmenu-open')
        await page.keyboard.press('Escape'); await page.waitForTimeout(250)
      }
    } catch { /* ignore */ }
  }
}

/** Form probes: focus, filled, empty-submit validation, loading. */
async function formStates(page, route, bp) {
  try {
    const form = page.locator('form').first()
    if (!(await form.count())) return
    await form.scrollIntoViewIfNeeded(); await page.waitForTimeout(300)
    await shot(page, route, bp, 'state-form-idle')
    const input = form.locator('input[type="text"], input[type="email"], input:not([type="hidden"]):not([type="checkbox"])').first()
    if (await input.count()) {
      await input.focus(); await page.waitForTimeout(200)
      await shot(page, route, bp, 'state-form-input-focus')
      await input.fill('test@example.com'); await page.waitForTimeout(200)
      await shot(page, route, bp, 'state-form-filled')
      await input.fill('')
    }
    const submit = form.locator('button[type="submit"], button').last()
    if (await submit.count() && await submit.isVisible()) {
      await submit.click({ timeout: 3000 })
      await page.waitForTimeout(180); await shot(page, route, bp, 'state-form-submit-t180ms')
      await page.waitForTimeout(1400); await shot(page, route, bp, 'state-form-after-submit')
    }
  } catch { /* ignore */ }
}

/** Blog index: filter chips across all three groups + sort. */
async function blogIndexStates(page, route, bp) {
  for (const g of ['Filter by lane', 'Filter by category', 'Filter by tag', 'Sort']) {
    try {
      const chips = page.getByRole('group', { name: g }).getByRole('button')
      const c = await chips.count()
      if (c > 1) {
        await chips.nth(1).scrollIntoViewIfNeeded()
        await chips.nth(1).hover(); await page.waitForTimeout(80)
        await shot(page, route, bp, `state-${g.replace(/\s+/g, '-').toLowerCase()}-hover`)
        await chips.nth(1).click(); await page.waitForTimeout(700)
        await shot(page, route, bp, `state-${g.replace(/\s+/g, '-').toLowerCase()}-active`, { fullPage: true, animations: 'disabled' })
      }
    } catch { /* ignore */ }
  }
  // empty result: stack lane + tag filters until the grid empties
  try {
    const lane = page.getByRole('group', { name: 'Filter by lane' }).getByRole('button')
    const tag = page.getByRole('group', { name: 'Filter by tag' }).getByRole('button')
    if (await lane.count() > 2 && await tag.count() > 2) {
      await lane.nth(2).click(); await page.waitForTimeout(300)
      await tag.nth(2).click(); await page.waitForTimeout(600)
      await shot(page, route, bp, 'state-filter-empty-result', { fullPage: true, animations: 'disabled' })
    }
  } catch { /* ignore */ }
}

/** Article: reader menu, TOC, themes, a11y toggles, progress. */
async function articleStates(page, route, bp) {
  try {
    await page.evaluate(() => scrollTo(0, Math.round((document.documentElement.scrollHeight - innerHeight) / 2)))
    await page.waitForTimeout(400)
    await shot(page, route, bp, 'state-scrolled-chrome', { clip: { x: 0, y: 0, width: parseInt(bp), height: Math.min(240, bp === '390' ? 844 : 900) } })
    const rm = page.getByRole('button', { name: /reading options/i }).first()
    if (await rm.count()) {
      await rm.hover(); await page.waitForTimeout(90); await shot(page, route, bp, 'state-readermenu-trigger-hover')
      await rm.click()
      await page.waitForTimeout(70);  await shot(page, route, bp, 'state-readermenu-t70ms')
      await page.waitForTimeout(500); await shot(page, route, bp, 'state-readermenu-open')
      await page.keyboard.press('Escape'); await page.waitForTimeout(300)
    }
    const h2 = page.locator('[data-article] h2').first()
    if (await h2.count()) { await h2.scrollIntoViewIfNeeded(); await h2.hover(); await page.waitForTimeout(150); await shot(page, route, bp, 'state-heading-anchor-hover') }
    const lk = page.locator('[data-article] a').first()
    if (await lk.count()) {
      await lk.scrollIntoViewIfNeeded(); await lk.hover()
      await page.waitForTimeout(110); await shot(page, route, bp, 'state-link-hover-mid110ms')
      await page.waitForTimeout(400); await shot(page, route, bp, 'state-link-hover-settled')
    }
  } catch { /* ignore */ }
}

const browser = await chromium.launch()

for (const bp of BPS) {
  for (const route of ROUTES) {
    const ctx = await browser.newContext({ viewport: { width: bp.w, height: bp.h } })
    const page = await ctx.newPage()
    const errs = []
    page.on('pageerror', (e) => errs.push(String(e).slice(0, 100)))
    try {
      const resp = await page.goto(BASE + route, { waitUntil: 'load', timeout: 45000 })
      log.push(`${route} ${bp.n} -> HTTP ${resp?.status()}`)
      await settle(page)
      await shot(page, route, bp.n, 'fold')
      await shot(page, route, bp.n, 'full', { fullPage: true, animations: 'disabled' })
      await genericStates(page, route, bp.n)
      if (route === '/blog') await blogIndexStates(page, route, bp.n)
      if (route.startsWith('/blog/') && !/series|osi-model/.test(route)) await articleStates(page, route, bp.n)
      if (/contact|services|now|uses|garden|library/.test(route)) await formStates(page, route, bp.n)
      if (errs.length) log.push(`  JS-ERRORS ${route} ${bp.n}: ${errs.slice(0, 2).join(' | ')}`)
    } catch (e) {
      log.push(`FAIL ${route} ${bp.n}: ${String(e).slice(0, 110)}`)
    }
    await ctx.close()
  }
  fs.writeFileSync(path.join(ROOT, '_capture-log.txt'), log.join('\n'))
  console.log(`--- ${bp.n} done, ${n} frames so far ---`)
}

// Article themes + a11y toggles, seeded per context
for (const bp of BPS) {
  for (const [k, v, label] of [
    ['sp_theme', 'archive', 'theme-dark'], ['sp_theme', 'terminal', 'theme-green'],
    ['sp_dyslexia', 'true', 'a11y-dyslexia'], ['sp_high_contrast', 'true', 'a11y-high-contrast'],
    ['sp_reading_ruler', 'true', 'a11y-reading-ruler'], ['sp_reduced_motion', 'true', 'a11y-reduced-motion'],
    ['sp_font_size', '3', 'text-size-XL'], ['sp_width', 'wide', 'width-wide'], ['sp_width', 'narrow', 'width-narrow'],
  ]) {
    const c = await browser.newContext({ viewport: { width: bp.w, height: bp.h } })
    await c.addInitScript(([kk, vv]) => localStorage.setItem(kk, vv), [k, v])
    const p = await c.newPage()
    try {
      await p.goto(BASE + ART, { waitUntil: 'load', timeout: 45000 })
      await p.waitForTimeout(1600)
      const b = await p.locator('[data-article]').boundingBox()
      if (b) { await p.evaluate((y) => scrollTo(0, y - 30), b.y); await p.waitForTimeout(400) }
      await shot(p, ART, bp.n, `pref-${label}`, { animations: 'disabled' })
    } catch (e) { log.push(`PREF-FAIL ${label} ${bp.n}: ${String(e).slice(0, 70)}`) }
    await c.close()
  }
}

fs.writeFileSync(path.join(ROOT, '_capture-log.txt'), log.join('\n'))
await browser.close()
console.log(`DONE — ${n} frames`)
