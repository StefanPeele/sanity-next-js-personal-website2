'use client'

import { useId, useState } from 'react'
import { FOCUS } from '@/lib/ui'
// components/blog/SideNote.tsx
// Phase 6 — the ANCHOR half of a sidenote. The note text itself is rendered twice, and
// deliberately:
//
//   at lg and above  MarginNotes reads `data-sidenote-text` off this element and renders the
//                    note in the margin, positioned at this anchor's measured offset.
//   below lg         there is no margin, so the note expands INLINE at the anchor (6.4's
//                    option A) — which is also what a reader with JS off, or a screen reader
//                    walking the prose, gets.
//
// The text lives in a data attribute rather than being passed to MarginNotes as a prop
// because the anchors are inside server-rendered Portable Text and the margin is a separate
// client component: the DOM is the only thing they both already share.

interface SideNoteProps {
  children: React.ReactNode
  note?: string
  /** 6.2: 'note' is hand-authored, 'glossary' is derived from a definition. */
  kind?: 'note' | 'glossary'
  /** Where the full entry lives. Only glossary notes have one; it surfaces in 6.5's window. */
  href?: string
}

export function SideNote({ children, note, kind = 'note', href }: SideNoteProps) {
  const [open, setOpen] = useState(false)
  const noteId = useId()

  if (!note) return <span>{children}</span>

  return (
    <span
      className="sidenote-anchor relative inline"
      data-sidenote-id={noteId}
      data-sidenote-text={note}
      data-sidenote-kind={kind}
      data-sidenote-href={href || undefined}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={`${noteId}-inline`}
        style={{ font: 'inherit', color: 'inherit' }}
        className={`sidenote-mark bg-transparent p-0 rounded-sm ${FOCUS}`}
      >
        {children}
        <sup className="font-mono text-xs text-amber-400/80 ml-0.5 select-none" aria-hidden="true">※</sup>
      </button>

      {/* 6.4 option A. Hidden at lg, where the margin carries it instead. */}
      {open && (
        <span id={`${noteId}-inline`} className="sidenote-inline">
          <span className="meta-label text-amber-400/80 block mb-1">Note</span>
          <span className="font-sans text-xs text-stone-200 leading-relaxed block">{note}</span>
        </span>
      )}
    </span>
  )
}
