// scripts/migrate-heading-levels.mjs
//
// Phase 10 found the one heading defect on the site, and it is CONTENT, not code:
//
//   /blog/the-field-… renders  h1 → h5 h5 h5 h5 h5 h5 h5 → h2 "Responses" → h2 "Contents"
//
// Seven section headings authored as "Heading 5". Two things follow, and the second is
// worse than the first:
//
//   1. The level skip (h1 → h5) fails the outline: a screen-reader user navigating by
//      heading level is told the article has no second- or third-level sections at all.
//   2. The article's OWN sections end up nested deeper than its apparatus. "Responses" and
//      "Contents" are h2, so the machinery around the piece outranks the piece.
//
// This rewrites those blocks to h2. It is a real change to how a published article LOOKS --
// h5 renders at 19/20px, h2 at 32/38px -- which is why it does not run by itself.
//
//   node scripts/migrate-heading-levels.mjs                  # dry run, shows every change
//   node scripts/migrate-heading-levels.mjs --apply          # writes
//   node scripts/migrate-heading-levels.mjs --slug=<slug>    # one post (default: all)
//
import fs from 'node:fs'

function env(key) {
  if (process.env[key]) return process.env[key]
  const file = fs.readFileSync('.env.local', 'utf8')
  const line = file.split(String.fromCharCode(10)).map((l) => l.trim()).find((l) => l.startsWith(`${key}=`))
  return line?.slice(key.length + 1).trim().replace(/^["']|["']$/g, '') || undefined
}

const P = env('NEXT_PUBLIC_SANITY_PROJECT_ID')
const D = env('NEXT_PUBLIC_SANITY_DATASET')
const T = env('SANITY_API_WRITE_TOKEN')
const API = `https://${P}.api.sanity.io/v2025-02-27`
const AUTH = { Authorization: `Bearer ${T}`, 'Content-Type': 'application/json' }

const APPLY = process.argv.includes('--apply')
const SLUG = (process.argv.find((a) => a.startsWith('--slug=')) || '').split('=')[1]

const groq = (q, params = {}) =>
  fetch(`${API}/data/query/${D}?perspective=raw&query=${encodeURIComponent(q)}` +
    Object.entries(params).map(([k, v]) => `&$${k}=${encodeURIComponent(JSON.stringify(v))}`).join(''), { headers: AUTH })
    .then((r) => r.json()).then((r) => r.result)

/**
 * Decide the level each heading SHOULD have.
 *
 * Per distinct LEVEL, not per position. The first version walked the sequence and promoted
 * each heading just enough to avoid a skip -- which turned seven SIBLING sections into a
 * descending staircase h2, h3, h4, h5, h5, h5, h5. Seven headings an author gave the same
 * level are seven siblings, and the transform has to preserve that.
 *
 * So: collect the distinct levels the document actually uses, sort them, and map them onto
 * 2, 3, 4 … in order. {5} becomes {2}. {2,3} is already correct and is left alone. {1,3,5}
 * becomes {2,3,4}. The author's hierarchy survives; only the skips go.
 */
function plan(body) {
  const blocks = (body ?? []).filter((b) => b._type === 'block' && /^h[1-6]$/.test(b.style ?? ''))
  if (!blocks.length) return []
  // A body "Heading 1" already renders as an h2 (Phase 3), so it counts as 2 here.
  const effective = (b) => { const l = Number(b.style[1]); return l === 1 ? 2 : l }
  const levels = [...new Set(blocks.map(effective))].sort((a, b) => a - b)
  const map = new Map(levels.map((l, i) => [l, i + 2]))
  const out = []
  for (const b of blocks) {
    const from = b.style
    const to = `h${map.get(effective(b))}`
    if (from !== to) {
      out.push({ key: b._key, from, to, text: (b.children ?? []).map((c) => c.text ?? '').join('').replace(/\s+/g, ' ').trim().slice(0, 46) })
    }
  }
  return out
}

const posts = await groq(
  SLUG
    ? `*[_type == "post" && slug.current == $slug]{ _id, title, "slug": slug.current, body }`
    : `*[_type == "post" && defined(body)]{ _id, title, "slug": slug.current, body }`,
  SLUG ? { slug: SLUG } : {},
)

let total = 0
const patches = []
for (const p of posts ?? []) {
  // The fixtures are excluded. fixture-kitchen-sink carries a body "Heading 1" ON PURPOSE,
  // to prove the renderer turns it into an h2 rather than a second page-level h1 -- so
  // "fixing" it would delete the test. It is also re-seeded by scripts/seed-fixture-posts.mjs,
  // which would undo this on the next run and make the migration look flaky.
  if ((p.slug ?? '').startsWith('fixture-')) { console.log(`  ${(p.slug ?? p._id).padEnd(50)} skipped (fixture)`); continue }
  const changes = plan(p.body)
  if (!changes.length) { console.log(`  ${(p.slug ?? p._id).padEnd(50)} nothing to change`); continue }
  total += changes.length
  console.log(`\n  ${p.slug ?? p._id}  (${changes.length} heading${changes.length === 1 ? '' : 's'})`)
  for (const c of changes) console.log(`    ${c.from} → ${c.to}   "${c.text}"`)
  patches.push({
    patch: {
      id: p._id,
      set: Object.fromEntries(changes.map((c) => [`body[_key=="${c.key}"].style`, c.to])),
    },
  })
}

console.log(`\n${total} heading(s) across ${patches.length} post(s).`)
if (!total) process.exit(0)

if (!APPLY) {
  console.log(`
DRY RUN — nothing written.

This changes how a published article LOOKS, not only how it is marked up: an h5 renders at
19/20px and an h2 at 32/38px, so those sections become considerably larger. That is the
correct size for a section heading, and if it reads as too loud the fix is the h2 STYLE in
components/CustomPortableText.tsx, not the level.

Re-run with --apply.`)
  process.exit(0)
}

const res = await fetch(`${API}/data/mutate/${D}`, { method: 'POST', headers: AUTH, body: JSON.stringify({ mutations: patches }) }).then((r) => r.json())
if (res.error) { console.error('FAILED', res.error); process.exit(1) }

// Verify by re-reading, not by trusting the response.
let left = 0
for (const p of await groq(`*[_type == "post" && defined(body)]{ _id, "slug": slug.current, body }`)) left += plan(p.body).length
console.log(`applied. ${left} heading(s) still out of sequence (must be 0).`)
process.exit(left ? 1 : 0)
