'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { articleTypeMeta } from '@/lib/site'
import { readingTime } from '@/lib/reading'
import { noteStatus } from '@/components/garden/status'
import type { LearningPathBySlugQueryResult } from '@/sanity.types'
// components/knowledge/PathSteps.tsx
// Ordered steps of a learning path with a checkbox per step. Completion is stored in
// localStorage under `sp_path_<slug>` so progress survives reloads without an account.

export const LEVEL_LABELS: Record<string, string> = {
  foundations: 'Foundations',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

type Step = NonNullable<NonNullable<LearningPathBySlugQueryResult>['steps']>[number]

const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400'
const NOTE_MINUTES = 3

function storageKey(slug: string) { return `sp_path_${slug}` }

function load(slug: string): Set<string> {
  try {
    const raw = localStorage.getItem(storageKey(slug))
    const arr = raw ? JSON.parse(raw) : []
    return new Set(Array.isArray(arr) ? arr.filter((k) => typeof k === 'string') : [])
  } catch { return new Set() }
}

export function stepMinutes(step: Step): number {
  if (step.post) return readingTime(step.post.wordCount ?? 0)
  return NOTE_MINUTES
}

export function PathSteps({ slug, steps }: { slug: string; steps: Step[] }) {
  const [done, setDone] = useState<Set<string>>(new Set())
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setDone(load(slug))
    setMounted(true)
  }, [slug])

  const toggle = (key: string) => {
    setDone((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      try { localStorage.setItem(storageKey(slug), JSON.stringify([...next])) } catch {}
      return next
    })
  }

  const reset = () => {
    setDone(new Set())
    try { localStorage.removeItem(storageKey(slug)) } catch {}
  }

  const totalMinutes = useMemo(() => steps.reduce((n, s) => n + stepMinutes(s), 0), [steps])
  const completed = steps.filter((s) => done.has(s._key)).length
  const pct = steps.length ? Math.round((completed / steps.length) * 100) : 0
  const nextStep = steps.find((s) => !done.has(s._key))

  return (
    <div>
      {/* Progress */}
      <div className="mb-8 rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
        <div className="flex items-center justify-between gap-4 mb-3">
          <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-stone-500">Progress</span>
          <span className="font-mono text-[10px] text-stone-300" aria-live="polite">
            {mounted ? `${completed} / ${steps.length} · ${pct}%` : `0 / ${steps.length}`}
          </span>
        </div>
        <div className="h-1 bg-white/[0.08] rounded-full overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Path progress">
          <div className="h-full bg-emerald-500/80 rounded-full transition-[width] duration-500" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex flex-wrap items-center gap-4 mt-4">
          <span className="font-mono text-[9px] uppercase tracking-widest text-stone-500">~{totalMinutes} min of reading</span>
          {nextStep && (nextStep.post?.slug || nextStep.gardenNote?.slug) && (
            <Link
              href={nextStep.post ? `/blog/${nextStep.post.slug}` : `/garden/${nextStep.gardenNote?.slug}`}
              className={`ml-auto font-mono text-[10px] uppercase tracking-widest bg-white text-black px-4 py-2 rounded-sm hover:bg-stone-200 transition-colors ${FOCUS}`}
            >
              {completed === 0 ? 'Start here →' : 'Continue →'}
            </Link>
          )}
          {completed === steps.length && steps.length > 0 && (
            <span className="ml-auto font-mono text-[10px] uppercase tracking-widest text-emerald-400">Path complete</span>
          )}
          {completed > 0 && (
            <button type="button" onClick={reset} className={`font-mono text-[9px] uppercase tracking-widest text-stone-500 hover:text-white rounded-sm ${FOCUS}`}>
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Steps */}
      <ol className="space-y-3">
        {steps.map((step, i) => {
          const isDone = done.has(step._key)
          const isNext = nextStep?._key === step._key
          const post = step.post
          const note = step.gardenNote
          const href = post ? `/blog/${post.slug}` : `/garden/${note?.slug}`
          const title = post?.title ?? note?.title ?? 'Untitled step'
          const meta = post ? articleTypeMeta(post.articleType) : null
          const status = note ? noteStatus(note.status) : null
          const inputId = `step-${step._key}`
          return (
            <li
              key={step._key}
              className={`flex gap-4 rounded-xl border p-4 transition-colors ${
                isDone ? 'border-white/[0.06] bg-white/[0.01] opacity-70' : isNext ? 'border-amber-400/30 bg-amber-400/[0.03]' : 'border-white/[0.08] bg-white/[0.02]'
              }`}
            >
              <div className="flex flex-col items-center gap-2 pt-1">
                <span className="font-mono text-[9px] text-stone-500 w-5 text-center">{String(i + 1).padStart(2, '0')}</span>
                <input
                  id={inputId}
                  type="checkbox"
                  checked={isDone}
                  onChange={() => toggle(step._key)}
                  className={`h-4 w-4 accent-emerald-500 cursor-pointer ${FOCUS}`}
                  aria-label={`Mark step ${i + 1}, ${title}, as ${isDone ? 'not done' : 'done'}`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1 font-mono text-[8px] uppercase tracking-[0.25em]">
                  {meta ? (
                    <span className="border px-2 py-0.5 rounded-sm" style={{ color: meta.color, borderColor: `${meta.color}55`, backgroundColor: meta.bg }}>{meta.label}</span>
                  ) : status ? (
                    <span className={`border px-2 py-0.5 rounded-sm ${status.badge}`}>Note · {status.label}</span>
                  ) : null}
                  <span className="text-stone-500">{stepMinutes(step)} min</span>
                  {isNext && <span className="text-amber-300">Up next</span>}
                </div>
                <Link href={href} className={`font-serif text-lg text-white hover:text-stone-200 leading-snug rounded-sm ${FOCUS} ${isDone ? 'line-through decoration-stone-600' : ''}`}>
                  {title}
                </Link>
                {step.note && <p className="text-stone-400 text-sm leading-relaxed mt-1">{step.note}</p>}
                {post?.excerpt && !step.note && <p className="text-stone-500 text-sm leading-relaxed mt-1 line-clamp-2">{post.excerpt}</p>}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
