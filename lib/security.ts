// lib/security.ts
// Small, dependency-free helpers for server actions and route handlers.
// Rate limiting is per-instance memory: good enough to stop casual abuse on
// Vercel functions. Swap `rateLimit` for @upstash/ratelimit if you need it global.

import { headers } from 'next/headers'

/** Escape a string for safe interpolation into HTML (emails, RSS, JSON-LD). */
export function escapeHtml(input: unknown): string {
  return String(input ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Best-effort client IP from proxy headers. Falls back to "unknown". */
export async function getClientIp(): Promise<string> {
  const h = await headers()
  const fwd = h.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0]!.trim()
  return h.get('x-real-ip') ?? h.get('cf-connecting-ip') ?? 'unknown'
}

type Bucket = { count: number; resetAt: number }
const buckets = new Map<string, Bucket>()

/**
 * Sliding-window-ish limiter. Returns { ok: false, retryAfterSeconds } when exceeded.
 * @param key   something like `booking:${ip}`
 * @param limit max hits per window
 * @param windowMs window length
 */
export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; remaining: number; retryAfterSeconds: number } {
  const now = Date.now()
  // Opportunistic cleanup so the map never grows unbounded.
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) if (b.resetAt < now) buckets.delete(k)
  }
  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 }
  }
  if (bucket.count >= limit) {
    return { ok: false, remaining: 0, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) }
  }
  bucket.count += 1
  return { ok: true, remaining: limit - bucket.count, retryAfterSeconds: 0 }
}

/** Constant-time string compare for secrets. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let out = 0
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return out === 0
}
