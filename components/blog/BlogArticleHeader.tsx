import Image from 'next/image'
import Link from 'next/link'
import { articleTypeMeta } from '@/lib/site'
import { ArrowLeft } from 'lucide-react'
import { DEFAULT_ARTICLE_UI, type ArticleUiCopy } from '@/lib/cms/defaults/articleUi'
import type { VocabEntry } from '@/lib/cms/defaults/taxonomy'
import { heroImageUrl } from '@/components/article/heroImage'
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
  readTime: number
  categories: string[]
  articleType?: string | null
  mainImageUrl?: string | null
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
  readTime,
  categories,
  articleType,
  mainImageUrl,
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

  const metaItems = [
    publishDate,
    // Beside the published date, not replacing it. A reader who wants to know how old the
    // thinking is needs both -- "updated last month" hides a post first written in 2019.
    // The badge row above carries the strongest REVIEW claim; the revision is a different
    // axis and belongs here, next to the date it is about.
    ...(updatedDate && revisionFlag ? [labels.revisedLabels[revisionFlag].replace('{date}', updatedDate)] : []),
    n(labels.readTimeLabel, readTime),
    ...(sourceCount > 0 ? [n(labels.sourcesLabel, sourceCount)] : []),
    ...(conceptCardCount > 0 ? [n(labels.cardsLabel, conceptCardCount)] : []),
  ]

  return (
    <header className="w-full border-b border-edge-faint pt-10 pb-10 md:pt-14 md:pb-12">
      {/* Mirrors the reading grid in [slug]/page.tsx so the header lines up with the prose
          column. Centring on the viewport instead leaves it ~130px right of the body text,
          because the grid reserves a 220px column for the table of contents. */}
      <div className="relative max-w-6xl mx-auto px-6 lg:grid lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-12">
        <div className="w-full max-w-[36rem] mx-auto">
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

        {/* D4: the h1 alone breaks out of the 36rem prose measure at lg. `text-wrap: balance`
            (styles/index.css) can only pick better breaks inside the width it is given, and 576px
            is too narrow for a display title at 48px -- it split "Week / 2:" across a line. An
            explicit width is required because max-width would still resolve to the parent's 576px.
            Measured: 4 lines/192px -> 3 lines/144px at 1440, no overflow, tablet and mobile
            unchanged because it is gated at lg. */}
        <h1 className="text-3xl md:text-4xl lg:text-5xl lg:w-[52rem] lg:max-w-none font-serif font-bold text-white mb-5 leading-tight tracking-tight">
          {title}
        </h1>

        <div className="flex items-center gap-3 font-sans text-sm text-stone-400 flex-wrap">
          {metaItems.map((item, i) => (
            <span key={item} className="flex items-center gap-3">
              {i > 0 && <span className="text-stone-600" aria-hidden="true">·</span>}
              {item}
            </span>
          ))}
        </div>

        {mainImageUrl && (
          <figure className="mt-8">
            <Image
              src={heroImageUrl(mainImageUrl)}
              alt={mainImageAlt ?? ''}
              width={1600}
              height={900}
              priority
              unoptimized
              sizes="(min-width: 768px) 36rem, 100vw"
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
