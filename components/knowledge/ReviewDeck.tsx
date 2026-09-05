'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { formatDate } from '@/lib/dates'
// components/knowledge/ReviewDeck.tsx
// Spaced repetition over concept cards and quiz questions pulled from every post.
// SM-2-lite: again / hard / good / easy adjust an ease factor and interval; due dates
// live in localStorage keyed by card id. No accounts, no server state.

export interface ReviewCard {
  id: string
  kind: 'concept' | 'quiz'
  front: string
  back: string
  /** Quiz only: answer options, with the correct ones flagged. */
  options?: { text: string; isCorrect: boolean }[]
  post: { title: string; slug: string }
}

interface CardState {
  ease: number      // 1.3 – 3.0
  interval: number  // days
  due: number       // epoch ms
  reps: number
  lapses: number
}

interface Store {
  cards: Record<string, CardState>
  streak: { count: number; last: string } // last = YYYY-MM-DD
  reviewed: number
}

type Grade = 'again' | 'hard' | 'good' | 'easy'

const KEY = 'sp_review_v1'
const DAY = 86400000
const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400'

function today(): string { return new Date().toISOString().slice(0, 10) }

function load(): Store {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const s = JSON.parse(raw) as Store
      if (s && typeof s === 'object' && s.cards) return { cards: s.cards, streak: s.streak ?? { count: 0, last: '' }, reviewed: s.reviewed ?? 0 }
    }
  } catch {}
  return { cards: {}, streak: { count: 0, last: '' }, reviewed: 0 }
}

function save(s: Store) { try { localStorage.setItem(KEY, JSON.stringify(s)) } catch {} }

/** SM-2-lite. Returns the next state for a card after a grade. */
export function schedule(prev: CardState | undefined, grade: Grade, now = Date.now()): CardState {
  const s: CardState = prev ?? { ease: 2.5, interval: 0, due: now, reps: 0, lapses: 0 }
  let { ease, interval, reps, lapses } = s
  if (grade === 'again') {
    ease = Math.max(1.3, ease - 0.2)
    interval = 0
    reps = 0
    lapses += 1
    return { ease, interval, reps, lapses, due: now + 10 * 60 * 1000 } // 10 minutes
  }
  if (grade === 'hard') ease = Math.max(1.3, ease - 0.15)
  if (grade === 'easy') ease = Math.min(3.0, ease + 0.15)
  reps += 1
  if (reps === 1) interval = grade === 'easy' ? 4 : 1
  else if (reps === 2) interval = grade === 'easy' ? 7 : grade === 'hard' ? 2 : 3
  else interval = Math.round(interval * (grade === 'hard' ? 1.2 : grade === 'easy' ? ease * 1.3 : ease))
  interval = Math.max(1, Math.min(interval, 365))
  return { ease, interval, reps, lapses, due: now + interval * DAY }
}

function bumpStreak(streak: Store['streak']): Store['streak'] {
  const t = today()
  if (streak.last === t) return streak
  const yesterday = new Date(Date.now() - DAY).toISOString().slice(0, 10)
  return { count: streak.last === yesterday ? streak.count + 1 : 1, last: t }
}

export function ReviewDeck({ cards }: { cards: ReviewCard[] }) {
  const [store, setStore] = useState<Store>({ cards: {}, streak: { count: 0, last: '' }, reviewed: 0 })
  const [mounted, setMounted] = useState(false)
  const [queue, setQueue] = useState<string[]>([])
  const [revealed, setRevealed] = useState(false)
  const [picked, setPicked] = useState<number | null>(null)
  const [sessionDone, setSessionDone] = useState(0)
  const [mode, setMode] = useState<'due' | 'all'>('due')

  const byId = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards])

  const dueIds = useCallback((s: Store, all: boolean) => {
    const now = Date.now()
    return cards
      .filter((c) => all || !s.cards[c.id] || s.cards[c.id]!.due <= now)
      .sort((a, b) => (s.cards[a.id]?.due ?? 0) - (s.cards[b.id]?.due ?? 0))
      .map((c) => c.id)
  }, [cards])

  useEffect(() => {
    const s = load()
    setStore(s)
    setQueue(dueIds(s, false))
    setMounted(true)
  }, [dueIds])

  const startSession = (all: boolean) => {
    setMode(all ? 'all' : 'due')
    setQueue(dueIds(store, all))
    setRevealed(false)
    setPicked(null)
    setSessionDone(0)
  }

  const current = queue.length > 0 ? byId.get(queue[0]!) : undefined
  const dueCount = mounted ? dueIds(store, false).length : 0
  const learned = Object.values(store.cards).filter((c) => c.reps > 0).length

  const grade = (g: Grade) => {
    if (!current) return
    const next: Store = {
      cards: { ...store.cards, [current.id]: schedule(store.cards[current.id], g) },
      streak: bumpStreak(store.streak),
      reviewed: store.reviewed + 1,
    }
    setStore(next)
    save(next)
    setQueue((q) => {
      const rest = q.slice(1)
      // "again" comes back at the end of this session.
      return g === 'again' ? [...rest, current.id] : rest
    })
    setSessionDone((n) => n + 1)
    setRevealed(false)
    setPicked(null)
  }

  const resetAll = () => {
    const empty: Store = { cards: {}, streak: { count: 0, last: '' }, reviewed: 0 }
    setStore(empty)
    save(empty)
    setQueue(dueIds(empty, false))
    setRevealed(false)
    setPicked(null)
  }

  // Keyboard: space reveals, 1–4 grade
  useEffect(() => {
    if (!current) return
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
      if (e.key === ' ' && !revealed) { e.preventDefault(); setRevealed(true) }
      if (revealed && ['1', '2', '3', '4'].includes(e.key)) {
        e.preventDefault()
        grade((['again', 'hard', 'good', 'easy'] as Grade[])[Number(e.key) - 1]!)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, revealed, store])

  const nextDue = useMemo(() => {
    const future = Object.values(store.cards).map((c) => c.due).filter((d) => d > Date.now())
    return future.length ? new Date(Math.min(...future)) : null
  }, [store])

  return (
    <div>
      {/* Stats */}
      <dl className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Due now', value: dueCount },
          { label: 'Streak', value: `${store.streak.count} day${store.streak.count === 1 ? '' : 's'}` },
          { label: 'Learned', value: `${learned} / ${cards.length}` },
          { label: 'Reviews total', value: store.reviewed },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-4">
            <dd className="font-serif text-2xl text-white font-bold">{mounted ? s.value : '—'}</dd>
            <dt className="font-mono text-[8px] uppercase tracking-widest text-stone-400 mt-0.5">{s.label}</dt>
          </div>
        ))}
      </dl>

      {/* Card */}
      {current ? (
        <section aria-live="polite" className="rounded-xl border border-white/15 bg-[#101012] p-6 md:p-8 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 font-mono text-[8px] uppercase tracking-[0.3em] text-stone-400">
            <span className="border border-white/10 px-2 py-0.5 rounded-sm text-stone-300">{current.kind === 'quiz' ? 'Knowledge check' : 'Concept'}</span>
            <span>{sessionDone} done · {queue.length} left{mode === 'all' ? ' · full deck' : ''}</span>
          </div>

          <p className="font-serif text-2xl md:text-3xl text-white leading-snug mb-6">{current.front}</p>

          {current.kind === 'quiz' && current.options && (
            <ul className="space-y-2 mb-6" role="group" aria-label="Answer options">
              {current.options.map((o, i) => {
                const chosen = picked === i
                const show = revealed
                const cls = show
                  ? o.isCorrect ? 'border-emerald-500/60 text-emerald-300 bg-emerald-950/20' : chosen ? 'border-red-500/50 text-red-300' : 'border-white/[0.08] text-stone-400'
                  : chosen ? 'border-white/40 text-white bg-white/5' : 'border-white/10 text-stone-300 hover:border-white/30'
                return (
                  <li key={i}>
                    <button
                      type="button"
                      disabled={revealed}
                      onClick={() => { setPicked(i); setRevealed(true) }}
                      aria-pressed={chosen}
                      className={`w-full text-left px-4 py-3 rounded-lg border font-sans text-sm transition-colors disabled:cursor-default ${cls} ${FOCUS}`}
                    >
                      <span className="font-mono text-[9px] text-stone-400 mr-3">{String.fromCharCode(65 + i)}</span>{o.text}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          {revealed ? (
            <div className="border-t border-white/[0.08] pt-5">
              <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-stone-400 mb-2">{current.kind === 'quiz' ? 'Explanation' : 'Answer'}</p>
              <p className="text-stone-200 text-base leading-relaxed mb-5">{current.back}</p>
              <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-stone-400 mb-2">How well did you know it?</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2" role="group" aria-label="Grade this card">
                {([
                  ['again', 'Again', '< 10 min', 'text-red-300 border-red-500/40'],
                  ['hard', 'Hard', 'soon', 'text-amber-300 border-amber-400/40'],
                  ['good', 'Good', 'days', 'text-stone-200 border-white/30'],
                  ['easy', 'Easy', 'longer', 'text-emerald-300 border-emerald-500/40'],
                ] as [Grade, string, string, string][]).map(([g, label, hint, cls], i) => (
                  <button key={g} type="button" onClick={() => grade(g)} className={`rounded-lg border px-3 py-3 text-left hover:bg-white/5 transition-colors ${cls} ${FOCUS}`}>
                    <span className="font-mono text-[10px] uppercase tracking-widest block">{i + 1} · {label}</span>
                    <span className="font-mono text-[8px] text-stone-400 uppercase tracking-widest">{hint}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : current.kind === 'concept' ? (
            <button type="button" onClick={() => setRevealed(true)} className={`font-mono text-[10px] uppercase tracking-widest bg-white text-black px-5 py-2.5 rounded-sm hover:bg-stone-200 transition-colors ${FOCUS}`}>
              Reveal answer <span className="text-stone-400 ml-2">space</span>
            </button>
          ) : (
            <p className="font-mono text-[9px] uppercase tracking-widest text-stone-400">Pick an answer to reveal the explanation.</p>
          )}

          <p className="mt-6 pt-4 border-t border-white/5 font-mono text-[9px] uppercase tracking-widest text-stone-400">
            From{' '}
            <Link href={`/blog/${current.post.slug}`} className={`text-stone-300 hover:text-white underline underline-offset-4 rounded-sm ${FOCUS}`}>{current.post.title}</Link>
          </p>
        </section>
      ) : (
        <section className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-8 text-center mb-6">
          {cards.length === 0 ? (
            <>
              <p className="font-serif italic text-stone-300 text-lg mb-2">Nothing to review yet.</p>
              <p className="font-mono text-[9px] text-stone-400 uppercase tracking-widest">Concept cards and knowledge checks on posts feed this deck automatically.</p>
            </>
          ) : (
            <>
              <p className="font-serif italic text-stone-300 text-lg mb-2">{sessionDone > 0 ? 'Session complete.' : 'Nothing due right now.'}</p>
              <p className="font-mono text-[9px] text-stone-400 uppercase tracking-widest mb-5">
                {nextDue ? `Next card due ${formatDate(nextDue, 'relative')}` : 'Every card has been graded at least once.'}
              </p>
              <button type="button" onClick={() => startSession(true)} className={`font-mono text-[10px] uppercase tracking-widest border border-white/20 text-stone-200 hover:text-white hover:border-white/40 px-5 py-2.5 rounded-sm transition-colors ${FOCUS}`}>
                Review the full deck anyway
              </button>
            </>
          )}
        </section>
      )}

      <div className="flex flex-wrap items-center gap-4 font-mono text-[9px] uppercase tracking-widest text-stone-400">
        <span>Space reveals · 1–4 grades</span>
        {mounted && Object.keys(store.cards).length > 0 && (
          <button type="button" onClick={resetAll} className={`ml-auto hover:text-white rounded-sm ${FOCUS}`}>Reset progress</button>
        )}
      </div>
    </div>
  )
}
