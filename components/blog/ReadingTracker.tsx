'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
// components/blog/ReadingTracker.tsx

interface Section {
  id: string
  title: string
  reached: boolean
  understood: boolean
}

export function ReadingTracker() {
  const [sections, setSections] = useState<Section[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [overallProgress, setOverallProgress] = useState(0)

  // Auto-detect h2 headings in the article on mount
  useEffect(() => {
    const headings = Array.from(document.querySelectorAll('main h2'))
    const detected: Section[] = headings.map((el, i) => {
      const id = el.id || `section-${i}`
      if (!el.id) el.id = id
      return {
        id,
        title: el.textContent?.trim() || `Section ${i + 1}`,
        reached: false,
        understood: false,
      }
    })
    setSections(detected)
  }, [])

  // Track scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight
      if (docHeight <= 0) return

      const overall = Math.min(100, Math.round((scrollY / docHeight) * 100))
      setOverallProgress(overall)

      setSections((prev) =>
        prev.map((section) => {
          const el = document.getElementById(section.id)
          if (!el) return section
          const reached = el.getBoundingClientRect().top < window.innerHeight * 0.6
          return { ...section, reached }
        })
      )
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // run once on mount
    return () => window.removeEventListener('scroll', handleScroll)
  }, [sections.length])

  const toggleUnderstood = (id: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, understood: !s.understood } : s))
    )
  }

  const understoodCount = sections.filter((s) => s.understood).length

  if (sections.length === 0) return null

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Reading progress"
        className="fixed bottom-8 left-8 z-40 w-11 h-11 rounded-full bg-[#111] border border-white/10 flex items-center justify-center hover:border-white/30 transition-all group shadow-2xl"
      >
        {/* Circular progress ring */}
        <svg
          className="w-full h-full -rotate-90"
          viewBox="0 0 44 44"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="22" cy="22" r="18" stroke="#292524" strokeWidth="2" />
          <circle
            cx="22"
            cy="22"
            r="18"
            stroke="#a8a29e"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={`${(overallProgress / 100) * 113.1} 113.1`}
            className="transition-all duration-300"
          />
        </svg>
        <span className="absolute font-mono text-[9px] text-stone-500 group-hover:text-white transition-colors">
          {overallProgress}
        </span>
      </button>

      {/* Progress panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -12, y: 12 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: -12, y: 12 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-24 left-8 z-40 w-72 bg-[#111] border border-white/10 rounded-lg overflow-hidden shadow-2xl"
          >
            {/* Panel header */}
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-stone-500">
                Progress
              </span>
              <span className="font-mono text-[10px] text-stone-600">
                {understoodCount}/{sections.length} understood
              </span>
            </div>

            {/* Section list */}
            <div className="p-4 space-y-3 max-h-72 overflow-y-auto">
              {sections.map((section) => (
                <div key={section.id} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <a
                      href={`#${section.id}`}
                      onClick={() => setIsOpen(false)}
                      className={`font-mono text-[10px] block truncate transition-colors ${
                        section.reached
                          ? 'text-stone-300 hover:text-white'
                          : 'text-stone-600 hover:text-stone-400'
                      }`}
                    >
                      {section.reached ? '▸ ' : '○ '}
                      {section.title}
                    </a>
                  </div>
                  {/* Mark as understood toggle */}
                  <button
                    onClick={() => toggleUnderstood(section.id)}
                    title={section.understood ? 'Mark as not understood' : 'Mark as understood'}
                    className={`flex-shrink-0 w-5 h-5 rounded border font-mono text-[8px] flex items-center justify-center transition-all ${
                      section.understood
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                        : 'border-white/10 text-stone-700 hover:border-stone-500 hover:text-stone-400'
                    }`}
                  >
                    {section.understood ? '✓' : ''}
                  </button>
                </div>
              ))}
            </div>

            {/* Overall progress bar */}
            <div className="px-5 pb-4 pt-3 border-t border-white/5">
              <div className="h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-stone-400 rounded-full transition-all duration-500"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
              <p className="font-mono text-[9px] text-stone-700 mt-2 text-right uppercase tracking-widest">
                {overallProgress}% read
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}