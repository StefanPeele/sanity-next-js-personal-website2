'use client'

import { useId, useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { NOTE_STATUS, NOTE_STATUS_ORDER, noteStatus, type NoteStatus } from './status'
import { formatDate, parseDate } from '@/lib/dates'
// components/garden/GrowthTimeline.tsx
// A small SVG strip of notes over time. Each note is a line from the day it was
// created to the day it was last tended, in a lane per status. Plain SVG (no d3
// runtime) so it renders on the server; the draw-in animation respects reduced motion.

interface TimelineNote {
  _id: string
  title: string | null
  slug: string | null
  status: NoteStatus | null
  _createdAt: string
  lastTended: string
}

const W = 720
const LANE = 26
const PAD_L = 84
const PAD_R = 16
const PAD_T = 14

export function GrowthTimeline({ notes, onSelect }: { notes: TimelineNote[]; onSelect?: (slug: string) => void }) {
  const reduce = useReducedMotion()
  const gradId = useId()

  const model = useMemo(() => {
    const rows = notes
      .map((n) => {
        const created = parseDate(n._createdAt)
        const tended = parseDate(n.lastTended) ?? created
        if (!created || !tended) return null
        return { ...n, created, tended: tended < created ? created : tended }
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
    if (rows.length === 0) return null
    const min = Math.min(...rows.map((r) => r.created.getTime()))
    // No Date.now() here: the component is server-rendered, and a clock read during render
    // would give the server and client different scales (hydration mismatch).
    const max = Math.max(...rows.map((r) => r.tended.getTime()))
    const span = Math.max(max - min, 86400000 * 30)
    const x = (t: number) => PAD_L + ((t - min) / span) * (W - PAD_L - PAD_R)
    return { rows, min, max, x }
  }, [notes])

  if (!model) return null

  const H = PAD_T + LANE * NOTE_STATUS_ORDER.length + 28
  const counts = NOTE_STATUS_ORDER.map((s) => ({ s, n: model.rows.filter((r) => (r.status ?? 'seedling') === s).length }))
  const summary = counts.map(({ s, n }) => `${n} ${NOTE_STATUS[s].label.toLowerCase()}`).join(', ')
  const firstDate = formatDate(new Date(model.min), 'month')
  const lastDate = formatDate(new Date(model.max), 'month')

  return (
    <figure className="rounded-xl border border-edge bg-surface-veil p-4 overflow-hidden">
      <figcaption className="flex items-center justify-between gap-4 mb-3">
        <span className="meta-label text-stone-400 border-l-2 border-stone-700 pl-3">
          Growth timeline
        </span>
        <span className="meta-label text-stone-400">
          {firstDate} → {lastDate}
        </span>
      </figcaption>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full min-w-[480px] h-auto"
          role="img"
          aria-label={`Growth timeline: ${model.rows.length} notes from ${firstDate} to ${lastDate}; ${summary}. Each line runs from the day a note was created to the day it was last tended.`}
        >
          <defs>
            <linearGradient id={gradId} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="rgba(255,255,255,0.05)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.35)" />
            </linearGradient>
          </defs>

          {/* Lanes */}
          {NOTE_STATUS_ORDER.map((s, i) => {
            const y = PAD_T + i * LANE + LANE / 2
            return (
              <g key={s}>
                <line x1={PAD_L} x2={W - PAD_R} y1={y} y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="2 4" />
                <text x={PAD_L - 10} y={y + 3} textAnchor="end" fontSize="8" fill="#a8a29e" fontFamily="var(--font-mono), monospace" letterSpacing="0.15em">
                  {NOTE_STATUS[s].label.toUpperCase()}
                </text>
              </g>
            )
          })}

          {/* Notes */}
          {model.rows.map((r, idx) => {
            const s = noteStatus(r.status)
            const lane = NOTE_STATUS_ORDER.indexOf((r.status ?? 'seedling') as NoteStatus)
            const y = PAD_T + lane * LANE + LANE / 2 + ((idx % 3) - 1) * 4
            const x1 = model.x(r.created.getTime())
            const x2 = Math.max(model.x(r.tended.getTime()), x1 + 2)
            const label = `${r.title ?? 'Untitled'} — created ${formatDate(r.created, 'short')}, tended ${formatDate(r.tended, 'short')}`
            const clickable = Boolean(onSelect && r.slug)
            return (
              <g
                key={r._id}
                role={clickable ? 'button' : undefined}
                tabIndex={clickable ? 0 : undefined}
                aria-label={label}
                className={clickable ? 'cursor-pointer outline-none focus-visible:[&>circle]:stroke-amber-400' : undefined}
                onClick={clickable ? () => onSelect!(r.slug!) : undefined}
                onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect!(r.slug!) } } : undefined}
              >
                <title>{label}</title>
                <motion.line
                  x1={x1} x2={x2} y1={y} y2={y}
                  stroke={`url(#${gradId})`}
                  strokeWidth={2}
                  strokeLinecap="round"
                  initial={reduce ? false : { pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.6, delay: Math.min(idx * 0.03, 0.6) }}
                />
                <motion.circle
                  cx={x2} cy={y} r={3.5}
                  fill={s.hex}
                  stroke="#0a0a0a"
                  strokeWidth={1}
                  initial={reduce ? false : { scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3, delay: Math.min(idx * 0.03, 0.6) + 0.4 }}
                />
              </g>
            )
          })}

          {/* Axis */}
          <text x={PAD_L} y={H - 8} fontSize="8" fill="#78716c" fontFamily="var(--font-mono), monospace">{firstDate.toUpperCase()}</text>
          <text x={W - PAD_R} y={H - 8} fontSize="8" fill="#78716c" textAnchor="end" fontFamily="var(--font-mono), monospace">{lastDate.toUpperCase()}</text>
        </svg>
      </div>

      {/* Text alternative */}
      <p className="meta-label mt-3 text-stone-400">
        {model.rows.length} notes · {summary}. Lines run from created to last tended.
      </p>
    </figure>
  )
}
