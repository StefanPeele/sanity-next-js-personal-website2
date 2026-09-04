'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
// components/blog/MobileTOC.tsx
// Mobile-only bottom-sheet table of contents.
// Appears as a floating pill at the bottom once the reader is 10% through the article.
// Tap to open a bottom drawer showing all headings. Tap a heading to jump. Swipe down to dismiss.

interface Heading { id: string; text: string; level: number }

export function MobileTOC() {
  const [headings, setHeadings]   = useState<Heading[]>([])
  const [open, setOpen]           = useState(false)
  const [visible, setVisible]     = useState(false)
  const [activeId, setActiveId]   = useState('')
  const [startY, setStartY]       = useState(0)

  // Collect headings
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('main h2, main h3')) as HTMLElement[]
    const detected = els.map((el, i) => {
      const id = el.id || `mob-h-${i}`
      if (!el.id) el.id = id
      return { id, text: el.textContent?.trim() ?? '', level: el.tagName === 'H2' ? 2 : 3 }
    })
    setHeadings(detected)
  }, [])

  // Show pill after 10% scroll
  useEffect(() => {
    const onScroll = () => {
      const pct = window.scrollY / (document.body.scrollHeight - window.innerHeight)
      setVisible(pct > 0.1 && headings.length > 0)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [headings.length])

  // Track active heading
  useEffect(() => {
    if (!headings.length) return
    const obs = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) setActiveId(e.target.id) }),
      { rootMargin: '-20% 0px -70% 0px' }
    )
    headings.forEach(h => { const el = document.getElementById(h.id); if (el) obs.observe(el) })
    return () => obs.disconnect()
  }, [headings])

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Swipe-down to close
  const onTouchStart = (e: React.TouchEvent) => setStartY(e.touches[0].clientY)
  const onTouchEnd   = (e: React.TouchEvent) => {
    if (e.changedTouches[0].clientY - startY > 60) setOpen(false)
  }

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setTimeout(() => setOpen(false), 300)
  }

  const activeText = headings.find(h => h.id === activeId)?.text ?? 'Contents'

  return (
    // Only visible on mobile (lg: hidden)
    <div className="lg:hidden">

      {/* ── Floating pill ──────────────────────────────────────────── */}
      <AnimatePresence>
        {visible && !open && (
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2.5 px-5 py-3 bg-[#111]/95 border border-white/15 rounded-full backdrop-blur-xl shadow-2xl"
            aria-label="Open table of contents"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white/40 flex-shrink-0" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-stone-300 max-w-48 truncate">
              {activeText}
            </span>
            <span className="text-stone-600 text-sm">↑</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Bottom sheet ──────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-[#0f0f12] border-t border-white/10 rounded-t-2xl overflow-hidden shadow-2xl"
              style={{ maxHeight: '75vh' }}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-white/15 rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 pb-3 border-b border-white/[0.08]">
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-stone-500">
                  Table of Contents
                </span>
                <button
                  onClick={() => setOpen(false)}
                  className="font-mono text-[10px] text-stone-600 hover:text-white transition-colors"
                >
                  Done
                </button>
              </div>

              {/* Heading list */}
              <div className="overflow-y-auto" style={{ maxHeight: 'calc(75vh - 80px)' }}>
                {headings.length > 0 ? (
                  <ul className="p-3 space-y-1">
                    {headings.map(h => (
                      <li key={h.id}>
                        <button
                          onClick={() => scrollTo(h.id)}
                          className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                            h.level === 3 ? 'pl-8' : ''
                          } ${
                            h.id === activeId
                              ? 'bg-white/10 text-white'
                              : 'text-stone-400 hover:bg-white/5 hover:text-stone-200'
                          }`}
                        >
                          {h.id === activeId && (
                            <span className="w-1.5 h-1.5 rounded-full bg-white flex-shrink-0" />
                          )}
                          <span className="font-serif text-sm leading-snug">{h.text}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="font-mono text-[10px] text-stone-700 text-center py-8 uppercase tracking-widest">
                    No sections found
                  </p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}