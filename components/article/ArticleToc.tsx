'use client'

import { useArticle } from '@/components/article/ArticleProvider'
import { ReaderMenu, type ReaderMenuProps } from '@/components/article/ReaderMenu'
import type { ArticleUiCopy } from '@/lib/cms/defaults/articleUi'
import { FOCUS } from '@/lib/ui'
import { ChevronDown } from 'lucide-react'
// components/article/ArticleToc.tsx — the one table of contents.
// Desktop: sticky sidebar (rendered by the page in the right column).
// Mobile: a <details> list under the header. Both carry the reader menu button.

type Props = { copy: ArticleUiCopy; menu: ReaderMenuProps; variant: 'sidebar' | 'mobile' }

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

export function ArticleToc({ copy, menu, variant }: Props) {
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
        </details>
      ) : <div className="flex-1" />}
      <ReaderMenu {...menu} />
    </div>
  )
}
