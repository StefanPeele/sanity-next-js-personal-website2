// lib/feedItems.ts
// The pure post -> feed item transform, with NO Sanity client import.
//
// Split out of lib/feed.ts so it can be unit-tested. lib/feed.ts imports the Sanity client,
// which throws at module load without NEXT_PUBLIC_SANITY_DATASET, and Playwright does not
// load .env.local into the test process -- only into the Next server it spawns. Importing
// the transform therefore used to crash the whole suite at collection time.
import { portableTextToHtml } from '@/lib/portableTextToHtml'
import { portableTextToPlain } from '@/lib/reading'
import { effectiveReviewStatus, revisionState, statusPlainText } from '@/lib/status'
import { absoluteUrl, articleTypeMeta } from '@/lib/site'
import type { FeedQueryResult } from '@/sanity.types'

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
  /** Plain text, because a feed reader has no colour and no icons to lean on. */
  status: string | null
}


export function toFeedItems(posts: FeedQueryResult | null | undefined): FeedItem[] {
  return (posts ?? [])
    .filter((p) => Boolean(p.slug && p.title && p.publishedAt))
    .map((p) => {
      const url = absoluteUrl(`/blog/${p.slug}`)
      const lane = articleTypeMeta(p.articleType)?.label
      const categories = [...(p.categories ?? []).filter((c): c is string => Boolean(c))]
      if (lane) categories.unshift(lane)
      const summary = p.excerpt?.trim() || portableTextToPlain(p.body as never).slice(0, 280)
      // Phase 3.3's feed tier. Prefixed into the summary rather than added as a field
      // nothing reads: RSS and JSON Feed have no slot for an epistemic status, so the
      // only way a subscriber sees it is in text they already read.
      const revision = revisionState(p.lastRevised, p.correctionKinds, p.publishedAt)
      const status = statusPlainText(effectiveReviewStatus(p.reviewStatus, revision.flag))
      return {
        id: p._id,
        title: p.title ?? 'Untitled',
        url,
        publishedAt: p.publishedAt!,
        // 3.7. A reader's feed app treats date_modified as "this changed, look again", so
        // _updatedAt alone re-surfaces the post for a typo fix. The changelog date is the
        // only one that means a material revision; _updatedAt stays as the fallback so an
        // unrevised post still carries a sane timestamp.
        updatedAt: revision.date ?? p._updatedAt,
        summary: status ? `[${status}] ${summary}` : summary,
        status,
        html: portableTextToHtml(p.body, url),
        categories,
        imageUrl: p.imageUrl ?? null,
      }
    })
}
