'use client'

import { useState } from 'react'
import { useArticle } from '@/components/article/ArticleProvider'
// components/blog/ArticleProgressRail.tsx
// Desktop-only segmented rail on the left edge: one segment per h2, filled as the
// reader moves through that section. All numbers come from ArticleProvider — this
// component has no scroll listener of its own.

export function ArticleProgressRail() {
  const { headings, sectionProgress, progress, minutesLeft, scrollTo, activeId } = useArticle()
  const [tooltip, setTooltip] = useState<{ text: string; y: number } | null>(null)

  const sections = headings.filter((h) => h.level === 2)
  const visible = progress > 0.02
  if (!visible) return null

  const timeLeft = minutesLeft <= 0 ? 'Done' : minutesLeft === 1 ? '~1 min left' : `~${minutesLeft} min left`

  return (
    <nav
      aria-label="Section progress"
      className="fixed left-3 md:left-6 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col items-center gap-2"
      data-print-hide
    >
      <span
        className="font-mono text-[8px] uppercase tracking-[0.2em] text-stone-500 mb-1"
        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        aria-live="off"
      >
        {timeLeft}
      </span>

      <ol className="flex flex-col gap-1 items-center list-none m-0 p-0">
        {sections.length > 0 ? sections.map((section) => {
          const pct = sectionProgress[section.id] ?? 0
          const completed = pct >= 0.95
          const isActive = activeId === section.id
          return (
            <li key={section.id} className="relative">
              <button
                type="button"
                onClick={() => scrollTo(section.id)}
                onMouseEnter={(e) => setTooltip({ text: section.text, y: e.currentTarget.getBoundingClientRect().top })}
                onMouseLeave={() => setTooltip(null)}
                onFocus={(e) => setTooltip({ text: section.text, y: e.currentTarget.getBoundingClientRect().top })}
                onBlur={() => setTooltip(null)}
                className={`relative block w-2 h-10 rounded-full overflow-hidden transition-[width] duration-300 hover:w-2.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 ${
                  isActive ? 'bg-white/15' : 'bg-white/5'
                }`}
                aria-label={`Jump to: ${section.text}${section.minutes ? ` (${section.minutes} min)` : ''}`}
                aria-current={isActive ? 'location' : undefined}
              >
                <span
                  className={`absolute inset-x-0 bottom-0 rounded-full transition-[height] duration-150 ease-out ${
                    completed ? 'bg-emerald-500/70' : 'bg-stone-400/70'
                  }`}
                  style={{ height: `${pct * 100}%` }}
                  aria-hidden="true"
                />
              </button>
            </li>
          )
        }) : (
          <li className="relative w-2 h-40 rounded-full bg-white/5 overflow-hidden" aria-hidden="true">
            <span
              className="absolute inset-x-0 bottom-0 bg-stone-400/70 rounded-full transition-[height] duration-150 ease-out"
              style={{ height: `${progress * 100}%` }}
            />
          </li>
        )}
      </ol>

      {tooltip && (
        <div
          role="tooltip"
          className="fixed left-10 pointer-events-none z-50 bg-[#111] border border-white/10 px-3 py-2 rounded-lg shadow-xl max-w-48"
          style={{ top: tooltip.y - 20 }}
        >
          <p className="font-mono text-[9px] text-stone-200 leading-snug">{tooltip.text}</p>
        </div>
      )}
    </nav>
  )
}
