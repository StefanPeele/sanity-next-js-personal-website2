import { NextResponse } from 'next/server'
import { client } from '@/sanity/lib/client'
// app/api/health/route.ts — uptime probe. Pings Sanity with a trivial query.

export const dynamic = 'force-dynamic'

export async function GET() {
  const startedAt = Date.now()
  let sanity: 'ok' | 'error' = 'ok'
  try {
    await client.fetch<number>('count(*[_type == "settings"])', {}, { cache: 'no-store' })
  } catch {
    sanity = 'error'
  }
  const body = {
    status: sanity === 'ok' ? 'operational' : 'degraded',
    checks: { sanity, latencyMs: Date.now() - startedAt },
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'local',
    branch: process.env.VERCEL_GIT_COMMIT_REF ?? 'local',
    region: process.env.VERCEL_REGION ?? 'local',
    timestamp: new Date().toISOString(),
  }
  return NextResponse.json(body, {
    status: sanity === 'ok' ? 200 : 503,
    headers: { 'Cache-Control': 'no-store' },
  })
}
