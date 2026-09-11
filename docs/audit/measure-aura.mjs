// docs/audit/measure-aura.mjs
//
// Phase 3.4. Measures the status aura AND captures the three intensities for Stefan to
// pick from. Run with a server already on 127.0.0.1:3000 serving the build you mean.
//
//   node docs/audit/measure-aura.mjs
//
// The posts that carry a status are draft-only fixtures, so /blog must be loaded through
// the site's real draft-mode route -- same technique as docs/audit/capture-draft.mjs.
// NOT networkidle: draft mode holds a SanityLive connection open and never settles.
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
const OUT = path.join('docs', 'audit', 'screenshots', 'aura')
const BPS = [{ n: '1440', w: 1440, h: 1400 }, { n: '768', w: 768, h: 1400 }, { n: '390', w: 390, h: 1400 }]
const INTENSITIES = ['subtle', 'medium', 'pronounced']
const SECRET_ID = 'sanity-preview-url-secret.capture-harness'
const secret = crypto.randomBytes(24).toString('hex')

const mutate = async (mutations) => {
  const r = await fetch(`${API}/data/mutate/${D}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${T}` },
    body: JSON.stringify({ mutations }),
  })
  const j = await r.json()
  if (j.error) throw new Error(JSON.stringify(j.error))
  return j
}

let pass = 0
let fail = 0
const check = (ok, name, detail) => {
  if (ok) { pass++; console.log(`  PASS  ${name}${detail ? '  -- ' + detail : ''}`) }
  else { fail++; console.log(`  FAIL  ${name}${detail ? '  -- ' + detail : ''}`) }
}

fs.mkdirSync(OUT, { recursive: true })
await mutate([{ createOrReplace: { _id: SECRET_ID, _type: 'sanity.previewUrlSecret', secret, studioUrl: '/studio' } }])

const browser = await chromium.launch()
const enable = (pathname) => `${BASE}/api/draft-mode/enable`
  + `?sanity-preview-secret=${encodeURIComponent(secret)}`
  + `&sanity-preview-pathname=${encodeURIComponent(pathname)}`

// Read the aura state of every card on /blog. One row per card.
// Built as a string-free function so Playwright can serialize it; the zero-width class is
// assembled with fromCharCode because a literal one does not survive a file write.
const READ_CARDS = () => {
  const ZW = new RegExp('[' + String.fromCharCode(0x200b, 0x200c, 0x200d, 0xfeff) + ']', 'g')
  const clean = (s) => (s || '').replace(ZW, '').trim()
  const cards = Array.from(document.querySelectorAll('a[href^="/blog/"]')).filter((a) => a.querySelector('h3'))
  return cards.map((card) => {
    const tile = card.querySelector('[data-aura]') || card.querySelector('div[style]')
    const cs = tile ? getComputedStyle(tile) : null
    const before = tile ? getComputedStyle(tile, '::before') : null
    const marks = Array.from(card.querySelectorAll('span[title]'))
      .filter((s) => s.querySelector('svg'))
      .map((s) => ({ title: s.getAttribute('title'), color: getComputedStyle(s).color }))
    const tileBox = tile ? tile.getBoundingClientRect() : null
    // Every text-bearing leaf on the card, and whether it sits over the tile. The "must not
    // reduce the contrast of any text over it" requirement only bites where they overlap.
    const texts = Array.from(card.querySelectorAll('h3, p, span, div, time'))
      .filter((el) => el.children.length === 0 && el.textContent && el.textContent.trim())
      .map((el) => {
        const b = el.getBoundingClientRect()
        const over = !!(tileBox && b.width > 0 && b.height > 0
          && b.left < tileBox.right && b.right > tileBox.left
          && b.top < tileBox.bottom && b.bottom > tileBox.top)
        return {
          t: clean(el.textContent).slice(0, 26),
          over,
          color: getComputedStyle(el).color,
          bg: getComputedStyle(el).backgroundColor,
        }
      })
    const h3 = card.querySelector('h3')
    return {
      // Key on the SLUG, never the title. The first version of this probe matched
      // /kitchen/i against the title and the fixture is called "A deliberately long fixture
      // title", so every kitchen-sink assertion failed against a working implementation --
      // eleven false findings in one run.
      slug: (card.getAttribute('href') || '').replace('/blog/', ''),
      title: clean(h3 && h3.textContent).slice(0, 34),
      aura: tile ? tile.getAttribute('data-aura') : null,
      c1: cs ? cs.getPropertyValue('--aura-1').trim() : '',
      c2: cs ? cs.getPropertyValue('--aura-2').trim() : '',
      shadow: cs ? cs.boxShadow : '',
      borderColor: cs ? cs.borderColor : '',
      trans: cs ? cs.transitionDuration : '',
      anim: cs ? cs.animationName : '',
      beforeTrans: before ? before.transitionDuration : '',
      beforeAnim: before ? before.animationName : '',
      beforeContent: before ? before.content : '',
      marks,
      texts,
    }
  })
}

const openBlog = async (ctx) => {
  const page = await ctx.newPage()
  await page.goto(enable('/blog'), { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForLoadState('load').catch(() => {})
  await page.waitForTimeout(3200)
  if (new URL(page.url()).pathname !== '/blog') throw new Error('draft mode not entered: ' + page.url())
  return page
}

const toTriple = (rgbStr) => {
  const m = /rgba?\(([^)]+)\)/.exec(rgbStr || '')
  if (!m) return null
  return m[1].split(/[,\s/]+/).filter(Boolean).slice(0, 3).map((n) => parseFloat(n).toString()).join(' ')
}

try {
  // -- Measurement pass, at 1440 ----------------------------------------------
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1400 } })
  const page = await openBlog(ctx)
  const rows = await page.evaluate(READ_CARDS)

  console.log(`\ncards on /blog in draft mode: ${rows.length}`)
  for (const r of rows) {
    console.log(`  ${r.aura ? '[' + r.aura + ']' : '[  --  ]'} ${r.slug}  c1="${r.c1}" c2="${r.c2}" marks=${r.marks.length}`)
  }

  const ks = rows.find((r) => r.slug === 'fixture-kitchen-sink')
  const min = rows.find((r) => r.slug === 'fixture-minimal')
  if (!ks || !min) throw new Error('fixtures not on /blog: ' + rows.map((r) => r.slug).join(', '))
  const plain = rows.filter((r) => !r.c1)

  console.log('\nA. the aura appears only where a status exists')
  check(!!ks && !!ks.aura, 'kitchen-sink tile carries data-aura', ks && ks.aura)
  check(!!min && !!min.aura, 'minimal tile carries data-aura', min && min.aura)
  check(plain.length === rows.length - 2, 'every statusless post has NO aura',
    `${plain.length} of ${rows.length} cards, expected ${rows.length - 2}`)
  check(plain.every((r) => r.aura === null), 'no data-aura attribute at all on those',
    plain.map((r) => String(r.aura)).join(','))

  console.log('\nB. do not stack five glows -- the aura is capped at two colours')
  // The kitchen-sink post carries FIVE statuses once `revised` is derived from its
  // changelog -- the brief's own "do not stack five glows" case, exactly.
  const stops = ks ? new Set([ks.c1, ks.c2].filter(Boolean)).size : 0
  check(stops === 2, 'kitchen-sink (5 statuses once revised is derived) renders exactly 2 colour stops', String(stops))
  const minStops = min ? new Set([min.c1, min.c2].filter(Boolean)).size : 0
  check(minStops === 1, 'minimal (1 status) collapses to 1 colour', String(minStops))
  check(!!min && min.c1 === min.c2, 'and does it by repeating the stop, not by a special case',
    min && `${min.c1} / ${min.c2}`)

  console.log('\nC. the aura matches the marks the card actually shows')
  if (ks) {
    const markTriples = ks.marks.map((m) => toTriple(m.color))
    check(ks.marks.length === 2, 'kitchen-sink shows 2 marks', ks.marks.map((m) => m.title).join(' + '))
    check(markTriples[0] === ks.c1, 'aura stop 1 == mark 1 colour', `${markTriples[0]} vs ${ks.c1}`)
    check(markTriples[1] === ks.c2, 'aura stop 2 == mark 2 colour', `${markTriples[1]} vs ${ks.c2}`)
  }
  if (min) {
    const t = toTriple(min.marks[0] && min.marks[0].color)
    check(t === min.c1, 'minimal aura == its single mark colour', `${t} vs ${min.c1}`)
  }

  console.log('\nD. an edge glow, not a halo')
  check(!!ks && /inset/.test(ks.shadow), 'the glow is inset -- falloff inward from the border', '')
  check(!!ks && ks.beforeContent !== 'none', 'the ring pseudo-element is painted', ks && ks.beforeContent)
  const outer = ks ? ks.shadow.split(/,(?![^(]*\))/).map((s) => s.trim()).filter((s) => !/inset/.test(s)) : []
  const lengths = outer.map((s) => (s.match(/-?[\d.]+px/g) || []).map(parseFloat))
  const blurs = lengths.map((l) => l[2]).filter((n) => Number.isFinite(n))
  const spreads = lengths.map((l) => l[3]).filter((n) => Number.isFinite(n))
  check(blurs.every((b) => b <= 20), 'outer blur stays tight (<=20px) -- wider is a halo', `blurs ${JSON.stringify(blurs)}`)
  check(spreads.every((s) => s <= 0), 'outer spread is zero or negative -- it hugs the edge', `spreads ${JSON.stringify(spreads)}`)
  check(!!ks && !!plain[0] && ks.borderColor !== plain[0].borderColor,
    'the border itself is tinted, so the light comes FROM the edge',
    ks && `${ks.borderColor} vs statusless ${plain[0] && plain[0].borderColor}`)

  console.log('\nE. no text sits over the aura, so no text contrast can be reduced')
  const overlapping = ks ? ks.texts.filter((t) => t.over) : []
  console.log(`  text leaves on the kitchen-sink card: ${ks ? ks.texts.length : 0}, over the tile: ${overlapping.length}`)
  for (const t of overlapping) console.log(`    over tile: "${t.t}"  color=${t.color}  bg=${t.bg}`)
  // Remove the aura entirely and re-read. Any text whose colour or background moves was
  // affected by it.
  await page.evaluate(() => {
    document.querySelectorAll('[data-aura]').forEach((el) => {
      el.removeAttribute('data-aura')
      el.style.removeProperty('--aura-1')
      el.style.removeProperty('--aura-2')
    })
  })
  await page.waitForTimeout(600)
  const without = await page.evaluate(READ_CARDS)
  const ksOff = without.find((r) => r.slug === 'fixture-kitchen-sink')
  const diffs = []
  if (ks && ksOff) {
    for (let i = 0; i < ks.texts.length; i++) {
      const a = ks.texts[i]
      const b = ksOff.texts[i]
      if (!b) continue
      if (a.color !== b.color || a.bg !== b.bg) diffs.push(`${a.t}: ${a.color}/${a.bg} -> ${b.color}/${b.bg}`)
    }
  }
  check(diffs.length === 0, 'every text colour and background is identical with the aura on and off',
    diffs.length ? diffs.join(' | ') : `${ks ? ks.texts.length : 0} text leaves compared`)
  check(!!ksOff && !ksOff.c1, 'negative control: removing the attribute really did remove the aura',
    ksOff && `shadow now "${ksOff.shadow}"`)
  await ctx.close()

  // -- Reduced motion ---------------------------------------------------------
  console.log('\nF. prefers-reduced-motion: the aura is static')
  const rmCtx = await browser.newContext({ viewport: { width: 1440, height: 1400 }, reducedMotion: 'reduce' })
  const rmPage = await openBlog(rmCtx)
  const rmRows = await rmPage.evaluate(READ_CARDS)
  const rmKs = rmRows.find((r) => r.slug === 'fixture-kitchen-sink')
  // "Effectively instant", not "exactly zero". The site-wide reduced-motion reset in
  // styles/index.css uses `transition-duration: 0.01ms !important` -- the standard pattern,
  // which keeps transitionend firing. 0.01ms reads back as 1e-05s, and an === 0 check calls
  // that a failure against correct behaviour.
  const zero = (d) => !d || d.split(',').every((v) => parseFloat(v) <= 0.001)
  check(!!rmKs && zero(rmKs.trans), 'tile transition is effectively instant under reduce', rmKs && rmKs.trans)
  check(!!rmKs && zero(rmKs.beforeTrans), '::before transition is effectively instant under reduce', rmKs && rmKs.beforeTrans)
  check(!!rmKs && rmKs.anim === 'none', 'no animation on the tile in either mode', rmKs && rmKs.anim)
  check(!!rmKs && rmKs.beforeAnim === 'none', 'no animation on the ring in either mode', rmKs && rmKs.beforeAnim)
  // Positive control: without reduce the transition must be non-zero, or the two checks
  // above pass for the wrong reason.
  check(!!ks && !zero(ks.trans), 'positive control: the transition IS non-zero without reduce', ks && ks.trans)
  await rmCtx.close()

  // -- Capture: 3 intensities x 3 breakpoints ---------------------------------
  console.log('\nG. frames')
  for (const bp of BPS) {
    for (const intensity of INTENSITIES) {
      const c = await browser.newContext({ viewport: { width: bp.w, height: bp.h } })
      const p = await openBlog(c)
      const n = await p.evaluate((v) => {
        const els = document.querySelectorAll('[data-aura]')
        els.forEach((el) => el.setAttribute('data-aura', v))
        return els.length
      }, intensity)
      await p.waitForTimeout(900)
      const file = path.join(OUT, `aura-${intensity}-${bp.n}.jpg`)
      await p.screenshot({ path: file, type: 'jpeg', quality: 82, fullPage: true })
      // And a tight crop of just the two cards that carry an aura. The full page frame is
      // the honest context, but at card size the difference between subtle and pronounced
      // is a few pixels of edge -- undecidable from a 1400px-tall screenshot, which is the
      // only thing this deliverable actually has to support.
      const box = await p.evaluate(() => {
        const cards = ['fixture-kitchen-sink', 'fixture-minimal']
          .map((sl) => document.querySelector(`a[href="/blog/${sl}"]`))
          .filter(Boolean)
        if (!cards.length) return null
        const rs = cards.map((c) => c.getBoundingClientRect())
        const pad = 24
        const left = Math.max(0, Math.min(...rs.map((r) => r.left)) - pad)
        const top = Math.max(0, Math.min(...rs.map((r) => r.top)) + window.scrollY - pad)
        const right = Math.min(document.documentElement.scrollWidth, Math.max(...rs.map((r) => r.right)) + pad)
        // Just the tile plus the mark row beneath it -- the rest of the card is unchanged.
        const bottom = Math.min(...rs.map((r) => r.top)) + window.scrollY + 420
        return { x: left, y: top, width: right - left, height: bottom - top }
      })
      if (box && box.width > 0 && box.height > 0) {
        const crop = path.join(OUT, `aura-${intensity}-${bp.n}-crop.jpg`)
        await p.screenshot({ path: crop, type: 'jpeg', quality: 92, clip: box, fullPage: true })
        console.log(`  ${intensity} @${bp.n}: ${n} tiles -> ${file}  + crop`)
      } else {
        console.log(`  ${intensity} @${bp.n}: ${n} tiles -> ${file}  (no crop: cards not located)`)
      }
      await c.close()
    }
  }
} finally {
  await browser.close()
  await mutate([{ delete: { id: SECRET_ID } }])
}

console.log(`\n${pass} passed / ${fail} failed`)
process.exit(fail ? 1 : 0)
