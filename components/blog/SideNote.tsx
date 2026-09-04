'use client'

import { useId, useState } from 'react'
// components/blog/SideNote.tsx
// Inline annotation mark. The highlighted text is a button so keyboard users can
// reach it: hover or focus shows the tooltip on desktop, click/tap toggles an
// inline expansion on mobile. The note is linked through aria-describedby.

interface SideNoteProps {
  children: React.ReactNode
  note?: string
}

export function SideNote({ children, note }: SideNoteProps) {
  const [open, setOpen] = useState(false)
  const noteId = useId()

  if (!note) return <span>{children}</span>

  return (
    <span className="relative group inline">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-describedby={noteId}
        style={{ font: 'inherit', color: 'inherit' }}
        className="border-b border-dashed border-amber-400/60 cursor-help bg-transparent p-0 rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
      >
        {children}
        <sup className="font-mono text-[9px] text-amber-400/80 ml-0.5 select-none" aria-hidden="true">※</sup>
      </button>

      {/* Desktop tooltip — hover or focus-within */}
      <span
        id={noteId}
        role="tooltip"
        className={`
          article-light-invert pointer-events-none
          absolute z-40 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3.5
          bg-[#1a1a1e] border border-amber-400/20 rounded-lg shadow-2xl shadow-black/60 text-left
          hidden lg:group-hover:block lg:group-focus-within:block
        `}
      >
        <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-amber-400/80 block mb-1.5">Note</span>
        <span className="font-mono text-[11px] text-stone-200 leading-relaxed block">{note}</span>
        <span className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-amber-400/20" aria-hidden="true" />
      </span>

      {/* Mobile inline expander */}
      {open && (
        <span className="lg:hidden block mt-2 mb-3 pl-3 border-l-2 border-amber-400/40 bg-amber-950/20 rounded-r-lg py-2 pr-3">
          <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-amber-400/80 block mb-1">Note</span>
          <span className="font-mono text-[11px] text-stone-200 leading-relaxed block">{note}</span>
        </span>
      )}
    </span>
  )
}
