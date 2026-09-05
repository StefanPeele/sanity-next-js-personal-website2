'use client'

import { useState } from 'react'
import { KnowledgeQuiz } from '@/components/blog/KnowledgeQuiz'
// components/blog/Checkpoint.tsx
// Prior-knowledge self-check, collapsed under a disclosure at the top of a deep dive.

interface QuizOption { _key: string; text: string; isCorrect: boolean }
interface Quiz {
  question: string
  options: QuizOption[]
  explanation?: string
}

export function Checkpoint({ quiz, heading = 'Check what you already know' }: { quiz: Quiz; heading?: string }) {
  const [open, setOpen] = useState(false)
  if (!quiz?.question || !quiz.options?.length) return null

  return (
    <section className="mb-10 rounded-xl border border-amber-500/20 bg-amber-950/[0.08] overflow-hidden" data-no-toc data-print-hide>
      <h2 className="m-0">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="checkpoint-body"
          className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-amber-500/5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
        >
          <span>
            <span className="font-serif text-base text-stone-100">{heading}</span>
          </span>
          <span className="font-sans text-sm text-stone-400 flex-shrink-0" aria-hidden="true">{open ? '−' : '+'}</span>
        </button>
      </h2>
      {open && (
        <div id="checkpoint-body" className="px-5 pb-2 -mt-4">
          <KnowledgeQuiz value={{ question: quiz.question, options: quiz.options, explanation: quiz.explanation, isGated: false }} />
        </div>
      )}
    </section>
  )
}
