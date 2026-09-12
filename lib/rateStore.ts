import 'server-only'
import { createHash } from 'node:crypto'
import { getWriteClient } from '@/sanity/lib/writeClient'
// lib/rateStore.ts
// A rate limiter that survives a cold start.
//
// `rateLimit` in lib/security.ts is a module-level Map. On Vercel every serverless instance
// has its own module scope, so that limit is per instance and resets whenever a new one
// boots -- its own header says "Swap rateLimit for @upstash/ratelimit if you need it
// global." For the newsletter that is tolerable, because the worst case is a few duplicate
// confirmation emails. For an open comment box it is the difference between a limit and the
// appearance of one, so Phase 8 treats a durable limiter as a prerequisite.
//
// Sanity rather than a new dependency: the site is Vercel-only by standing decision, the
// write client already exists, and a spam wave becomes visible in the Studio rather than
// invisible in someone else's dashboard. The cost is one round trip per attempt, which is
// the right price for the one code path where a stranger can write.

/** Hash the client identifier. A raw IP is personal data and never needs to be stored. */
function hashKey(action: string, client: string): string {
  const salt = process.env.SANITY_REVALIDATE_SECRET ?? 'sp-rate'
  return createHash('sha256').update(`${salt}:${action}:${client}`).digest('hex').slice(0, 32)
}

export interface RateResult {
  ok: boolean
  remaining: number
  retryAfterSeconds: number
  /** True when the limiter could not reach its store. See the note on `fallbackOpen`. */
  degraded: boolean
}

/**
 * Consume one unit from a durable bucket.
 *
 * `fallbackOpen` decides what happens when Sanity is unreachable. It defaults to FALSE for
 * comments: if the limiter cannot work, a comment is refused rather than waved through,
 * because the failure mode of the other choice is an unlimited open box during exactly the
 * outage nobody is watching. Callers where refusing is worse than allowing can opt in.
 */
export async function rateLimitDurable(
  action: string,
  client: string,
  limit: number,
  windowMs: number,
  { fallbackOpen = false }: { fallbackOpen?: boolean } = {},
): Promise<RateResult> {
  const write = getWriteClient()
  if (!write) {
    return { ok: fallbackOpen, remaining: 0, retryAfterSeconds: Math.ceil(windowMs / 1000), degraded: true }
  }

  const key = hashKey(action, client)
  const id = `rateBucket.${key}`
  const now = Date.now()

  try {
    const existing = await write.fetch<{ _id: string; count: number; resetAt: string } | null, { id: string }>(
      `*[_id == $id][0]{ _id, count, resetAt }`,
      { id },
    )

    const expired = !existing || new Date(existing.resetAt ?? 0).getTime() < now
    if (expired) {
      const resetAt = new Date(now + windowMs).toISOString()
      await write.createOrReplace({
        _id: id, _type: 'rateBucket', key, count: 1, resetAt, updatedAt: new Date(now).toISOString(),
      })
      return { ok: true, remaining: limit - 1, retryAfterSeconds: 0, degraded: false }
    }

    if ((existing.count ?? 0) >= limit) {
      const retry = Math.max(1, Math.ceil((new Date(existing.resetAt).getTime() - now) / 1000))
      return { ok: false, remaining: 0, retryAfterSeconds: retry, degraded: false }
    }

    // `inc` rather than a read-modify-write of the number we just read: two requests landing
    // together would otherwise both write count+1 and the limit would leak by one per
    // collision, which is exactly the traffic shape a limiter exists for.
    await write.patch(id).inc({ count: 1 }).set({ updatedAt: new Date(now).toISOString() }).commit()
    return { ok: true, remaining: Math.max(0, limit - (existing.count ?? 0) - 1), retryAfterSeconds: 0, degraded: false }
  } catch (err) {
    console.error('[rateStore] failed', err)
    return { ok: fallbackOpen, remaining: 0, retryAfterSeconds: 60, degraded: true }
  }
}

/** Salted hash of a client identifier, for storing beside a comment so it can be blocked. */
export function clientHash(client: string): string {
  return hashKey('client', client)
}
