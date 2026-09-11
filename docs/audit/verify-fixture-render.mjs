// docs/audit/verify-fixture-render.mjs
//
// Measures what the kitchen-sink fixture ACTUALLY renders in draft mode, and checks the
// anonymity contract against the real page rather than against a unit test.
//
//   node docs/audit/verify-fixture-render.mjs
//
// Needs a server on 127.0.0.1:3000 serving the build you mean.
import { chromium } from '@playwright/test'
import crypto from 'node:crypto'
import fs from 'node:fs'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]))
const { NEXT_PUBLIC_SANITY_PROJECT_ID: P, NEXT_PUBLIC_SANITY_DATASET: D, SANITY_API_WRITE_TOKEN: T } = env
const API = `https://${P}.api.sanity.io/v2025-02-27`
const BASE = process.env.CAPTURE_BASE ?? 'http://127.0.0.1:3000'
const SECRET_ID = 'sanity-preview-url-secret.capture-harness'
const secret = crypto.randomBytes(24).toString('hex')

// Draft mode turns on stega: Sanity encodes each string's source path into the string as
// zero-width characters so click-to-edit works. Any text comparison must strip them.
// Written as \u escapes on purpose -- a literal character class of invisible codepoints
// does not survive being written to a file and edited, and the first version of this probe
// matched nothing because of it.
const STEGA = /[\u200B\u200C\u200D\uFEFF\u2060\u061C\u180E]|\uDB40[\uDC00-\uDFFF]/g

// TWO different readings, and the difference matters.
//   textContent -> the source text, CSS transforms NOT applied
//   innerText   -> the RENDERED text, so `text-transform: uppercase` is already applied
// `.meta-label` uppercases, so a badge whose source is "Fact checked" reads as
// "FACT CHECKED" in innerText. Comparing innerText to the source string fails and looks
// exactly like a missing badge. Match case-insensitively.
const clean = (s) => (s ?? '').replace(STEGA, '')
const has = (haystack, needle) => clean(haystack).toLowerCase().includes(needle.toLowerCase())

async function mutate(mutations) {
  const r = await fetch(`${API}/data/mutate/${D}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${T}` },
    body: JSON.stringify({ mutations }),
  })
  const j = await r.json()
  if (j.error) throw new Error(JSON.stringify(j.error))
}

await mutate([{ createOrReplace: { _id: SECRET_ID, _type: 'sanity.previewUrlSecret', secret, studioUrl: '/studio' } }])

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
const page = await ctx.newPage()
let pass = 0, fail = 0
const check = (label, ok, detail = '') => {
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label.padEnd(52)} ${detail}`)
  if (ok) pass++; else fail++
}

try {
  const pathname = '/blog/fixture-kitchen-sink'
  await page.goto(`${BASE}/api/draft-mode/enable?sanity-preview-secret=${secret}&sanity-preview-pathname=${encodeURIComponent(pathname)}`,
    { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForLoadState('load').catch(() => {})
  await page.waitForTimeout(3000)

  const rawText = await page.evaluate(() => document.body.innerText)
  const text = clean(rawText)
  const html = clean(await page.content())

  console.log('\n=== STRUCTURE ===')
  const counts = await page.evaluate(() => {
    const n = (s) => document.querySelectorAll(s).length
    return {
      h1: n('h1'), h2: n('main h2'), h3: n('main h3'), h4: n('main h4'),
      blockquote: n('main blockquote'), figure: n('main figure'), figcaption: n('main figcaption'),
      pre: n('main pre'), img: n('main img'),
    }
  })
  check('exactly one <h1> on the page', counts.h1 === 1, `h1=${counts.h1}`)
  check('h2 renders (incl. the body "Heading 1")', counts.h2 >= 4, `h2=${counts.h2}`)
  check('h3 renders', counts.h3 >= 1, `h3=${counts.h3}`)
  check('h4 renders — never seen on a published post', counts.h4 >= 1, `h4=${counts.h4}`)
  const hx = await page.evaluate(() => ({
    h5: document.querySelectorAll('main h5').length,
    h6: document.querySelectorAll('main h6').length,
    // Excluding [data-no-toc]. Interactive components render their own headings -- the
    // packet animator labels a step "SYN" with an h3 -- and they are deliberately skipped
    // by the TOC collector, so having no id is correct for them, not a defect.
    noId: [...document.querySelectorAll('[data-article] h2,[data-article] h3,[data-article] h4,[data-article] h5,[data-article] h6')].filter((e) => !e.id && !e.closest('[data-no-toc]')).length,
    tocEntries: document.querySelectorAll('[data-toc="sidebar"] li').length,
  }))
  check('h5 renders — had NO renderer before Phase 3', hx.h5 >= 1, `h5=${hx.h5}`)
  check('h6 renders — had NO renderer before Phase 3', hx.h6 >= 1, `h6=${hx.h6}`)
  check('every Portable Text heading has an id', hx.noId === 0, `without id: ${hx.noId}`)
  check('TOC is populated', hx.tocEntries >= 8, `entries=${hx.tocEntries}`)
  check('blockquote renders — never seen published', counts.blockquote >= 1, `blockquote=${counts.blockquote}`)
  check('figure + caption render — never seen published', counts.figure >= 1 && counts.figcaption >= 1, `figure=${counts.figure} caption=${counts.figcaption}`)
  check('code block renders', counts.pre >= 1, `pre=${counts.pre}`)

  console.log('\n=== LEARNING BLOCKS (each has never rendered for a published post) ===')
  for (const [label, needle] of [
    ['sectionBreak', 'Part two'],
    ['failureNote', 'mask mismatch'],
    ['whatIGotWrong', 'I thought a switch had to learn'],
    ['whatEngineersUse', 'ip route get'],
    ['theProblemSolved', 'Spanning Tree exists because Ethernet'],
    ['conceptStressTest', 'Name two causes that are not the gateway'],
    ['knowledgeQuiz', 'Which layer does a MAC address belong to'],
    ['layerExplorer', 'The OSI layers, with two overridden'],
    ['packetAnimator', 'A TCP handshake across one router'],
    ['wiresharkCallout', 'numbered callouts over it'],
  ]) check(label, has(text, needle))

  // Collapsed by design -- present in the DOM, absent from innerText until expanded.
  // Checking innerText for these would report a phantom defect.
  for (const [label, needle] of [
    ['sidenote (collapsed by design)', 'sits in the margin'],
    ['changelog (collapsed by design)', 'Corrected the unknown-unicast'],
  ]) check(label, has(html, needle))

  console.log('\n=== PHASE 3.1 — status flags, two applied at once ===')
  for (const [label, needle] of [['Peer reviewed badge', 'Peer reviewed'], ['Fact checked badge', 'Fact checked'], ['Revised badge', 'Revised']])
    check(label, has(text, needle))
  check('confidence "Working theory" renders', has(text, 'Working theory'))
  check('maturity "Lab tested" renders', has(text, 'Lab tested'))
  check('removed value "Expert verified" is absent', !has(text, 'Expert verified'))

  console.log('\n=== PHASE 3.2 — reviewer attribution and anonymity ===')
  check('named reviewer renders', has(text, 'Dana Okafor'))
  check('named reviewer LinkedIn present', has(html, 'example-fixture'))
  check('Contents column shows "Peer reviewed by"', has(text, 'Peer reviewed by'))
  check('anonymous reviewer shows the role', has(text, 'an Infrastructure Engineer'))

  console.log('\n  --- the anonymity contract, against the rendered page AND the payload ---')
  check('anon name NOT in visible text', !has(text, 'Should Never Render'))
  check('anon name NOT anywhere in page source (RSC payload included)', !has(html, 'Should Never Render'),
    has(html, 'Should Never Render') ? 'LEAKED' : '')
  check('anon organization NOT in page source', !has(html, 'Should Never Render Ltd'))
  check('anon LinkedIn NOT in page source', !has(html, 'should-never-render'))
  check('anon quote DOES render (not identifying)', has(text, 'layer 2 explanation is accurate'))

  console.log('\n=== OTHER FIELDS ===')
  check('sources render', has(text, 'RFC 826'))
  check('response-from-field renders', has(text, 'A response from the field'))
  check('tldr renders', has(text, 'Every block type on one page'))
} finally {
  await browser.close()
  await mutate([{ delete: { id: SECRET_ID } }])
}

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
