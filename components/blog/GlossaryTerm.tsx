'use client'

import { useEffect, useId, useRef, useState } from 'react'
import Link from 'next/link'
import { FOCUS } from '@/lib/ui'
// components/blog/GlossaryTerm.tsx
// Inline glossary annotation. The term is a button (keyboard reachable) that
// shows a definition card on hover / focus / click; Escape closes it. The card
// is referenced through aria-describedby so screen readers announce it.

interface Props {
  slug?: string
  term?: string
  definition?: string
  children: React.ReactNode
}

export function GlossaryTerm({ slug, term, definition, children }: Props) {
  const [open, setOpen] = useState(false)
  const [pinned, setPinned] = useState(false)
  const wrapRef = useRef<HTMLSpanElement>(null)
  const cardId = useId()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); setPinned(false) } }
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) { setOpen(false); setPinned(false) }
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [open])

  if (!definition || !slug) return <>{children}</>

  return (
    <span
      ref={wrapRef}
      className="relative inline"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => { if (!pinned) setOpen(false) }}
    >
      <button
        type="button"
        className={`glossary-term ${FOCUS} rounded-sm`}
        aria-describedby={open ? cardId : undefined}
        aria-expanded={open}
        onClick={() => { setPinned((p) => !p); setOpen((o) => !(o && pinned)) }}
        onFocus={() => setOpen(true)}
        onBlur={(e) => {
          if (!wrapRef.current?.contains(e.relatedTarget as Node)) { setOpen(false); setPinned(false) }
        }}
      >
        {children}
      </button>

      {open && (
        <span
          id={cardId}
          role="tooltip"
          className="article-light-invert absolute left-1/2 top-full z-40 mt-2 w-72 -translate-x-1/2 rounded-lg border border-amber-400/20 bg-[#141416] p-3.5 text-left shadow-2xl shadow-black/60 font-sans not-italic tracking-normal normal-case block"
        >
          <span className="meta-label text-amber-400/80 block mb-1.5">
            Glossary · {term}
          </span>
          <span className="font-sans text-[13px] leading-relaxed text-stone-200 block">
            {definition}
          </span>
          <Link
            href={`/glossary#${slug}`}
            className={`meta-label mt-2.5 inline-block text-stone-400 hover:text-white ${FOCUS}`}
          >
            Read more →
          </Link>
        </span>
      )}
    </span>
  )
}
