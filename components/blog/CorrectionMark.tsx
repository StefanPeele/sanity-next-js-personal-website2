'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { CORRECTION_LABELS, type CorrectionKind } from '@/lib/corrections'
import { formatDate } from '@/lib/dates'
import { FOCUS } from '@/lib/ui'
// components/blog/CorrectionMark.tsx
// The in-place half of 3B. The corrected passage carries a quiet edge and a small numbered
// marker; the marker opens the correction with its attribution.
//
// Accessibility follows the same contract as GlossaryTerm, which §1.8 set: hover AND focus
// open it, and it dismisses on mouseleave, blur AND Escape. A hover-only annotation is
// invisible to a keyboard, and a correction is exactly the kind of thing a reader must not
// have to use a mouse to find.
//
// The passage itself is NOT a button. Wrapping a whole sentence in a button makes the
// sentence a tab stop and reads it out as one control; the marker beside it is the control,
// and the passage is just marked.

interface Props {
  n?: number
  kind?: CorrectionKind
  now?: string
  was?: string
  creditTo?: string
  creditUrl?: string
  date?: string
  children: React.ReactNode
}

export function CorrectionMark({ n, kind = 'correction', now, was, creditTo, creditUrl, date, children }: Props) {
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

  if (!now) return <>{children}</>

  const meta = CORRECTION_LABELS[kind] ?? CORRECTION_LABELS.correction
  const when = date ? formatDate(date, 'long', '') : ''
  // "Corrected 12 September 2026 — thanks to Jane Doe." The credit line is the reason this
  // feature exists, so it is the sentence the card leads with after the change itself.
  const credit = creditTo ? `${meta.verb}${when ? ` ${when}` : ''} — thanks to ${creditTo}` : `${meta.verb}${when ? ` ${when}` : ''}`

  return (
    <span
      ref={wrapRef}
      className="relative inline"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => { if (!pinned) setOpen(false) }}
    >
      <span className="correction-passage" data-correction-kind={kind}>{children}</span>
      <button
        type="button"
        className={`correction-marker ${FOCUS} rounded-sm`}
        aria-describedby={open ? cardId : undefined}
        aria-expanded={open}
        aria-label={`${meta.label} ${n ?? ''}: ${now}`}
        onClick={() => { setPinned((p) => !p); setOpen((o) => !(o && pinned)) }}
        onFocus={() => setOpen(true)}
        onBlur={(e) => {
          if (!wrapRef.current?.contains(e.relatedTarget as Node)) { setOpen(false); setPinned(false) }
        }}
      >
        c{n ?? ''}
      </button>
      {open && (
        <span
          id={cardId}
          role="tooltip"
          className="correction-card"
        >
          <span className="meta-label block mb-1.5 text-stone-300">{meta.label}</span>
          <span className="block font-sans text-sm text-stone-200 leading-relaxed mb-2">{now}</span>
          {was && (
            // Quoted and labelled, never struck through in the prose above. The original
            // stays recoverable without the wrong version being taught first.
            <span className="block font-mono text-xs text-stone-400 leading-relaxed mb-2 pl-2.5 border-l border-edge">
              It said: {was}
            </span>
          )}
          <span className="block font-sans text-xs text-stone-400">
            {creditUrl && creditTo ? (
              <>
                {meta.verb}{when ? ` ${when}` : ''} — thanks to{' '}
                <a href={creditUrl} target="_blank" rel="noreferrer noopener" className="text-stone-300 underline underline-offset-2">{creditTo}</a>
              </>
            ) : credit}
          </span>
        </span>
      )}
    </span>
  )
}
