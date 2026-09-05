'use client'

import { useArticle } from '@/components/article/ArticleProvider'
import { ReaderMenu, type ReaderMenuProps } from '@/components/article/ReaderMenu'
import type { ArticleUiCopy } from '@/lib/cms/defaults/articleUi'
// components/article/ArticleToc.tsx — the one table of contents.
// Desktop: sticky sidebar (rendered by the page in the right column).
// Mobile: a <details> list under the header. Both carry the reader menu button.

const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400'

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
              {h.minutes > 0 && <span className="text-xs text-stone-500 shrink-0">{h.minutes} {copy.toc.minutesSuffix}</span>}
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
      <aside className="hidden lg:block" aria-label={copy.toc.title} data-print-hide>
        <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2">
          <div className="flex items-center justify-between gap-2 mb-4">
            <h2 className="section-label">{copy.toc.title}</h2>
            <ReaderMenu {...menu} />
          </div>
          {headings.length > 0 ? <TocList copy={copy} /> : null}
        </div>
      </aside>
    )
  }

  return (
    <div className="lg:hidden mb-8 flex items-start gap-3" data-print-hide>
      {headings.length > 0 ? (
        <details className="flex-1 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3" open={headings.length <= 8}>
          <summary className={`cursor-pointer section-label list-none flex items-center justify-between ${FOCUS} rounded-sm`}>
            {copy.toc.mobileTitle}
            <span aria-hidden="true" className="text-stone-500 text-sm">▾</span>
          </summary>
          <div className="mt-3"><TocList copy={copy} /></div>
        </details>
      ) : <div className="flex-1" />}
      <ReaderMenu {...menu} />
    </div>
  )
}
