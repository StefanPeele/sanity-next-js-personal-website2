// scripts/migrate-lab-notes.mjs
//
// Phase 4.3. Renames the `field-notes` lane to `lab-notes` in the DATASET, and removes the
// `transmission` lane, matching lib/cms/defaults/taxonomy.ts.
//
//   node scripts/migrate-lab-notes.mjs            dry run, prints what it would do
//   node scripts/migrate-lab-notes.mjs --apply    writes
//
// Two things move:
//   1. every post whose articleType is 'field-notes'  -> 'lab-notes'
//   2. the Taxonomy singleton's articleLanes array     -> the new table
//
// Posts on the removed `transmission` lane are reported and LEFT ALONE rather than
// reassigned. Guessing which lane someone else's post belongs to is not a migration's job,
// and the count was measured as zero before the lane was removed — if this ever prints a
// non-zero count, the removal needs revisiting rather than papering over.
//
// Drafts are included: a draft carrying the old key would silently lose its lane the moment
// it was published.
import fs from 'node:fs'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]))
const { NEXT_PUBLIC_SANITY_PROJECT_ID: P, NEXT_PUBLIC_SANITY_DATASET: D, SANITY_API_WRITE_TOKEN: T } = env
if (!P || !D || !T) { console.error('missing project id, dataset or write token in .env.local'); process.exit(1) }
const API = `https://${P}.api.sanity.io/v2025-02-27`
const APPLY = process.argv.includes('--apply')

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

// The new table, kept identical to lib/cms/defaults/taxonomy.ts. Written out rather than
// imported because this is a plain .mjs script and that module is TypeScript.
const NEW_LANES = [
  { _key: 'taxonomy-articleLanes-0', key: 'perspective', label: 'Perspective', short: 'Perspective', color: '#a78bfa', description: 'Opinion and analysis on where the field is going.' },
  { _key: 'taxonomy-articleLanes-1', key: 'concept-deep-dive', label: 'Deep dive', short: 'Deep dive', color: '#fbbf24', description: 'One idea, explained until it clicks.' },
  { _key: 'taxonomy-articleLanes-2', key: 'lab-notes', label: 'Lab Notes', short: 'Lab Notes', color: '#34d399', description: 'What actually happened in the lab or on the job.' },
]

// Phase 2.1's lesson, applied without being asked twice: the code defaults are only half of
// a rename. Every live Studio document carries its own copy of the copy, and patching the
// defaults changes nothing a reader sees until the document is patched too. This walks every
// non-system document and reports any string containing "field note" -- prose included, not
// just the enum key, because a grep for the KEY would miss all four of the strings below.
// A plain substring test, not a regex. The first version of this line was written through
// a shell heredoc and a Python string, and the  word boundaries arrived as literal
// BACKSPACE characters (0x08) -- so the pattern was /<BS>field notes<BS>/ and matched
// nothing. It reported a clean, confident 0 against 4 real hits that a substring check
// found on the same 56 documents. The dumb version is the one whose answer can be
// trusted; see OVERHAUL-PROGRESS for the other escapes this project has lost.
const NEEDLE = 'field note'
const allDocs = await query(`*[!(_type match "sanity.*")]`)
const proseHits = []
const walkDoc = (node, path, doc) => {
  if (typeof node === 'string') {
    if (node.toLowerCase().includes(NEEDLE)) proseHits.push({ id: doc._id, path, val: node })
    return
  }
  if (Array.isArray(node)) return node.forEach((v, i) => walkDoc(v, `${path}[${i}]`, doc))
  if (node && typeof node === 'object') return Object.entries(node).forEach(([k, v]) => walkDoc(v, path ? `${path}.${k}` : k, doc))
}
allDocs.forEach((d) => walkDoc(d, '', d))
// "Field notes" -> "Lab notes" in running prose: sentence case, because these sit mid-sentence
// ("deep dives, lab notes and the occasional photo essay"), unlike the lane LABEL which is a
// proper name and stays "Lab Notes".
const fixProse = (v) => v.split('Field notes').join('Lab notes').split('field notes').join('lab notes')

const posts = await query(`*[_type == "post" && articleType in ["field-notes", "transmission"]]{ _id, articleType, title }`)
const toRename = posts.filter((p) => p.articleType === 'field-notes')
const orphaned = posts.filter((p) => p.articleType === 'transmission')
const taxonomy = await query(`*[_type == "taxonomy"][0]{ _id, articleLanes }`)

console.log(`posts on 'field-notes' -> 'lab-notes': ${toRename.length}`)
for (const p of toRename) console.log(`  ${p._id}  ${String(p.title).slice(0, 60)}`)
console.log(`posts on the removed 'transmission' lane: ${orphaned.length}`)
for (const p of orphaned) console.log(`  LEFT ALONE  ${p._id}  ${String(p.title).slice(0, 60)}`)
if (orphaned.length) {
  console.log('  ^ the lane was removed because this count was measured as ZERO. Revisit 4.3.')
}
console.log(`live documents with "field notes" in prose: ${proseHits.length}`)
for (const h of proseHits) console.log(`  ${h.id}.${h.path}
    ${h.val.slice(0, 90)}
    -> ${fixProse(h.val).slice(0, 90)}`)
console.log(`taxonomy document: ${taxonomy?._id ?? 'NONE — the singleton has never been seeded'}`)
if (taxonomy?.articleLanes) {
  console.log(`  current lanes: ${taxonomy.articleLanes.map((l) => l.key).join(', ')}`)
  console.log(`  new lanes:     ${NEW_LANES.map((l) => l.key).join(', ')}`)
}

if (!APPLY) {
  console.log('\nDRY RUN — nothing written. Re-run with --apply.')
  process.exit(0)
}

const mutations = [
  ...toRename.map((p) => ({ patch: { id: p._id, set: { articleType: 'lab-notes' } } })),
  ...(taxonomy?._id ? [{ patch: { id: taxonomy._id, set: { articleLanes: NEW_LANES } } }] : []),
  // One set per exact path, so nothing else in the document is touched.
  ...proseHits.map((h) => ({ patch: { id: h.id, set: { [h.path]: fixProse(h.val) } } })),
]
if (!mutations.length) { console.log('\nnothing to do'); process.exit(0) }
await mutate(mutations)
console.log(`\napplied ${mutations.length} mutation(s)`)

// Prove it, rather than asserting it: re-query for the old keys and require zero.
const left = await query(`count(*[_type == "post" && articleType in ["field-notes", "transmission"] && articleType != "transmission"])`)
const tax = await query(`*[_type == "taxonomy"][0].articleLanes[].key`)
// Re-walk every document rather than counting ids: the point is "is the old string gone",
// and an id count answers a different question (it printed "of 0 touched" while 4 documents
// had in fact been patched).
const after = await query(`*[!(_type match "sanity.*")]`)
let stillThere = 0
const countNeedle = (n) => {
  if (typeof n === 'string') { if (n.toLowerCase().includes(NEEDLE)) stillThere++; return }
  if (Array.isArray(n)) return n.forEach(countNeedle)
  if (n && typeof n === 'object') return Object.values(n).forEach(countNeedle)
}
after.forEach(countNeedle)
console.log(`posts still on 'field-notes': ${left} (must be 0)`)
console.log(`prose strings patched: ${proseHits.length}; strings still containing "${NEEDLE}": ${stillThere} (must be 0)`)
console.log(`taxonomy lanes now: ${(tax ?? []).join(', ')}`)
if (left !== 0) process.exit(1)
if (tax && tax.includes('field-notes')) { console.error('taxonomy still lists field-notes'); process.exit(1) }
if (stillThere !== 0) { console.error(`${stillThere} string(s) still contain "${NEEDLE}"`); process.exit(1) }
