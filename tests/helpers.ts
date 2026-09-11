import type { APIRequestContext } from '@playwright/test'
// tests/helpers.ts
// Shared fixtures for the Playwright specs.

/**
 * Slug of the newest published post, read from the sitemap so it never hard-codes
 * content. Skips /blog/series, /blog/osi-model and the feed routes.
 */
export async function firstPostSlug(request: APIRequestContext): Promise<string | null> {
  const xml = await (await request.get('/sitemap.xml')).text()
  const match = xml.match(/<loc>[^<]*\/blog\/(?!series(?:\/|<)|osi-model|feed)([^<\/]+)<\/loc>/)
  return match?.[1] ?? null
}

/**
 * Every published post slug, from the sitemap. `firstPostSlug` checks one article, which
 * is how a second <h1> sat on /blog/the-creation-of-my-personal-portfolio-site unnoticed:
 * it was not the first post, so no test ever opened it.
 */
export async function allPostSlugs(request: APIRequestContext): Promise<string[]> {
  const xml = await (await request.get('/sitemap.xml')).text()
  const re = /<loc>[^<]*\/blog\/(?!series(?:\/|<)|osi-model|feed)([^<\/]+)<\/loc>/g
  return [...xml.matchAll(re)].map((m) => m[1])
}
