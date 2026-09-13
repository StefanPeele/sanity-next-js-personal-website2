// docs/audit/verify-production.mjs
//
// ONE consolidated statement of whether the live site is healthy, so a reader of
// LAUNCH-CHECKLIST.md does not have to assemble it from a dozen per-phase claims.
//
// Every public route at 1440 / 768 / 390, in a real browser, against production by default:
//
//   node docs/audit/verify-production.mjs                 # https://stefanpeele.com
//   BASE=http://127.0.0.1:3000 node docs/audit/verify-production.mjs
//
// What it deliberately does NOT cover, because it cannot from here:
//   - the draft fixtures (they are drafts; they need draft mode and a local build)
//   - anything needing a credential Stefan holds
// Both are named in LAUNCH-CHECKLIST.md instead of being silently skipped.
//
import { chromium } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const BASE = process.env.BASE || 'https://stefanpeele.com'
const BREAKPOINTS = [1440, 768, 390]

const ROUTES = [
  '/', '/blog', '/garden', '/library', '/glossary', '/graph', '/projects', '/resume',
  '/photography', '/photography/albums', '/services', '/contact', '/now', '/uses',
  '/blog/series', '/blog/osi-model',
  '/blog/the-field-the-moment-and-what-it-means-for-us-networking-industry',
  '/blog/the-creation-of-my-personal-portfolio-site',
  '/blog/building-my-physical-home-lab-week-2-documentation-and-extensive-researching',
  '/projects/my-digital-archive-a-high-performance-headless-portfolio',
  '/photography/headshots',
]

const NON_HTML = ['/blog/feed.xml', '/blog/feed.json', '/sitemap.xml', '/robots.txt', '/api/health', '/manifest.webmanifest']

/** CORS on Sanity's live-events stream is a 127.0.0.1-only artifact; allowed in production. */
const IGNORE = /_vercel\/|va\.vercel-scripts|upgrade-insecure-requests|\/data\/live\/events\//

let pass = 0, fail = 0
const failures = []
const check = (label, cond, detail = '') => {
  if (cond) pass++
  else { fail++; failures.push(`${label}${detail ? ' — ' + detail : ''}`) }
}

const browser = await chromium.launch()
const report = { base: BASE, when: new Date().toISOString(), routes: {}, nonHtml: {} }

try {
  for (const width of BREAKPOINTS) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' })
    const page = await ctx.newPage()
    const errors = []
    page.on('pageerror', (e) => { if (!IGNORE.test(e.message)) errors.push(`[pageerror] ${e.message}`) })
    page.on('requestfailed', (r) => {
      const why = r.failure()?.errorText ?? ''
      if (!IGNORE.test(r.url()) && !/ERR_ABORTED/.test(why)) errors.push(`[request] ${r.url()} - ${why}`)
    })
    page.on('console', (m) => {
      const t = m.text()
      if (m.type() === 'error' && /Content Security Policy|Refused to/i.test(t) && !IGNORE.test(t)) errors.push(`[csp] ${t}`)
    })

    console.log(`\n── ${width}px ${'─'.repeat(52)}`)
    for (const route of ROUTES) {
      errors.length = 0
      let status = 0
      const res = await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => null)
      status = res?.status() ?? 0
      await page.waitForTimeout(700)

      const m = await page.evaluate(() => ({
        h1: document.querySelectorAll('h1').length,
        content: !!document.querySelector('#content'),
        main: document.querySelectorAll('main').length,
        title: document.title,
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
        // An "empty state" is legitimate; a page with no readable text at all is not.
        textLen: (document.body.innerText || '').trim().length,
      }))

      const overflow = m.scroll > m.client + 1
      const ok = status === 200 && m.h1 === 1 && m.content && m.main === 1 && !overflow && m.textLen > 200 && errors.length === 0
      check(`${width} ${route}`, ok,
        `status=${status} h1=${m.h1} #content=${m.content} main=${m.main} overflow=${overflow ? m.scroll + '>' + m.client : 'no'} text=${m.textLen} errors=${errors.length}${errors.length ? ' :: ' + errors[0].slice(0, 110) : ''}`)
      console.log(`  ${ok ? 'ok  ' : 'BAD '} ${String(status)} h1=${m.h1} ${overflow ? 'OVERFLOW ' : ''}${errors.length ? 'ERR ' : ''}${route}`)
      if (width === 1440) report.routes[route] = { status, ...m, errors: [...errors] }
    }
    await ctx.close()
  }

  // ── non-HTML surfaces, once ────────────────────────────────────────────
  console.log(`\n── feeds and machine surfaces ${'─'.repeat(38)}`)
  for (const route of NON_HTML) {
    const res = await fetch(`${BASE}${route}`)
    const body = await res.text()
    let valid = res.status === 200 && body.length > 50
    if (route.endsWith('.json') || route.endsWith('.webmanifest')) { try { JSON.parse(body) } catch { valid = false } }
    if (route.endsWith('.xml')) valid = valid && body.trimStart().startsWith('<?xml')
    check(`feed ${route}`, valid, `status=${res.status} bytes=${body.length}`)
    console.log(`  ${valid ? 'ok  ' : 'BAD '} ${res.status} ${String(Math.round(body.length / 1024)).padStart(4)}KB  ${route}`)
    report.nonHtml[route] = { status: res.status, bytes: body.length }
  }
} finally {
  await browser.close()
}

fs.writeFileSync(path.join('docs', 'audit', 'production-verify.json'), JSON.stringify(report, null, 2))
console.log(`\n${pass} passed, ${fail} failed  (${ROUTES.length} routes × ${BREAKPOINTS.length} breakpoints + ${NON_HTML.length} machine surfaces)`)
if (failures.length) { console.log('\nFAILURES:'); failures.forEach((f) => console.log('  ' + f)) }
console.log('\nraw: docs/audit/production-verify.json')
process.exit(fail ? 1 : 0)
