'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
// components/blog/ArticleProgressRail.tsx
// A segmented vertical progress rail on the left edge of the reading column.
// Divides into segments per h2 heading. Fills as you read each section.

interface Section {
  id: string
  title: string
  progress: number // 0–1 for this segment
  completed: boolean
}

function getReadingTimeLeft(totalWords: number, scrollPct: number): string {
  const wordsLeft = Math.round(totalWords * (1 - scrollPct))
  const minsLeft  = Math.ceil(wordsLeft / 200)
  if (minsLeft <= 0) return 'Done'
  if (minsLeft === 1) return '~1 min left'
  return `~${minsLeft} min left`
}

export function ArticleProgressRail({ totalWords = 1000 }: { totalWords?: number }) {
  const [sections, setSections]         = useState<Section[]>([])
  const [overallProgress, setOverallProgress] = useState(0)
  const [tooltip, setTooltip]           = useState<string | null>(null)
  const [tooltipY, setTooltipY]         = useState(0)
  const [visible, setVisible]           = useState(false)
  const [timeLeft, setTimeLeft]         = useState('')

  useEffect(() => {
    const headings = Array.from(document.querySelectorAll('main h2')) as HTMLElement[]
    const detected: Section[] = headings.map((el, i) => {
      const id = el.id || `section-rail-${i}`
      if (!el.id) el.id = id
      return { id, title: el.textContent?.trim() ?? `Section ${i + 1}`, progress: 0, completed: false }
    })
    setSections(detected)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const scrollY    = window.scrollY
      const maxScroll  = document.documentElement.scrollHeight - window.innerHeight
      const pct        = maxScroll > 0 ? Math.min(1, scrollY / maxScroll) : 0

      setOverallProgress(pct)
      setTimeLeft(getReadingTimeLeft(totalWords, pct))
      setVisible(scrollY > 100)

      if (sections.length === 0) return

      const headingEls = sections.map((s) => document.getElementById(s.id))
      const tops       = headingEls.map((el) => el ? el.getBoundingClientRect().top + scrollY : 0)

      setSections((prev) => prev.map((section, i) => {
        const sectionTop    = tops[i]
        const sectionBottom = tops[i + 1] ?? (document.body.scrollHeight)
        const sectionHeight = sectionBottom - sectionTop
        const posInSection  = scrollY + window.innerHeight * 0.5 - sectionTop
        const sectionPct    = Math.max(0, Math.min(1, posInSection / sectionHeight))
        return {
          ...section,
          progress:  sectionPct,
          completed: sectionPct >= 0.95,
        }
      }))
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [sections.length, totalWords])

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (!visible) return null

  return (
    <div className="fixed left-3 md:left-6 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col items-center gap-2">

      {/* Time remaining */}
      {timeLeft && (
        <span className="font-mono text-[7px] uppercase tracking-[0.2em] text-stone-700 mb-1"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
          {timeLeft}
        </span>
      )}

      {/* Segmented rail */}
      <div className="flex flex-col gap-1 items-center">
        {sections.length > 0 ? (
          sections.map((section, i) => (
            <div
              key={section.id}
              className="relative group"
              onMouseEnter={(e) => {
                setTooltip(section.title)
                setTooltipY(e.currentTarget.getBoundingClientRect().top)
              }}
              onMouseLeave={() => setTooltip(null)}
            >
              <button
                onClick={() => scrollToSection(section.id)}
                className="relative w-1 h-10 rounded-full bg-white/5 overflow-hidden hover:w-1.5 transition-all duration-300"
                aria-label={`Jump to: ${section.title}`}
              >
                <motion.div
                  className={`absolute inset-x-0 bottom-0 rounded-full transition-colors duration-500 ${
                    section.completed ? 'bg-emerald-500/70' : 'bg-stone-400/60'
                  }`}
                  animate={{ height: `${section.progress * 100}%` }}
                  transition={{ duration: 0.1 }}
                />
              </button>
            </div>
          ))
        ) : (
          // Single bar if no h2 headings
          <div className="relative w-1 h-40 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              className="absolute inset-x-0 bottom-0 bg-stone-400/60 rounded-full"
              animate={{ height: `${overallProgress * 100}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
        )}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed left-10 pointer-events-none z-50 bg-[#111] border border-white/10 px-3 py-2 rounded-lg shadow-xl max-w-48"
          style={{ top: tooltipY - 20 }}
        >
          <p className="font-mono text-[9px] text-stone-300 leading-snug">{tooltip}</p>
        </div>
      )}
    </div>
  )
}