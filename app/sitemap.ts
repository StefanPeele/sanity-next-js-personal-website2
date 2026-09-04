import type { MetadataRoute } from 'next'
import { client } from '@/sanity/lib/client'
import { sitemapQuery } from '@/sanity/lib/queries'
import { absoluteUrl } from '@/lib/site'
import { isReservedSlug } from '@/lib/site'
import type { SitemapQueryResult } from '@/sanity.types'
// app/sitemap.ts
// Static routes + every published slug from Sanity. lastModified comes from `updated`
// (coalesce of _updatedAt / publishedAt / lastTended, see sitemapQuery).

export const revalidate = 3600

type Entry = MetadataRoute.Sitemap[number]

const STATIC_ROUTES: Array<[path: string, priority: number, freq: Entry['changeFrequency']]> = [
  ['/',                    1.0, 'weekly'],
  ['/blog',                0.9, 'daily'],
  ['/blog/series',         0.6, 'weekly'],
  ['/blog/osi-model',      0.7, 'monthly'],
  ['/garden',              0.8, 'daily'],
  ['/graph',               0.5, 'weekly'],
  ['/library',             0.6, 'weekly'],
  ['/glossary',            0.5, 'monthly'],
  ['/paths',               0.5, 'monthly'],
  ['/review',              0.3, 'monthly'],
  ['/projects',            0.9, 'weekly'],
  ['/resume',              0.8, 'monthly'],
  ['/photography',         0.8, 'weekly'],
  ['/photography/albums',  0.6, 'weekly'],
  ['/services',            0.7, 'monthly'],
  ['/contact',             0.6, 'yearly'],
  ['/now',                 0.6, 'weekly'],
  ['/uses',                0.4, 'monthly'],
]

function toDate(value?: string | null): Date | undefined {
  if (!value) return undefined
  const d = new Date(value)
  return isNaN(d.getTime()) ? undefined : d
}

function entries(
  items: Array<{ slug: string | null; updated?: string | null }> | null | undefined,
  prefix: string,
  priority: number,
  changeFrequency: Entry['changeFrequency'],
): Entry[] {
  return (items ?? [])
    .filter((i): i is { slug: string; updated?: string | null } => Boolean(i.slug))
    .map((i) => ({
      url: absoluteUrl(`${prefix}${i.slug}`),
      lastModified: toDate(i.updated),
      changeFrequency,
      priority,
    }))
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const statics: Entry[] = STATIC_ROUTES.map(([path, priority, changeFrequency]) => ({
    url: absoluteUrl(path),
    lastModified: now,
    changeFrequency,
    priority,
  }))

  let data: SitemapQueryResult | null = null
  try {
    data = await client.fetch<SitemapQueryResult>(sitemapQuery, {}, { next: { revalidate: 3600 } })
  } catch (err) {
    console.error('[sitemap] Sanity fetch failed, serving static routes only', err)
  }
  if (!data) return statics

  // Glossary is a single page; the most recently updated term stamps it.
  const glossaryUpdated = (data.glossary ?? [])
    .map((g) => toDate(g.updated))
    .filter((d): d is Date => Boolean(d))
    .sort((a, b) => b.getTime() - a.getTime())[0]
  const glossaryEntry = statics.find((s) => s.url.endsWith('/glossary'))
  if (glossaryEntry && glossaryUpdated) glossaryEntry.lastModified = glossaryUpdated

  // Page documents live at the root (/resume, /services, ...). Skip ones already static.
  const staticPaths = new Set(STATIC_ROUTES.map(([p]) => p))
  const pageEntries = entries(data.pages, '/', 0.6, 'monthly').filter(
    (e) => !staticPaths.has(new URL(e.url).pathname) && !isReservedSlug(new URL(e.url).pathname.slice(1)),
  )

  return [
    ...statics,
    ...entries(data.posts,     '/blog/',        0.8, 'monthly'),
    ...entries(data.series,    '/blog/series/', 0.6, 'weekly'),
    ...entries(data.notes,     '/garden/',      0.6, 'weekly'),
    ...entries(data.projects,  '/projects/',    0.7, 'monthly'),
    ...entries(data.galleries, '/photography/', 0.6, 'monthly'),
    ...pageEntries,
  ]
}
