// docs/audit/probe-revalidate-alias.mjs
//
// Proves that /api/draft-mode/enable/revalidate and /api/revalidate are the SAME handler,
// not two copies of one, and that both still refuse an unsigned caller.
//
// Why it exists: the alias is temporary, and the argument for deleting it is that the
// webhook can be repointed without changing behaviour. That argument is only worth
// anything if someone measured it once. Run this before repointing the webhook, and again
// after deleting the alias (the alias lines then correctly report 404).
//
//   node docs/audit/probe-revalidate-alias.mjs                    # a local `next start`
//   BASE=https://stefanpeele.com node ...                         # needs the production secret
//
// .env.local's SANITY_REVALIDATE_SECRET is NOT production's -- a signed request built from it
// is accepted locally and refused with 401 by production, measured 2026-09-12. So the signed
// half of this probe is local-only until Vercel's Production value is pasted into .env.local.
//
// A SIGNED probe really does revalidate the paths it names -- it is exactly what a publish
// does -- so it is safe, but it is not free against production. The default is local.
//
import { encodeSignatureHeader } from '@sanity/webhook'
import fs from 'node:fs'

const BASE = process.env.BASE || 'http://127.0.0.1:3000'
const CANONICAL = '/api/revalidate'
const ALIAS = '/api/draft-mode/enable/revalidate'
const CONTROL = '/api/revalidate-control-does-not-exist'

// The secret lives in .env.local for a local server; Vercel holds the production one.
let secret = process.env.SANITY_REVALIDATE_SECRET
if (!secret && fs.existsSync('.env.local')) {
  const m = fs.readFileSync('.env.local', 'utf8').match(/^SANITY_REVALIDATE_SECRET=(.*)$/m)
  secret = m?.[1]?.trim().replace(/^["']|["']$/g, '')
}
if (!secret) {
  console.error('SANITY_REVALIDATE_SECRET is not set and .env.local does not carry it.')
  process.exit(2)
}

let pass = 0, fail = 0
const check = (label, cond, detail = '') => {
  if (cond) { pass++; console.log(`  ok   ${label}${detail ? '  ' + detail : ''}`) }
  else { fail++; console.log(`  BAD  ${label}${detail ? '  ' + detail : ''}`) }
}

const post = async (path, { signed = false, payload = {} } = {}) => {
  const body = JSON.stringify(payload)
  const headers = { 'content-type': 'application/json' }
  if (signed) headers['sanity-webhook-signature'] = await encodeSignatureHeader(body, Date.now(), secret)
  const res = await fetch(`${BASE}${path}`, { method: 'POST', headers, body, redirect: 'manual' })
  const text = await res.text()
  let json = null
  try { json = JSON.parse(text) } catch {}
  return { status: res.status, json, text, alias: res.headers.get('x-revalidate-alias') }
}

console.log(`\n── unsigned: the endpoint must exist and must refuse ─────────────────`)
for (const path of [CANONICAL, ALIAS]) {
  const r = await post(path)
  check(`${path} refuses an unsigned POST with 401`, r.status === 401, `status=${r.status}`)
}
const control = await post(CONTROL)
check('a route that does not exist reads as 404 (control)', control.status === 404, `status=${control.status}`)

console.log(`\n── signed: the alias must do the same work as the canonical route ────`)
// A `post` payload with a slug exercises the widest branch of RULES: fixed paths, feeds and
// the slug template. If the alias were a stale copy, this is where the two would diverge.
const payload = { _type: 'post', slug: { current: 'osi-model' } }
const a = await post(CANONICAL, { signed: true, payload })
const b = await post(ALIAS, { signed: true, payload })

check(`${CANONICAL} revalidates`, a.status === 200 && a.json?.revalidated === true, `status=${a.status}`)
check(`${ALIAS} revalidates`, b.status === 200 && b.json?.revalidated === true, `status=${b.status}`)

const pathsA = JSON.stringify(a.json?.paths ?? null)
const pathsB = JSON.stringify(b.json?.paths ?? null)
check('both revalidate exactly the same paths', pathsA === pathsB && pathsA !== 'null',
  `${(a.json?.paths ?? []).length} paths`)
check('the alias is labelled as one', b.alias === 'deprecated', `x-revalidate-alias=${b.alias}`)
check('the canonical route is not labelled as an alias', a.alias === null, `x-revalidate-alias=${a.alias}`)

console.log(`\n  paths: ${(a.json?.paths ?? []).join(', ')}`)
console.log(`\n${pass} passed, ${fail} failed  (${BASE})`)
process.exit(fail ? 1 : 0)
