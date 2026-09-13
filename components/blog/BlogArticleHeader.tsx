import Image from 'next/image'
import Link from 'next/link'
import { articleTypeMeta } from '@/lib/site'
import { ArrowLeft } from 'lucide-react'
import { DEFAULT_ARTICLE_UI, type ArticleUiCopy } from '@/lib/cms/defaults/articleUi'
import type { VocabEntry } from '@/lib/cms/defaults/taxonomy'
import { HERO_HEIGHT, HERO_WIDTH, heroCropUrl, heroImageUrl } from '@/components/article/heroImage'
import { FOCUS } from '@/lib/ui'
import { reviewFlags, type RevisionFlag } from '@/lib/status'
// components/blog/BlogArticleHeader.tsx
// Text-first article header, left-aligned to the prose measure.
//
// This replaced a full-bleed parallax hero (min-h-75vh, scroll-linked image/content/opacity
// transforms, and a canvas colour sample of the LQIP). Measured cost of that version: a full
// viewport before any writing, the title set over a photograph, and a sidebar table of contents
// that started at y=785 — so the first thing a reader's eye landed on was the image, and the
// second was the TOC, not the article. No hooks remain, so this is a server component now.

interface BlogArticleHeaderProps {
  title: string
  /** Already formatted with lib/dates formatDate. */
  publishDate: string
  /**
   * 3.7 + 3B. Already formatted, and already decided: the page passes these ONLY when there
   * is a material post-publication revision. Never `_updatedAt`, which fires on a typo fix.
   * `revisionFlag` picks the verb — a post that was WRONG says "Corrected", not "Updated".
   */
  updatedDate?: string | null
  revisionFlag?: RevisionFlag | null
  categories: string[]
  articleType?: string | null
  mainImageUrl?: string | null
  /** 7.3 F. The RAW image object, so Sanity can crop to 21:9 from the editor's hotspot. */
  mainImage?: Parameters<typeof heroCropUrl>[0]
  mainImageAlt?: string | null
  lqip?: string | null
  sourceCount?: number
  conceptCardCount?: number
  reviewStatus?: string[] | null
  labels?: ArticleUiCopy['header']
  lanes?: VocabEntry[]
}

export function BlogArticleHeader({
  title,
  publishDate,
  updatedDate,
  revisionFlag,
  categories,
  articleType,
  mainImageUrl,
  mainImage,
  mainImageAlt,
  lqip,
  sourceCount = 0,
  conceptCardCount = 0,
  reviewStatus,
  labels = DEFAULT_ARTICLE_UI.header,
  lanes,
}: BlogArticleHeaderProps) {
  const typeMeta = articleTypeMeta(articleType, lanes)
  const n = (t: string, v: number) => t.replace('{n}', String(v))

  // ONE flag, the strongest that applies. 3.3 gives the header the "full label" tier and
  // §1.4 says document-level status goes quiet -- the whole set renders further down in
  // CredibilitySection, and the Contents column carries who and when.
  const headerFlag = reviewFlags(reviewStatus, 1)[0] ?? null
  const reviewBadge = headerFlag
    ? { label: headerFlag.label, className: `${headerFlag.color} ${headerFlag.bg.split(' ')[0]}` }
    : null

  // 7.3 F. undefined when the post has no image object or no asset reference.
  const heroCrop = heroCropUrl(mainImage)

  const metaItems = [
    publishDate,
    // Beside the published date, not replacing it. A reader who wants to know how old the
    // thinking is needs both -- "updated last month" hides a post first written in 2019.
    // The badge row above carries the strongest REVIEW claim; the revision is a different
    // axis and belongs here, next to the date it is about.
    ...(updatedDate && revisionFlag ? [labels.revisedLabels[revisionFlag].replace('{date}', updatedDate)] : []),
    // 7.5: the reading time is NOT here any more. It sits above the Contents column, so a
    // reader meets it as they settle in rather than as a cost advertised before they start.
    // See ArticleToc.
    ...(sourceCount > 0 ? [n(labels.sourcesLabel, sourceCount)] : []),
    ...(conceptCardCount > 0 ? [n(labels.cardsLabel, conceptCardCount)] : []),
  ]

  return (
    <header className="w-full border-b border-edge-faint pt-10 pb-10 md:pt-14 md:pb-12">
      {/* Mirrors the reading grid in [slug]/page.tsx so the header lines up with the prose
          column. Centring on the viewport instead leaves it ~130px right of the body text,
          because the grid reserves a 220px column for the table of contents. */}
      {/* 7.2. Mirrors the article grid exactly -- same max-width, same padding, same
          columns, same gap -- so the header and the reading column sit on one axis and the
          margin column starts at the same x on both.
          The inner block widens from 36rem to 52rem, the same `wide` tier the apparatus
          below the article uses. Header and prose are CONCENTRIC, not flush: measured at
          1440 the header runs 170-1002 and the prose 250-921, both centred on 586. The
          title deliberately overhangs the prose on both sides; it does not share its left
          edge, and a future change that expects it to will be wrong. */}
      <div className="relative max-w-[80rem] mx-auto px-6 lg:grid lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-12">
        {/* 7.3 F and 7.4 B. This wrapper is the FULL reading column (964px at 1440). The
            title and the hero now sit on it, and everything else stays on the 52rem `wide`
            tier inside it. Header and prose stay concentric rather than flush: the 52rem
            blocks are centred in this column, so the title overhangs the prose by 66px on
            each side deliberately. */}
        <div className="w-full">
        <div className="w-full max-w-[52rem] mx-auto">
        <Link
          href="/blog"
          className={`inline-flex items-center gap-2 min-h-[24px] py-1 text-stone-300 hover:text-white font-sans text-sm transition-colors mb-7 ${FOCUS} rounded-sm`}
        >
          <ArrowLeft size={14} aria-hidden /> {labels.backLabel}
        </Link>

        {(typeMeta || reviewBadge || categories.length > 0) && (
          <div className="flex flex-wrap gap-2 mb-5">
            {typeMeta && (
              <span
                className="font-sans text-xs px-3 py-1.5 rounded-full border"
                style={{ color: typeMeta.color, borderColor: typeMeta.bg.replace('0.12', '0.4') }}
              >
                {typeMeta.label}
              </span>
            )}
            {reviewBadge && (
              <span className={`font-sans text-xs px-3 py-1.5 rounded-full border ${reviewBadge.className}`}>
                {reviewBadge.label}
              </span>
            )}
            {categories.map((cat) => (
              <span key={cat} className="font-sans text-xs px-3 py-1.5 rounded-full border border-edge text-stone-400">
                {cat}
              </span>
            ))}
          </div>
        )}

        </div>

        {/* 7.4 option B. The title joins the full reading column instead of the 52rem tier.
            B sets a 43-character title on one line where the current width breaks it across
            two, which is the clearest wrapping defect on the page, and saves a line on the
            77-character title as well. It never costs a line on any of the three measured.
            Rejected: C, flush with the prose measure, which costs a line on the two longer
            titles and reads as a title that ran out of room rather than one that was set. */}
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-white mb-5 leading-tight tracking-tight text-balance">
          {title}
        </h1>

        <div className="w-full max-w-[52rem] mx-auto">
        <div className="flex items-center gap-3 font-sans text-sm text-stone-400 flex-wrap">
          {metaItems.map((item, i) => (
            <span key={item} className="flex items-center gap-3">
              {i > 0 && <span className="text-stone-600" aria-hidden="true">·</span>}
              {item}
            </span>
          ))}
        </div>

        </div>

        {/* 7.3 option F. Full reading column at 21:9, cropped by Sanity from the editor's
            hotspot. No object-fit and no fixed-height container: the URL already carries the
            aspect, so `w-full h-auto` renders exactly the bytes that were fetched.
            heroCrop falls back to the uncropped 16:9 URL when a post has no image object,
            which keeps older callers working. */}
        {(heroCrop || mainImageUrl) && (
          <figure className="mt-8">
            <Image
              src={heroCrop ?? heroImageUrl(mainImageUrl!)}
              alt={mainImageAlt ?? ''}
              width={HERO_WIDTH}
              height={heroCrop ? HERO_HEIGHT : 900}
              priority
              unoptimized
              sizes="(min-width: 1024px) 60rem, 100vw"
              placeholder={lqip ? 'blur' : 'empty'}
              blurDataURL={lqip ?? undefined}
              className="w-full h-auto rounded-lg border border-edge"
            />
          </figure>
        )}
        </div>
      </div>
    </header>
  )
}
