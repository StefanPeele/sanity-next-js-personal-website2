'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { FOCUS } from '@/lib/ui'
import { learnMore } from '@/app/actions/learnMore'

type LearnMoreItem = { title: string; author: string; why: string }
// components/article/MarginNotes.tsx
// Phase 6.3 — sidenotes in the margin.
//
// Before this they were tooltips: anchored above the phrase, `pointer-events: none`, visible
// on desktop hover only, and with no answer to any of 6.3's three edge cases. This renders
// them as real margin notes and answers all three explicitly.
//
//   ANCHOR SCROLLS OUT OF VIEW -> the note scrolls away with it. Not stick, not fade. A note
//   that outlives its passage is a note pointing at nothing, and sticking would turn the
//   margin into a second, laggy reading column. Each note is simply placed at its anchor's
//   offset, which also makes the rule trivial to reason about.
//
//   TWO ANCHORS CLOSE ENOUGH TO OVERLAP -> the later note is pushed down, to
//   max(anchorTop, previousBottom + GAP). One top-to-bottom pass. This is what Tufte CSS and
//   gwern.net both do. A dense cluster drifts below its anchors, which is the lesser harm:
//   the alternative is two notes on top of each other, where neither is readable.
//
//   A NOTE LONGER THAN THE SPACE -> it clamps at MAX_LINES and offers "more", which opens
//   the 6.5 window. NOT a scrolling margin box: a second scrollable region on a page is a
//   thing readers do not find.
//
// Positions are MEASURED, not computed from the markup, and re-measured whenever the article
// resizes. That matters more here than usual: Phase 5 gave the reader seven text sizes and
// four spacing scales, every one of which reflows the prose and moves every anchor.

const GAP = 16
// The 12-line clamp lives in ONE place: `-webkit-line-clamp` on .margin-note-text in
// styles/article.css. It used to be repeated here as a constant so an estimated height could
// be computed from it; the estimate is gone, and a second copy of a number is how the two
// drift apart.

interface Note {
  id: string
  /** Where the anchor is. Never changes between passes. */
  anchorTop: number
  /** Where the note is actually placed, after the push-down. */
  top: number
  text: string
  kind: string
  /** Glossary notes carry a link to their full entry; hand-authored ones do not. */
  href: string | null
}

export function MarginNotes({
  label = 'Note',
  moreLabel = 'More',
  closeLabel = 'Close',
  glossaryLabel = 'Full entry in the glossary',
  learnMoreLabel = 'Suggest further reading',
  loadingLabel = 'Looking…',
  generatedLabel = 'Suggested by a model, not by Stefan — look these up rather than trusting them',
  /** False when ANTHROPIC_API_KEY is unset: the control does not render at all. */
  learnMoreEnabled = false,
}: {
  label?: string
  moreLabel?: string
  closeLabel?: string
  glossaryLabel?: string
  learnMoreLabel?: string
  loadingLabel?: string
  generatedLabel?: string
  learnMoreEnabled?: boolean
}) {
  const [notes, setNotes] = useState<Note[]>([])
  const [open, setOpen] = useState<Note | null>(null)
  // 6.5's "Learn more". Per-open state, deliberately: it is generated on demand and never
  // stored, so closing the window throws it away.
  const [more, setMore] = useState<{ status: 'idle' | 'loading' | 'done' | 'error'; items?: LearnMoreItem[]; error?: string }>({ status: 'idle' })
  const hostRef = useRef<HTMLDivElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)

  const measure = useCallback(() => {
    const article = document.querySelector<HTMLElement>('[data-article]')
    const host = hostRef.current
    if (!article || !host) return
    const hostTop = host.getBoundingClientRect().top + window.scrollY
    const anchors = Array.from(article.querySelectorAll<HTMLElement>('[data-sidenote-id]'))

    // PASS ONE: place every note at its own anchor. The push-down happens in pass two,
    // against REAL heights.
    const next: Note[] = []
    anchors.forEach((el) => {
      const text = el.getAttribute('data-sidenote-text') ?? ''
      if (!text) return
      const anchorTop = el.getBoundingClientRect().top + window.scrollY - hostTop
      next.push({
        id: el.getAttribute('data-sidenote-id') ?? '',
        anchorTop,
        top: anchorTop,
        text,
        kind: el.getAttribute('data-sidenote-kind') ?? 'note',
        href: el.getAttribute('data-sidenote-href'),
      })
    })
    setNotes(next)
  }, [])

  /* PASS TWO: the push-down, measured.
   *
   * The first version of this estimated each note's height from its character count and
   * pushed the next one below that estimate. The estimate was wrong, notes overlapped, and
   * the overlap was invisible in a screenshot but not to a click: Playwright could not press
   * "More" because a neighbouring note's label was sitting on top of it. An estimate is not
   * a layout.
   *
   * So the notes are painted at their anchors first, their real heights read back, and the
   * tops corrected. It converges: the width is fixed, so a note's height does not depend on
   * where it sits, and the second pass is the last one. */
  useLayoutEffect(() => {
    const host = hostRef.current
    if (!host || notes.length === 0) return
    const els = Array.from(host.querySelectorAll<HTMLElement>('.margin-note'))
    if (els.length !== notes.length) return
    let prevBottom = -Infinity
    let changed = false
    const next = notes.map((n, i) => {
      const top = Math.max(n.anchorTop, prevBottom + GAP)
      prevBottom = top + els[i].offsetHeight
      if (Math.abs(top - n.top) > 0.5) changed = true
      return { ...n, top }
    })
    if (changed) setNotes(next)
  }, [notes])

  useEffect(() => {
    // Measuring on mount is the point of this effect, not a cascading render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    measure()
    const article = document.querySelector<HTMLElement>('[data-article]')
    if (!article) return
    // Re-measure on reflow. The reader can change text size, line height, letter spacing,
    // word spacing and paragraph spacing — every one of those moves every anchor.
    const ro = new ResizeObserver(() => measure())
    ro.observe(article)
    window.addEventListener('resize', measure)
    // Images and fonts land after first paint and shift everything below them.
    const t = window.setTimeout(measure, 800)
    return () => { ro.disconnect(); window.removeEventListener('resize', measure); window.clearTimeout(t) }
  }, [measure])

  /* 6.3: "shared with the TOC, or replacing it where they would collide."
   *
   * The TOC yields. It is navigation a reader consults deliberately and can reopen at any
   * time; a sidenote is about the sentence in front of them right now. So when a note's rect
   * overlaps the sticky TOC's, the TOC steps back to 12% and stops taking pointer events.
   *
   * rAF-throttled, and it reads rects rather than tracking scroll arithmetic, because the
   * TOC is sticky and the notes are absolute — their relationship changes with scroll in a
   * way that is much easier to observe than to compute. */
  useEffect(() => {
    // The STICKY INNER box, not the <aside>. The aside is now h-full — it spans the whole
    // column so that `position: sticky` has travel — so its rect overlaps every note at every
    // scroll position, and using it made the TOC yield permanently, dimmed to 12% and
    // effectively deleted. Measured: YIELD at y=0, 700, 1400 and 2100 alike. The visible TOC
    // is the sticky child, and that is what a note can actually collide with.
    const toc = document.querySelector<HTMLElement>('[data-toc="sidebar"] .sticky')
    if (!toc || notes.length === 0) return
    let raf = 0
    const check = () => {
      raf = 0
      const t = toc.getBoundingClientRect()
      if (t.width === 0 || t.height === 0) return
      const hit = Array.from(document.querySelectorAll<HTMLElement>('.margin-note')).some((n) => {
        const r = n.getBoundingClientRect()
        return r.height > 0 && r.top < t.bottom && r.bottom > t.top
      })
      toc.classList.toggle('toc-yielding', hit)
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(check) }
    check()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(raf)
      toc.classList.remove('toc-yielding')
    }
  }, [notes])

  // 6.5's window: focus-trapped, Escape closes, focus returns to the note that opened it.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(null); return }
      if (e.key !== 'Tab') return
      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
      if (!focusables?.length) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    dialogRef.current?.querySelector<HTMLElement>('button')?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    // Clearing the generated suggestions when the window opens is the point of this effect:
    // 6.5's results are never stored, so a new note must not show the previous note's.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) { setMore({ status: 'idle' }); return }
    openerRef.current?.focus()
    openerRef.current = null
  }, [open])

  const askForMore = useCallback(async (n: Note) => {
    setMore({ status: 'loading' })
    // The ANCHOR's own words are the term; the note is the context. A sidenote is attached to
    // a phrase, so the phrase is what a reader wants to read more about.
    const anchor = document.querySelector<HTMLElement>(`[data-sidenote-id="${n.id}"] .sidenote-mark`)
    const term = (anchor?.textContent ?? '').replace(/※/g, '').trim()
    const res = await learnMore(term, n.text)
    setMore(res.ok ? { status: 'done', items: res.items } : { status: 'error', error: res.error })
  }, [])

  return (
    <>
      {/* The margin column. `relative` so the notes' absolute offsets are measured against
          it, and aria-hidden because the note text is already in the prose for a screen
          reader — this is a second VISUAL presentation of it, not a second copy. */}
      <div ref={hostRef} className="margin-notes" aria-hidden="true" data-print-hide>
        {notes.map((n) => (
          <div key={n.id} className="margin-note" style={{ top: n.top }} data-sidenote-kind={n.kind}>
            <span className="margin-note-label meta-label">{n.kind === 'glossary' ? 'Definition' : label}</span>
            <p className="margin-note-text">{n.text}</p>
            <button
              type="button"
              className={`margin-note-more ${FOCUS}`}
              onClick={(e) => { openerRef.current = e.currentTarget; setOpen(n) }}
            >
              {moreLabel}
            </button>
          </div>
        ))}
      </div>

      {open && typeof document !== 'undefined' && createPortal(
        <div className="margin-note-scrim" onClick={() => setOpen(null)}>
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            className="margin-note-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <span className="meta-label text-stone-300">{label}</span>
              <button type="button" onClick={() => setOpen(null)} className={`font-sans text-xs text-stone-400 hover:text-white rounded-sm ${FOCUS}`}>
                {closeLabel}
              </button>
            </div>
            <p className="font-sans text-sm text-stone-200 leading-relaxed">{open.text}</p>
            {/* 6.5's "Learn more", and 5.6's rules applied rather than restated: it is
                labelled machine-generated IN THE PANEL, never styled as prose, and never
                stored. It returns titles and authors to look up rather than hyperlinks --
                a model asked for links invents them, and verifying one means a fetch the
                CSP forbids. */}
            {learnMoreEnabled && (
              <div className="mt-4 pt-3 border-t border-edge-faint">
                {more.status === 'idle' && (
                  <button type="button" onClick={() => askForMore(open)} className={`font-sans text-xs text-stone-300 underline underline-offset-4 rounded-sm ${FOCUS}`}>
                    {learnMoreLabel}
                  </button>
                )}
                {more.status === 'loading' && <p className="font-sans text-xs text-stone-400">{loadingLabel}</p>}
                {more.status === 'error' && <p className="font-sans text-xs text-stone-400">{more.error}</p>}
                {more.status === 'done' && (
                  <div>
                    <p className="meta-label text-amber-400/80 mb-2">{generatedLabel}</p>
                    <ul className="list-none m-0 p-0 space-y-2.5">
                      {more.items?.map((it, i) => (
                        <li key={i} className="font-sans text-xs leading-relaxed">
                          <span className="text-stone-200">{it.title}</span>
                          {it.author && <span className="text-stone-400"> — {it.author}</span>}
                          {it.why && <span className="block text-stone-400">{it.why}</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {open.href && (
              // 6.2: a glossary note is a definition that lives somewhere. The inline mark
              // used to carry this link in a hover card; the window carries it now, which is
              // the one place with room for it.
              <a href={open.href} className={`inline-block mt-3 font-sans text-xs text-stone-300 underline underline-offset-4 rounded-sm ${FOCUS}`}>
                {glossaryLabel}
              </a>
            )}
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
