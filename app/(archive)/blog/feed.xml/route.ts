import { escapeHtml } from '@/lib/security'
import { FEED_CACHE_CONTROL, FEED_META, loadFeedItems } from '@/lib/feed'
// app/(archive)/blog/feed.xml/route.ts — RSS 2.0 with full content:encoded.

export const revalidate = 3600

function rfc822(iso: string): string {
  const d = new Date(iso)
  return isNaN(d.getTime()) ? new Date().toUTCString() : d.toUTCString()
}

function cdata(html: string): string {
  return `<![CDATA[${html.replace(/]]>/g, ']]]]><![CDATA[>')}]]>`
}

function mimeFromUrl(url: string): string {
  const ext = url.split('?')[0]!.split('.').pop()?.toLowerCase()
  if (ext === 'png') return 'image/png'
  if (ext === 'webp') return 'image/webp'
  if (ext === 'gif') return 'image/gif'
  if (ext === 'svg') return 'image/svg+xml'
  return 'image/jpeg'
}

export async function GET() {
  const items = await loadFeedItems()
  const lastBuild = items[0]?.updatedAt ?? new Date().toISOString()

  const entries = items
    .map((item) => {
      const categories = item.categories.map((c) => `      <category>${escapeHtml(c)}</category>`).join('\n')
      const enclosure = item.imageUrl
        ? `      <enclosure url="${escapeHtml(item.imageUrl)}" length="0" type="${mimeFromUrl(item.imageUrl)}" />\n`
        : ''
      return `    <item>
      <title>${escapeHtml(item.title)}</title>
      <link>${escapeHtml(item.url)}</link>
      <guid isPermaLink="true">${escapeHtml(item.url)}</guid>
      <pubDate>${rfc822(item.publishedAt)}</pubDate>
      <dc:creator>${escapeHtml(FEED_META.author.name)}</dc:creator>
      <description>${escapeHtml(item.summary)}</description>
${categories ? categories + '\n' : ''}${enclosure}      <content:encoded>${cdata(item.html)}</content:encoded>
    </item>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeHtml(FEED_META.title)}</title>
    <link>${escapeHtml(FEED_META.homePage)}</link>
    <description>${escapeHtml(FEED_META.description)}</description>
    <language>${FEED_META.language}</language>
    <lastBuildDate>${rfc822(lastBuild)}</lastBuildDate>
    <generator>stefanpeele.com (Next.js)</generator>
    <atom:link href="${escapeHtml(FEED_META.rss)}" rel="self" type="application/rss+xml" />
    <atom:link href="${escapeHtml(FEED_META.json)}" rel="alternate" type="application/feed+json" />
    <managingEditor>${escapeHtml(FEED_META.author.email)} (${escapeHtml(FEED_META.author.name)})</managingEditor>
    <webMaster>${escapeHtml(FEED_META.author.email)} (${escapeHtml(FEED_META.author.name)})</webMaster>
${entries}
  </channel>
</rss>
`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': FEED_CACHE_CONTROL,
    },
  })
}
