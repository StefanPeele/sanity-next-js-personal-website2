// lib/feed.ts
// Shared loader for /blog/feed.xml and /blog/feed.json. Uses the plain client
// (no request context) so the routes can be statically cached.

import { client } from '@/sanity/lib/client'
import { feedQuery } from '@/sanity/lib/queries'
import { portableTextToHtml } from '@/lib/portableTextToHtml'
import { portableTextToPlain } from '@/lib/reading'
import { absoluteUrl, articleTypeMeta, SITE } from '@/lib/site'

export type FeedItem = {
  id: string
  title: string
  url: string
  publishedAt: string
  updatedAt: string
  summary: string
  html: string
  categories: string[]
  imageUrl: string | null
}

export const FEED_META = {
  title: `${SITE.name} — Blog`,
  description: 'Network engineering, infrastructure, and field notes from Stefan Peele.',
  homePage: absoluteUrl('/blog'),
  rss: absoluteUrl('/blog/feed.xml'),
  json: absoluteUrl('/blog/feed.json'),
  language: 'en-US',
  author: { name: SITE.name, url: SITE.url, email: SITE.email },
}

export const FEED_CACHE_CONTROL = 'public, s-maxage=3600, stale-while-revalidate=86400'

export async function loadFeedItems(): Promise<FeedItem[]> {
  const posts = await client.fetch(feedQuery, {}, { next: { revalidate: 3600 } })
  return (posts ?? [])
    .filter((p) => Boolean(p.slug && p.title && p.publishedAt))
    .map((p) => {
      const url = absoluteUrl(`/blog/${p.slug}`)
      const lane = articleTypeMeta(p.articleType)?.label
      const categories = [...(p.categories ?? []).filter((c): c is string => Boolean(c))]
      if (lane) categories.unshift(lane)
      const summary = p.excerpt?.trim() || portableTextToPlain(p.body as never).slice(0, 280)
      return {
        id: p._id,
        title: p.title ?? 'Untitled',
        url,
        publishedAt: p.publishedAt!,
        updatedAt: p._updatedAt,
        summary,
        html: portableTextToHtml(p.body, url),
        categories,
        imageUrl: p.imageUrl ?? null,
      }
    })
}
