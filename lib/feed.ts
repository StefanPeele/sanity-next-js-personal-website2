// lib/feed.ts
// Shared loader for /blog/feed.xml and /blog/feed.json. Uses the plain client
// (no request context) so the routes can be statically cached.

import { client } from '@/sanity/lib/client'
import { feedQuery } from '@/sanity/lib/queries'
import { absoluteUrl, SITE } from '@/lib/site'
import { toFeedItems, type FeedItem } from '@/lib/feedItems'

export { toFeedItems }
export type { FeedItem }

export const FEED_META = {
  title: `${SITE.name} — Blog`,
  description: 'Network engineering, infrastructure, and lab notes from Stefan Peele.',
  homePage: absoluteUrl('/blog'),
  rss: absoluteUrl('/blog/feed.xml'),
  json: absoluteUrl('/blog/feed.json'),
  language: 'en-US',
  author: { name: SITE.name, url: SITE.url, email: SITE.email },
}

export const FEED_CACHE_CONTROL = 'public, s-maxage=3600, stale-while-revalidate=86400'

export async function loadFeedItems(): Promise<FeedItem[]> {
  const posts = await client.fetch(feedQuery, {}, { next: { revalidate: 3600 } })
  return toFeedItems(posts)
}
