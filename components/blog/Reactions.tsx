'use client'

import { useEffect, useState } from 'react'
// components/blog/Reactions.tsx
// "This helped me" — the reader's own reaction, stored in localStorage per post.
// There is deliberately no counter: without a backend a number would be fake.
// To aggregate, replace `persist()` with a call to a KV store (Vercel KV /
// Upstash) keyed by slug and render the returned count next to the button.

const REACTIONS = [
  { id: 'helped', label: 'This helped me', icon: '✓' },
  { id: 'clear', label: 'Clearly explained', icon: '◎' },
  { id: 'more', label: 'Want more like this', icon: '→' },
] as const

type ReactionId = (typeof REACTIONS)[number]['id']

export function Reactions({ slug }: { slug: string }) {
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
      <h2 id="reactions-heading" className="font-mono text-[9px] uppercase tracking-[0.35em] text-stone-500 mb-3">
        Was this useful?
      </h2>
      <div className="flex flex-wrap gap-2">
        {REACTIONS.map((r) => {
          const on = chosen.has(r.id)
          return (
            <button
              key={r.id}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(r.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-full border font-mono text-[10px] uppercase tracking-widest transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 ${
                on ? 'bg-white text-black border-white' : 'border-white/10 text-stone-300 hover:text-white hover:border-white/30'
              }`}
            >
              <span aria-hidden="true">{r.icon}</span>
              {r.label}
            </button>
          )
        })}
      </div>
      <p className="mt-3 font-mono text-[9px] text-stone-500">Saved on this device only.</p>
    </section>
  )
}
