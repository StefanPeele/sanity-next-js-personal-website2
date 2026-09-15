// docs/audit/probe-revalidate-route.mjs
//
// The Sanity webhook target, end to end: it refuses an unsigned caller, it revalidates the
// right paths under a real signature, and the path it used to live at is gone.
//
// It began as probe-revalidate-alias.mjs, proving that /api/draft-mode/enable/revalidate and
// /api/revalidate were the SAME handler rather than two copies -- the argument for deleting
// the alias, measured once rather than asserted. That was verified 8/8 on 2026-09-14, the
// webhook was repointed, and the alias was deleted on 2026-09-15. The alias assertions are
// now the reverse: the old path must 404.
//
//   node docs/audit/probe-revalidate-route.mjs                    # a local `next start`
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
const RETIRED = '/api/draft-mode/enable/revalidate'
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
const unsigned = await post(CANONICAL)
check(`${CANONICAL} refuses an unsigned POST with 401`, unsigned.status === 401, `status=${unsigned.status}`)

const retired = await post(RETIRED)
check(`${RETIRED} is retired and 404s`, retired.status === 404, `status=${retired.status}`)

const control = await post(CONTROL)
check('a route that does not exist reads as 404 (control)', control.status === 404, `status=${control.status}`)

console.log(`\n── signed: the route does the work it claims ─────────────────────────`)
// A `post` payload with a slug exercises the widest branch of RULES: fixed paths, feeds and
// the slug template.
const payload = { _type: 'post', slug: { current: 'osi-model' } }
const a = await post(CANONICAL, { signed: true, payload })

check(`${CANONICAL} revalidates`, a.status === 200 && a.json?.revalidated === true, `status=${a.status}`)
const paths = a.json?.paths ?? []
check('and names the paths it revalidated', paths.length >= 8, `${paths.length} paths`)
check('including the article the payload named', paths.includes('/blog/osi-model'), paths.join(', '))
check('and the feeds, which a publish has to move', paths.includes('/blog/feed.xml') && paths.includes('/sitemap.xml'))
check('nothing answers with the retired alias header any more', a.alias === null, `x-revalidate-alias=${a.alias}`)

console.log(`\n  paths: ${paths.join(', ')}`)
console.log(`\n${pass} passed, ${fail} failed  (${BASE})`)
process.exit(fail ? 1 : 0)
