// scripts/migrate-featured.mjs
//
// `isFeatured` (boolean) -> `featuredAt` (datetime) + `featuredNote` (text).
//
// A boolean cannot have an archive: "every post I have flagged" meant "the post that is
// flagged", so featuring something new erased the last one. This moves the one fact the old
// field carried into the new one without inventing anything.
//
// WHAT IT DOES NOT DO: write a note. The note has to be Stefan's sentence about why he
// featured it, and a migration that made one up would put words in his mouth on the one page
// whose entire value is that the words are his. The post is left needing a note, the schema
// says so, and the archive renders the entry without one until he writes it.
//
//   node scripts/migrate-featured.mjs            # dry run, the default
//   node scripts/migrate-featured.mjs --apply
//
import fs from 'node:fs'

function env(key) {
  const line = fs.readFileSync('.env.local', 'utf8')
    .split(String.fromCharCode(10))
    .map((l) => l.trim())
    .find((l) => l.startsWith(key + '='))
  return process.env[key] || line?.slice(key.length + 1).trim().replace(/^["']|["']$/g, '')
}

const APPLY = process.argv.includes('--apply')
const PROJECT = env('NEXT_PUBLIC_SANITY_PROJECT_ID')
const DATASET = env('NEXT_PUBLIC_SANITY_DATASET')
const TOKEN = env('SANITY_API_WRITE_TOKEN')
const api = `https://${PROJECT}.api.sanity.io/v2025-02-27`
const auth = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }

const query = (groq) =>
  fetch(`${api}/data/query/${DATASET}?perspective=raw&query=${encodeURIComponent(groq)}`, { headers: auth })
    .then((r) => r.json())
    .then((r) => r.result)

// Drafts too: an unpublished post carrying the old flag should keep it through the move.
const posts = await query(`*[_type == "post" && isFeatured == true]{
  _id, title, publishedAt, featuredAt, featuredNote
}`)

console.log(`posts carrying the old isFeatured flag: ${posts.length}`)
if (posts.length === 0) {
  console.log('Nothing to migrate. If /blog has no hero, set "Featured on" by hand in the Studio.')
  process.exit(0)
}

const mutations = []
for (const p of posts) {
  // publishedAt is the honest stand-in: it is the date it WAS featured as far as anything
  // recorded, and inventing "now" would put today's date on a decision made months ago.
  const featuredAt = p.featuredAt ?? p.publishedAt ?? new Date().toISOString()
  console.log(`  ${p._id}`)
  console.log(`     ${p.title}`)
  console.log(`     featuredAt <- ${featuredAt}${p.featuredAt ? ' (already set, left alone)' : ''}`)
  console.log(`     featuredNote: ${p.featuredNote ? 'already written' : 'STILL NEEDED — write it in the Studio'}`)
  mutations.push({ patch: { id: p._id, set: { featuredAt }, unset: ['isFeatured'] } })
}

if (!APPLY) {
  console.log('\nDry run. Nothing was written. Re-run with --apply.')
  process.exit(0)
}

const res = await fetch(`${api}/data/mutate/${DATASET}`, {
  method: 'POST',
  headers: auth,
  body: JSON.stringify({ mutations }),
}).then((r) => r.json())

if (res.error) {
  console.error('FAILED:', JSON.stringify(res.error).slice(0, 400))
  process.exit(1)
}

// Verify by re-reading rather than trusting the mutation response.
//
// The straggler count deliberately asks whether any post is still FLAGGED, not whether the
// field exists anywhere. The first version counted `defined(isFeatured)` and reported "2
// still carrying it" after a clean migration, because two unrelated posts held
// `isFeatured: false` from the old initialValue. A verification that cannot tell "migrated"
// from "never featured" is worse than none: it reports a failure that did not happen.
const after = await query(`*[_type == "post" && defined(featuredAt)]{ _id, featuredAt, featuredNote }`)
const stragglers = await query(`count(*[_type == "post" && isFeatured == true])`)
console.log(`\napplied. posts with featuredAt: ${after.length}, posts still flagged the old way: ${stragglers}`)
const needNotes = after.filter((p) => !(p.featuredNote ?? '').trim())
if (needNotes.length) {
  console.log(`\n${needNotes.length} featured post(s) still need a note. The Studio will flag them:`)
  needNotes.forEach((p) => console.log(`  ${p._id}`))
}
