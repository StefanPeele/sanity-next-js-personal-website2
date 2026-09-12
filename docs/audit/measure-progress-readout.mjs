// docs/audit/measure-progress-readout.mjs
//
// Phase 7.5 (the reading time moves) and 7.6 (the progress bar).
//
// Both are behaviour, not pixels, so this drives the page rather than photographing it:
// it scrolls, it opens the reader menu and clicks the real switches, and it reloads to
// check that a setting and a position survive. A screenshot cannot tell you whether the
// number changed for the right reason.
//
//   node docs/audit/measure-progress-readout.mjs
//
import { chromium } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const BASE = process.env.BASE || 'http://127.0.0.1:3000'
const OUT = path.join('docs', 'audit', 'screenshots', 'phase-7')
const SLUG = process.env.SLUG || 'the-field-the-moment-and-what-it-means-for-us-networking-industry'
const URL = `${BASE}/blog/${SLUG}`

let pass = 0, fail = 0
const check = (ok, name, detail) => {
  if (ok) { pass++; console.log(`  PASS  ${name}${detail ? '  -- ' + detail : ''}`) }
  else { fail++; console.log(`  FAIL  ${name}${detail ? '  -- ' + detail : ''}`) }
}

// innerText, never textContent: textContent includes <script> contents, and the RSC payload
// on this page legitimately carries the string "min read" in its serialised copy. Reading it
// would make every assertion below pass for the wrong reason.
const textOf = (el) => (el ? el.innerText : '')

fs.mkdirSync(OUT, { recursive: true })
const browser = await chromium.launch()
try {
  // ── desktop ────────────────────────────────────────────────────
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  const page = await ctx.newPage()
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(2500)
  await page.evaluate(() => document.querySelectorAll('[data-sonner-toaster], [data-sonner-toast]').forEach((el) => el.remove()))

  console.log('\n## 7.5 — the reading time is out of the header and above Contents\n')

  const top = await page.evaluate((t) => {
    const f = new Function('el', `return (${t})(el)`)
    return {
      header: f(document.querySelector('header')),
      toc: f(document.querySelector('[data-toc="sidebar"]')),
    }
  }, textOf.toString())
  check(!/min read/i.test(top.header), 'the article header no longer carries a reading time',
    `header meta reads "${top.header.split('\n').filter(Boolean).slice(-1)[0]?.slice(0, 60)}"`)
  check(/min read/i.test(top.toc), 'the Contents column carries it instead',
    top.toc.split('\n').find((l) => /min read/i.test(l)))
  // The whole point of the move is that the reader meets it as they settle in. If the
  // figure sat below the fold it would not be met at all.
  const tocY = await page.evaluate(() => {
    const el = document.querySelector('[data-toc="sidebar"]')
    return el ? Math.round(el.getBoundingClientRect().top + window.scrollY) : null
  })
  check(tocY !== null, 'the Contents column is present at 1440', `top y=${tocY}`)

  console.log('\n## 7.6 — the bar, the percentage and the time remaining\n')

  const bar = await page.evaluate(() => {
    const el = document.querySelector('[role="progressbar"]')
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { height: Math.round(r.height), now: el.getAttribute('aria-valuenow'), position: getComputedStyle(el).position }
  })
  check(bar?.height === 4, 'the bar is 4px, not 2px', `measured ${bar?.height}px`)
  check(bar?.position === 'fixed', 'and still fixed to the viewport')

  // Scroll to the middle and read the same element again.
  await page.evaluate(() => window.scrollTo({ top: Math.round((document.documentElement.scrollHeight - window.innerHeight) * 0.5), behavior: 'instant' }))
  await page.waitForTimeout(700)
  const mid = await page.evaluate((t) => {
    const f = new Function('el', `return (${t})(el)`)
    const el = document.querySelector('[role="progressbar"]')
    return { toc: f(document.querySelector('[data-toc="sidebar"]')), now: Number(el?.getAttribute('aria-valuenow')) }
  }, textOf.toString())
  const readout = mid.toc.split('\n').find((l) => /%/.test(l)) ?? ''
  check(/\d+%/.test(readout), 'the readout shows a percentage once the reader is into the piece', readout)
  check(/min left/i.test(readout), 'and the time REMAINING, not the total', readout)
  check(!/min read/i.test(readout), 'the total is replaced, not appended -- one figure, not two', readout)
  const pct = Number((readout.match(/(\d+)%/) || [])[1])
  check(Math.abs(pct - mid.now) <= 2, 'the readout and the progressbar agree on the same number',
    `readout ${pct}% vs aria-valuenow ${mid.now}`)
  check(pct >= 45 && pct <= 60, 'and the number is right for a scroll to the middle', `${pct}%`)
  await page.screenshot({ path: path.join(OUT, 'readout-mid-1440.jpg'), type: 'jpeg', quality: 80 })

  // ── the off switch ─────────────────────────────────────────────
  console.log('\n## 7.6 — every persistent element carries an off switch\n')
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await page.waitForTimeout(400)
  const opened = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) => /reading options/i.test(b.getAttribute('aria-label') || b.textContent || ''))
    if (!btn) return false
    btn.click()
    return true
  })
  check(opened, 'the reader menu opens')
  await page.waitForTimeout(500)
  const switches = await page.evaluate(() =>
    Array.from(document.querySelectorAll('[role="switch"], button[aria-checked]')).map((b) => (b.textContent || '').trim()))
  check(switches.some((s) => /progress bar/i.test(s)), 'it offers a progress-bar switch', switches.filter((s) => /progress|stopped/i.test(s)).join(' | '))
  check(switches.some((s) => /stopped/i.test(s)), 'and a resume switch')

  const toggled = await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('[role="switch"], button[aria-checked]')).find((x) => /progress bar/i.test(x.textContent || ''))
    if (!b) return false
    b.click()
    return true
  })
  await page.waitForTimeout(500)
  const gone = await page.evaluate(() => !document.querySelector('[role="progressbar"]'))
  check(toggled && gone, 'switching it off removes the bar from the document entirely')

  // And it survives a reload, which is what makes it a setting rather than a gesture.
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2500)
  const stillGone = await page.evaluate(() => !document.querySelector('[role="progressbar"]'))
  check(stillGone, 'and stays off across a reload')

  // Put it back, and prove the restore direction too -- a one-way switch is a trap.
  await page.evaluate(() => { try { localStorage.setItem('sp_progress_bar', 'true') } catch { /* ignore */ } })
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2500)
  check(await page.evaluate(() => !!document.querySelector('[role="progressbar"]')), 'and comes back when switched on again')

  // ── resume ─────────────────────────────────────────────────────
  console.log('\n## 7.6 — resume where you stopped\n')
  await page.evaluate(() => window.scrollTo({ top: Math.round((document.documentElement.scrollHeight - window.innerHeight) * 0.45), behavior: 'instant' }))
  await page.waitForTimeout(1200)
  const stored = await page.evaluate(() => {
    try { return localStorage.getItem(`sp_position_${location.pathname.split('/').pop()}`) } catch { return null }
  })
  check(stored !== null && Number(stored) > 0.3, 'the position is written as a fraction while scrolling', `stored ${stored}`)

  // NOT page.reload(). Chromium restores scroll position across a reload by itself, and the
  // first version of this harness measured y=6855 with the setting OFF and called it a
  // failure -- it was the BROWSER's restoration, not the site's. A returning reader arrives
  // by NAVIGATION, so navigate away and come back, which is both the honest simulation and
  // the only way to isolate the behaviour under test.
  const returnToArticle = async () => {
    await page.goto(`${BASE}/blog`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(600)
    await page.goto(URL, { waitUntil: 'domcontentloaded' })
  }

  await returnToArticle()
  await page.waitForTimeout(2600)
  const yOff = await page.evaluate(() => Math.round(window.scrollY))
  check(yOff < 50, 'with the setting OFF a returning reader lands at the top', `y=${yOff}`)
  // The visit above scrolled nowhere. It must not have cost the reader their place -- a
  // visit is not a reading session, and this assertion exists because the earlier version
  // of this sequence silently destroyed its own precondition and then reported the FEATURE
  // as broken.
  const survived = await page.evaluate(() => {
    try { return localStorage.getItem(`sp_position_${location.pathname.split('/').pop()}`) } catch { return null }
  })
  check(survived === stored, 'and a visit with no scrolling does not erase the saved place',
    `${survived} (was ${stored})`)

  await page.evaluate(() => { try { localStorage.setItem('sp_resume_scroll', 'true') } catch { /* ignore */ } })
  await returnToArticle()
  await page.waitForTimeout(3200)
  const yOn = await page.evaluate(() => ({ y: Math.round(window.scrollY), max: Math.round(document.documentElement.scrollHeight - window.innerHeight) }))
  const frac = yOn.max > 0 ? yOn.y / yOn.max : 0
  check(Math.abs(frac - Number(stored)) < 0.06, 'with it ON the reader is returned to the same fraction',
    `restored to ${Math.round(frac * 100)}% against a stored ${Math.round(Number(stored) * 100)}%`)

  // A fragment link must win over the restore, or every anchor on the site is broken for
  // anyone who turns this on.
  await page.goto(`${URL}#the-first-transmission`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(3200)
  const hashY = await page.evaluate(() => {
    const el = document.getElementById(location.hash.slice(1))
    const max = document.documentElement.scrollHeight - window.innerHeight
    return el ? {
      scroll: Math.round(window.scrollY),
      target: Math.round(el.getBoundingClientRect().top + window.scrollY),
      // Where the stored position WOULD have put them, so the two candidates can be
      // compared against each other rather than against an absolute tolerance. A fixed
      // pixel tolerance is wrong here anyway: the heading carries scroll-mt-28, so the
      // browser deliberately stops 112px short of it, and images settling after the jump
      // move the heading further down before this reads it.
      resumeWouldBe: Math.round(0.45 * max),
    } : null
  })
  const nearHeading = hashY ? Math.abs(hashY.scroll - hashY.target) : Infinity
  const nearResume = hashY ? Math.abs(hashY.scroll - hashY.resumeWouldBe) : 0
  check(hashY !== null && nearHeading < nearResume,
    'a fragment link still wins -- the restore does not fight an anchor',
    hashY ? `scrollY ${hashY.scroll} is ${nearHeading}px from the heading and ${nearResume}px from where a resume would have put it` : 'heading id not found')

  await ctx.close()

  // ── mobile: the same readout must exist at 390 ─────────────────
  console.log('\n## 7.5 — the same figure at 390, where the Contents column is a <details>\n')
  const mctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const mpage = await mctx.newPage()
  await mpage.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await mpage.waitForTimeout(2500)
  const mobile = await mpage.evaluate((t) => {
    const f = new Function('el', `return (${t})(el)`)
    const toc = document.querySelector('[data-toc="mobile"]')
    return { header: f(document.querySelector('header')), around: f(toc?.parentElement) }
  }, textOf.toString())
  check(!/min read/i.test(mobile.header), 'the header carries no reading time at 390 either')
  check(/min read/i.test(mobile.around), 'and the mobile Contents block carries it',
    mobile.around.split('\n').find((l) => /min read/i.test(l)))
  await mpage.screenshot({ path: path.join(OUT, 'readout-390.jpg'), type: 'jpeg', quality: 80 })
  await mctx.close()
} finally {
  await browser.close()
}

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
