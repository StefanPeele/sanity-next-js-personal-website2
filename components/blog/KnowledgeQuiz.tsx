'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FloatingQuizTrigger } from '@/components/blog/FloatingQuizTrigger'
// components/blog/KnowledgeQuiz.tsx

interface QuizOption {
  _key: string
  text: string
  isCorrect: boolean
}

interface KnowledgeQuizProps {
  value: {
    question: string
    options: QuizOption[]
    explanation?: string
    isGated?: boolean
    triggerAfterSection?: string
  }
}

export function KnowledgeQuiz({ value }: KnowledgeQuizProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [unlocked, setUnlocked] = useState(false)
  const quizRef = useRef<HTMLDivElement>(null)

  // ── MODE 1: Floating trigger ─────────────────────────────────────
  if (value.triggerAfterSection) {
    return (
      <FloatingQuizTrigger
        triggerAfterSection={value.triggerAfterSection}
        question={value.question}
        options={value.options}
        explanation={value.explanation}
      />
    )
  }

  // ── SHARED INLINE LOGIC (modes 2 & 3) ───────────────────────────
  const correctOption = value.options?.find((o) => o.isCorrect)
  const isGated = value.isGated ?? false
  const isCorrect = revealed && selected === correctOption?._key

  const handleReveal = () => {
    if (!selected) return
    setRevealed(true)
    if (selected === correctOption?._key) {
      setTimeout(() => setUnlocked(true), 800)
    }
  }

  const reset = () => {
    setSelected(null)
    setRevealed(false)
  }

  return (
    <div ref={quizRef} className="relative">

      {/* ── Quiz card ─────────────────────────────────────────────── */}
      <div className="my-10 border border-white/10 rounded-lg overflow-hidden bg-[#0f0f0f]">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-stone-500">
              Knowledge Check
            </span>
            {isGated && !unlocked && (
              <span className="font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 border border-amber-500/30 text-amber-500/70 rounded-sm">
                Answer to continue
              </span>
            )}
            {isGated && unlocked && (
              <span className="font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 border border-emerald-500/30 text-emerald-500/70 rounded-sm">
                ✓ Unlocked
              </span>
            )}
          </div>
          <span className="font-mono text-[10px] text-stone-700">Active Recall</span>
        </div>

        <div className="p-6">
          <p className="font-serif text-xl text-white mb-6 leading-snug">
            {value.question}
          </p>

          <div className="space-y-3">
            {value.options?.map((option, i) => {
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
                  className={`w-full text-left px-4 py-3 rounded border font-mono text-sm transition-all duration-300 ${stateClass} ${
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

          <div className="mt-6 flex items-center gap-4">
            {!revealed ? (
              <button
                onClick={handleReveal}
                disabled={!selected}
                className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 border border-white/20 text-stone-400 hover:border-white hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {isGated ? 'Submit Answer' : 'Reveal Answer'}
              </button>
            ) : (
              <>
                <span
                  className={`font-mono text-[10px] uppercase tracking-widest ${
                    isCorrect ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                </span>
                {(!isGated || !unlocked) && (
                  <button
                    onClick={reset}
                    className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 border border-white/10 text-stone-600 hover:text-white transition-colors"
                  >
                    Try Again
                  </button>
                )}
              </>
            )}
          </div>

          <AnimatePresence>
            {revealed && value.explanation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4 }}
                className="mt-6 pt-6 border-t border-white/5 overflow-hidden"
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-stone-600 mb-2">
                  Explanation
                </p>
                <p className="text-stone-400 text-sm leading-relaxed">
                  {value.explanation}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── MODE 2: Content gate overlay ────────────────────────────── */}
      <AnimatePresence>
        {isGated && !unlocked && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="pointer-events-none absolute left-0 right-0 z-20"
            style={{ top: '100%', height: '480px' }}
          >
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(to bottom, rgba(10,10,10,0) 0%, rgba(10,10,10,0.85) 30%, rgba(10,10,10,0.97) 100%)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
              }}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none">
              <div className="w-10 h-10 rounded-full border border-white/10 bg-[#111] flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-stone-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                  />
                </svg>
              </div>
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-stone-600">
                Answer above to continue
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}