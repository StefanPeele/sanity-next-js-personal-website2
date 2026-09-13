// docs/audit/measure-tour.mjs
//
// The first-visit tour, driven rather than read. Every requirement Stefan set is a claim
// about behaviour, and behaviour is the one thing a code review cannot check.
//
//   node docs/audit/measure-tour.mjs
//
import { chromium } from '@playwright/test'

const BASE = process.env.BASE || 'http://127.0.0.1:3000'
const SLUG = process.env.SLUG || 'the-field-the-moment-and-what-it-means-for-us-networking-industry'

let pass = 0, fail = 0
const check = (label, cond, detail = '') => {
  if (cond) { pass++; console.log(`  PASS  ${label}${detail ? ' — ' + detail : ''}`) }
  else { fail++; console.log(`  FAIL  ${label}${detail ? ' — ' + detail : ''}`) }
}

/** Scroll far enough to trip the 25% trigger without waiting out the 20s one. */
async function trip(page) {
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight * 0.35))
  await page.waitForTimeout(700)
}

const browser = await chromium.launch()
try {
  // ── 1. it does not appear before the reader has committed ──────────────
  let ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  let page = await ctx.newPage()
  await page.goto(`${BASE}/blog/${SLUG}`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2000)
  check('does NOT appear on arrival', await page.locator('[role="region"] button', { hasText: /show me/i }).count() === 0)

  await trip(page)
  const invite = page.locator('[role="region"]').filter({ hasText: /want a quick look/i })
  check('appears once the reader is 25% in', await invite.count() > 0)

  // ── 2. declining is one click, and it never comes back ─────────────────
  const decline = invite.getByRole('button', { name: /no thanks/i })
  const accept = invite.getByRole('button', { name: /show me/i })
  check('both buttons exist, and there is no third option', await decline.count() === 1 && await accept.count() === 1)
  const box = await Promise.all([decline.boundingBox(), accept.boundingBox()])
  check('decline is not smaller than accept', !!box[0] && !!box[1] && box[0].height === box[1].height,
    box[0] && box[1] ? `${Math.round(box[0].width)}x${box[0].height} vs ${Math.round(box[1].width)}x${box[1].height}` : 'missing')
  check('there is no close X beside them', await invite.locator('button').count() === 2, `${await invite.locator('button').count()} buttons`)

  await decline.click()
  await page.waitForTimeout(400)
  check('declining dismisses it', await invite.count() === 0)

  const cookie = (await ctx.cookies()).find((c) => c.name === 'sp_tour')
  check('the decision is stored in a cookie', !!cookie, cookie ? `${cookie.name}=${cookie.value}` : 'none')

  await page.reload({ waitUntil: 'domcontentloaded' })
  await trip(page)
  check('it does NOT come back after a reload', await page.locator('[role="region"]').filter({ hasText: /want a quick look/i }).count() === 0)

  // The requirement a cookie alone cannot meet: clearing cookies mid-visit must not
  // resurrect it, because the session flag is still set.
  await ctx.clearCookies()
  await page.reload({ waitUntil: 'domcontentloaded' })
  await trip(page)
  check('it does NOT come back when the COOKIE IS CLEARED MID-VISIT', await page.locator('[role="region"]').filter({ hasText: /want a quick look/i }).count() === 0)
  await ctx.close()

  // ── 3. accepting runs the tour, trapped and keyboard-operable ──────────
  ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  page = await ctx.newPage()
  await page.goto(`${BASE}/blog/${SLUG}`, { waitUntil: 'domcontentloaded' })
  await trip(page)
  await page.getByRole('button', { name: /show me/i }).click()
  await page.waitForTimeout(500)

  const dialog = page.locator('[role="dialog"][aria-modal="true"]')
  check('accepting opens a modal dialog', await dialog.count() === 1)
  check('focus moved into the dialog', await page.evaluate(() => {
    const d = document.querySelector('[role="dialog"][aria-modal="true"]')
    return !!d && (d === document.activeElement || d.contains(document.activeElement))
  }))

  const stepCount = await page.evaluate(() => {
    const el = document.querySelector('[role="dialog"] .meta-label')
    return el?.textContent?.trim() ?? ''
  })
  check('it says which step this is', /\d+\s*\/\s*\d+/.test(stepCount), stepCount)

  // Walk the whole thing with the keyboard only.
  const total = Number(stepCount.split('/')[1]?.trim() || 0)
  check('there are five steps or fewer', total > 0 && total <= 5, String(total))
  // Tab THEN Enter, which is the real keyboard path. Initial focus sits on the dialog
  // container rather than on the button, deliberately: that is what makes a screen reader
  // announce the step's title and body before offering the control. The first version of
  // this check pressed Enter straight away, which tests a focus placement nobody should want.
  let steps = 0
  for (let i = 0; i < total + 2; i++) {
    if (await dialog.count() === 0) break
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter')
    await page.waitForTimeout(250)
    steps++
  }
  check('it can be completed with the keyboard alone', await dialog.count() === 0, `${steps} step(s) via Tab+Enter`)
  await ctx.close()

  // ── 4. Escape ends it, and counts as done rather than "ask again" ──────
  ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  page = await ctx.newPage()
  await page.goto(`${BASE}/blog/${SLUG}`, { waitUntil: 'domcontentloaded' })
  await trip(page)
  await page.getByRole('button', { name: /show me/i }).click()
  await page.waitForTimeout(400)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)
  check('Escape closes the tour', await page.locator('[role="dialog"][aria-modal="true"]').count() === 0)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await trip(page)
  check('Escape counted as DONE, so the invite does not return', await page.locator('[role="region"]').filter({ hasText: /want a quick look/i }).count() === 0)

  // ── 5. the way back in ────────────────────────────────────────────────
  await page.locator('.reading-toolbar-trigger').click()
  await page.waitForTimeout(400)
  const replay = page.getByRole('button', { name: /reading tips/i })
  check('the reader menu offers a way back in', await replay.count() === 1)
  if (await replay.count()) {
    await replay.click()
    await page.waitForTimeout(500)
    check('and it replays the tour', await page.locator('[role="dialog"][aria-modal="true"]').count() === 1)
  }
  await ctx.close()

  // ── 6. it never runs on the index ─────────────────────────────────────
  ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  page = await ctx.newPage()
  await page.goto(`${BASE}/blog`, { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight * 0.5))
  await page.waitForTimeout(1500)
  check('it never appears on the blog index', await page.locator('[role="region"]').filter({ hasText: /want a quick look/i }).count() === 0)
  await ctx.close()
} finally {
  await browser.close()
}
console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
