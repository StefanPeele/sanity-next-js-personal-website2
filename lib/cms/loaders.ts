import 'server-only'
import { cache } from 'react'
import { sanityFetch } from '@/sanity/lib/live'
import { errorPagesQuery, navigationQuery, siteSettingsCopyQuery, taxonomyQuery } from '@/sanity/lib/queries-site'
import { withDefaults } from './withDefaults'
import { DEFAULT_ERROR_PAGES, DEFAULT_NAVIGATION, DEFAULT_SETTINGS, DEFAULT_TAXONOMY } from './defaults'
import type { ErrorPagesCopy, NavigationData, SettingsCopy, TaxonomyData } from './defaults'
// lib/cms/loaders.ts
// Server-only, request-deduped loaders. Every loader merges the Studio document over
// code defaults, so an empty or missing document never breaks a page.

export type SiteSettings = SettingsCopy & {
  email?: string | null
  github?: string | null
  linkedin?: string | null
  trello?: string | null
  instagram?: string | null
  bluesky?: string | null
  gitbook?: string | null
  calendlyUrl?: string | null
  footerHeadlinePrefix?: string | null
  footerHeadlineHighlight?: string | null
  footerHeadlineSuffix?: string | null
  ogImage?: { url?: string | null } | null
}

/**
 * Fetch a singleton and merge it over its defaults, degrading instead of throwing.
 *
 * withDefaults already covers a missing or empty document, but a *thrown* fetch —
 * an expired token, a revoked session, Sanity being unreachable — used to propagate
 * out of the root layout and 500 every route on the site, including /studio, which
 * needs no Sanity data to render at all. Copy is not worth an outage: fall back to
 * the code defaults and keep the page up.
 *
 * The failure is logged rather than swallowed, so a degraded render is visible in
 * the server logs instead of looking like healthy output with stale copy.
 */
async function fetchWithDefaults<D>(query: string, defaults: D, label: string): Promise<D> {
  try {
    const { data } = await sanityFetch({ query, stega: false })
    return withDefaults(data, defaults)
  } catch (err) {
    console.error(`[cms] ${label} fetch failed — rendering with code defaults.`, err)
    return defaults
  }
}

export const getNavigation = cache(async (): Promise<NavigationData> =>
  fetchWithDefaults(navigationQuery, DEFAULT_NAVIGATION, 'navigation'))

export const getSettings = cache(async (): Promise<SiteSettings> =>
  fetchWithDefaults(siteSettingsCopyQuery, DEFAULT_SETTINGS as SiteSettings, 'settings'))

export const getSiteChrome = cache(async () => {
  const [settings, navigation] = await Promise.all([getSettings(), getNavigation()])
  return { settings, navigation }
})

export const getTaxonomy = cache(async (): Promise<TaxonomyData> =>
  fetchWithDefaults(taxonomyQuery, DEFAULT_TAXONOMY, 'taxonomy'))

export const getErrorPages = cache(async (): Promise<ErrorPagesCopy> =>
  fetchWithDefaults(errorPagesQuery, DEFAULT_ERROR_PAGES, 'errorPages'))

/**
 * Generic loader for page singletons. Each page passes its own query + defaults
 * so typegen keeps the query static and the return type is the defaults' type.
 */
export async function getCopy<D>(query: string, defaults: D): Promise<D> {
  return fetchWithDefaults(query, defaults, 'page copy')
}
