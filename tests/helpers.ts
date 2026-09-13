import type { APIRequestContext } from '@playwright/test'
// tests/helpers.ts
// Shared fixtures for the Playwright specs.

/**
 * Slug of the newest published post, read from the sitemap so it never hard-codes content.
 *
 * EVERY non-article route under /blog has to be excluded here by hand, and forgetting one is
 * a silent, confusing failure rather than an error: adding /blog/digests to the sitemap made
 * this return "digests", so three article tests navigated to the digest archive and reported
 * that an article had no progress bar, no table of contents and no reader menu. The page was
 * fine. The helper was pointing at the wrong page.
 *
 * If you add another section under /blog, add it to BOTH patterns below.
 */
export async function firstPostSlug(request: APIRequestContext): Promise<string | null> {
  const xml = await (await request.get('/sitemap.xml')).text()
  const match = xml.match(/<loc>[^<]*\/blog\/(?!series(?:\/|<)|digests(?:\/|<)|osi-model|feed)([^<\/]+)<\/loc>/)
  return match?.[1] ?? null
}

/**
 * Every published post slug, from the sitemap. `firstPostSlug` checks one article, which
 * is how a second <h1> sat on /blog/the-creation-of-my-personal-portfolio-site unnoticed:
 * it was not the first post, so no test ever opened it.
 */
export async function allPostSlugs(request: APIRequestContext): Promise<string[]> {
  const xml = await (await request.get('/sitemap.xml')).text()
  const re = /<loc>[^<]*\/blog\/(?!series(?:\/|<)|digests(?:\/|<)|osi-model|feed)([^<\/]+)<\/loc>/g
  return [...xml.matchAll(re)].map((m) => m[1])
}
