// docs/audit/verify-production.mjs
//
// ONE consolidated statement of whether the live site is healthy, so a reader of
// LAUNCH-CHECKLIST.md does not have to assemble it from a dozen per-phase claims.
//
// Every public route at 1440 / 768 / 390, in a real browser, plus the feeds and the Sanity
// webhook target, against production by default:
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
  '/blog/series', '/blog/digests', '/blog/featured', '/blog/osi-model',
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
const report = { base: BASE, when: new Date().toISOString(), routes: {}, nonHtml: {}, webhook: {} }

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

  // ── the Sanity webhook target ─────────────────────────────────────
  //
  // WHY THIS SECTION EXISTS. From 7 September to 14 September 2026 the webhook was pointed at
  // /api/revalidate and the route was at /api/draft-mode/enable/revalidate, so every publish
  // 404d for a week and nothing caught it. Nothing COULD: a dead webhook does not break a
  // page, it leaves the page as it was, and every check above passes happily on stale content.
  // The only thing that says a webhook works is asking the webhook's own URL.
  //
  // An unsigned POST is the whole test, because each status means exactly one thing:
  //   401  the route is there, the secret is set, the signature check is live   <- the only pass
  //   404  the route moved out from under the webhook again
  //   500  SANITY_REVALIDATE_SECRET is missing in Vercel
  //   200  the signature check is gone and anyone can trigger a revalidation
  //   3xx  the webhook URL redirects; it must be configured with the final URL
  // `redirect: 'manual'` is deliberate: following a redirect here would silently probe a
  // different URL than the webhook uses, which is the same class of mistake as the original.
  console.log(`
── the Sanity webhook target ${'─'.repeat(41)}`)
  const WEBHOOK = [
    ['/api/revalidate', 'canonical'],
    ['/api/draft-mode/enable/revalidate', 'alias, delete once the webhook is repointed'],
  ]
  for (const [route, note] of WEBHOOK) {
    const res = await fetch(`${BASE}${route}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
      redirect: 'manual',
    }).catch((e) => ({ status: 0, headers: new Headers(), error: String(e) }))
    const why =
      res.status === 401 ? '' :
      res.status === 404 ? 'ROUTE IS GONE — the Sanity webhook is 404ing right now' :
      res.status === 500 ? 'SANITY_REVALIDATE_SECRET is not set in Vercel' :
      res.status === 200 ? 'SIGNATURE CHECK IS GONE — unsigned callers can revalidate' :
      res.status >= 300 && res.status < 400 ? `redirects to ${res.headers.get('location')}` :
      `unexpected status`
    check(`webhook ${route} (${note})`, res.status === 401, `status=${res.status}${why ? ' — ' + why : ''}`)
    console.log(`  ${res.status === 401 ? 'ok  ' : 'BAD '} ${res.status} ${route}${why ? '  ' + why : ''}`)
    report.webhook[route] = { status: res.status, note, why: why || 'signature enforced' }
  }

  // Positive control. Without it a 401 proves nothing: if this harness could not tell a live
  // route from a dead one, both lines above would still read "ok".
  const control = await fetch(`${BASE}/api/revalidate-control-does-not-exist`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}', redirect: 'manual',
  })
  check('webhook probe can see a missing route (control)', control.status === 404, `status=${control.status}`)
  console.log(`  ${control.status === 404 ? 'ok  ' : 'BAD '} ${control.status} /api/revalidate-control-does-not-exist  (control: must be 404)`)
  report.webhook.control = { status: control.status }
} finally {
  await browser.close()
}

fs.writeFileSync(path.join('docs', 'audit', 'production-verify.json'), JSON.stringify(report, null, 2))
console.log(`\n${pass} passed, ${fail} failed  (${ROUTES.length} routes × ${BREAKPOINTS.length} breakpoints + ${NON_HTML.length} machine surfaces + 3 webhook probes)`)
if (failures.length) { console.log('\nFAILURES:'); failures.forEach((f) => console.log('  ' + f)) }
console.log('\nraw: docs/audit/production-verify.json')
process.exit(fail ? 1 : 0)
