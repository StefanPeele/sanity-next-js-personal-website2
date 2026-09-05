// lib/site.ts
// Single source of truth for site-wide constants that are not CMS-driven.
// Anything here is safe to import from server and client code.

export const SITE = {
  name: 'Stefan Peele',
  legalName: 'Stefan Peele II',
  title: 'Stefan Peele | Digital Archive',
  url: 'https://stefanpeele.com',
  description:
    'Network engineering, infrastructure, and photography from Stefan Peele — NJIT student, network engineer associate, and photographer in Newark, NJ.',
  location: { city: 'Newark', region: 'NJ', lat: 40.7423, lng: -74.1791 },
  school: 'New Jersey Institute of Technology',
  email: 'swp9@njit.edu',
  bookingEmail: 'bookings@stefanpeele.com',
  handles: {
    github: 'https://github.com/StefanPeele',
    gitbook: 'https://stefs-documentation.gitbook.io/stefs-documentation-docs/',
    instagram: 'https://instagram.com/stefs.lens',
  },
  /**
   * Scheduling link for photography consultations.
   * Leave empty until a real link exists — buttons fall back to the inquiry form.
   */
  calendlyUrl: '',
} as const

import { DEFAULT_NAVIGATION } from '@/lib/cms/defaults/navigation'
import { DEFAULT_TAXONOMY, type VocabEntry } from '@/lib/cms/defaults/taxonomy'

/** @deprecated Read navigation from getNavigation() (lib/cms/loaders). Kept so existing imports compile. */
export const PRIMARY_NAV = DEFAULT_NAVIGATION.primary.map((l) => ({ name: l.label, href: l.path ?? '/', desc: l.description ?? '' }))
/** @deprecated Read navigation from getNavigation() (lib/cms/loaders). */
export const SECONDARY_NAV = DEFAULT_NAVIGATION.secondary.map((l) => ({ name: l.label, href: l.path ?? '/' }))

export type ArticleType = 'perspective' | 'concept-deep-dive' | 'field-notes' | 'transmission'
type LaneMeta = { label: string; short: string; color: string; bg: string; description: string }

function laneFromVocab(v: VocabEntry): LaneMeta {
  const color = v.color ?? '#d6d3d1'
  const r = parseInt(color.slice(1, 3), 16), g = parseInt(color.slice(3, 5), 16), b = parseInt(color.slice(5, 7), 16)
  return { label: v.label, short: v.short ?? v.label, color, bg: `rgba(${r},${g},${b},0.12)`, description: v.description ?? '' }
}

/** Article lanes. Labels/colours are editable in Studio → Site → Taxonomy; keys are fixed. */
export const ARTICLE_TYPES: Record<ArticleType, LaneMeta> = Object.fromEntries(
  DEFAULT_TAXONOMY.articleLanes.map((v) => [v.key, laneFromVocab(v)]),
) as Record<ArticleType, LaneMeta>

/** Lane metadata, optionally overridden by a taxonomy document's articleLanes. */
export function articleTypeMeta(type?: string | null, lanes?: VocabEntry[] | null): LaneMeta | null {
  if (!type) return null
  const override = lanes?.find((l) => l.key === type)
  if (override) return laneFromVocab(override)
  return ARTICLE_TYPES[type as ArticleType] ?? null
}

/** Absolute URL helper for metadata, feeds and JSON-LD. */
export function absoluteUrl(path = '/') {
  return new URL(path, SITE.url).toString()
}

/**
 * Top-level path segments owned by real routes. A generic Sanity "page" document
 * must never be served at one of these, or its prerender overwrites the real route.
 */
export const RESERVED_SLUGS = new Set<string>([
  'blog', 'garden', 'graph', 'library', 'glossary', 'paths', 'review',
  'projects', 'resume', 'photography', 'services', 'contact', 'now', 'uses', 'delivery',
  'studio', 'api', 'offline', 'sitemap.xml', 'robots.txt', 'manifest.webmanifest', 'humans.txt', 'sw.js',
])

export function isReservedSlug(slug?: string | null): boolean {
  return !!slug && RESERVED_SLUGS.has(slug.toLowerCase())
}
