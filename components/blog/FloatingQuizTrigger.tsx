'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
// components/blog/FloatingQuizTrigger.tsx

interface QuizOption {
  _key: string
  text: string
  isCorrect: boolean
}

interface FloatingQuizTriggerProps {
  triggerAfterSection: string // exact text of the h2 heading to watch
  question: string
  options: QuizOption[]
  explanation?: string
}

export function FloatingQuizTrigger({
  triggerAfterSection,
  question,
  options,
  explanation,
}: FloatingQuizTriggerProps) {
  const [visible, setVisible] = useState(false)
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [completed, setCompleted] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)

  // Find the target heading by matching its text content, then observe it
  useEffect(() => {
    const findHeading = () => {
      const headings = Array.from(document.querySelectorAll('main h2'))
      return headings.find((el) =>
        el.textContent?.trim().toLowerCase() === triggerAfterSection.trim().toLowerCase()
      )
    }

    const heading = findHeading()
    if (!heading) return

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        // Pill appears once the heading has scrolled OUT of view (reader passed it)
        if (!entry.isIntersecting && entry.boundingClientRect.top < 0) {
          setVisible(true)
        }
      },
      { threshold: 0, rootMargin: '0px 0px 0px 0px' }
    )

    observerRef.current.observe(heading)

    return () => observerRef.current?.disconnect()
  }, [triggerAfterSection])

  const correctOption = options?.find((o) => o.isCorrect)
  const isCorrect = revealed && selected === correctOption?._key

  const handleReveal = () => {
    if (!selected) return
    setRevealed(true)
    if (selected === correctOption?._key) {
      setTimeout(() => setCompleted(true), 1200)
    }
  }

  const reset = () => {
    setSelected(null)
    setRevealed(false)
  }

  const handleDismiss = () => {
    setOpen(false)
    setCompleted(true) // dismiss permanently hides the pill
  }

  // Once completed, hide pill entirely
  if (completed && !open) return null

  return (
    <>
      {/* ── Floating pill ──────────────────────────────────────────── */}
      <AnimatePresence>
        {visible && !completed && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed bottom-24 right-8 md:bottom-12 md:right-12 z-40"
          >
            <button
              onClick={() => setOpen(true)}
              className="flex items-center gap-3 bg-[#111] border border-white/15 rounded-full px-4 py-3 shadow-2xl hover:border-white/30 transition-all group"
            >
              {/* Pulse dot */}
              <span className="relative flex h-2 w-2 flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-stone-400 group-hover:text-white transition-colors">
                Check your understanding
              </span>
              <span className="font-mono text-[10px] text-stone-700 group-hover:text-stone-400 transition-colors">
                →
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Quiz modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setOpen(false)}
            />

            {/* Modal panel */}
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="fixed bottom-0 left-0 right-0 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-xl w-full z-50"
            >
              <div className="bg-[#111] border border-white/10 rounded-t-2xl md:rounded-2xl overflow-hidden shadow-2xl">

                {/* Modal header */}
                <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-stone-500">
                      Knowledge Check
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 border border-amber-500/30 text-amber-500/70 rounded-sm">
                      Section Checkpoint
                    </span>
                  </div>
                  <button
                    onClick={handleDismiss}
                    className="font-mono text-[10px] text-stone-700 hover:text-white transition-colors uppercase tracking-widest"
                  >
                    Dismiss
                  </button>
                </div>

                <div className="p-6">
                  <p className="font-serif text-xl text-white mb-6 leading-snug">
                    {question}
                  </p>

                  {/* Options */}
                  <div className="space-y-3">
                    {options?.map((option, i) => {
                      const isSelected = selected === option._key
                      const isThisCorrect = option.isCorrect

                      let stateClass =
                        'border-white/10 text-stone-400 hover:border-stone-600 hover:text-white'
                      if (isSelected && !revealed)
                        stateClass = 'border-stone-400 text-white bg-white/5'
                      if (revealed && isThisCorrect)
                        stateClass = 'border-emerald-500/50 text-emerald-400 bg-emerald-500/5'
                      if (revealed && isSelected && !isThisCorrect)
                        stateClass = 'border-red-500/50 text-red-400 bg-red-500/5'

                      return (
                        <button
                          key={option._key}
                          onClick={() => !revealed && setSelected(option._key)}
                          disabled={revealed}
                          className={`w-full text-left px-4 py-3 rounded border font-mono text-sm transition-all duration-200 ${stateClass} ${
                            !revealed ? 'cursor-pointer' : 'cursor-default'
                          }`}
                        >
                          <span className="mr-3 text-stone-600">
                            {String.fromCharCode(65 + i)}.
                          </span>
                          {option.text}
                        </button>
                      )
                    })}
                  </div>

                  {/* Actions */}
                  <div className="mt-6 flex items-center gap-4">
                    {!revealed ? (
                      <button
                        onClick={handleReveal}
                        disabled={!selected}
                        className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 border border-white/20 text-stone-400 hover:border-white hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        Submit Answer
                      </button>
                    ) : (
                      <div className="flex items-center gap-4 w-full">
                        <span
                          className={`font-mono text-[10px] uppercase tracking-widest ${
                            isCorrect ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                        </span>
                        {!isCorrect && (
                          <button
                            onClick={reset}
                            className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 border border-white/10 text-stone-600 hover:text-white transition-colors"
                          >
                            Try Again
                          </button>
                        )}
                        {isCorrect && (
                          <button
                            onClick={() => { setOpen(false); setCompleted(true) }}
                            className="ml-auto font-mono text-[10px] uppercase tracking-widest px-4 py-2 bg-white text-black hover:bg-stone-200 transition-colors"
                          >
                            Continue Reading →
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Explanation */}
                  <AnimatePresence>
                    {revealed && explanation && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.35 }}
                        className="mt-6 pt-6 border-t border-white/5 overflow-hidden"
                      >
                        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-stone-600 mb-2">
                          Explanation
                        </p>
                        <p className="text-stone-400 text-sm leading-relaxed">
                          {explanation}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}