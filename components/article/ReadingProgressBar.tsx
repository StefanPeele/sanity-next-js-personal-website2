'use client'

import { useArticle } from '@/components/article/ArticleProvider'
// components/article/ReadingProgressBar.tsx — the bar at the top of the viewport.
//
// 7.6: 2px was "too thin to read as information", and it was right — at 2px the bar is a
// hairline that a reader registers as a border rather than a measure. 4px (h-1, a named
// step) is the smallest height at which the fill reads as a quantity at a glance, and it is
// still thin enough not to look like chrome.
//
// The PERCENTAGE that 7.6 also asks for is deliberately not here. A number legible beside a
// 4px bar would have to sit in its own floating element, and the article's standing rule is
// that it gains no floating widgets. It lives in the readout above the Contents column
// instead (ArticleToc), where it sits beside the reading time that 7.5 moved there and the
// per-section minutes that break the same number down — three views of one fact, in one
// place, and nothing new occupying the viewport.

export function ReadingProgressBar({ color }: { color?: string | null }) {
  const { progress, settings } = useArticle()
  // Every persistent element carries its own off switch. Returning null rather than hiding
  // it with a class so it costs nothing at all when it is off.
  if (!settings.progressBar) return null
  const pct = Math.round(progress * 100)
  return (
    <div
      role="progressbar"
      aria-label="Reading progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      data-print-hide
      className="fixed top-0 left-0 right-0 z-[1001] h-1 bg-transparent pointer-events-none"
    >
      <div className="h-full origin-left transition-transform duration-150 ease-out" style={{ transform: `scaleX(${progress})`, backgroundColor: color || '#d6d3d1' }} />
    </div>
  )
}
