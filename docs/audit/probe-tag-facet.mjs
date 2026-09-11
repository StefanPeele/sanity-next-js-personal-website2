// docs/audit/probe-tag-facet.mjs
//
// A Phase 4 verifier reported the Tag facet never appears: it created a real tag document,
// referenced it from two posts, reloaded /blog, and saw only Topic / Checked / Sort.
//
// That is either a genuine defect or trap 16 — `/blog` is statically rendered, so a reload
// after a dataset change serves the page built before it. Draft mode bypasses that and
// fetches live, which separates the two possibilities.
//
// Creates a tag, references it from the two draft fixtures, measures BOTH the published and
// the draft page, then removes everything it made and proves the removal.
import { chromium } from '@playwright/test'
import crypto from 'node:crypto'
import fs from 'node:fs'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]))
const { NEXT_PUBLIC_SANITY_PROJECT_ID: P, NEXT_PUBLIC_SANITY_DATASET: D, SANITY_API_WRITE_TOKEN: T } = env
const API = `https://${P}.api.sanity.io/v2025-02-27`
const BASE = 'http://127.0.0.1:3000'
const SECRET_ID = 'sanity-preview-url-secret.capture-harness'
const TAG_ID = 'probe-tag-facet'
const secret = crypto.randomBytes(24).toString('hex')

const query = async (groq) => {
  const r = await fetch(`${API}/data/query/${D}?query=${encodeURIComponent(groq)}&perspective=raw`,
    { headers: { Authorization: `Bearer ${T}` } })
  const j = await r.json()
  if (j.error) throw new Error(JSON.stringify(j.error))
  return j.result
}
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

const READ = async (page) => {
  // The facets are behind the disclosure, so open it first.
  const btn = page.locator('button', { hasText: /^Filters/ })
  if (await btn.count() && !(await page.locator('#blog-facets').count())) {
    await btn.first().click()
    await page.waitForTimeout(400)
  }
  return page.evaluate(() => {
    const groups = Array.from(document.querySelectorAll('#blog-facets [role="group"]'))
      .map((g) => g.getAttribute('aria-label'))
    const tagRow = document.querySelector('[aria-label="Filter by tag"]')
    return {
      groups,
      tagRow: !!tagRow,
      tagChips: tagRow ? Array.from(tagRow.querySelectorAll('button')).map((b) => (b.textContent || '').trim()) : [],
    }
  })
}

await mutate([
  { createOrReplace: { _id: TAG_ID, _type: 'tag', title: 'Probe Tag', slug: { _type: 'slug', current: 'probe-tag' } } },
  { patch: { id: 'drafts.fixture-kitchen-sink', set: { tags: [{ _type: 'reference', _ref: TAG_ID, _key: 'probetag1' }] } } },
  { patch: { id: 'drafts.fixture-minimal', set: { tags: [{ _type: 'reference', _ref: TAG_ID, _key: 'probetag2' }] } } },
  { createOrReplace: { _id: SECRET_ID, _type: 'sanity.previewUrlSecret', secret, studioUrl: '/studio' } },
])
console.log('created a tag and referenced it from both draft fixtures')

const browser = await chromium.launch()
try {
  // ── published: the state the verifier measured ──────────────────────────────
  const c1 = await browser.newContext({ viewport: { width: 1440, height: 1100 } })
  const p1 = await c1.newPage()
  await p1.goto(`${BASE}/blog`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await p1.waitForTimeout(2200)
  const pub = await READ(p1)
  console.log(`\nPUBLISHED  groups=${JSON.stringify(pub.groups)}  tagRow=${pub.tagRow}`)
  await c1.close()

  // ── draft: live data, no static cache in the way ────────────────────────────
  const c2 = await browser.newContext({ viewport: { width: 1440, height: 1100 } })
  const p2 = await c2.newPage()
  await p2.goto(`${BASE}/api/draft-mode/enable?sanity-preview-secret=${secret}&sanity-preview-pathname=${encodeURIComponent('/blog')}`,
    { waitUntil: 'domcontentloaded', timeout: 60000 })
  await p2.waitForLoadState('load').catch(() => {})
  await p2.waitForTimeout(3500)
  const draft = await READ(p2)
  console.log(`DRAFT      groups=${JSON.stringify(draft.groups)}  tagRow=${draft.tagRow}  chips=${JSON.stringify(draft.tagChips)}`)

  // and that selecting it actually filters
  if (draft.tagRow) {
    await p2.goto(`${BASE}/blog?tag=probe-tag`, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await p2.waitForTimeout(2500)
    const n = await p2.evaluate(() =>
      Array.from(document.querySelectorAll('a[href^="/blog/"]')).filter((a) => a.querySelector('h3')).length)
    console.log(`?tag=probe-tag leaves ${n} cards (expected 2)`)
  }
  await c2.close()

  console.log(`\nVERDICT: ${draft.tagRow
    ? 'the tag facet DOES render when the data reaches the page. The published page was serving a build made before the tag existed — trap 16, not a defect.'
    : 'the tag facet does NOT render even with live data. A REAL defect.'}`)
} finally {
  await browser.close()
  await mutate([
    { patch: { id: 'drafts.fixture-kitchen-sink', unset: ['tags'] } },
    { patch: { id: 'drafts.fixture-minimal', unset: ['tags'] } },
    { delete: { id: TAG_ID } },
    { delete: { id: SECRET_ID } },
  ])
  const left = await query(`{"tags": count(*[_type=="tag"]), "tagged": count(*[_type=="post" && defined(tags)])}`)
  console.log(`\ncleanup: tags=${left.tags} taggedPosts=${left.tagged} (both must be 0)`)
  if (left.tags !== 0 || left.tagged !== 0) process.exit(1)
}
