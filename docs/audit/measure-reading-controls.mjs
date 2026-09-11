// docs/audit/measure-reading-controls.mjs
//
// Phase 5.2's expanded set: four spacing SCALES and three new toggles.
//
// The failure mode this is built against is a setting that stores and persists correctly and
// changes nothing on screen — a CSS variable nobody consumes, or a class no rule matches.
// Every check below therefore reads the RENDERED value off the prose, and every scale is
// measured at all three steps so "it moved" cannot pass for "it moved the right way".
import { chromium } from '@playwright/test'
import crypto from 'node:crypto'
import fs from 'node:fs'

const BASE = 'http://127.0.0.1:3000'
const SLUG = 'the-field-the-moment-and-what-it-means-for-us-networking-industry'

// The only post carrying an inline prose link is a draft fixture -- the three published
// posts have heading anchors and nothing else, which is why the first run of this harness
// measured `null` for the link check and reported a failure against a working feature.
const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]))
const API = `https://${env.NEXT_PUBLIC_SANITY_PROJECT_ID}.api.sanity.io/v2025-02-27`
const SECRET_ID = 'sanity-preview-url-secret.capture-harness'
const secret = crypto.randomBytes(24).toString('hex')
const mutate = (m) => fetch(`${API}/data/mutate/${env.NEXT_PUBLIC_SANITY_DATASET}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.SANITY_API_WRITE_TOKEN}` },
  body: JSON.stringify({ mutations: m }),
}).then((r) => r.json())

let pass = 0
let fail = 0
const check = (ok, name, detail) => {
  if (ok) { pass++; console.log(`  PASS  ${name}${detail ? '  -- ' + detail : ''}`) }
  else { fail++; console.log(`  FAIL  ${name}${detail ? '  -- ' + detail : ''}`) }
}

const SCALES = [
  { key: 'lineHeight', storage: 'sp_line_height', prop: 'lineHeight', initial: 1 },
  { key: 'letterSpacing', storage: 'sp_letter_spacing', prop: 'letterSpacing', initial: 0 },
  { key: 'wordSpacing', storage: 'sp_word_spacing', prop: 'wordSpacing', initial: 0 },
  { key: 'paraSpacing', storage: 'sp_para_spacing', prop: 'marginBottom', initial: 0 },
]

const browser = await chromium.launch()
try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  const page = await ctx.newPage()
  await page.goto(`${BASE}/blog/${SLUG}`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(2200)

  // Read a computed property off a real body paragraph — not off the variable, which would
  // only prove the variable was written.
  const read = (prop) => page.evaluate((p) => {
    const el = document.querySelector('[data-article] p')
    return el ? getComputedStyle(el)[p] : null
  }, prop)

  console.log('A. each scale moves the rendered prose, in order')
  for (const s of SCALES) {
    const seen = []
    for (let i = 0; i < 3; i++) {
      await page.evaluate(([k, v]) => localStorage.setItem(k, String(v)), [s.storage, i])
      await page.reload({ waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(1500)
      seen.push(parseFloat(await read(s.prop)))
    }
    console.log(`  ${s.key}: ${seen.join(' -> ')}`)
    check(seen.every((v) => Number.isFinite(v)), `${s.key} produces a real computed value`, seen.join(','))
    check(new Set(seen).size === 3, `${s.key} has three DISTINCT rendered values`, `${new Set(seen).size} distinct`)
    check(seen[0] < seen[1] && seen[1] < seen[2], `${s.key} increases monotonically`, seen.join(' < '))
    // Put it back so the next scale is measured against the default, not the last one's step 2.
    await page.evaluate(([k, v]) => localStorage.setItem(k, String(v)), [s.storage, s.initial])
  }
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1500)

  console.log(String.fromCharCode(10) + 'B. the three new toggles change something real')
  const baseline = await page.evaluate(() => {
    const link = document.querySelector('[data-article] .article-link')
    const art = document.querySelector('[data-article]')
    return {
      linkDecoration: link ? getComputedStyle(link).textDecorationLine : null,
      filter: art ? getComputedStyle(art).filter : null,
    }
  })
  console.log(`  baseline: link=${baseline.linkDecoration} filter=${baseline.filter}`)

  // Measured on the fixture, in draft mode, because that is the only post with a prose link.
  await mutate([{ createOrReplace: { _id: SECRET_ID, _type: 'sanity.previewUrlSecret', secret, studioUrl: '/studio' } }])
  const linkPath = '/blog/fixture-kitchen-sink'
  await page.goto(`${BASE}/api/draft-mode/enable?sanity-preview-secret=${secret}&sanity-preview-pathname=${encodeURIComponent(linkPath)}`,
    { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForLoadState('load').catch(() => {})
  await page.waitForTimeout(3000)
  const linkBefore = await page.evaluate(() => {
    const link = document.querySelector('[data-article] .article-link')
    return link ? { deco: getComputedStyle(link).textDecorationLine, bg: getComputedStyle(link).backgroundImage } : null
  })
  check(!!linkBefore, 'the fixture has a prose link to measure', linkBefore ? 'yes' : 'NONE — the fixture needs one')
  await page.evaluate(() => localStorage.setItem('sp_link_underline', 'true'))
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2200)
  const linkAfter = await page.evaluate(() => {
    const link = document.querySelector('[data-article] .article-link')
    return link ? { deco: getComputedStyle(link).textDecorationLine, bg: getComputedStyle(link).backgroundImage } : null
  })
  check(linkAfter?.deco === 'underline' && linkBefore?.deco !== 'underline',
    'linkUnderline turns the ink-bleed underline into a real one',
    `${linkBefore?.deco} -> ${linkAfter?.deco}`)
  check(linkAfter?.bg === 'none' && linkBefore?.bg !== 'none',
    'and drops the gradient that only appears on hover',
    `${String(linkBefore?.bg).slice(0, 30)} -> ${linkAfter?.bg}`)
  await page.evaluate(() => localStorage.removeItem('sp_link_underline'))
  await page.goto(`${BASE}/blog/${SLUG}`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(2000)

  await page.evaluate(() => localStorage.setItem('sp_mute_colour', 'true'))
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1500)
  const muted = await page.evaluate(() => {
    const art = document.querySelector('[data-article]')
    return art ? getComputedStyle(art).filter : null
  })
  check(/saturate/.test(muted || '') && !/saturate/.test(baseline.filter || ''),
    'muteColour desaturates the prose', `${baseline.filter} -> ${muted}`)
  await page.evaluate(() => localStorage.removeItem('sp_mute_colour'))

  // bigFocus has to be measured on a REALLY focused element: :focus-visible is gated on
  // input modality, so el.focus() does not always match it. Tab from the body.
  await page.evaluate(() => localStorage.setItem('sp_big_focus', 'true'))
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1600)
  await page.evaluate(() => document.body.focus())
  for (let i = 0; i < 6; i++) await page.keyboard.press('Tab')
  await page.waitForTimeout(400)
  const big = await page.evaluate(() => {
    const el = document.activeElement
    if (!el || el === document.body) return null
    const cs = getComputedStyle(el)
    return { tag: el.tagName, width: cs.outlineWidth, offset: cs.outlineOffset }
  })
  console.log(`  focused with bigFocus on: ${JSON.stringify(big)}`)
  check(!!big && parseFloat(big.width) >= 4, 'bigFocus widens the focus ring to >=4px', big ? big.width : 'nothing focused')
  await page.evaluate(() => localStorage.removeItem('sp_big_focus'))
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1600)
  await page.evaluate(() => document.body.focus())
  for (let i = 0; i < 6; i++) await page.keyboard.press('Tab')
  await page.waitForTimeout(400)
  const normal = await page.evaluate(() => {
    const el = document.activeElement
    if (!el || el === document.body) return null
    return { tag: el.tagName, width: getComputedStyle(el).outlineWidth }
  })
  // Positive control: without the toggle the ring must be NARROWER, or the check above
  // passed against a ring that was always 4px.
  check(!!normal && !!big && normal.tag === big.tag && parseFloat(normal.width) < parseFloat(big.width),
    'positive control: the SAME element has a narrower ring without it',
    `${normal?.tag} ${normal?.width} vs ${big?.tag} ${big?.width}`)

  console.log(String.fromCharCode(10) + 'C. Reset returns every one of them')
  await page.evaluate(() => {
    localStorage.setItem('sp_line_height', '2')
    localStorage.setItem('sp_letter_spacing', '2')
    localStorage.setItem('sp_word_spacing', '2')
    localStorage.setItem('sp_para_spacing', '2')
    localStorage.setItem('sp_link_underline', 'true')
    localStorage.setItem('sp_big_focus', 'true')
    localStorage.setItem('sp_mute_colour', 'true')
    localStorage.setItem('sp_dyslexia', 'true')
  })
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1800)
  await page.evaluate(() => document.querySelectorAll('[data-sonner-toaster], [data-sonner-toast]').forEach((el) => el.remove()))
  await page.locator('.reading-toolbar-trigger').click()
  await page.waitForTimeout(400)
  await page.locator('.reader-menu-panel button', { hasText: /^Reset$/ }).first().click()
  await page.waitForTimeout(600)
  const afterReset = await page.evaluate(() => ({
    lh: localStorage.getItem('sp_line_height'),
    ls: localStorage.getItem('sp_letter_spacing'),
    ws: localStorage.getItem('sp_word_spacing'),
    ps: localStorage.getItem('sp_para_spacing'),
    link: localStorage.getItem('sp_link_underline'),
    focus: localStorage.getItem('sp_big_focus'),
    colour: localStorage.getItem('sp_mute_colour'),
    dys: localStorage.getItem('sp_dyslexia'),
  }))
  console.log(`  after Reset: ${JSON.stringify(afterReset)}`)
  check(afterReset.lh === '1', 'line height back to its default step (1, not 0)', String(afterReset.lh))
  check(afterReset.ls === '0' && afterReset.ws === '0' && afterReset.ps === '0',
    'the other three scales back to 0', `${afterReset.ls}/${afterReset.ws}/${afterReset.ps}`)
  check(afterReset.link === 'false' && afterReset.focus === 'false' && afterReset.colour === 'false',
    'all three new toggles off', `${afterReset.link}/${afterReset.focus}/${afterReset.colour}`)
  check(afterReset.dys === 'false', 'and the original toggles still reset too', String(afterReset.dys))
  await ctx.close()
} finally {
  await browser.close()
  await mutate([{ delete: { id: SECRET_ID } }]).catch(() => {})
}

console.log(String.fromCharCode(10) + `${pass} passed / ${fail} failed`)
process.exit(fail ? 1 : 0)
