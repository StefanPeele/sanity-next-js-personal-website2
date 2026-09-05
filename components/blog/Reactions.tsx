'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, Check, Lightbulb } from 'lucide-react'
import { DEFAULT_ARTICLE_UI } from '@/lib/cms/defaults/articleUi'
import type { VocabEntry } from '@/lib/cms/defaults/taxonomy'
// components/blog/Reactions.tsx
// "This helped me" — the reader's own reaction, stored in localStorage per post.
// There is deliberately no counter: without a backend a number would be fake.
// To aggregate, replace `persist()` with a call to a KV store (Vercel KV /
// Upstash) keyed by slug and render the returned count next to the button.

const ICONS: Record<string, React.ComponentType<{ size?: number; 'aria-hidden'?: boolean }>> = { helped: Check, clear: Lightbulb, more: ArrowRight }
type ReactionId = string

export function Reactions({ slug, heading = DEFAULT_ARTICLE_UI.reactionsHeading, options = DEFAULT_ARTICLE_UI.reactions }: { slug: string; heading?: string; options?: VocabEntry[] }) {
  const REACTIONS = options.map((o) => ({ id: o.key, label: o.label }))
  const key = `sp_reaction_${slug}`
  const [chosen, setChosen] = useState<Set<ReactionId>>(new Set())

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return
      const parsed: unknown = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        const valid = parsed.filter((v): v is ReactionId => REACTIONS.some((r) => r.id === v))
        setChosen(new Set(valid))
      }
    } catch { /* ignore */ }
  }, [key])

  const persist = (next: Set<ReactionId>) => {
    try { localStorage.setItem(key, JSON.stringify(Array.from(next))) } catch { /* ignore */ }
  }

  const toggle = (id: ReactionId) => {
    setChosen((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      persist(next)
      return next
    })
  }

  return (
    <section className="mt-16 pt-8 border-t border-white/5" aria-labelledby="reactions-heading" data-print-hide>
      <h2 id="reactions-heading" className="section-label mb-3">{heading}</h2>
      <div className="flex flex-wrap gap-2">
        {REACTIONS.map((r) => {
          const on = chosen.has(r.id)
          return (
            <button
              key={r.id}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(r.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-full border font-sans text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 ${
                on ? 'bg-white text-black border-white' : 'border-white/10 text-stone-300 hover:text-white hover:border-white/30'
              }`}
            >
              {(() => { const I = ICONS[r.id]; return I ? <I size={12} aria-hidden /> : null })()}
              {r.label}
            </button>
          )
        })}
      </div>
      <p className="mt-3 font-sans text-xs text-stone-500">Saved on this device only.</p>
    </section>
  )
}
