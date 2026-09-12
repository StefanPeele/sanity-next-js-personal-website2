// docs/audit/probe-stega-fields.mjs
//
// Which fields does Sanity actually ENCODE in draft mode?
//
// The glossary bug (Phase 6.2) and the Phase 3 status bug were the same class: a string
// that arrives carrying an invisible source-path payload is fine to display and fatal to
// compare, key, dedupe or build a regex from. Both were found by accident. This finds the
// rest by measurement rather than by reading @sanity/client's filterDefault and guessing
// how it applies -- that filter denies `status` but not `reviewStatus`, denies anything
// whose path contains "type" but not `kind`, and THIS repo overrides it to force-encode
// `title`. Inference was never going to be reliable.
//
// It runs the real queries through a stega-enabled client on the drafts perspective and
// reports, per query, every string path whose value is actually encoded.
//
//   node docs/audit/probe-stega-fields.mjs            # summary
//   node docs/audit/probe-stega-fields.mjs --paths    # every encoded path, deduped
//
import fs from 'node:fs'
import { createClient } from '@sanity/client'
import { vercelStegaSplit } from '@vercel/stega'

function env(key) {
  if (process.env[key]) return process.env[key]
  const file = fs.readFileSync('.env.local', 'utf8')
  const line = file.split(String.fromCharCode(10)).map((l) => l.trim()).find((l) => l.startsWith(`${key}=`))
  return line?.slice(key.length + 1).trim().replace(/^["']|["']$/g, '') || undefined
}

const projectId = env('NEXT_PUBLIC_SANITY_PROJECT_ID')
const dataset = env('NEXT_PUBLIC_SANITY_DATASET')
const token = env('SANITY_API_READ_TOKEN')
if (!projectId || !dataset || !token) {
  console.error('Missing project id, dataset or SANITY_API_READ_TOKEN')
  process.exit(1)
}

// The same client config the app uses, including this repo's filter override, so the
// answer is about THIS site and not about @sanity/client's defaults.
const client = createClient({
  projectId,
  dataset,
  apiVersion: '2025-02-27',
  useCdn: false,
  token,
  perspective: 'drafts',
  stega: {
    enabled: true,
    studioUrl: '/studio',
    filter: (props) => (props.sourcePath.at(-1) === 'title' ? true : props.filterDefault(props)),
  },
})

/** Walk a result and collect the paths of every string, noting which are encoded. */
function walk(node, path, out) {
  if (typeof node === 'string') {
    const { encoded } = vercelStegaSplit(node)
    const key = path.join('.')
    // Separate samples per branch. Sharing one field meant the first CLEAN value became the
    // "sample" printed beside an ENCODED count, which read as a heading style being encoded
    // when the encoded value was actually a sectionBreak's own `style` field at the same
    // collapsed path. A sample from the wrong branch is worse than no sample.
    const rec = out.get(key) ?? { encoded: 0, clean: 0, sample: '' }
    if (encoded) { rec.encoded++; if (!rec.encodedSample) rec.encodedSample = vercelStegaSplit(node).cleaned.slice(0, 32) }
    else { rec.clean++; if (!rec.cleanSample) rec.cleanSample = node.slice(0, 32) }
    rec.sample = rec.encodedSample ?? rec.cleanSample
    out.set(key, rec)
    return
  }
  if (Array.isArray(node)) { for (const v of node) walk(v, [...path, '[]'], out); return }
  if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) walk(v, [...path, k], out)
  }
}

// Every query reached by a page fetch that does NOT pass stega:false, plus the article
// query, which is the one the glossary bug lived in.
// The queries are TS with shared `${fragment}` template interpolations, so they cannot be
// read as raw text and cannot be imported from node without a TS loader. Collect both the
// fragments and the queries, then substitute until no `${}` remains.
const src = fs.readFileSync('sanity/lib/queries.ts', 'utf8')
const fragments = new Map()
for (const m of src.matchAll(/^const (\w+) = `([\s\S]*?)`$/gm)) fragments.set(m[1], m[2])
function expand(text, depth = 0) {
  if (depth > 6 || !text.includes('${')) return text
  return expand(text.replace(/\$\{(\w+)\}/g, (all, name) => fragments.get(name) ?? all), depth + 1)
}
function q(name) {
  const m = src.match(new RegExp(`export const ${name} = defineQuery\\(\`([\\s\\S]*?)\`\\)`))
  if (!m) throw new Error(`query not found: ${name}`)
  const expanded = expand(m[1])
  if (expanded.includes('${')) throw new Error(`unresolved fragment in ${name}`)
  return expanded
}

const TARGETS = [
  ['blogIndexQuery', 'blogIndexQuery', {}],
  ['postBySlugQuery', 'postBySlugQuery', { slug: process.env.FIXTURE_SLUG || 'fixture-kitchen-sink' }],
  ['glossaryQuery', 'glossaryQuery', {}],
  ['gardenQuery', 'gardenQuery', {}],
  ['libraryQuery', 'libraryQuery', {}],
  ['allSeriesQuery', 'allSeriesQuery', {}],
  ['projectsQuery', 'projectsQuery', {}],
  ['galleriesQuery', 'galleriesQuery', {}],
  ['categoriesQuery', 'categoriesQuery', {}],
  ['resumeQuery', 'resumeQuery', {}],
  ['homePageQuery', 'homePageQuery', {}],
  ['settingsQuery', 'settingsQuery', {}],
]

const showPaths = process.argv.includes('--paths')
const allEncoded = new Set()

// ── Portable Text, specifically ───────────────────────────────────────────────
// `body[].style` is the structural one: @portabletext/react selects the renderer BY that
// string, and CustomPortableText decides what counts as a heading from it. If it is
// encoded, every heading in a draft preview renders as a paragraph and the TOC is empty.
if (process.argv.includes('--portable-text')) {
  const slug = process.env.FIXTURE_SLUG || 'fixture-kitchen-sink'
  // Through the REAL query. A bare `*[...][0].body` projection produces a different content
  // source map — measured: styles came back clean there and encoded here — so the only
  // honest probe is the query the page actually runs.
  const post = await client.fetch(q('postBySlugQuery'), { slug })
  const body = post?.body
  if (!body) { console.error(`no post with slug ${slug}`); process.exit(1) }
  console.log('per-block detail (only blocks whose style is encoded differ from the rest):')
  body.forEach((b, i) => {
    const t = vercelStegaSplit(b._type ?? '').cleaned
    if (t !== 'block') return
    const s = vercelStegaSplit(b.style ?? '')
    const first = vercelStegaSplit(b.children?.[0]?.text ?? '')
    console.log(`   [${String(i).padStart(2)}] style=${(s.cleaned || '<absent>').padEnd(10)} ${s.encoded ? 'ENCODED' : 'clean  '}  text=${first.encoded ? 'ENCODED' : 'clean  '}  "${first.cleaned.slice(0, 40)}"`)
  })
  const tally = (label, values) => {
    const rows = {}
    for (const v of values) {
      if (typeof v !== 'string') continue
      const { cleaned, encoded } = vercelStegaSplit(v)
      const k = `${cleaned} ${encoded ? 'ENCODED' : 'clean'}`
      rows[k] = (rows[k] ?? 0) + 1
    }
    console.log(`\n${label}`)
    for (const [k, n] of Object.entries(rows).sort()) console.log(`   ${n}×  ${k}`)
  }
  console.log(`## Portable Text structure on /blog/${slug}, drafts perspective`)
  tally('block _type', body.map((b) => b._type))
  tally('block style', body.filter((b) => vercelStegaSplit(b._type ?? '').cleaned === 'block').map((b) => b.style ?? '<absent>'))
  tally('block listItem', body.map((b) => b.listItem).filter(Boolean))
  tally('span marks', body.flatMap((b) => (b.children ?? []).flatMap((c) => c.marks ?? [])))
  tally('markDef _type', body.flatMap((b) => (b.markDefs ?? []).map((d) => d._type)))
  process.exit(0)
}

for (const [label, name, params] of TARGETS) {
  let data
  try {
    data = await client.fetch(q(name), params)
  } catch (e) {
    console.log(`\n## ${label}\n  FETCH FAILED: ${e.message}`)
    continue
  }
  const out = new Map()
  walk(data, [], out)
  const encoded = [...out.entries()].filter(([, r]) => r.encoded > 0)
  console.log(`\n## ${label} — ${out.size} string paths, ${encoded.length} encoded`)
  for (const [path, r] of encoded) {
    allEncoded.add(path.replace(/\[\]/g, '[]'))
    if (showPaths) console.log(`   ENCODED  ${path}  (${r.encoded}×)  e.g. "${r.sample}"`)
  }
  if (!showPaths) {
    const leaves = [...new Set(encoded.map(([p]) => p.split('.').filter((s) => s !== '[]').at(-1)))].sort()
    console.log(`   fields: ${leaves.join(', ') || '(none)'}`)
  }
}

console.log(`\n## Every encoded leaf field name, across all queries`)
const leaves = [...new Set([...allEncoded].map((p) => p.split('.').filter((s) => s !== '[]').at(-1)))].sort()
console.log(leaves.join(', '))
