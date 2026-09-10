'use client'

import { useId, useState, useTransition } from 'react'
import { askArticle } from '@/app/actions/ask'
import { FOCUS, buttonClass } from '@/lib/ui'
// components/blog/AskArticle.tsx
// Ask a question about this article. Answers come from the article text only
// (see app/actions/ask.ts). Only rendered by the page when the API key is set.

export function AskArticle({ slug, heading = 'Ask this article', placeholder = 'Ask a question about this post', buttonLabel = 'Ask' }: { slug: string; heading?: string; placeholder?: string; buttonLabel?: string }) {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const id = useId()

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = question.trim()
    if (!q || pending) return
    setError(null)
    setAnswer(null)
    startTransition(async () => {
      const result = await askArticle(slug, q)
      if (result.ok) setAnswer(result.answer)
      else setError(result.error)
    })
  }

  return (
    <section className="mt-16 pt-10 border-t border-edge" aria-labelledby={`${id}-heading`} data-print-hide>
      <div className="flex items-center gap-4 mb-2">
        <h2 id={`${id}-heading`} className="section-label">{heading}</h2>
      </div>
      <p className="font-sans text-sm text-stone-400 mb-5 max-w-xl leading-relaxed">
        Answers are generated from this article&rsquo;s text only — nothing outside it. If the article doesn&rsquo;t cover your question, it will say so.
      </p>

      <form onSubmit={submit} className="space-y-3">
        <label htmlFor={`${id}-q`} className="sr-only">Your question</label>
        <textarea
          id={`${id}-q`}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') submit(e) }}
          rows={3}
          maxLength={500}
          placeholder={placeholder}
          className={`w-full rounded-xl border border-edge bg-surface-veil px-4 py-3 font-sans text-sm text-stone-100 placeholder:text-stone-500 focus:border-edge-strong focus:outline-none ${FOCUS} resize-y`}
          disabled={pending}
        />
        <div className="flex items-center gap-4 flex-wrap">
          <button
            type="submit"
            disabled={pending || !question.trim()}
            className={`font-sans text-sm ${buttonClass({ variant: 'primary', size: 'lg' })}`}
          >
            {pending ? 'Reading the article…' : buttonLabel}
          </button>
          <span className="font-sans text-xs text-stone-400">{question.length}/500 · Ctrl+Enter to send</span>
        </div>
      </form>

      <div aria-live="polite" className="mt-5">
        {pending && (
          <p className="meta-label text-stone-400 motion-safe:animate-pulse">Thinking…</p>
        )}
        {error && !pending && (
          <p role="alert" className="font-mono text-xs text-amber-400 border border-amber-500/30 bg-amber-950/10 rounded-lg px-4 py-3">{error}</p>
        )}
        {answer && !pending && (
          <div className="rounded-xl border border-edge bg-surface-veil p-5">
            <span className="font-sans text-xs text-stone-400 block mb-3">From the article</span>
            <p className="font-serif text-base text-stone-200 leading-relaxed whitespace-pre-wrap">{answer}</p>
          </div>
        )}
      </div>
    </section>
  )
}
