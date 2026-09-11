'use client'

import { useArticle } from '@/components/article/ArticleProvider'
import { ReaderMenu, type ReaderMenuProps } from '@/components/article/ReaderMenu'
import type { ArticleUiCopy } from '@/lib/cms/defaults/articleUi'
import { FOCUS } from '@/lib/ui'
import { ChevronDown } from 'lucide-react'
// components/article/ArticleToc.tsx — the one table of contents.
// Desktop: sticky sidebar (rendered by the page in the right column).
// Mobile: a <details> list under the header. Both carry the reader menu button.

type Props = {
  copy: ArticleUiCopy
  menu: ReaderMenuProps
  variant: 'sidebar' | 'mobile'
  /** Pre-redacted on the server by reviewerSummary(). Never the raw reviewer objects --
      this is a client component, so anything passed here reaches the RSC payload. */
  reviewedBy?: string | null
  /**
   * 3.6. Titles only, in the order they appear in the body list. Deliberately NOT the full
   * source objects: the sidebar is 220px wide and a well-cited post can carry fifteen
   * citations, so the column shows a count and the titles, and each one links to its full
   * entry at the bottom of the article. One canonical rendering, two volumes -- the same
   * rule 3.3 applies to status.
   */
  sources?: string[]
}

function SourcesBlock({ copy, sources, className }: { copy: ArticleUiCopy; sources: string[]; className: string }) {
  if (!sources.length) return null
  return (
    <details className={className}>
      <summary className={`cursor-pointer list-none font-sans text-xs text-stone-400 hover:text-stone-100 flex items-center justify-between gap-2 rounded-sm ${FOCUS}`}>
        {copy.header.sourcesLabel.replace('{n}', String(sources.length))}
        <ChevronDown size={14} className="shrink-0" aria-hidden="true" />
      </summary>
      {/* Bounded: the sidebar is a fixed-height sticky column, and an open list of fifteen
          citations would otherwise push past the viewport with no way to scroll it. Safe to
          use overflow here -- unlike the TOC container, nothing inside this list renders an
          absolutely positioned panel that the implied overflow-x would clip. */}
      <ol className="mt-2.5 space-y-1.5 list-none m-0 p-0 max-h-[40vh] overflow-y-auto pr-1">
        {sources.map((title, i) => (
          <li key={i} className="flex items-baseline gap-2">
            <span className="font-mono text-xs text-stone-400 shrink-0">[{i + 1}]</span>
            {/* A plain anchor, not scrollTo: these are real ids in the document and a
                reader should be able to copy the link to a single citation. */}
            <a
              href={`#source-${i + 1}`}
              className={`flex-1 min-w-0 font-sans text-xs text-stone-400 hover:text-stone-100 leading-snug transition-colors rounded-sm ${FOCUS}`}
            >
              {title}
            </a>
          </li>
        ))}
      </ol>
    </details>
  )
}

function TocList({ copy }: { copy: ArticleUiCopy }) {
  const { headings, activeId, scrollTo } = useArticle()
  return (
    <ol className="space-y-1.5 list-none m-0 p-0">
      {headings.map((h) => {
        const active = h.id === activeId
        return (
          <li key={h.id} className={h.level === 3 ? 'pl-4' : ''}>
            <button
              type="button"
              onClick={() => scrollTo(h.id)}
              aria-current={active ? 'true' : undefined}
              className={`w-full text-left flex items-baseline gap-2 py-1 text-sm font-sans rounded-sm transition-colors ${FOCUS} ${active ? 'text-white' : 'text-stone-400 hover:text-stone-100'}`}
            >
              <span className="flex-1 leading-snug">{h.text}</span>
              {h.minutes > 0 && <span className="text-xs text-stone-400 shrink-0">{h.minutes} {copy.toc.minutesSuffix}</span>}
            </button>
          </li>
        )
      })}
    </ol>
  )
}

export function ArticleToc({ copy, menu, variant, reviewedBy, sources = [] }: Props) {
  const { headings } = useArticle()

  if (variant === 'sidebar') {
    return (
      <aside className="hidden lg:block" aria-label={copy.toc.title} data-toc="sidebar" data-print-hide>
        {/* The heading row must stay OUTSIDE the scrolling element. `overflow-y: auto` makes
            overflow-x compute to `auto` as well, which clipped the ReaderMenu's absolutely
            positioned panel — it rendered but 18 of its 24 controls were not hit-testable. */}
        <div className="sticky top-24 max-h-[calc(100vh-7rem)] flex flex-col">
          {/* flex-wrap: "Contents" plus the "Reading options" chip exceed the 220px sidebar
              column, which truncated the chip's label. It now drops to its own line instead. */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4 shrink-0">
            <h2 className="section-label min-w-0">{copy.toc.title}</h2>
            <ReaderMenu {...menu} />
          </div>
          {headings.length > 0 ? (
            <div className="overflow-y-auto min-h-0 pr-2">
              <TocList copy={copy} />
            </div>
          ) : null}
          {/* Document-level status, kept quiet: §1.4 found that the largest article-quality
              system in existence (Wikipedia) hides its grade from readers entirely and
              surfaces only claim-level marks. This is the detail tier from 3.3 -- the
              header carries the badge, this carries who. */}
          {reviewedBy && (
            <p className="mt-5 pt-4 border-t border-edge-faint shrink-0 font-sans text-xs text-stone-400 leading-relaxed">
              {copy.credibility.reviewedByLabel}: <span className="text-stone-300">{reviewedBy}</span>
            </p>
          )}
          {/* 3.6: at the bottom of the column, below who checked it. Closed by default --
              the column's job is orientation, and an open list of fifteen citations would
              push the headings out of the sticky viewport. */}
          <SourcesBlock copy={copy} sources={sources} className="mt-4 pt-4 border-t border-edge-faint shrink-0" />
        </div>
      </aside>
    )
  }

  return (
    <div className="lg:hidden mb-8 flex items-start gap-3" data-print-hide>
      {headings.length > 0 ? (
        <details className="flex-1 rounded-xl border border-edge bg-surface-veil px-4 py-3" open={headings.length <= 8} data-toc="mobile">
          <summary className={`cursor-pointer section-label list-none flex items-center justify-between ${FOCUS} rounded-sm`}>
            {copy.toc.mobileTitle}
            <ChevronDown size={16} className="text-stone-400" aria-hidden="true" />
          </summary>
          <div className="mt-3"><TocList copy={copy} /></div>
          {/* The same detail the sidebar carries. Without this the Contents surface
              differs between breakpoints -- found by the verifier. */}
          {reviewedBy && (
            <p className="mt-4 pt-3 border-t border-edge-faint font-sans text-xs text-stone-400 leading-relaxed">
              {copy.credibility.reviewedByLabel}: <span className="text-stone-300">{reviewedBy}</span>
            </p>
          )}
          {/* The Contents surface must not differ between breakpoints -- the verifier caught
              exactly that when reviewedBy shipped to the sidebar only. */}
          <SourcesBlock copy={copy} sources={sources} className="mt-4 pt-3 border-t border-edge-faint" />
        </details>
      ) : <div className="flex-1" />}
      <ReaderMenu {...menu} />
    </div>
  )
}
