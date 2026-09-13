// docs/audit/measure-toolbar-persistence.mjs
//
// Stefan: "Every setting persists across pages AND across visits, not just the current
// session. Use localStorage, not sessionStorage. A reader who sets their text size once
// should never set it again."
//
// The code already used localStorage for all seventeen settings and `sessionStorage` appears
// nowhere in the repo, so this ships as a GUARD rather than a fix. It is worth a guard
// because the failure is silent: a reader who loses their text size on the next page does
// not file a bug, they just stop using the control.
//
// Three kinds of persistence, and they are not the same thing:
//   1. across a reload      -- the settings are written at all
//   2. across a navigation  -- they are not scoped to one page's React tree
//   3. across a VISIT       -- a new browser session with the same profile, which is what
//      localStorage gives you and sessionStorage does not
//
//   node docs/audit/measure-toolbar-persistence.mjs
//
import { chromium } from '@playwright/test'

const BASE = process.env.BASE || 'http://127.0.0.1:3000'
const SLUG = process.env.SLUG || 'the-field-the-moment-and-what-it-means-for-us-networking-industry'

let pass = 0, fail = 0
const check = (label, cond, detail = '') => {
  if (cond) { pass++; console.log(`  PASS  ${label}${detail ? ' — ' + detail : ''}`) }
  else { fail++; console.log(`  FAIL  ${label}${detail ? ' — ' + detail : ''}`) }
}

/**
 * The reader's SETTINGS only.
 *
 * `sp_read_posts` and the resume-scroll position also live under the `sp_` prefix and are
 * not settings: they are reading STATE, they change as you read, and comparing them across
 * two page loads made the first version of this check fail once and pass the next time. A
 * flaky guard is worse than no guard, so the filter is explicit rather than a prefix match.
 */
const NOT_A_SETTING = /read_posts|scroll|position|progress_seen/
const read = (page) => page.evaluate((pattern) => {
  const re = new RegExp(pattern)
  const out = {}
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k && k.startsWith('sp_') && !re.test(k)) out[k] = localStorage.getItem(k)
  }
  return out
}, NOT_A_SETTING.source)

const browser = await chromium.launch()
try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  const page = await ctx.newPage()
  await page.goto(`${BASE}/blog/${SLUG}`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(1200)

  // No sessionStorage anywhere. This is the assertion the instruction actually asked for.
  const usesSession = await page.evaluate(() => sessionStorage.length)
  check('nothing is kept in sessionStorage', usesSession === 0, `${usesSession} key(s)`)

  // Drive the real control rather than writing localStorage directly: writing the keys by
  // hand would prove the reader, not the writer.
  await page.locator('.reading-toolbar-trigger').click()
  await page.waitForTimeout(400)
  const panel = page.locator('.reader-menu-panel')
  check('the panel opens', await panel.isVisible())

  // Pick the largest text size and the widest measure, whatever they are called.
  const sizeGroup = panel.locator('[role="radiogroup"]').nth(1)
  const widthGroup = panel.locator('[role="radiogroup"]').nth(2)
  const nSize = await sizeGroup.locator('button').count()
  const nWidth = await widthGroup.locator('button').count()
  if (nSize > 1) await sizeGroup.locator('button').nth(nSize - 1).click()
  await page.waitForTimeout(250)
  if (nWidth > 1) await widthGroup.locator('button').nth(nWidth - 1).click()
  await page.waitForTimeout(400)

  const after = await read(page)
  check('the control writes settings to localStorage', Object.keys(after).length > 0, `${Object.keys(after).length} sp_* keys`)
  const fontSize = await page.evaluate(() => getComputedStyle(document.querySelector('[data-article]') || document.body).fontSize)

  // 1. across a reload
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1200)
  const reloaded = await read(page)
  check('every setting survives a reload', JSON.stringify(reloaded) === JSON.stringify(after))
  const fontAfterReload = await page.evaluate(() => getComputedStyle(document.querySelector('[data-article]') || document.body).fontSize)
  check('and it is APPLIED, not merely stored', fontAfterReload === fontSize, `${fontAfterReload} vs ${fontSize}`)

  // 2. across a navigation to a different surface
  await page.goto(`${BASE}/blog`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1000)
  const onIndex = await read(page)
  check('every setting survives navigating to /blog', JSON.stringify(onIndex) === JSON.stringify(after))

  // 3. across a VISIT — a brand new browser session carrying the same storage, which is what
  // separates localStorage from sessionStorage.
  const state = await ctx.storageState()
  await ctx.close()
  const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 1000 }, storageState: state })
  const page2 = await ctx2.newPage()
  await page2.goto(`${BASE}/blog/${SLUG}`, { waitUntil: 'domcontentloaded' })
  await page2.waitForTimeout(1200)
  const nextVisit = await read(page2)
  const diff = [...new Set([...Object.keys(after), ...Object.keys(nextVisit)])].filter((k) => after[k] !== nextVisit[k]).map((k) => k + ': ' + after[k] + ' -> ' + nextVisit[k])
  check('every setting survives a NEW browser session', diff.length === 0, diff.join(' | ') || 'identical')
  const fontNextVisit = await page2.evaluate(() => getComputedStyle(document.querySelector('[data-article]') || document.body).fontSize)
  check('and is applied on the next visit', fontNextVisit === fontSize, `${fontNextVisit} vs ${fontSize}`)

  // The negative control. A session with NO stored settings must fall back to the defaults,
  // not to whatever the last reader chose.
  const ctx3 = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  const page3 = await ctx3.newPage()
  await page3.goto(`${BASE}/blog/${SLUG}`, { waitUntil: 'domcontentloaded' })
  await page3.waitForTimeout(1200)
  const fresh = await read(page3)
  const fontFresh = await page3.evaluate(() => getComputedStyle(document.querySelector('[data-article]') || document.body).fontSize)
  check('a fresh reader gets the defaults, not the last reader\'s settings', fontFresh !== fontSize || Object.keys(fresh).length === 0,
    `fresh ${fontFresh}, stored ${fontSize}`)
  await ctx3.close()
  await ctx2.close()
} finally {
  await browser.close()
}
console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
