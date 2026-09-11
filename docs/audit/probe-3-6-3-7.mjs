// docs/audit/probe-3-6-3-7.mjs
// 3.6 (sources at the bottom of the Contents column) and 3.7 (last updated), measured at
// both breakpoints. Draft mode, because the only post carrying sources AND a changelog is a
// draft fixture.
//
// Two things this probe got wrong first, both worth keeping:
//   - it read the SIDEBAR toc at 390px. The sidebar is `hidden lg:block`, so it is in the
//     DOM at every width; picking it measured a surface the reader never sees.
//   - it read the first <header>, which is the site navbar, not the article header.
import { chromium } from '@playwright/test'
import crypto from 'node:crypto'
import fs from 'node:fs'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]))
const { NEXT_PUBLIC_SANITY_PROJECT_ID: P, NEXT_PUBLIC_SANITY_DATASET: D, SANITY_API_WRITE_TOKEN: T } = env
const API = `https://${P}.api.sanity.io/v2025-02-27`
const ID = 'sanity-preview-url-secret.capture-harness'
const secret = crypto.randomBytes(24).toString('hex')
const mutate = (m) => fetch(`${API}/data/mutate/${D}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${T}` },
  body: JSON.stringify({ mutations: m }),
}).then((r) => r.json())

await mutate([{ createOrReplace: { _id: ID, _type: 'sanity.previewUrlSecret', secret, studioUrl: '/studio' } }])
const b = await chromium.launch()
try {
  for (const [name, w, h] of [['desktop', 1440, 1200], ['mobile', 390, 900]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } })
    const p = await ctx.newPage()
    const path = '/blog/fixture-kitchen-sink'
    await p.goto(`http://127.0.0.1:3000/api/draft-mode/enable?sanity-preview-secret=${secret}&sanity-preview-pathname=${encodeURIComponent(path)}`,
      { waitUntil: 'domcontentloaded', timeout: 60000 })
    await p.waitForLoadState('load').catch(() => {})
    await p.waitForTimeout(3000)

    const r = await p.evaluate(() => {
      const ZW = new RegExp('[' + String.fromCharCode(0x200b, 0x200c, 0x200d, 0xfeff) + ']', 'g')
      const clean = (s) => (s || '').replace(ZW, '').replace(/\s+/g, ' ').trim()
      // Pick the TOC that is actually VISIBLE at this width. The sidebar is `hidden lg:block`
      // so it is in the DOM at 390px too, and querying it first measures the wrong one.
      const vis = (el) => !!el && el.getClientRects().length > 0
      const sidebar = document.querySelector('[data-toc="sidebar"]')
      const mobile = document.querySelector('[data-toc="mobile"]')
      const toc = vis(sidebar) ? sidebar : (vis(mobile) ? mobile : (sidebar || mobile))
      const det = toc ? Array.from(toc.querySelectorAll('details')) : []
      // The sources block is the details whose summary is NOT the mobile TOC title.
      const srcDet = det.find((d) => /source/i.test(d.querySelector('summary')?.textContent || ''))
      const links = srcDet ? Array.from(srcDet.querySelectorAll('a')).map((a) => ({
        href: a.getAttribute('href'), text: clean(a.textContent).slice(0, 40),
      })) : []
      // The ARTICLE header, not the site navbar -- both are <header>, and the navbar is first.
      const header = Array.from(document.querySelectorAll('header')).find((h) => h.querySelector('h1'))
      return {
        tocFound: !!toc,
        tocKind: toc?.getAttribute('data-toc') ?? null,
        summary: srcDet ? clean(srcDet.querySelector('summary')?.textContent) : null,
        open: srcDet ? srcDet.hasAttribute('open') : null,
        links,
        // Do the anchors resolve to real elements?
        anchorsResolve: links.map((l) => !!document.querySelector(l.href)),
        headerMeta: header ? clean(header.innerText).slice(0, 260) : null,
        // 3.7: the changelog's newest entry is 2026-09-01.
        updatedShown: header ? /updated/i.test(header.innerText) : false,
        // and _updatedAt must NOT be what is displayed
        h1s: document.querySelectorAll('h1').length,
      }
    })
    console.log(`\n--- ${name} (${w}x${h}) ---`)
    console.log(JSON.stringify(r, null, 1))
    await ctx.close()
  }
} finally {
  await b.close()
  await mutate([{ delete: { id: ID } }])
}
