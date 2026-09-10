'use client'

import { useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { FOCUS, buttonClass } from '@/lib/ui'
import { ChevronRight } from 'lucide-react'
// components/blog/GlossaryList.tsx
// Client half of /glossary: category filter + A–Z groups. The longDefinition is
// rendered on the server and arrives here as a ReactNode.

export interface GlossaryListEntry {
  _id: string
  term: string
  slug: string
  definition: string
  category: string | null
  aliases: string[]
  longDefinition: ReactNode | null
  relatedPosts: Array<{ title: string | null; slug: string | null }>
  relatedNotes: Array<{ title: string | null; slug: string | null }>
}

export function GlossaryList({ entries, categories }: { entries: GlossaryListEntry[]; categories: string[] }) {
  const [category, setCategory] = useState<string>('all')

  const filtered = useMemo(
    () => (category === 'all' ? entries : entries.filter((e) => e.category === category)),
    [entries, category],
  )

  const groups = useMemo(() => {
    const map = new Map<string, GlossaryListEntry[]>()
    for (const e of filtered) {
      const first = e.term.trim().charAt(0).toUpperCase()
      const letter = /[A-Z]/.test(first) ? first : '#'
      if (!map.has(letter)) map.set(letter, [])
      map.get(letter)!.push(e)
    }
    return Array.from(map.entries()).sort(([a], [b]) => (a === '#' ? 1 : b === '#' ? -1 : a.localeCompare(b)))
  }, [filtered])

  const letters = groups.map(([l]) => l)

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-8" role="group" aria-label="Filter by category">
        {['all', ...categories].map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={category === c}
            onClick={() => setCategory(c)}
            className={`font-sans text-sm ${buttonClass({ variant: 'chip', size: 'sm', active: category === c })}`}
          >
            {c === 'all' ? `All (${entries.length})` : c}
          </button>
        ))}
      </div>

      <nav aria-label="Jump to letter" className="mb-10 flex flex-wrap gap-1.5">
        {letters.map((l) => (
          <a
            key={l}
            href={`#letter-${l === '#' ? 'other' : l}`}
            className={`w-8 h-8 flex items-center justify-center rounded font-mono text-xs text-stone-400 hover:text-white hover:bg-surface-fill transition-colors ${FOCUS}`}
          >
            {l}
          </a>
        ))}
      </nav>

      {groups.length === 0 && (
        <p className="meta-label text-stone-400">No terms in this category yet.</p>
      )}

      {groups.map(([letter, items]) => (
        <section key={letter} id={`letter-${letter === '#' ? 'other' : letter}`} className="mb-12 scroll-mt-28" aria-labelledby={`letter-heading-${letter}`}>
          <h2 id={`letter-heading-${letter}`} className="font-serif text-4xl text-white mb-6 border-b border-edge-faint pb-3">{letter}</h2>
          <dl className="space-y-8">
            {items.map((e) => (
              <div key={e._id} id={e.slug} className="scroll-mt-28 group">
                <dt className="flex flex-wrap items-baseline gap-3">
                  <a href={`#${e.slug}`} className={`font-serif text-xl text-white hover:text-stone-200 ${FOCUS} rounded-sm`}>
                    {e.term}
                  </a>
                  {e.aliases.length > 0 && (
                    <span className="font-mono text-xs text-stone-400">also: {e.aliases.join(', ')}</span>
                  )}
                  {e.category && (
                    <span className="meta-label ml-auto text-stone-400 border border-edge px-2 py-0.5 rounded-sm">{e.category}</span>
                  )}
                </dt>
                <dd className="mt-2">
                  <p className="font-sans text-[15px] text-stone-300 leading-relaxed max-w-2xl">{e.definition}</p>
                  {e.longDefinition && (
                    <details className="mt-3 group/long">
                      <summary className={`meta-label cursor-pointer list-none text-stone-400 hover:text-white transition-colors ${FOCUS} rounded-sm inline-flex items-center gap-2`}>
                        <ChevronRight size={14} className="transition-transform group-open/long:rotate-90" aria-hidden="true" />
                        Longer explanation
                      </summary>
                      <div className="mt-3 pl-4 border-l border-edge max-w-2xl">{e.longDefinition}</div>
                    </details>
                  )}
                  {(e.relatedPosts.length > 0 || e.relatedNotes.length > 0) && (
                    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                      {e.relatedPosts.filter((p) => p.slug).map((p) => (
                        <li key={p.slug}>
                          <Link href={`/blog/${p.slug}`} className={`font-mono text-xs text-stone-400 hover:text-white underline underline-offset-4 decoration-stone-700 hover:decoration-white ${FOCUS} rounded-sm`}>
                            Post: {p.title}
                          </Link>
                        </li>
                      ))}
                      {e.relatedNotes.filter((n) => n.slug).map((n) => (
                        <li key={n.slug}>
                          <Link href={`/garden/${n.slug}`} className={`font-mono text-xs text-stone-400 hover:text-white underline underline-offset-4 decoration-stone-700 hover:decoration-white ${FOCUS} rounded-sm`}>
                            Note: {n.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  )
}
