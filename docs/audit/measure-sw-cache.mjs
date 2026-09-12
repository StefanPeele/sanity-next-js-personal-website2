// docs/audit/measure-sw-cache.mjs
//
// The service worker's STATIC_CACHE is cache-first and had no ceiling. Chunk URLs are
// content-hashed, so every deploy writes a new set and never removes the old one: measured
// against production, one article pulls 26 assets totalling 1.7 MB, which is ~34 MB after
// twenty deploys. When an origin hits the browser's storage limit the browser evicts the
// WHOLE origin -- including the offline articles this cache exists to protect.
//
// This drives the REAL service worker in a real browser. A unit test of a copy of the trim
// function would prove nothing about the file that ships.
//
//   node docs/audit/measure-sw-cache.mjs
//
import { chromium } from '@playwright/test'

const BASE = process.env.BASE || 'http://127.0.0.1:3000'
const SLUG = process.env.SLUG || 'the-field-the-moment-and-what-it-means-for-us-networking-industry'
const CAP = 150

let pass = 0, fail = 0
const check = (label, cond, detail = '') => {
  if (cond) { pass++; console.log(`  PASS  ${label}${detail ? ' — ' + detail : ''}`) }
  else { fail++; console.log(`  FAIL  ${label}${detail ? ' — ' + detail : ''}`) }
}

const browser = await chromium.launch()
try {
  // A persistent-ish context: service workers need a secure context, and 127.0.0.1 counts.
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await ctx.newPage()
  await page.goto(`${BASE}/blog/${SLUG}`, { waitUntil: 'load', timeout: 60000 })

  const controlled = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return 'no SW support'
    const reg = await navigator.serviceWorker.ready.catch(() => null)
    if (!reg) return 'no registration'
    // The first load registers but does not control the page; claim() runs on activate.
    for (let i = 0; i < 40 && !navigator.serviceWorker.controller; i++) await new Promise((r) => setTimeout(r, 250))
    return navigator.serviceWorker.controller ? 'controlled' : 'registered but not controlling'
  })
  console.log(`\n  service worker: ${controlled}`)
  check('the service worker controls the page', controlled === 'controlled', controlled)
  if (controlled !== 'controlled') throw new Error('cannot test the cache without an active worker')

  // The real article load should have populated the static cache through the worker.
  const seeded = await page.evaluate(async () => (await (await caches.open('sp-static-v4')).keys()).length)
  console.log(`  static cache after one article: ${seeded} entries`)
  check('a real article populates the static cache', seeded > 0, `${seeded} entries`)

  // Push it well past the cap with synthetic entries, exactly as many deploys would.
  const stuffed = await page.evaluate(async (cap) => {
    const cache = await caches.open('sp-static-v4')
    for (let i = 0; i < cap + 60; i++) {
      await cache.put(new Request(`/_next/static/chunks/synthetic-${i}.js`), new Response('x'))
    }
    return (await cache.keys()).length
  }, CAP)
  console.log(`  after simulating deploys:        ${stuffed} entries`)
  check('the cache can exceed the cap before a trim runs', stuffed > CAP, `${stuffed} > ${CAP}`)

  // Now make ONE real request through the worker for a static asset it has not seen. That is
  // the path that calls trimStatic.
  const after = await page.evaluate(async () => {
    const cache = await caches.open('sp-static-v4')
    const keys = await cache.keys()
    const real = keys.map((k) => new URL(k.url).pathname).find((p) => p.endsWith('.js') && !p.includes('synthetic'))
    const url = (real ?? '/_next/static/chunks/synthetic-0.js') + '?trimprobe=' + Date.now()
    await fetch(url)
    for (let i = 0; i < 40; i++) {
      const n = (await (await caches.open('sp-static-v4')).keys()).length
      if (n <= 150) return { count: n, url }
      await new Promise((r) => setTimeout(r, 250))
    }
    return { count: (await (await caches.open('sp-static-v4')).keys()).length, url }
  })
  console.log(`  after one further static fetch:  ${after.count} entries`)
  check(`the trim holds the cache at or under ${CAP}`, after.count <= CAP, `${after.count} entries`)

  // The entry that was just added must survive -- trimming oldest-first must not evict the
  // thing the reader is loading right now.
  const newestKept = await page.evaluate(async (u) => {
    const keys = await (await caches.open('sp-static-v4')).keys()
    return keys.some((k) => k.url.includes('trimprobe'))
  }, after.url)
  check('the just-fetched asset survives the trim', newestKept)

  await ctx.close()
} finally {
  await browser.close()
}
console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
