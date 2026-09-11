// docs/audit/capture-change.mjs
// Targeted before/after capture for a single change, at the three standard breakpoints.
//   node docs/audit/capture-change.mjs <phase-dir> <before|after> <route> [clipSelector]
// Requires a server already running on 127.0.0.1:3000 — confirm it is serving the
// build you just made, not a stale one (see the brief, §1 environment hazards).
import { chromium } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const [, , dir, label, route = '/blog', clip] = process.argv
if (!dir || !label) {
  console.error('usage: node docs/audit/capture-change.mjs <phase-dir> <before|after> <route> [clipSelector]')
  process.exit(1)
}
const OUT = path.join('docs', 'audit', 'screenshots', dir, label)
fs.mkdirSync(OUT, { recursive: true })

const BPS = [{ n: '1440', w: 1440, h: 900 }, { n: '768', w: 768, h: 1024 }, { n: '390', w: 390, h: 844 }]
const slug = route.replace(/\W+/g, '-').replace(/^-|-$/g, '') || 'home'

const browser = await chromium.launch()
for (const bp of BPS) {
  const page = await browser.newPage({ viewport: { width: bp.w, height: bp.h } })
  await page.goto(`http://127.0.0.1:3000${route}`, { waitUntil: 'networkidle' })
  const file = path.join(OUT, `${slug}-${bp.n}.jpg`)
  const target = clip ? page.locator(clip).first() : page
  await target.screenshot({ path: file, type: 'jpeg', quality: 82 })
  console.log('  wrote', file)
  await page.close()
}
await browser.close()
