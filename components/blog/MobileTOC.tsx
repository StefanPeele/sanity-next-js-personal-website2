'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useArticle } from '@/components/article/ArticleProvider'
// components/blog/MobileTOC.tsx
// Mobile navigator (hidden at lg+ where the toolbar and progress rail take over).
// A floating pill shows the current section + progress; tapping opens a bottom
// sheet with the full TOC, per-section reading time and "understood" checkmarks
// (the former ReadingTracker, merged here so there is one mobile widget).
// Sheet: role=dialog, focus trap, focus return, Escape, drag-to-close on the handle only.

const FOCUSABLE = 'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'

export function MobileTOC() {
  const { slug, headings, activeId, progress, minutesLeft, scrollTo, reducedMotion } = useArticle()
  const [open, setOpen] = useState(false)
  const [understood, setUnderstood] = useState<Set<string>>(new Set())
  const sheetRef = useRef<HTMLDivElement>(null)
  const openerRef = useRef<HTMLButtonElement>(null)
  const dragStartY = useRef<number | null>(null)
  const titleId = useId()

  const storageKey = `sp_understood_${slug}`

  // Restore "understood" marks per post
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const parsed: unknown = JSON.parse(raw)
        if (Array.isArray(parsed)) setUnderstood(new Set(parsed.filter((v): v is string => typeof v === 'string')))
      }
    } catch { /* ignore */ }
  }, [storageKey])

  const toggleUnderstood = (id: string) => {
    setUnderstood((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      try { localStorage.setItem(storageKey, JSON.stringify(Array.from(next))) } catch { /* ignore */ }
      return next
    })
  }

  const close = useCallback(() => {
    setOpen(false)
    // Return focus to the pill once it re-renders.
    setTimeout(() => openerRef.current?.focus(), 0)
  }, [])

  // Escape + focus trap + body scroll lock while open
  useEffect(() => {
    if (!open) return
    const sheet = sheetRef.current
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const first = sheet?.querySelector<HTMLElement>(FOCUSABLE)
    first?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); close(); return }
      if (e.key !== 'Tab' || !sheet) return
      const items = Array.from(sheet.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (!items.length) return
      const firstEl = items[0]
      const lastEl = items[items.length - 1]
      if (e.shiftKey && document.activeElement === firstEl) { e.preventDefault(); lastEl.focus() }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); firstEl.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, close])

  // Drag-to-close: only from the handle, so scrolling the list never dismisses
  const onHandleTouchStart = (e: React.TouchEvent) => { dragStartY.current = e.touches[0].clientY }
  const onHandleTouchEnd = (e: React.TouchEvent) => {
    if (dragStartY.current !== null && e.changedTouches[0].clientY - dragStartY.current > 50) close()
    dragStartY.current = null
  }

  const jump = (id: string) => {
    setOpen(false)
    setTimeout(() => scrollTo(id), reducedMotion ? 0 : 200)
  }

  const activeText = headings.find((h) => h.id === activeId)?.text ?? 'Contents'
  const pct = Math.round(progress * 100)
  const h2s = headings.filter((h) => h.level === 2)
  const understoodCount = h2s.filter((h) => understood.has(h.id)).length
  const showPill = progress > 0.06 && headings.length > 0

  const dur = (d: number) => (reducedMotion ? 0 : d)

  return (
    <div className="lg:hidden" data-print-hide>
      <AnimatePresence>
        {showPill && !open && (
          <motion.button
            ref={openerRef}
            type="button"
            initial={reducedMotion ? false : { y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: dur(0.25) }}
            onClick={() => setOpen(true)}
            className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2.5 pl-3 pr-4 py-2.5 max-w-[calc(100vw-2rem)] bg-[#111]/95 border border-white/15 rounded-full backdrop-blur-xl shadow-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
            aria-label={`Open table of contents. ${pct}% read. Current section: ${activeText}`}
            aria-haspopup="dialog"
            aria-expanded={open}
          >
            <span className="relative w-6 h-6 flex-shrink-0" aria-hidden="true">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9.5" stroke="#292524" strokeWidth="2" />
                <circle
                  cx="12" cy="12" r="9.5" stroke="#d6d3d1" strokeWidth="2" strokeLinecap="round"
                  strokeDasharray={`${(pct / 100) * 59.7} 59.7`}
                  className={reducedMotion ? '' : 'transition-[stroke-dasharray] duration-300'}
                />
              </svg>
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-stone-200 truncate">
              {activeText}
            </span>
            <span className="font-mono text-[10px] text-stone-500 flex-shrink-0">{pct}%</span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={reducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: dur(0.2) }}
              className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm"
              onClick={close}
              aria-hidden="true"
            />

            <motion.div
              ref={sheetRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              initial={reducedMotion ? false : { y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: dur(0.3), ease: [0.25, 0.46, 0.45, 0.94] }}
              className="fixed bottom-0 left-0 right-0 z-[1001] bg-[#0f0f12] border-t border-white/10 rounded-t-2xl overflow-hidden shadow-2xl flex flex-col"
              style={{ maxHeight: '80dvh' }}
            >
              {/* Drag handle — the only drag-to-close surface */}
              <div
                className="flex justify-center pt-3 pb-2 touch-none cursor-grab"
                onTouchStart={onHandleTouchStart}
                onTouchEnd={onHandleTouchEnd}
                aria-hidden="true"
              >
                <div className="w-10 h-1 bg-white/20 rounded-full" />
              </div>

              <div className="flex items-center justify-between px-5 pb-3 border-b border-white/[0.08]">
                <div>
                  <span id={titleId} className="font-mono text-[10px] uppercase tracking-[0.3em] text-stone-400 block">
                    Table of Contents
                  </span>
                  <span className="font-mono text-[9px] text-stone-500 block mt-0.5">
                    {pct}% read · {minutesLeft <= 0 ? 'done' : `~${minutesLeft} min left`}
                    {h2s.length > 0 && ` · ${understoodCount}/${h2s.length} understood`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={close}
                  className="min-w-[40px] min-h-[40px] px-3 rounded-lg font-mono text-[10px] uppercase tracking-widest text-stone-300 hover:text-white hover:bg-white/5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
                >
                  Done
                </button>
              </div>

              <div className="overflow-y-auto overscroll-contain flex-1">
                {headings.length > 0 ? (
                  <ul className="p-3 space-y-1">
                    {headings.map((h) => {
                      const isActive = h.id === activeId
                      const isDone = understood.has(h.id)
                      return (
                        <li key={h.id} className={`flex items-center gap-1 ${h.level === 3 ? 'pl-6' : ''}`}>
                          <button
                            type="button"
                            onClick={() => jump(h.id)}
                            aria-current={isActive ? 'location' : undefined}
                            className={`flex-1 min-w-0 text-left flex items-center gap-3 px-4 py-3 rounded-xl transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 ${
                              isActive ? 'bg-white/10 text-white' : 'text-stone-300 hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isActive ? 'bg-white' : 'bg-white/15'}`} aria-hidden="true" />
                            <span className="font-serif text-sm leading-snug truncate">{h.text}</span>
                            {h.minutes > 0 && (
                              <span className="ml-auto font-mono text-[9px] text-stone-500 flex-shrink-0">{h.minutes} min</span>
                            )}
                          </button>
                          {h.level === 2 && (
                            <button
                              type="button"
                              role="checkbox"
                              aria-checked={isDone}
                              aria-label={`Mark "${h.text}" as understood`}
                              onClick={() => toggleUnderstood(h.id)}
                              className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 ${
                                isDone ? 'text-emerald-400' : 'text-stone-500 hover:text-stone-300'
                              }`}
                            >
                              <span className={`w-5 h-5 rounded border flex items-center justify-center font-mono text-[10px] ${
                                isDone ? 'bg-emerald-500/20 border-emerald-500/50' : 'border-white/15'
                              }`} aria-hidden="true">
                                {isDone ? '✓' : ''}
                              </span>
                            </button>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <p className="font-mono text-[10px] text-stone-500 text-center py-8 uppercase tracking-widest">
                    No sections found
                  </p>
                )}
              </div>

              <div className="px-5 py-3 border-t border-white/5">
                <div className="h-0.5 w-full bg-white/5 rounded-full overflow-hidden" aria-hidden="true">
                  <div className="h-full bg-stone-400 rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
