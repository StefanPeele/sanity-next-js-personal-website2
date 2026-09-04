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

export const getNavigation = cache(async (): Promise<NavigationData> => {
  const { data } = await sanityFetch({ query: navigationQuery, stega: false })
  return withDefaults(data, DEFAULT_NAVIGATION)
})

export const getSettings = cache(async (): Promise<SiteSettings> => {
  const { data } = await sanityFetch({ query: siteSettingsCopyQuery, stega: false })
  return withDefaults(data, DEFAULT_SETTINGS as SiteSettings)
})

export const getSiteChrome = cache(async () => {
  const [settings, navigation] = await Promise.all([getSettings(), getNavigation()])
  return { settings, navigation }
})

export const getTaxonomy = cache(async (): Promise<TaxonomyData> => {
  const { data } = await sanityFetch({ query: taxonomyQuery, stega: false })
  return withDefaults(data, DEFAULT_TAXONOMY)
})

export const getErrorPages = cache(async (): Promise<ErrorPagesCopy> => {
  const { data } = await sanityFetch({ query: errorPagesQuery, stega: false })
  return withDefaults(data, DEFAULT_ERROR_PAGES)
})

/**
 * Generic loader for page singletons. Each page passes its own query + defaults
 * so typegen keeps the query static and the return type is the defaults' type.
 */
export async function getCopy<D>(query: string, defaults: D): Promise<D> {
  const { data } = await sanityFetch({ query, stega: false })
  return withDefaults(data, defaults)
}
