'use client'

import { useState } from 'react'
// components/blog/SideNote.tsx
//
// Renders inline annotation marks from Sanity.
// Desktop (lg+): hover the highlighted text → note appears in a tooltip
// Mobile: tap the highlighted text → note expands inline below

interface SideNoteProps {
  children: React.ReactNode
  note?: string
}

export function SideNote({ children, note }: SideNoteProps) {
  const [open, setOpen] = useState(false)

  if (!note) return <span>{children}</span>

  return (
    <span className="relative group">
      {/* Annotated text — dashed amber underline signals "there's a note here" */}
      <span
        className="border-b border-dashed border-amber-400/60 cursor-pointer lg:cursor-help text-inherit"
        onClick={() => setOpen((v) => !v)}
        aria-label="Sidenote"
      >
        {children}
      </span>

      {/* Superscript marker */}
      <sup className="font-mono text-[9px] text-amber-400/80 ml-0.5 select-none">
        ※
      </sup>

      {/* ── Desktop tooltip — appears on hover above/below the text ── */}
      <span
        className={`
          pointer-events-none
          hidden lg:group-hover:block
          absolute z-50
          bottom-full left-1/2 -translate-x-1/2 mb-2
          w-64
          p-3.5
          bg-[#1a1a1e] border border-amber-400/20 rounded-lg
          shadow-2xl shadow-black/60
          text-left
        `}
      >
        <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-amber-400/70 block mb-1.5">
          Note
        </span>
        <span className="font-mono text-[11px] text-stone-300 leading-relaxed block">
          {note}
        </span>
        {/* Arrow pointing down */}
        <span className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-amber-400/20" />
      </span>

      {/* ── Mobile inline expander ─────────────────────────────────── */}
      {open && (
        <span className="lg:hidden block mt-2 mb-3 ml-0 pl-3 border-l-2 border-amber-400/40 bg-amber-950/20 rounded-r-lg py-2 pr-3">
          <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-amber-400/70 block mb-1">
            Note
          </span>
          <span className="font-mono text-[11px] text-stone-300 leading-relaxed block">
            {note}
          </span>
        </span>
      )}
    </span>
  )
}
