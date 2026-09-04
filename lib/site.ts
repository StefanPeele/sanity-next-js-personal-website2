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

/** Primary navigation. Order matters: work first, writing second, personal last. */
export const PRIMARY_NAV = [
  { name: 'Projects',    href: '/projects',    desc: 'Case studies and infrastructure' },
  { name: 'Writing',     href: '/blog',        desc: 'Editorial, deep dives, field notes' },
  { name: 'Garden',      href: '/garden',      desc: 'Notes in progress' },
  { name: 'Library',     href: '/library',     desc: 'What I read' },
  { name: 'Photography', href: '/photography', desc: 'Visual archive and galleries' },
  { name: 'Resume',      href: '/resume',      desc: 'Professional history' },
] as const

/** Secondary destinations for the footer and sitemap. */
export const SECONDARY_NAV = [
  { name: 'Knowledge Graph', href: '/graph' },
  { name: 'Services',        href: '/services' },
  { name: 'Contact',         href: '/contact' },
  { name: 'Now',             href: '/now' },
  { name: 'Uses',            href: '/uses' },
  { name: 'OSI Reference',   href: '/blog/osi-model' },
] as const

/** Article lanes shared by the schema, directory, header, graph and OG image. */
export const ARTICLE_TYPES = {
  'perspective':       { label: 'Perspective',       short: 'PERSP', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', description: 'Opinion and analysis on where the field is going.' },
  'concept-deep-dive': { label: 'Concept Deep Dive', short: 'DEEP',  color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  description: 'One idea, explained until it clicks.' },
  'field-notes':       { label: 'Field Notes',       short: 'FIELD', color: '#34d399', bg: 'rgba(52,211,153,0.12)',  description: 'What actually happened in the lab or on the job.' },
  'transmission':      { label: 'Transmission',      short: 'TX',    color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  description: 'Short signals, updates, and announcements.' },
} as const

export type ArticleType = keyof typeof ARTICLE_TYPES

export function articleTypeMeta(type?: string | null) {
  return (type && ARTICLE_TYPES[type as ArticleType]) || null
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
  'studio', 'api', 'sitemap.xml', 'robots.txt', 'manifest.webmanifest', 'humans.txt', 'sw.js',
])

export function isReservedSlug(slug?: string | null): boolean {
  return !!slug && RESERVED_SLUGS.has(slug.toLowerCase())
}
