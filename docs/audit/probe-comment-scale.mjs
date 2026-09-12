// docs/audit/probe-comment-scale.mjs
//
// Phase 8.6 asks "what happens at 1,000 comments, and at 50,000" and the honest answer is
// not available by reasoning. This measures it.
//
// It seeds N comment documents shaped the way the real schema would be shaped, times the
// four queries a comment system actually runs, and deletes them again. Everything it writes
// is a DRAFT, so none of it is visible to the published site at any point, and the deletion
// is verified rather than assumed.
//
//   node docs/audit/probe-comment-scale.mjs            # dry run, says what it would do
//   node docs/audit/probe-comment-scale.mjs --apply    # seed, measure, delete, verify
//   node docs/audit/probe-comment-scale.mjs --delete   # clean up after an interrupted run
//
// --count=N to change the volume (default 1000). Writes are batched; Sanity's mutation
// endpoint refuses very large transactions, and 1000 creates in one request is over the
// line.
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
const CDN = `https://${P}.apicdn.sanity.io/v2025-02-27`
const AUTH = { Authorization: `Bearer ${T}`, 'Content-Type': 'application/json' }

const MODE = process.argv.includes('--delete') ? 'delete' : process.argv.includes('--apply') ? 'apply' : 'dry'
const COUNT = Number((process.argv.find((a) => a.startsWith('--count=')) || '').split('=')[1]) || 1000
const PREFIX = 'drafts.scale-comment-'

const mutate = (mutations) =>
  fetch(`${API}/data/mutate/${D}?returnIds=false&returnDocuments=false`, {
    method: 'POST', headers: AUTH, body: JSON.stringify({ mutations }),
  }).then(async (r) => {
    const j = await r.json()
    if (!r.ok) throw new Error(`${r.status} ${JSON.stringify(j).slice(0, 300)}`)
    return j
  })

/** Time a GROQ query and report latency AND payload size — both matter for a page. */
async function time(label, query, { cdn = false, params = {} } = {}) {
  const base = cdn ? CDN : API
  const url = `${base}/data/query/${D}?perspective=raw&query=${encodeURIComponent(query)}` +
    Object.entries(params).map(([k, v]) => `&$${k}=${encodeURIComponent(JSON.stringify(v))}`).join('')
  const runs = []
  let bytes = 0, n = 0
  for (let i = 0; i < 3; i++) {
    const t0 = Date.now()
    const res = await fetch(url, { headers: AUTH })
    const text = await res.text()
    runs.push(Date.now() - t0)
    bytes = text.length
    try { const j = JSON.parse(text); n = Array.isArray(j.result) ? j.result.length : (typeof j.result === 'number' ? j.result : 1) } catch { /* keep 0 */ }
  }
  runs.sort((a, b) => a - b)
  console.log(`  ${label.padEnd(46)} ${String(runs[1]).padStart(5)}ms median of 3 (${runs[0]}-${runs[2]})  ${String(n).padStart(5)} rows  ${(bytes / 1024).toFixed(1)}KB`)
  return { label, median: runs[1], n, kb: Math.round((bytes / 1024) * 10) / 10 }
}

// `_id match "prefix-*"`, NOT `_id in path("prefix-**")`.
//
// This is the bug that mattered most in this file. `**` in a Sanity path is a SEGMENT glob,
// and ids like `drafts.scale-comment-0` are two segments -- `drafts` and `scale-comment-0` --
// so `drafts.scale-comment-**` matched nothing. The delete removed nothing, the verification
// used THE SAME PATTERN, counted the same nothing, and printed "0 probe documents remain
// (must be 0)". 5,000 documents sat in the dataset behind a clean report until a different
// query happened to count them.
//
// A check that shares its pattern with the operation it is checking is not a check.
const MATCH = `_type == "comment" && _id match "${PREFIX}*"`

async function existing() {
  const r = await fetch(`${API}/data/query/${D}?perspective=raw&query=${encodeURIComponent(`count(*[${MATCH}])`)}`, { headers: AUTH }).then((x) => x.json())
  return r.result ?? 0
}

async function removeAll() {
  // In PASSES. A delete-by-query has a per-request ceiling -- measured at 1,000 here -- so
  // one call does not finish the job and a 200 response is not evidence that it did.
  for (let i = 0; i < 60; i++) {
    const before = await existing()
    if (before === 0) break
    await mutate([{ delete: { query: `*[${MATCH}][0...1000]` } }])
    const after = await existing()
    if (after === before) { console.log(`  cleanup stalled at ${after}; delete them by hand`); break }
  }
  const left = await existing()
  // A second, INDEPENDENT count. If the id pattern is ever wrong again, the total will
  // disagree with it and say so rather than quietly agreeing.
  const total = await fetch(`${API}/data/query/${D}?perspective=raw&query=${encodeURIComponent('count(*[_type == "comment"])')}`, { headers: AUTH }).then((x) => x.json()).then((x) => x.result ?? 0)
  console.log(`  cleanup: ${left} probe documents remain (must be 0); ${total} comment documents of any kind in the dataset`)
  return left
}

// ── the shape a real comment document would have ───────────────────
const LABELS = ['question', 'correction', 'addition', 'disagreement', 'praise']
const WORDS = ('the switch floods unknown unicast out of every port in the vlan except the ingress ' +
  'port then learns from the reply which is why an unfamiliar failure can look like a working link ' +
  'and why the mtu mismatch only shows up once a packet is large enough to need fragmenting').split(' ')

function body(i) {
  const len = 25 + (i % 60)
  const out = []
  for (let w = 0; w < len; w++) out.push(WORDS[(i * 7 + w) % WORDS.length])
  return out.join(' ') + '.'
}

async function main() {
  if (!P || !D || !T) { console.error('missing project id, dataset or SANITY_API_WRITE_TOKEN'); process.exit(1) }

  if (MODE === 'delete') { await removeAll(); return }

  const posts = await fetch(`${API}/data/query/${D}?perspective=raw&query=${encodeURIComponent('*[_type == "post" && defined(slug.current)]{_id, "slug": slug.current}')}`, { headers: AUTH })
    .then((r) => r.json()).then((r) => r.result ?? [])
  if (!posts.length) { console.error('no posts to attach comments to'); process.exit(1) }

  if (MODE === 'dry') {
    console.log(`DRY RUN. Would create ${COUNT} draft comment documents across ${posts.length} posts,`)
    console.log(`time four queries against them, then delete every "${PREFIX}*" document and verify 0 remain.`)
    console.log(`Currently present: ${await existing()}. Re-run with --apply.`)
    return
  }

  const before = await existing()
  if (before) { console.log(`  ${before} left over from an earlier run; clearing first`); await removeAll() }

  // ── seed ─────────────────────────────────────────────────────────
  console.log(`\nSeeding ${COUNT} draft comments across ${posts.length} posts…`)
  const ids = []
  const docs = []
  for (let i = 0; i < COUNT; i++) {
    const post = posts[i % posts.length]
    const id = `${PREFIX}${i}`
    ids.push(id)
    // Every fifth comment is a reply to the one before it -- 8.3's one level of threading,
    // so the query being timed is the real recursive-ish one and not a flat list.
    const isReply = i % 5 === 4
    docs.push({
      _id: id,
      _type: 'comment',
      post: { _type: 'reference', _ref: post._id, _weak: true },
      ...(isReply ? { parent: { _type: 'reference', _ref: `${PREFIX}${i - 1}`, _weak: true } } : {}),
      label: LABELS[i % LABELS.length],
      authorName: i % 7 === 0 ? null : `Commenter ${i}`,
      anonymous: i % 7 === 0,
      email: `probe+${i}@example.invalid`,
      body: body(i),
      status: i % 50 === 0 ? 'removed' : 'published',
      createdAt: new Date(Date.now() - i * 60000).toISOString(),
    })
  }
  const BATCH = 100
  const t0 = Date.now()
  for (let i = 0; i < docs.length; i += BATCH) {
    await mutate(docs.slice(i, i + BATCH).map((d) => ({ createOrReplace: d })))
    process.stdout.write(`\r  ${Math.min(i + BATCH, docs.length)}/${docs.length}`)
  }
  console.log(`\n  seeded in ${((Date.now() - t0) / 1000).toFixed(1)}s (${BATCH} per request)`)

  const results = []
  try {
    const busiest = posts[0]._id
    console.log(`\n## The four queries a comment system actually runs, at ${COUNT} comments\n`)

    // 1. The article page. Everything published for ONE post, newest first, with the
    //    author's display name resolved and replies attached. This is the hot path.
    results.push(await time('article page: one post, threaded, published only',
      `*[_type == "comment" && post._ref == $p && status == "published" && !defined(parent)] | order(createdAt desc) {
         _id, label, authorName, anonymous, body, createdAt,
         "replies": *[_type == "comment" && parent._ref == ^._id && status == "published"] | order(createdAt asc) { _id, label, authorName, anonymous, body, createdAt }
       }`, { params: { p: busiest } }))

    // 2. The same, through the CDN, which is what a real page would use.
    results.push(await time('article page, via apicdn',
      `*[_type == "comment" && post._ref == $p && status == "published" && !defined(parent)] | order(createdAt desc) {
         _id, label, authorName, anonymous, body, createdAt,
         "replies": *[_type == "comment" && parent._ref == ^._id && status == "published"] | order(createdAt asc) { _id, label, authorName, anonymous, body, createdAt }
       }`, { cdn: true, params: { p: busiest } }))

    // 3. The index card's count, for every post at once.
    results.push(await time('blog index: comment count for every post',
      `*[_type == "post"]{ "n": count(*[_type == "comment" && post._ref == ^._id && status == "published"]) }`))

    // 4. Moderation: the newest 50 across the whole site, which is the Studio view.
    results.push(await time('moderation: newest 50 across all posts',
      `*[_type == "comment"] | order(createdAt desc)[0...50]{ _id, label, authorName, body, status, createdAt, "post": post->title }`))

    // 5. The pathological one: EVERY comment, unpaginated. Worth knowing because it is
    //    what a naive export or a badly written Studio view does.
    results.push(await time('everything, unpaginated (the naive export)',
      `*[_type == "comment"]{ _id, label, authorName, body, status, createdAt }`))
  } finally {
    console.log('')
    await removeAll()
  }

  console.log('\n## Read it as\n')
  const page = results[1]
  console.log(`  A post carrying ~${Math.round(COUNT / posts.length)} comments serves its thread in ${page.median}ms and ${page.kb}KB through the CDN.`)
  console.log(`  The per-post count query for the whole index: ${results[2].median}ms.`)
  console.log(`  A moderation page of 50: ${results[3].median}ms.`)
  console.log(`  The unpaginated read of all ${COUNT}: ${results[4].median}ms and ${results[4].kb}KB -- the number that says whether pagination is optional.`)
}

await main()
