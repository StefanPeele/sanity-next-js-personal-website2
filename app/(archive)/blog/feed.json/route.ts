import { absoluteUrl } from '@/lib/site'
import { FEED_CACHE_CONTROL, FEED_META, loadFeedItems } from '@/lib/feed'
// app/(archive)/blog/feed.json/route.ts — JSON Feed 1.1 (https://jsonfeed.org/version/1.1)

export const revalidate = 3600

export async function GET() {
  const items = await loadFeedItems()

  const feed = {
    version: 'https://jsonfeed.org/version/1.1',
    title: FEED_META.title,
    home_page_url: FEED_META.homePage,
    feed_url: FEED_META.json,
    description: FEED_META.description,
    icon: absoluteUrl('/icon.png'),
    favicon: absoluteUrl('/favicon.ico'),
    language: FEED_META.language,
    authors: [{ name: FEED_META.author.name, url: FEED_META.author.url }],
    items: items.map((item) => ({
      id: item.url,
      url: item.url,
      title: item.title,
      content_html: item.html,
      summary: item.summary,
      image: item.imageUrl ?? undefined,
      date_published: new Date(item.publishedAt).toISOString(),
      date_modified: new Date(item.updatedAt).toISOString(),
      authors: [{ name: FEED_META.author.name, url: FEED_META.author.url }],
      tags: item.categories,
    })),
  }

  return new Response(JSON.stringify(feed, null, 2), {
    headers: {
      'Content-Type': 'application/feed+json; charset=utf-8',
      'Cache-Control': FEED_CACHE_CONTROL,
    },
  })
}
