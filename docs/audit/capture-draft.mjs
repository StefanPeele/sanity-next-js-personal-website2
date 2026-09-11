// docs/audit/capture-draft.mjs
//
// Captures a DRAFT document by going through the site's real draft-mode route, the same
// one Sanity's Presentation tool uses. Nothing here bypasses the app.
//
//   node docs/audit/capture-draft.mjs <outdir> <slug> [<slug> ...]
//
// How it works. `app/api/draft-mode/enable` is next-sanity's defineEnableDraftMode, which
// validates `?sanity-preview-secret=` against a `sanity.previewUrlSecret` document whose
// _updatedAt is within SECRET_TTL (3600s). This script creates that document, drives the
// endpoint in a real browser so the draft-mode cookie is set by Next itself, captures, and
// deletes the secret afterwards.
//
// Requires a server already on 127.0.0.1:3000 serving the build you mean. Confirm the
// served CSS chunk matches .next/static/chunks/*.css first -- a stale server has
// fabricated failures on this project three times.
import { chromium } from '@playwright/test'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const [, , outdir, ...slugs] = process.argv
if (!outdir || !slugs.length) {
  console.error('usage: node docs/audit/capture-draft.mjs <outdir> <slug> [<slug> ...]')
  process.exit(1)
}

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]))
const { NEXT_PUBLIC_SANITY_PROJECT_ID: P, NEXT_PUBLIC_SANITY_DATASET: D, SANITY_API_WRITE_TOKEN: T } = env
const API = `https://${P}.api.sanity.io/v2025-02-27`
const BASE = process.env.CAPTURE_BASE ?? 'http://127.0.0.1:3000'
const OUT = path.join('docs', 'audit', 'screenshots', outdir)
const BPS = [{ n: '1440', w: 1440, h: 1000 }, { n: '768', w: 768, h: 1100 }, { n: '390', w: 390, h: 1100 }]

const SECRET_ID = 'sanity-preview-url-secret.capture-harness'
const secret = crypto.randomBytes(24).toString('hex')

async function mutate(mutations) {
  const r = await fetch(`${API}/data/mutate/${D}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${T}` },
    body: JSON.stringify({ mutations }),
  })
  const j = await r.json()
  if (j.error) throw new Error(JSON.stringify(j.error))
  return j
}

fs.mkdirSync(OUT, { recursive: true })

await mutate([{ createOrReplace: { _id: SECRET_ID, _type: 'sanity.previewUrlSecret', secret, studioUrl: '/studio' } }])
console.log('preview secret created')

const browser = await chromium.launch()
let failures = 0
try {
  for (const slug of slugs) {
    for (const bp of BPS) {
      const ctx = await browser.newContext({ viewport: { width: bp.w, height: bp.h } })
      const page = await ctx.newPage()
      const pathname = `/blog/${slug}`
      const enable = `${BASE}/api/draft-mode/enable`
        + `?sanity-preview-secret=${encodeURIComponent(secret)}`
        + `&sanity-preview-pathname=${encodeURIComponent(pathname)}`
      // NOT networkidle. Draft mode mounts SanityLive, which holds a streaming connection
      // open for live preview, so the network never goes idle and the navigation times out
      // after 60s. domcontentloaded plus an explicit settle is the only workable wait here.
      const res = await page.goto(enable, { waitUntil: 'domcontentloaded', timeout: 60000 })
      await page.waitForLoadState('load').catch(() => {})
      await page.waitForTimeout(2500)
      const landed = new URL(page.url()).pathname
      if (landed !== pathname) {
        console.log(`FAIL ${slug} @${bp.n}: enable redirected to ${landed} (http ${res?.status()}) -- draft mode not entered`)
        failures++
        await ctx.close()
        continue
      }
      // Confirm the page really rendered the draft rather than a 404 shell.
      const ok = await page.evaluate(() => ({
        h1: document.querySelectorAll('h1').length,
        title: document.querySelector('h1')?.textContent?.trim().slice(0, 48) ?? null,
        chars: document.body.innerText.length,
      }))
      if (!ok.h1) {
        console.log(`FAIL ${slug} @${bp.n}: no <h1> -- rendered ${ok.chars} chars, likely a 404`)
        failures++
        await ctx.close()
        continue
      }
      await page.waitForTimeout(1200)
      const file = path.join(OUT, `${slug}-${bp.n}.jpg`)
      await page.screenshot({ path: file, type: 'jpeg', quality: 80, fullPage: true })
      console.log(`ok   ${slug} @${bp.n}  h1=${ok.h1} "${ok.title}"  ${ok.chars} chars -> ${file}`)
      await ctx.close()
    }
  }
} finally {
  await browser.close()
  await mutate([{ delete: { id: SECRET_ID } }])
  console.log('preview secret deleted')
}
process.exit(failures ? 1 : 0)
