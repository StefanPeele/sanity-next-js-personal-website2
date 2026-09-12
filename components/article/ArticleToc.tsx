'use client'

import { useArticle } from '@/components/article/ArticleProvider'
import type { ArticleUiCopy } from '@/lib/cms/defaults/articleUi'
import { FOCUS } from '@/lib/ui'
import { ChevronDown } from 'lucide-react'
// components/article/ArticleToc.tsx — the one table of contents.
// Desktop: sticky sidebar (rendered by the page in the right column).
// Mobile: a <details> list under the header. Both carry the reader menu button.

type Props = {
  copy: ArticleUiCopy
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
  /**
   * 7.5. The reading time, moved out of the article header. The brief's reasoning is that
   * a figure in the header is a COST advertised before the reader has started, while the
   * same figure above the Contents is orientation: it is read at the moment someone is
   * deciding how to approach the piece, beside the section-by-section minutes that break
   * the same number down. Zero or absent renders nothing.
   *
   * The label is `copy.header.readTimeLabel` -- the same Studio string the header used --
   * rather than a new field, so the number cannot be phrased two ways on one page.
   */
  readTime?: number
}

/**
 * The reading readout. Before the reader has started it is the length of the piece (7.5);
 * once they are into it, it becomes what is LEFT and how far in they are (7.6).
 *
 * This is where 7.6's percentage lives. It is not beside the progress bar because a number
 * legible next to a 4px bar needs its own floating element, and the article gains no
 * floating widgets. Here it sits above the Contents column, beside the per-section minutes
 * that break the same number down.
 */
function ReadTime({ copy, readTime, className }: { copy: ArticleUiCopy; readTime?: number; className: string }) {
  const { progress, minutesLeft } = useArticle()
  if (!readTime) return null
  const pct = Math.round(progress * 100)
  // 3%, not 0: a browser restoring a scroll position, or a click on a heading anchor, can
  // put a reader a little way in without them having read anything, and flipping the label
  // to "17 min left" at 1% would be a worse lie than the one it replaces.
  const started = pct >= 3
  const text = started
    ? `${copy.toc.minutesLeftLabel.replace('{n}', String(minutesLeft))} · ${copy.toc.progressLabel.replace('{n}', String(pct))}`
    : copy.header.readTimeLabel.replace('{n}', String(readTime))
  // aria-live off on purpose: this changes on every scroll frame, and a live region would
  // read the percentage aloud continuously. A screen-reader user has the progressbar role
  // at the top of the page for the same fact, on demand.
  return <p className={className}>{text}</p>
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

export function ArticleToc({ copy, variant, reviewedBy, sources = [], readTime }: Props) {
  const { headings } = useArticle()

  if (variant === 'sidebar') {
    // h-full matters: `position: sticky` is bounded by its PARENT's box, so the sticky div
    // inside needs this aside to be as tall as the column. As a direct grid child it was
    // stretched for free; Phase 6 put a wrapper around it for the margin notes and the TOC
    // silently stopped sticking -- it scrolled away, measured at top 924 -> -1476.
    return (
      <aside className="hidden lg:block h-full" aria-label={copy.toc.title} data-toc="sidebar" data-print-hide>
        {/* The heading row must stay OUTSIDE the scrolling element. `overflow-y: auto` makes
            overflow-x compute to `auto` as well, which clipped the ReaderMenu's absolutely
            positioned panel — it rendered but 18 of its 24 controls were not hit-testable. */}
        <div className="sticky top-24 max-h-[calc(100vh-7rem)] flex flex-col">
          {/* The "Reading options" chip used to sit here and no longer does -- Phase 5 moved
              it to the fixed rail. flex-wrap is kept because the heading still shares the row
              when a future control lands in it. */}
          <ReadTime copy={copy} readTime={readTime} className="mb-2 shrink-0 font-sans text-sm text-stone-400" />
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4 shrink-0">
            <h2 className="section-label min-w-0">{copy.toc.title}</h2>
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

  // Nothing to show is nothing to render. This used to be an empty flex row holding a
  // spacer beside the reader-menu chip; Phase 5 moved that chip to the fixed rail, so the
  // row would otherwise be 8px of margin around nothing.
  //
  // The condition is deliberately wider than `headings.length`: a post with sources but no
  // headings rendered NO mobile Contents at all, so the 3.6 sources block was desktop-only
  // for it -- the exact breakpoint asymmetry the verifier caught once already with
  // reviewedBy.
  // readTime counts too. Without it a post with no headings and no sources would drop the
  // figure entirely on mobile -- the breakpoint asymmetry the verifier has already caught
  // twice on this component.
  if (!headings.length && !sources.length && !reviewedBy && !readTime) return null

  return (
    <div className="lg:hidden mb-8" data-print-hide>
      <ReadTime copy={copy} readTime={readTime} className="mb-2 font-sans text-sm text-stone-400" />
      {(
        <details className="rounded-xl border border-edge bg-surface-veil px-4 py-3" open={headings.length > 0 && headings.length <= 8} data-toc="mobile">
          <summary className={`cursor-pointer section-label list-none flex items-center justify-between ${FOCUS} rounded-sm`}>
            {copy.toc.mobileTitle}
            <ChevronDown size={16} className="text-stone-400" aria-hidden="true" />
          </summary>
          {headings.length > 0 && <div className="mt-3"><TocList copy={copy} /></div>}
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
      )}
    </div>
  )
}
