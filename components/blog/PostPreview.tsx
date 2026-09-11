'use client'

import { cloneElement, useCallback, useEffect, useId, useRef, useState } from 'react'
import Image from 'next/image'
import { Icon } from '@/lib/cms/icons'
import { reviewFlags, type StatusMeta, type ReviewFlag } from '@/lib/status'
// components/blog/PostPreview.tsx
// Phase 4.6 — the hover preview. Also the fifth surface of 3.3, which shipped with four:
// the preview carries the same status mark the card does, from the same table.
//
// THE RULE THE BRIEF SETS IS "SMALL". It must not obstruct, startle, or make someone pull
// away. Everything below follows from that:
//
//   IN 350ms, OUT 180ms. 350 is long enough that a pointer crossing the grid on its way
//   somewhere else never opens anything -- the brief's "must not fire on accidental
//   pass-through" -- and short enough to feel deliberate rather than laggy. The 180ms exit
//   grace lets a pointer cross the gap between card and panel without it snapping shut.
//
//   EDGE-AWARE. The panel is measured against the viewport at open time and flips to the
//   other side of the card when there is not room, then clamps vertically. A preview that
//   opens off-screen is worse than none.
//
//   KEYBOARD. Focus opens it on the same delay; Escape and blur close it. A keyboard user
//   reaches the same information rather than a different, lesser version of it.
//
//   TOUCH: DELIBERATELY ABSENT. There is no hover on a touchscreen, and the substitutes are
//   all worse -- long-press collides with text selection and the OS context menu, and
//   tap-to-preview steals the tap that should open the post. On touch the card IS the
//   preview: same title, same excerpt, same status mark, and one tap gets the whole article.
//   Nothing is lost, so nothing needs replacing.
//
//   REDUCED MOTION. The panel has no entrance animation of its own at any setting; under
//   `prefers-reduced-motion` the opacity transition is dropped too (styles/status.css).

const OPEN_DELAY = 350
const CLOSE_DELAY = 180
const PANEL_W = 300
const GAP = 12

export interface PreviewData {
  title: string
  excerpt?: string | null
  imageUrl?: string | null
  lane?: { label: string; color: string } | null
  minutes?: number | null
  status?: readonly (string | null)[] | null
  minutesSuffix?: string
}

type Side = 'right' | 'left'

export function PostPreview({ data, children }: { data: PreviewData; children: React.ReactElement<{ 'aria-describedby'?: string }> }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ side: Side; top: number } | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const panelId = useId()

  const clear = () => { if (timer.current) { clearTimeout(timer.current); timer.current = null } }

  // Measured at open time, not at render: the grid reflows, the page scrolls, and a position
  // computed once on mount is wrong by the time anyone hovers.
  const place = useCallback(() => {
    const el = wrapRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const roomRight = window.innerWidth - r.right
    const side: Side = roomRight >= PANEL_W + GAP ? 'right' : 'left'
    // Vertical: start level with the card, then pull up if the panel would run past the
    // bottom of the viewport. Never above the top.
    const estimatedH = data.imageUrl ? 260 : 170
    const overflow = Math.max(0, r.top + estimatedH - (window.innerHeight - 8))
    setPos({ side, top: -Math.min(overflow, Math.max(0, r.top - 8)) })
  }, [data.imageUrl])

  const schedule = useCallback((next: boolean) => {
    clear()
    timer.current = setTimeout(() => {
      if (next) place()
      setOpen(next)
    }, next ? OPEN_DELAY : CLOSE_DELAY)
  }, [place])

  useEffect(() => () => clear(), [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { clear(); setOpen(false) } }
    // Any scroll invalidates the measured position; closing is more honest than letting the
    // panel drift away from the card it describes.
    const onScroll = () => { clear(); setOpen(false) }
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onScroll)
    }
  }, [open])

  // The mark the card shows, from the same call, so the two cannot disagree.
  const flags: Array<StatusMeta & { key: ReviewFlag }> = reviewFlags(data.status, 2)

  return (
    <div
      ref={wrapRef}
      // h-full, and nothing else in the box model: this div becomes the grid item in place
      // of the card link, and without it the grid's equal-height cards collapse to content
      // height.
      className="relative h-full"
      onMouseEnter={() => schedule(true)}
      onMouseLeave={() => schedule(false)}
      onFocus={() => schedule(true)}
      onBlur={(e) => { if (!wrapRef.current?.contains(e.relatedTarget as Node)) { clear(); setOpen(false) } }}
    >
      {/* cloneElement rather than a wrapping <div aria-describedby>: the description has to
          land on the LINK for a screen reader to associate the two. On a wrapper it is
          announced to nobody, and the extra element breaks the height chain as well. */}
      {cloneElement(children, { 'aria-describedby': open ? panelId : undefined })}

      {open && pos && (
        <div
          id={panelId}
          role="tooltip"
          // Not focusable and not hoverable: it is a preview, not a second copy of the card.
          // Letting the pointer enter it would mean handling re-entry, and the brief's whole
          // framing is "a convenience, not a takeover".
          className="post-preview"
          style={{
            [pos.side === 'right' ? 'left' : 'right']: '100%',
            marginLeft: pos.side === 'right' ? GAP : undefined,
            marginRight: pos.side === 'left' ? GAP : undefined,
            top: pos.top,
            width: PANEL_W,
          }}
        >
          {data.imageUrl && (
            // next/image, not a raw <img>. The card behind this fetches an OPTIMISED variant
            // via `fill` + `sizes`; pointing a plain img at data.imageUrl would download the
            // full-size original instead of reusing anything, which is a large fetch for a
            // 300px thumbnail that appears on hover.
            <Image
              src={data.imageUrl}
              alt=""
              width={PANEL_W}
              height={110}
              className="w-full h-[110px] object-cover rounded-md mb-2.5"
            />
          )}
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            {data.lane && (
              <span className="meta-label" style={{ color: data.lane.color }}>{data.lane.label}</span>
            )}
            {flags.map((f) => (
              <span key={f.key} className={`inline-flex items-center ${f.color}`} title={f.label}>
                <Icon name={f.icon} size={13} aria-hidden />
                <span className="sr-only">{f.label}</span>
              </span>
            ))}
          </div>
          <p className="font-serif text-stone-100 text-[0.95rem] leading-snug mb-1.5">{data.title}</p>
          {data.excerpt && (
            <p className="font-sans text-xs text-stone-400 leading-relaxed line-clamp-3">{data.excerpt}</p>
          )}
          {!!data.minutes && (
            <p className="font-mono text-xs text-stone-400 mt-2">{data.minutes} {data.minutesSuffix ?? 'min'}</p>
          )}
        </div>
      )}
    </div>
  )
}
