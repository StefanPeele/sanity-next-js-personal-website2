import { expect, test } from '@playwright/test'
import crypto from 'node:crypto'
import fs from 'node:fs'
import { vercelStegaCombine } from '@vercel/stega'
import { enumKey, enumKeys } from '../lib/stega'

// Draft mode is the one context the rest of this suite never enters, and it is where an
// entire class of bug lives: Sanity encodes a field's source path INTO the string as
// zero-width characters so click-to-edit works, which silently breaks every lookup keyed
// on that string. Measured on the fixture post — `CONFIDENCE_CONFIG['working-theory…']`
// was undefined and the badge vanished, while `tested` happened to be clean and rendered.
//
// Two layers, because the honest ones are different:
//   1. the mechanism, deterministically, with a REAL stega payload — always runs
//   2. the end-to-end render under draft mode — needs a write token, skips in CI

// ── Layer 1: the mechanism ────────────────────────────────────────────────────
// vercelStegaCombine is what Sanity's stega encoder uses underneath, so this is the real
// encoding rather than an approximation of it.
const encode = (s: string) => vercelStegaCombine(s, { origin: 'sanity.io', href: '/studio/test' })

test('a stega-encoded key breaks a plain lookup — the negative control', () => {
  // If this ever fails, the bug has been fixed upstream and the rest of this file is
  // testing nothing. A guard against a vacuous pass.
  const CONFIG: Record<string, string> = { 'working-theory': 'Working theory' }
  const encoded = encode('working-theory')
  expect(encoded).not.toBe('working-theory')
  expect(encoded.length).toBeGreaterThan('working-theory'.length)
  expect(CONFIG[encoded]).toBeUndefined()
})

test('enumKey makes the lookup work again', () => {
  const CONFIG: Record<string, string> = { 'working-theory': 'Working theory' }
  expect(CONFIG[enumKey(encode('working-theory')) ?? '']).toBe('Working theory')
})

test('enumKey handles the values that actually shipped', () => {
  for (const v of ['speculative', 'working-theory', 'confident', 'fresh', 'tested',
    'production-proven', 'peer-reviewed', 'fact-checked', 'seeking-review',
    'open-to-comment', 'revised', 'light', 'technical', 'dense', 'reference']) {
    expect(enumKey(encode(v)), `${v} survived encoding`).toBe(v)
  }
})

test('enumKey returns undefined for absent values rather than an empty key', () => {
  expect(enumKey(null)).toBeUndefined()
  expect(enumKey(undefined)).toBeUndefined()
  expect(enumKey('')).toBeUndefined()
})

test('enumKeys cleans every item of an array', () => {
  const flags = ['peer-reviewed', 'fact-checked', 'revised'].map(encode)
  expect(enumKeys(flags)).toEqual(['peer-reviewed', 'fact-checked', 'revised'])
  expect(enumKeys(null)).toEqual([])
  // A null inside the array must not become an empty string that matches nothing.
  expect(enumKeys(['peer-reviewed', null])).toEqual(['peer-reviewed'])
})

// ── Layer 2: the end-to-end render, under real draft mode ────────────────────
// Needs SANITY_API_WRITE_TOKEN to mint a sanity.previewUrlSecret. CI is documented as
// read-token-only, so this skips there. It is a LOUD skip: Playwright reports it, and the
// suite total does not change, so a silently-vanishing test cannot hide here.
// Playwright does not load .env.local into the test process -- only the Next server it
// spawns sees it. Without this the test skips even on a machine that has the token, which
// is the worst outcome: it looks covered and is not.
function fromEnvLocal(key: string): string | undefined {
  if (process.env[key]) return process.env[key]
  try {
    const file = fs.readFileSync('.env.local', 'utf8')
    // String.fromCharCode(10) rather than a newline escape: this file has been rewritten
    // through a shell heredoc twice and both times the escape collapsed into a real
    // newline, breaking the literal. No backslashes here on purpose.
    const line = file.split(String.fromCharCode(10)).map((l) => l.trim()).find((l) => l.startsWith(`${key}=`))
    return line?.slice(key.length + 1).trim().replace(/^["']|["']$/g, '') || undefined
  } catch {
    return undefined
  }
}

const WRITE = fromEnvLocal('SANITY_API_WRITE_TOKEN')
const PROJECT = fromEnvLocal('NEXT_PUBLIC_SANITY_PROJECT_ID')
const DATASET = fromEnvLocal('NEXT_PUBLIC_SANITY_DATASET')

test('draft mode renders every status badge on the fixture post', async ({ page }) => {
  test.skip(!WRITE || !PROJECT || !DATASET,
    'needs SANITY_API_WRITE_TOKEN to mint a preview secret; CI is read-token-only')

  const API = `https://${PROJECT}.api.sanity.io/v2025-02-27`
  const secret = crypto.randomBytes(24).toString('hex')
  const id = `sanity-preview-url-secret.e2e-${Date.now()}`
  const mutate = (mutations: unknown[]) => fetch(`${API}/data/mutate/${DATASET}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${WRITE}` },
    body: JSON.stringify({ mutations }),
  })

  await mutate([{ createOrReplace: { _id: id, _type: 'sanity.previewUrlSecret', secret, studioUrl: '/studio' } }])
  try {
    const pathname = '/blog/fixture-kitchen-sink'
    // NOT networkidle: draft mode holds a live-preview connection open, so it never settles.
    await page.goto(`/api/draft-mode/enable?sanity-preview-secret=${secret}&sanity-preview-pathname=${encodeURIComponent(pathname)}`,
      { waitUntil: 'domcontentloaded' })
    test.skip(new URL(page.url()).pathname !== pathname,
      'draft-mode fixture not present in this dataset — run scripts/seed-fixture-posts.mjs --apply')
    await page.waitForTimeout(2500)

    // innerText, lowercased: `.meta-label` uppercases, so the rendered text is
    // "FACT CHECKED" while the source string is "Fact checked". Comparing against the
    // source case-sensitively fails and looks exactly like a missing badge.
    const text = (await page.locator('body').innerText()).toLowerCase()
    for (const badge of ['peer reviewed', 'fact checked', 'seeking peer review', 'open to comment', 'revised', 'working theory', 'lab tested']) {
      expect(text, `"${badge}" badge missing under draft mode — a stega-broken lookup looks exactly like this`).toContain(badge)
    }
    // And the value removed from confidenceLevel in Phase 3.1 must not come back.
    expect(text).not.toContain('expert verified')
  } finally {
    await mutate([{ delete: { id } }])
  }
})
