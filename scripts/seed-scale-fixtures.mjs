// scripts/seed-scale-fixtures.mjs
//
// Phase 4.1 asks for a directory structure that works "at 3 posts and at 50 posts", and for
// an explicit statement of what changes between those states. There are 3 published posts,
// so the 50-post state cannot be seen — only argued about. This creates it.
//
//   node scripts/seed-scale-fixtures.mjs            dry run
//   node scripts/seed-scale-fixtures.mjs --apply    writes 47 draft posts
//   node scripts/seed-scale-fixtures.mjs --delete   removes them
//
// SAFETY, PROVEN NOT ASSERTED. Every document is `drafts.`-prefixed, so the published
// perspective cannot see it and neither can the feeds, the sitemap or the graph. After
// writing, this queries the PUBLISHED perspective for the slugs and exits 1 if a single one
// comes back — the same contract as scripts/seed-fixture-posts.mjs. A scale fixture that
// leaked onto the live blog would be much worse than not having one.
//
// The titles are deliberately structural rather than plausible ("Scale fixture 12 — Deep
// dive"). These are not draft posts anyone might mistake for real planned writing; they
// exist to make a grid 50 items long and nothing else.
import fs from 'node:fs'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]))
const { NEXT_PUBLIC_SANITY_PROJECT_ID: P, NEXT_PUBLIC_SANITY_DATASET: D, SANITY_API_WRITE_TOKEN: T } = env
if (!P || !D || !T) { console.error('missing project id, dataset or write token in .env.local'); process.exit(1) }
const API = `https://${P}.api.sanity.io/v2025-02-27`
const MODE = process.argv.includes('--delete') ? 'delete' : process.argv.includes('--apply') ? 'apply' : 'dry'

const query = async (groq, perspective = 'raw') => {
  const r = await fetch(`${API}/data/query/${D}?query=${encodeURIComponent(groq)}&perspective=${perspective}`,
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

// 47, so that with the 3 real published posts the grid is exactly 50.
const COUNT = 47
const LANES = ['perspective', 'concept-deep-dive', 'lab-notes']
const LANE_LABEL = { perspective: 'Perspective', 'concept-deep-dive': 'Deep dive', 'lab-notes': 'Lab Notes' }
// Spread across a plausible range of topics so the Topic facet has something to group by.
const TOPICS = ['Routing', 'Switching', 'Automation', 'Observability', 'Security', 'Hardware']
// Weighted so roughly a third carry a status. The first version had two thirds carrying
// one, which contradicted the comment above it and would have made the status filter look
// far more useful than it will be in practice.
const STATUSES = [
  [], [], [], [], [], [], [], [], [],
  ['peer-reviewed'], ['fact-checked'], ['seeking-review'],
  ['open-to-comment'], ['peer-reviewed', 'fact-checked'],
]

const key = (n) => `sf${n.toString(36)}`
const docs = Array.from({ length: COUNT }, (_, i) => {
  const lane = LANES[i % LANES.length]
  const topic = TOPICS[i % TOPICS.length]
  // Descending dates so the river has a real order, one every 4 days back from 2026-08-01.
  const d = new Date(Date.UTC(2026, 7, 1) - i * 4 * 86400000).toISOString().slice(0, 10)
  const words = 400 + ((i * 137) % 2600)
  return {
    _id: `drafts.scale-fixture-${String(i + 1).padStart(2, '0')}`,
    _type: 'post',
    title: `Scale fixture ${i + 1} — ${LANE_LABEL[lane]} — ${topic}`,
    slug: { _type: 'slug', current: `scale-fixture-${String(i + 1).padStart(2, '0')}` },
    publishedAt: d,
    articleType: lane,
    excerpt: `A structural placeholder in the ${LANE_LABEL[lane]} lane, filed under ${topic}. It exists so the directory can be seen at fifty posts instead of three.`,
    reviewStatus: STATUSES[i % STATUSES.length],
    body: Array.from({ length: Math.max(2, Math.round(words / 400)) }, (_, b) => ({
      _type: 'block',
      _key: key(i * 100 + b),
      style: b === 0 ? 'normal' : (b % 3 === 0 ? 'h2' : 'normal'),
      markDefs: [],
      // Roughly `words` total across the blocks, so reading time varies believably and the
      // "longest" sort has something to sort by.
      children: [{ _type: 'span', _key: key(i * 100 + b + 50), text: Array.from({ length: Math.round(words / Math.max(2, Math.round(words / 400))) }, () => 'word').join(' '), marks: [] }],
    })),
  }
})

const slugs = docs.map((d) => d.slug.current)

if (MODE === 'delete') {
  const ids = await query(`*[_type == "post" && _id match "drafts.scale-fixture-*"]._id`)
  if (!ids.length) { console.log('nothing to delete'); process.exit(0) }
  await mutate(ids.map((id) => ({ delete: { id } })))
  const left = await query(`count(*[_type == "post" && _id match "drafts.scale-fixture-*"])`)
  console.log(`deleted ${ids.length}; remaining: ${left} (must be 0)`)
  process.exit(left === 0 ? 0 : 1)
}

console.log(`${MODE === 'apply' ? 'CREATING' : 'WOULD CREATE'} ${docs.length} draft-only scale fixtures`)
console.log(`  lanes: ${LANES.join(', ')}`)
console.log(`  dates: ${docs[docs.length - 1].publishedAt} .. ${docs[0].publishedAt}`)
console.log(`  with a status: ${docs.filter((d) => d.reviewStatus.length).length} of ${docs.length}`)
if (MODE !== 'apply') { console.log('\nDRY RUN — nothing written. Re-run with --apply.'); process.exit(0) }

await mutate(docs.map((doc) => ({ createOrReplace: doc })))
console.log(`wrote ${docs.length}`)

// The contract: prove they are invisible to the published perspective.
const published = await query(`count(*[_type == "post" && slug.current in ${JSON.stringify(slugs)}])`, 'published')
const raw = await query(`count(*[_type == "post" && slug.current in ${JSON.stringify(slugs)}])`, 'raw')
console.log(`published-perspective query for the fixture slugs returned ${published} documents (must be 0)`)
console.log(`raw-perspective query returned ${raw} (expected ${docs.length})`)
if (published !== 0) { console.error('FIXTURES LEAKED INTO THE PUBLISHED PERSPECTIVE — delete them now'); process.exit(1) }
if (raw !== docs.length) { console.error('not all fixtures were written'); process.exit(1) }
