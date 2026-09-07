import Image from 'next/image'
import Link from 'next/link'
import { articleTypeMeta } from '@/lib/site'
import { ArrowLeft } from 'lucide-react'
import { DEFAULT_ARTICLE_UI, type ArticleUiCopy } from '@/lib/cms/defaults/articleUi'
import type { VocabEntry } from '@/lib/cms/defaults/taxonomy'
import { heroImageUrl } from '@/components/article/heroImage'
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
  readTime: number
  categories: string[]
  articleType?: string | null
  mainImageUrl?: string | null
  mainImageAlt?: string | null
  lqip?: string | null
  sourceCount?: number
  conceptCardCount?: number
  reviewStatus?: string | null
  labels?: ArticleUiCopy['header']
  lanes?: VocabEntry[]
}

export function BlogArticleHeader({
  title,
  publishDate,
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

  const reviewBadge = reviewStatus === 'seeking-review'
    ? { label: labels.reviewBadges.seekingReview, className: 'text-amber-400 border-amber-500/30' }
    : reviewStatus === 'expert-verified'
    ? { label: labels.reviewBadges.expertVerified, className: 'text-emerald-400 border-emerald-500/30' }
    : null

  const metaItems = [
    publishDate,
    n(labels.readTimeLabel, readTime),
    ...(sourceCount > 0 ? [n(labels.sourcesLabel, sourceCount)] : []),
    ...(conceptCardCount > 0 ? [n(labels.cardsLabel, conceptCardCount)] : []),
  ]

  return (
    <header className="w-full border-b border-white/5 pt-10 pb-10 md:pt-14 md:pb-12">
      {/* Mirrors the reading grid in [slug]/page.tsx so the header lines up with the prose
          column. Centring on the viewport instead leaves it ~130px right of the body text,
          because the grid reserves a 220px column for the table of contents. */}
      <div className="relative max-w-6xl mx-auto px-6 lg:grid lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-12">
        <div className="w-full max-w-[36rem] mx-auto">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 min-h-[24px] py-1 text-stone-300 hover:text-white font-sans text-sm transition-colors mb-7 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 rounded-sm"
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
              <span key={cat} className="font-sans text-xs px-3 py-1.5 rounded-full border border-white/10 text-stone-400">
                {cat}
              </span>
            ))}
          </div>
        )}

        <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-white mb-5 leading-tight tracking-tight">
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
              className="w-full h-auto rounded-lg border border-white/10"
            />
          </figure>
        )}
        </div>
      </div>
    </header>
  )
}
