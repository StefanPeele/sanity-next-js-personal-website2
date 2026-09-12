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
  /**
   * Phase 8.4. The markDef's `_key` -- STABLE across renders, builds and deploys, because it
   * comes from the document (or, for a glossary match, from a deterministic
   * `gl-<slug>-<n>`).
   *
   * This is NOT `data-sidenote-id` below, and the difference is the whole reason this prop
   * exists. That one is a useId(), which is per-render wiring between the prose and the
   * margin column and changes every time. A comment anchored to a useId would point at
   * nothing the next time the page rendered, so a comment anchors to THIS.
   */
  anchorKey?: string
}

export function SideNote({ children, note, kind = 'note', href, anchorKey }: SideNoteProps) {
  const [open, setOpen] = useState(false)
  const noteId = useId()

  if (!note) return <span>{children}</span>

  return (
    <span
      // The id a comment's backlink lands on, so "on a margin note" is a link rather than a
      // label. scroll-mt matches every other anchor target on the page.
      id={anchorKey ? `sn-${anchorKey}` : undefined}
      className="sidenote-anchor relative inline scroll-mt-28"
      data-sidenote-key={anchorKey || undefined}
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
