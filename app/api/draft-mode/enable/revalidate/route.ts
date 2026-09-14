import type { NextRequest } from 'next/server'
import { POST as revalidate } from '@/app/api/revalidate/route'
// app/api/draft-mode/enable/revalidate/route.ts
//
// TEMPORARY ALIAS, added 2026-09-14. DELETE THIS FILE, and the directory it sits in, once
// the Sanity webhook points at /api/revalidate. It exists only so the webhook keeps working
// across the deploy window: the URL Stefan set in Sanity on 2026-09-14 is this one, and the
// handler moved to /api/revalidate in the same deploy.
//
// It DELEGATES rather than redirecting. A 307 would preserve the method and the body, but
// only if the caller follows redirects, and Sanity's webhook delivery is not documented to.
// The signature is computed over the body, so a caller that followed a redirect by re-POSTing
// would also have to re-send the body byte for byte. Calling the handler in process has none
// of those failure modes and behaves identically by construction -- it IS the handler.
//
// The warning below is the signal for when this file can go: once the webhook is repointed,
// the Vercel log stops showing it, and a quiet log means nothing is left on the old URL.
export async function POST(req: NextRequest) {
  console.warn(
    '[revalidate] Served through the deprecated alias /api/draft-mode/enable/revalidate. ' +
      'Point the Sanity webhook at /api/revalidate, then delete app/api/draft-mode/enable/revalidate/route.ts.',
  )
  const res = await revalidate(req)
  res.headers.set('x-revalidate-alias', 'deprecated')
  return res
}
