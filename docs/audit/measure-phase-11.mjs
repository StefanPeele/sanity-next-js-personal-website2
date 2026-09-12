// docs/audit/measure-phase-11.mjs
//
// §11 lists eight things to "evaluate and recommend on". Three of them are not opinions —
// they are claims about output that either is or is not good, and they can be measured:
//
//   11.3  the print stylesheet   — "verify the printed output is actually GOOD"
//   11.4  RSS quality            — full content or excerpt, status, sidenotes
//   11.8  Open Graph images      — "verify each post generates a good card"
//
// Measuring them first means the recommendations on the other five are written by someone
// who has looked, rather than someone reasoning from the schema.
//
//   node docs/audit/measure-phase-11.mjs
//
import { chromium } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const BASE = process.env.BASE || 'http://127.0.0.1:3000'
const OUT = path.join('docs', 'audit', 'screenshots', 'phase-11')
const SLUG = process.env.SLUG || 'the-field-the-moment-and-what-it-means-for-us-networking-industry'

fs.mkdirSync(OUT, { recursive: true })
const browser = await chromium.launch()
const report = {}

try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  const page = await ctx.newPage()

  // ── 11.3 print ──────────────────────────────────────────────────
  console.log('\n## 11.3 — the print stylesheet\n')
  await page.goto(`${BASE}/blog/${SLUG}`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(2500)
  await page.evaluate(() => document.querySelectorAll('[data-sonner-toaster], [data-sonner-toast]').forEach((el) => el.remove()))
  await page.emulateMedia({ media: 'print' })
  await page.waitForTimeout(600)

  const print = await page.evaluate(() => {
    // Measure the RECT, not the element's own computed display. A child of a
    // `display: none` parent still reports its own `display: block` -- so checking the
    // element reported the comment section as VISIBLE in print when its wrapper was hidden
    // and nothing rendered. A hidden subtree has zero-size boxes; that is the honest test.
    const vis = (sel) => {
      const el = document.querySelector(sel)
      if (!el) return 'absent'
      const r = el.getBoundingClientRect()
      return r.width < 1 && r.height < 1 ? 'hidden' : 'VISIBLE'
    }
    const prose = document.querySelector('[data-article]')
    const firstP = prose?.querySelector(':scope > p')
    return {
      navbar: vis('nav'),
      footer: vis('footer'),
      toolbar: vis('.reading-toolbar'),
      toc: vis('[data-toc="sidebar"]'),
      marginNotes: vis('.margin-notes'),
      comments: vis('#comments'),
      newsletter: document.querySelector('#comments')?.parentElement?.nextElementSibling ? 'present in flow' : 'n/a',
      proseWidth: firstP ? Math.round(firstP.getBoundingClientRect().width) : null,
      proseColour: firstP ? getComputedStyle(firstP).color : null,
      bodyBg: getComputedStyle(document.body).backgroundColor,
      // Do the sidenotes survive as anything a printed page can use?
      inlineSidenotes: document.querySelectorAll('.sidenote-inline').length,
      sidenoteAnchors: document.querySelectorAll('[data-sidenote-key]').length,
      sourcesHeading: !!Array.from(document.querySelectorAll('h2,h3')).find((h) => /sources/i.test(h.innerText || '')),
      // A link whose href is printed beside it is the only way a printed link is useful.
      linkHrefRule: Array.from(document.styleSheets).some((ss) => { try { return Array.from(ss.cssRules).some((r) => (r.cssText || '').includes("attr(href)")) } catch { return false } }),
    }
  })
  for (const [k, v] of Object.entries(print)) console.log(`  ${k.padEnd(18)} ${v}`)
  report.print = print
  await page.screenshot({ path: path.join(OUT, 'print-top.jpg'), type: 'jpeg', quality: 82 })
  await page.emulateMedia({ media: 'screen' })

  // ── 11.8 Open Graph ─────────────────────────────────────────────
  console.log('\n## 11.8 — Open Graph cards\n')
  const ogRes = await page.request.get(`${BASE}/blog/${SLUG}/opengraph-image`)
  const buf = await ogRes.body()
  fs.writeFileSync(path.join(OUT, 'og-image.png'), buf)
  const meta = await page.evaluate(() => ({
    ogImage: document.querySelector('meta[property="og:image"]')?.getAttribute('content') ?? null,
    ogTitle: document.querySelector('meta[property="og:title"]')?.getAttribute('content') ?? null,
    twitterCard: document.querySelector('meta[name="twitter:card"]')?.getAttribute('content') ?? null,
  }))
  console.log(`  route status      ${ogRes.status()} (${ogRes.headers()['content-type']}), ${Math.round(buf.length / 1024)}KB`)
  for (const [k, v] of Object.entries(meta)) console.log(`  ${k.padEnd(18)} ${v === null ? 'ABSENT' : String(v).slice(0, 80)}`)
  report.og = { status: ogRes.status(), bytes: buf.length, ...meta }
} finally {
  await browser.close()
}

// ── 11.4 RSS ──────────────────────────────────────────────────────
console.log('\n## 11.4 — RSS and JSON Feed\n')
const xml = await fetch(`${BASE}/blog/feed.xml`).then((r) => r.text())
const json = await fetch(`${BASE}/blog/feed.json`).then((r) => r.json())
const firstItem = json.items?.[0]
const xmlItem = xml.slice(xml.indexOf('<item>'), xml.indexOf('</item>'))
const rss = {
  xmlBytes: xml.length,
  items: (xml.match(/<item>/g) || []).length,
  hasContentEncoded: xml.includes('content:encoded'),
  xmlItemBytes: xmlItem.length,
  jsonItems: json.items?.length ?? 0,
  jsonHasContentHtml: !!firstItem?.content_html,
  jsonContentBytes: firstItem?.content_html?.length ?? 0,
  jsonSummaryBytes: firstItem?.summary?.length ?? 0,
  // Does a feed reader see the epistemic status the site works so hard to show?
  mentionsStatus: /peer reviewed|fact checked|seeking review|open to comment|corrected|clarified|updated/i.test(xml),
  // Sidenotes: do they survive into the feed at all, or vanish?
  hasSidenoteText: firstItem?.content_html ? /sidenote|※/i.test(firstItem.content_html) : false,
}
for (const [k, v] of Object.entries(rss)) console.log(`  ${k.padEnd(20)} ${v}`)
report.rss = rss

fs.writeFileSync(path.join('docs', 'audit', 'phase-11.json'), JSON.stringify(report, null, 2))
console.log(`\nFrames and the OG png in ${OUT}; raw in docs/audit/phase-11.json`)
