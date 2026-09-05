'use client'

import { useArticle } from '@/components/article/ArticleProvider'
// components/article/ReadingProgressBar.tsx — 2px bar at the top of the viewport.

export function ReadingProgressBar({ color }: { color?: string | null }) {
  const { progress } = useArticle()
  const pct = Math.round(progress * 100)
  return (
    <div
      role="progressbar"
      aria-label="Reading progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      data-print-hide
      className="fixed top-0 left-0 right-0 z-[1001] h-0.5 bg-transparent pointer-events-none"
    >
      <div className="h-full origin-left transition-transform duration-150 ease-out" style={{ transform: `scaleX(${progress})`, backgroundColor: color || '#d6d3d1' }} />
    </div>
  )
}
