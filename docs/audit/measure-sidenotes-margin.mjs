// docs/audit/measure-sidenotes-margin.mjs
//
// NOT measure-sidenotes.mjs, which is a Phase 1.5 research harness that measures the prose
// measure and marginal column of OTHER sites. I overwrote it writing this one and restored
// it from git; the -margin suffix is so that cannot happen twice.
//
// Phase 6.3 / 6.4 / 6.5 — sidenotes in the margin.
//
// 6.3 asks three questions that the old tooltip had no answer to, and every one of them is
// an assertion here rather than a paragraph:
//
//   what happens when the anchor scrolls out of view      -> the note goes with it
//   what happens when two notes would overlap             -> the later one is pushed down
//   what happens when a note is longer than the space      -> it clamps and offers "more"
//
// 6.4 asks for BOTH mobile options to be rendered. Option A is what ships; option B
// (footnote style, notes collected at the foot) is synthesised in the page at capture time,
// the same way the three aura intensities were, so the comparison is a real screenshot
// without shipping code for the option being argued against.
import { chromium } from '@playwright/test'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]))
const { NEXT_PUBLIC_SANITY_PROJECT_ID: P, NEXT_PUBLIC_SANITY_DATASET: D, SANITY_API_WRITE_TOKEN: T } = env
const API = `https://${P}.api.sanity.io/v2025-02-27`
const BASE = 'http://127.0.0.1:3000'
const OUT = path.join('docs', 'audit', 'screenshots', 'sidenotes')
const ID = 'sanity-preview-url-secret.capture-harness'
const secret = crypto.randomBytes(24).toString('hex')
const mutate = (m) => fetch(`${API}/data/mutate/${D}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${T}` },
  body: JSON.stringify({ mutations: m }),
}).then((r) => r.json())

let pass = 0
let fail = 0
const check = (ok, name, detail) => {
  if (ok) { pass++; console.log(`  PASS  ${name}${detail ? '  -- ' + detail : ''}`) }
  else { fail++; console.log(`  FAIL  ${name}${detail ? '  -- ' + detail : ''}`) }
}

const READ = () => {
  const prose = document.querySelector('[data-article]')
  const notes = Array.from(document.querySelectorAll('.margin-note')).map((n) => {
    const r = n.getBoundingClientRect()
    const t = n.querySelector('.margin-note-text')
    return {
      top: Math.round(r.top + window.scrollY),
      left: Math.round(r.left),
      bottom: Math.round(r.bottom + window.scrollY),
      height: Math.round(r.height),
      kind: n.getAttribute('data-sidenote-kind'),
      clamped: t ? t.scrollHeight > t.clientHeight + 1 : false,
      hasMore: !!n.querySelector('.margin-note-more'),
    }
  })
  const anchors = Array.from(document.querySelectorAll('[data-sidenote-id]')).map((a) => ({
    top: Math.round(a.getBoundingClientRect().top + window.scrollY),
  }))
  return {
    notes,
    anchors,
    proseRight: prose ? Math.round(prose.getBoundingClientRect().right) : null,
    marginVisible: (() => {
      const h = document.querySelector('.margin-notes')
      return h ? getComputedStyle(h).display !== 'none' : false
    })(),
    inlineCount: document.querySelectorAll('.sidenote-inline').length,
  }
}

fs.mkdirSync(OUT, { recursive: true })
await mutate([{ createOrReplace: { _id: ID, _type: 'sanity.previewUrlSecret', secret, studioUrl: '/studio' } }])
const browser = await chromium.launch()
const openFixture = async (ctx) => {
  const p = await ctx.newPage()
  const path_ = '/blog/fixture-kitchen-sink'
  await p.goto(`${BASE}/api/draft-mode/enable?sanity-preview-secret=${secret}&sanity-preview-pathname=${encodeURIComponent(path_)}`,
    { waitUntil: 'domcontentloaded', timeout: 60000 })
  await p.waitForLoadState('load').catch(() => {})
  await p.waitForTimeout(3500)
  return p
}

try {
  console.log(String.fromCharCode(10) + 'A. the notes are in the MARGIN, not over the prose')
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1100 } })
  const page = await openFixture(ctx)
  const r = await page.evaluate(READ)
  console.log(`  ${r.notes.length} margin notes, ${r.anchors.length} anchors, prose ends at x=${r.proseRight}`)
  check(r.marginVisible, 'the margin column renders at 1440', '')
  check(r.notes.length > 0, 'at least one note is placed', `${r.notes.length}`)
  check(r.notes.length === r.anchors.length, 'one note per anchor', `${r.notes.length} vs ${r.anchors.length}`)
  check(r.notes.every((n) => n.left > (r.proseRight ?? 1e9)),
    '6.3: every note sits entirely right of the prose, never over it',
    `lefts ${r.notes.map((n) => n.left).join(',')} vs prose right ${r.proseRight}`)

  console.log(String.fromCharCode(10) + 'B. 6.3: two notes never overlap')
  const overlaps = []
  for (let i = 1; i < r.notes.length; i++) {
    if (r.notes[i].top < r.notes[i - 1].bottom) overlaps.push(`${i - 1}/${i}`)
  }
  check(overlaps.length === 0, 'no note starts before the previous one ends', overlaps.join(', ') || 'none')
  // And the push-down is real: a note is never ABOVE its own anchor.
  const above = r.notes.filter((n, i) => r.anchors[i] && n.top < r.anchors[i].top - 4)
  check(above.length === 0, 'and no note is placed above its own anchor', `${above.length}`)

  console.log(String.fromCharCode(10) + 'C. 6.3: the note travels with its anchor')
  const before = r.notes[0]
  await page.evaluate(() => window.scrollTo(0, 900))
  await page.waitForTimeout(400)
  const scrolled = await page.evaluate(() => {
    const n = document.querySelector('.margin-note')
    const r2 = n.getBoundingClientRect()
    return { viewportTop: Math.round(r2.top), pageTop: Math.round(r2.top + window.scrollY), scrollY: window.scrollY }
  })
  check(scrolled.scrollY > 500, 'positive control: the page scrolled', `${scrolled.scrollY}`)
  check(Math.abs(scrolled.pageTop - before.top) <= 2,
    'its DOCUMENT position is unchanged — it scrolled away with the passage, it did not stick',
    `${before.top} -> ${scrolled.pageTop}`)
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(300)

  console.log(String.fromCharCode(10) + 'C2. 6.3: the TOC is sticky, and yields when a note lands on it')
  // Both of these were found by measuring rather than by reading the code. Wrapping the
  // <aside> for the margin column silently removed the sticky element's travel -- `position:
  // sticky` is bounded by its PARENT's box -- and the TOC scrolled away, measured going from
  // top 924 to top -1476. It looked completely normal in a screenshot.
  const stick = []
  for (const y of [0, 700, 1400, 2100]) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y)
    await page.waitForTimeout(350)
    stick.push(await page.evaluate(() => {
      const toc = document.querySelector('[data-toc="sidebar"] .sticky')
      const r = toc ? toc.getBoundingClientRect() : null
      return {
        y: window.scrollY,
        top: r ? Math.round(r.top) : null,
        yielding: toc ? toc.classList.contains('toc-yielding') : null,
        opacity: toc ? parseFloat(getComputedStyle(toc).opacity) : null,
      }
    }))
  }
  console.log(`  ${stick.map((s2) => `y${s2.y}:top${s2.top}${s2.yielding ? ' YIELD' : ''}`).join('  ')}`)
  // Sticky means the viewport top stops descending once it reaches the offset. Without
  // travel it marches negative exactly in step with the scroll.
  const tops = stick.map((s2) => s2.top)
  check(Math.min(...tops) > -50, 'the TOC STICKS — its viewport top never runs away negative', tops.join(', '))
  check(stick.some((s2) => s2.yielding), 'it yields where a note lands on it',
    stick.map((s2) => (s2.yielding ? 'yes' : 'no')).join(','))
  // And the other half, which is the one that actually failed: a permanent yield is not a
  // yield, it is a deletion. There must be at least one position where the TOC is present.
  check(stick.some((s2) => !s2.yielding), 'and does NOT yield everywhere — a permanent yield is a deleted TOC',
    stick.map((s2) => (s2.yielding ? 'yes' : 'no')).join(','))
  const yielded = stick.find((s2) => s2.yielding)
  check(!yielded || yielded.opacity < 0.5, 'yielding actually dims it', yielded ? String(yielded.opacity) : 'n/a')
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(400)

  console.log(String.fromCharCode(10) + 'D. 6.5: the window')
  await page.evaluate(() => document.querySelectorAll('[data-sonner-toaster], [data-sonner-toast]').forEach((el) => el.remove()))
  await page.locator('.margin-note-more').first().click()
  await page.waitForTimeout(400)
  const dlg = await page.evaluate(() => {
    const d = document.querySelector('[role="dialog"].margin-note-dialog')
    return d ? { modal: d.getAttribute('aria-modal'), focusInside: d.contains(document.activeElement), parentIsBody: d.parentElement?.parentElement === document.body } : null
  })
  check(!!dlg, 'clicking "more" opens a dialog', dlg ? 'yes' : 'none')
  check(dlg?.modal === 'true', 'it is aria-modal', String(dlg?.modal))
  check(dlg?.focusInside === true, 'focus moves into it', String(dlg?.focusInside))
  // Focus trap: tab past the last control and land back on the first.
  const trapped = await page.evaluate(async () => {
    const d = document.querySelector('.margin-note-dialog')
    const btns = d.querySelectorAll('button')
    btns[btns.length - 1].focus()
    return d.contains(document.activeElement)
  })
  await page.keyboard.press('Tab')
  await page.waitForTimeout(150)
  const stillInside = await page.evaluate(() =>
    document.querySelector('.margin-note-dialog')?.contains(document.activeElement))
  check(trapped && stillInside === true, 'Tab from the last control stays inside — focus is trapped', String(stillInside))
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)
  const closed = await page.evaluate(() => ({
    gone: document.querySelectorAll('.margin-note-dialog').length === 0,
    focusOnMore: document.activeElement?.classList.contains('margin-note-more'),
  }))
  check(closed.gone, 'Escape closes it', '')
  check(closed.focusOnMore === true, 'and focus returns to the control that opened it', String(closed.focusOnMore))

  await page.screenshot({ path: path.join(OUT, 'margin-1440.jpg'), type: 'jpeg', quality: 82, fullPage: false })
  await ctx.close()

  // ── 6.4, both options at 390 ───────────────────────────────────────────────
  console.log(String.fromCharCode(10) + 'E. 6.4 at 390 — option A ships, option B rendered for comparison')
  const nctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const np = await openFixture(nctx)
  await np.evaluate(() => document.querySelectorAll('[data-sonner-toaster], [data-sonner-toast]').forEach((el) => el.remove()))
  const narrow = await np.evaluate(READ)
  check(!narrow.marginVisible, 'the margin column is hidden at 390 — there is no margin to use', '')
  await np.locator('.sidenote-mark').first().click()
  await np.waitForTimeout(400)
  const expanded = await np.evaluate(() => {
    const inline = document.querySelector('.sidenote-inline')
    if (!inline) return null
    const r2 = inline.getBoundingClientRect()
    return { visible: getComputedStyle(inline).display !== 'none', width: Math.round(r2.width), left: Math.round(r2.left), docW: document.documentElement.scrollWidth, vw: window.innerWidth }
  })
  check(expanded?.visible === true, 'option A: tapping the mark expands the note inline at the anchor', '')
  check(!!expanded && expanded.docW <= expanded.vw, 'and adds no horizontal overflow', `${expanded?.docW} vs ${expanded?.vw}`)
  await np.locator('.sidenote-mark').first().scrollIntoViewIfNeeded()
  await np.waitForTimeout(300)
  await np.screenshot({ path: path.join(OUT, 'mobile-A-inline-390.jpg'), type: 'jpeg', quality: 88 })
  console.log('  captured mobile-A-inline-390.jpg')

  // Option B, synthesised: numbered markers in place of ※, notes collected at the foot.
  const built = await np.evaluate(() => {
    document.querySelectorAll('.sidenote-inline').forEach((el) => el.remove())
    const anchors = Array.from(document.querySelectorAll('[data-sidenote-id]'))
    if (!anchors.length) return 0
    anchors.forEach((a, i) => {
      const sup = a.querySelector('sup')
      if (sup) sup.textContent = `[${i + 1}]`
    })
    const article = document.querySelector('[data-article]')
    const sec = document.createElement('section')
    sec.style.cssText = 'margin-top:3rem;padding-top:1.5rem;border-top:1px solid rgba(255,255,255,0.12)'
    sec.innerHTML = '<h2 style="font-family:var(--font-mono);font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#a8a29e;margin-bottom:1rem">Notes</h2>'
    const ol = document.createElement('ol')
    ol.style.cssText = 'list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:.85rem'
    anchors.forEach((a, i) => {
      const li = document.createElement('li')
      li.style.cssText = 'display:flex;gap:.6rem;font-family:var(--font-sans);font-size:13px;line-height:1.5;color:#a8a29e'
      li.innerHTML = `<span style="font-family:var(--font-mono);font-size:12px;color:#78716c;flex:none">[${i + 1}]</span><span>${a.getAttribute('data-sidenote-text')}</span>`
      ol.appendChild(li)
    })
    sec.appendChild(ol)
    article.appendChild(sec)
    return anchors.length
  })
  check(built > 0, 'option B synthesised for comparison', `${built} note(s) collected at the foot`)
  await np.evaluate(() => document.querySelector('[data-article] section:last-child')?.scrollIntoView())
  await np.waitForTimeout(400)
  await np.screenshot({ path: path.join(OUT, 'mobile-B-footnotes-390.jpg'), type: 'jpeg', quality: 88 })
  console.log('  captured mobile-B-footnotes-390.jpg')
  await nctx.close()
} finally {
  await browser.close()
  await mutate([{ delete: { id: ID } }])
}

console.log(String.fromCharCode(10) + `${pass} passed / ${fail} failed`)
process.exit(fail ? 1 : 0)
