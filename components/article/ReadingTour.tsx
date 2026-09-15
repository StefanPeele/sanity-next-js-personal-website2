'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { readingFraction } from '@/lib/articleScroll'
import { FOCUS } from '@/lib/ui'
import type { ArticleUiCopy } from '@/lib/cms/defaults/articleUi'
// components/article/ReadingTour.tsx
//
// The first-visit tour. Its job is the handful of things a reader will never find alone.
//
// THE TRIGGER IS THE PART MOST TOURS GET WRONG. Showing one the second someone arrives asks
// them to learn the furniture of a room they have not decided to sit in, and it lands before
// the thing it describes is on screen. This waits until the reader has committed: 25% of the
// way down the article, or twenty seconds, whichever comes first.
//
// A QUIET BAR FIRST, the tour only on yes. Two buttons of equal weight and NO close X,
// because an X that means something different from the decline button is exactly how a reader
// ends up seeing it twice. There is no "later" state to come back from: one decision, stored,
// done.
//
// "Never twice even if the cookie is cleared mid-visit" cannot be done with a cookie alone,
// so a sessionStorage flag is written at the same moment and either one suppresses the bar.
//
// ONE DEVIATION FROM MY OWN PROPOSAL, and it is a correction. I proposed gating the tour
// behind a pointer-capable check so a screen-reader user would not be walked through a
// visual highlight sequence. That was the wrong fix: it excludes people from the
// explanation rather than making the explanation work for them. The right fix is that every
// sentence stands on its own without naming a position on screen, which is now enforced in
// the Studio field description. The highlight is decoration on top of text that works
// without it.

const COOKIE = 'sp_tour'
const SESSION_KEY = 'sp_tour_seen'
const SCROLL_TRIGGER = 0.25
const TIME_TRIGGER_MS = 20_000

/** Selector per step, in the order the copy describes them. A missing target is normal. */
const TARGETS = [
  '.reading-toolbar-trigger',
  '[data-toc="sidebar"], [data-toc="mobile"]',
  '[data-aura], [data-review-flag]',
  '.sidenote-anchor',
  '.correction-mark, #corrections',
]

function decided(): boolean {
  try {
    if (document.cookie.split('; ').some((c) => c.startsWith(`${COOKIE}=`))) return true
    if (sessionStorage.getItem(SESSION_KEY)) return true
  } catch { /* private mode: fall through and just show it */ }
  return false
}

function remember() {
  try {
    // One year. Accepting and declining write the SAME value, because both are final.
    document.cookie = `${COOKIE}=done; path=/; max-age=31536000; samesite=lax`
    sessionStorage.setItem(SESSION_KEY, '1')
  } catch { /* private mode */ }
}

export function ReadingTour({ copy }: { copy: ArticleUiCopy['tour'] }) {
  const [phase, setPhase] = useState<'idle' | 'invite' | 'running'>('idle')
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const restoreFocus = useRef<HTMLElement | null>(null)

  const steps = copy?.steps ?? []
  const enabled = Boolean(copy?.enabled) && steps.length > 0

  // ── the trigger ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled || decided()) return
    let done = false
    const open = () => {
      if (done) return
      done = true
      setPhase('invite')
      window.removeEventListener('scroll', onScroll)
      clearTimeout(timer)
    }
    const onScroll = () => {
      // A quarter of the ARTICLE, not a quarter of the page. Measured against the document
      // the trigger fired later on posts with long comment threads and newsletter blocks
      // below them, which is precisely backwards: the more page there is under the piece,
      // the further into the reading the reader would have to be before being offered help.
      if (readingFraction(window.scrollY) >= SCROLL_TRIGGER) open()
    }
    const timer = setTimeout(open, TIME_TRIGGER_MS)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); clearTimeout(timer) }
  }, [enabled])

  // ── the highlight ──────────────────────────────────────────────────────
  // A missing target is the NORMAL case on this site today: no published post carries a
  // status, a sidenote or a correction. The step still runs, centred, with no highlight,
  // because the vocabulary is worth teaching before the content exists.
  useEffect(() => {
    // The highlight is a measured DOM rect, which does not exist until after paint, so this
    // is React synchronising to an external system rather than deriving state from props.
    // Every write goes through `measure` and none of them is synchronous with the effect
    // body, which is what the compiler lint is actually about.
    const el = phase === 'running' ? document.querySelector(TARGETS[step] ?? '') : null
    const measure = () => {
      if (!el) { setRect(null); return }
      const r = el.getBoundingClientRect()
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
    }
    if (el) {
      el.scrollIntoView({ block: 'center', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
    }
    // A timeout even when there is no target: it keeps the state write off the effect's
    // synchronous path in both branches, so the two cases behave the same way.
    const t = setTimeout(measure, el ? 320 : 0)
    window.addEventListener('resize', measure)
    return () => { clearTimeout(t); window.removeEventListener('resize', measure) }
  }, [phase, step])

  const finish = useCallback(() => {
    remember()
    setPhase('idle')
    setStep(0)
    restoreFocus.current?.focus()
  }, [])

  const accept = () => {
    restoreFocus.current = document.activeElement as HTMLElement
    remember()
    setStep(0)
    setPhase('running')
  }

  // ── focus trap, and Escape ends it as DONE rather than "ask again" ─────
  useEffect(() => {
    if (phase !== 'running') return
    dialogRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); finish(); return }
      if (e.key !== 'Tab') return
      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>('button, [href], [tabindex]:not([tabindex="-1"])')
      if (!focusables?.length) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [phase, finish])

  // Listen for the reader menu's "show the reading tips", so a reader who declined while
  // busy is not punished for it. A tour worth showing once is worth finding again.
  useEffect(() => {
    const replay = () => { restoreFocus.current = document.activeElement as HTMLElement; setStep(0); setPhase('running') }
    window.addEventListener('sp:show-tour', replay)
    return () => window.removeEventListener('sp:show-tour', replay)
  }, [])

  if (!enabled) return null

  if (phase === 'invite') {
    return (
      <div
        role="region"
        aria-label={copy.invite}
        data-print-hide
        className="fixed inset-x-0 bottom-0 z-[1003] border-t border-edge bg-surface-raised/95 backdrop-blur-md px-6 py-4"
      >
        <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <p className="font-sans text-sm text-stone-200 m-0">
            {copy.invite} {copy.inviteQuestion}
          </p>
          {/* Same size, same row, neither styled as the primary. Declining must cost no more
              than accepting, and there is no third option. */}
          <div className="flex gap-2 shrink-0">
            <button type="button" onClick={finish} className={`font-sans text-sm px-4 py-2 rounded-lg border border-edge text-stone-300 hover:text-white ${FOCUS}`}>
              {copy.declineLabel}
            </button>
            <button type="button" onClick={accept} className={`font-sans text-sm px-4 py-2 rounded-lg border border-edge text-stone-300 hover:text-white ${FOCUS}`}>
              {copy.acceptLabel}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (phase !== 'running') return null
  const current = steps[step]
  const last = step === steps.length - 1

  return (
    <>
      {/* The highlight. Decoration on top of text that works without it, so it is
          aria-hidden and never the only way a step makes sense. */}
      {rect && (
        <div
          aria-hidden="true"
          data-print-hide
          className="fixed z-[1003] pointer-events-none rounded-lg ring-2 ring-amber-300/80"
          style={{ top: rect.top - 6, left: rect.left - 6, width: rect.width + 12, height: rect.height + 12 }}
        />
      )}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        tabIndex={-1}
        data-print-hide
        className="fixed inset-x-4 bottom-4 md:inset-x-auto md:right-6 md:bottom-6 md:w-96 z-[1004] rounded-xl border border-edge bg-surface-raised shadow-2xl p-5"
      >
        <p className="meta-label text-sm mb-2">{step + 1} / {steps.length}</p>
        <h2 id="tour-title" className="font-serif text-xl text-white mb-2">{current?.title}</h2>
        <p className="font-sans text-sm text-stone-300 leading-relaxed m-0">{current?.body}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => (last ? finish() : setStep((s) => s + 1))}
            className={`font-sans text-sm px-4 py-2 rounded-lg border border-edge text-stone-200 hover:text-white ${FOCUS}`}
          >
            {last ? copy.doneLabel : copy.nextLabel}
          </button>
        </div>
      </div>
    </>
  )
}
