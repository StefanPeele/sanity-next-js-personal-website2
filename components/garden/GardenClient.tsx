'use client'

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { NOTE_STATUS, NOTE_STATUS_ORDER, ORIGIN_LABELS, noteStatus, type NoteStatus } from './status'
import { GrowthTimeline } from './GrowthTimeline'
import { formatDate } from '@/lib/dates'
import type { GardenNoteView, GardenTag } from './types'
import { Icon } from '@/lib/cms/icons'
// components/garden/GardenClient.tsx
// Interactive garden index: status legend, growth timeline, recently tended,
// search, tag filter (synced to ?tag=), and expandable note cards whose titles
// are real links to /garden/[slug]. ?note=<slug> deep-links to an expanded card.

interface GardenClientProps {
  notes: GardenNoteView[]
  tags: GardenTag[]
  recentlyTended: GardenNoteView[]
}

const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400'

// ── Note card ─────────────────────────────────────────────────────
function NoteCard({
  note,
  expanded,
  onToggle,
  onTag,
  activeTag,
}: {
  note: GardenNoteView
  expanded: boolean
  onToggle: () => void
  onTag: (slug: string) => void
  activeTag: string | null
}) {
  const config = noteStatus(note.status)
  const preview = note.plain.slice(0, 140)
  const href = `/garden/${note.slug}`
  const bodyId = `note-body-${note._id}`

  return (
    <article
      className={`rounded-xl border transition-all duration-300 overflow-hidden ${
        expanded ? 'border-white/25 shadow-lg shadow-black/40' : 'border-white/[0.08] hover:border-white/[0.18]'
      }`}
      style={{ backgroundColor: expanded ? 'rgba(20,20,24,0.98)' : 'rgba(14,14,16,0.9)' }}
      aria-labelledby={`note-title-${note._id}`}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <span className={`font-mono text-[8px] uppercase tracking-[0.3em] px-2 py-1 rounded-sm border flex-shrink-0 ${config.badge}`}>
            <Icon name={config.icon} size={10} className="inline -mt-px mr-1" /> {config.label}
          </span>

          <button
            type="button"
            onClick={onToggle}
            aria-expanded={expanded}
            aria-controls={bodyId}
            aria-label={expanded ? `Collapse preview of ${note.title ?? 'note'}` : `Preview ${note.title ?? 'note'} in place`}
            className={`rounded-sm px-2 -mr-2 -mt-1 text-stone-400 hover:text-white transition-colors text-lg leading-none ${FOCUS}`}
          >
            <motion.span animate={{ rotate: expanded ? 45 : 0 }} transition={{ duration: 0.2 }} className="inline-block" aria-hidden="true">
              +
            </motion.span>
          </button>
        </div>

        <h3 id={`note-title-${note._id}`} className="font-serif text-lg leading-snug mb-2">
          <Link href={href} className={`text-white hover:text-stone-200 transition-colors rounded-sm ${FOCUS}`}>
            {note.title}
          </Link>
        </h3>

        {!expanded && preview && (
          <p className="font-mono text-[10px] text-stone-400 leading-relaxed line-clamp-2">
            {preview}
            {note.plain.length > 140 ? '…' : ''}
          </p>
        )}

        {(note.tags ?? []).length > 0 && (
          <ul className="flex flex-wrap gap-1.5 mt-3" aria-label="Tags">
            {(note.tags ?? []).map((tag) => (
              <li key={tag._id}>
                <button
                  type="button"
                  onClick={() => tag.slug && onTag(tag.slug)}
                  aria-pressed={activeTag === tag.slug}
                  className={`font-mono text-[8px] uppercase tracking-widest border px-2 py-0.5 rounded-sm transition-colors ${FOCUS} ${
                    activeTag === tag.slug
                      ? 'text-white border-white/40 bg-white/10'
                      : 'text-stone-400 border-stone-800 hover:text-stone-300 hover:border-stone-600'
                  }`}
                >
                  #{tag.title}
                </button>
              </li>
            ))}
          </ul>
        )}

        {note.status === 'seedling' && !expanded && (
          <p className="font-mono text-[8px] text-stone-400 uppercase tracking-widest mt-2 italic">
            Early-stage thought — treat accordingly
          </p>
        )}
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            id={bodyId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-white/[0.08] pt-4">
              {note.status === 'seedling' && (
                <div className="mb-4 p-3 border border-stone-700/40 rounded-lg bg-stone-900/40">
                  <p className="font-mono text-[9px] text-stone-400 uppercase tracking-widest">
                    <Icon name="sprout" size={10} className="inline -mt-px mr-1" />{NOTE_STATUS.seedling.banner}
                  </p>
                </div>
              )}

              {note.rendered ? (
                <div className="text-sm leading-relaxed text-stone-300">{note.rendered}</div>
              ) : (
                <p className="font-mono text-[10px] text-stone-400 italic">No content yet — this note is a placeholder.</p>
              )}

              <div className="flex flex-wrap items-center gap-4 mt-5 pt-4 border-t border-white/5">
                {note.origin && (
                  <span className="font-mono text-[9px] text-stone-400 uppercase tracking-widest">
                    {ORIGIN_LABELS[note.origin] ?? note.origin}
                  </span>
                )}
                <span className="font-mono text-[9px] text-stone-400 uppercase tracking-widest">
                  Tended <time dateTime={formatDate(note.lastTended, 'iso')}>{formatDate(note.lastTended, 'short')}</time>
                </span>
                <Link href={href} className={`ml-auto font-mono text-[9px] uppercase tracking-widest text-stone-400 hover:text-white transition-colors rounded-sm ${FOCUS}`}>
                  Open note →
                </Link>
              </div>

              {(note.relatedNotes ?? []).length > 0 && (
                <div className="mt-4">
                  <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-stone-400 block mb-2">Related notes</span>
                  <ul className="flex flex-wrap gap-2">
                    {(note.relatedNotes ?? []).map((related) => {
                      const rc = noteStatus(related.status)
                      return (
                        <li key={related._id}>
                          <Link
                            href={`/garden/${related.slug}`}
                            className={`font-mono text-[9px] text-stone-400 hover:text-white border border-white/10 hover:border-white/30 px-2.5 py-1 rounded-sm flex items-center gap-1.5 transition-all ${FOCUS}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${rc.dot}`} aria-hidden="true" />
                            {related.title}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}

              {(note.relatedPosts ?? []).length > 0 && (
                <div className="mt-3">
                  <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-stone-400 block mb-2">Related posts</span>
                  <ul className="flex flex-wrap gap-2">
                    {(note.relatedPosts ?? []).map((post) => (
                      <li key={post._id}>
                        <Link
                          href={`/blog/${post.slug}`}
                          className={`font-mono text-[9px] text-stone-400 hover:text-white border border-white/10 hover:border-white/30 px-2.5 py-1 rounded-sm transition-all ${FOCUS}`}
                        >
                          {post.title} →
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {(note.backlinks ?? []).length > 0 && (
                <div className="mt-3">
                  <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-stone-400 block mb-2">Notes that link here</span>
                  <ul className="flex flex-wrap gap-2">
                    {note.backlinks.map((b) => (
                      <li key={b._id}>
                        <Link href={`/garden/${b.slug}`} className={`font-mono text-[9px] text-stone-400 hover:text-white underline underline-offset-4 decoration-stone-700 hover:decoration-stone-400 rounded-sm ${FOCUS}`}>
                          {b.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  )
}

// ── Main GardenClient ─────────────────────────────────────────────
export function GardenClient({ notes, tags, recentlyTended }: GardenClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const activeTag = searchParams.get('tag')
  const focusSlug = searchParams.get('note')

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<NoteStatus | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [pendingScroll, setPendingScroll] = useState<string | null>(null)
  const handledFocus = useRef<string | null>(null)

  const setTag = useCallback(
    (slug: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (slug) params.set('tag', slug)
      else params.delete('tag')
      params.delete('note')
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  const toggle = (id: string) => setExpandedId((prev) => (prev === id ? null : id))

  /** Expand + scroll to a note. Clears any filter that would hide it first. */
  const reveal = useCallback(
    (slug: string) => {
      const note = notes.find((n) => n.slug === slug)
      if (!note) return
      const hiddenByTag = activeTag && !(note.tags ?? []).some((t) => t.slug === activeTag)
      const hiddenByStatus = statusFilter && note.status !== statusFilter
      if (hiddenByTag) setTag(null)
      if (hiddenByStatus) setStatusFilter(null)
      if (search) setSearch('')
      setExpandedId(note._id)
      setPendingScroll(note._id)
    },
    [notes, activeTag, statusFilter, search, setTag],
  )

  // Scroll once the card is actually in the DOM (after filters clear).
  useEffect(() => {
    if (!pendingScroll) return
    const el = document.getElementById(`note-${pendingScroll}`)
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' })
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncs from the DOM after layout
    setPendingScroll(null)
  }, [pendingScroll, activeTag, statusFilter, search])

  // ?note=<slug> deep link
  useEffect(() => {
    if (!focusSlug || handledFocus.current === focusSlug) return
    handledFocus.current = focusSlug
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-off deep link (?note=slug) after mount
    reveal(focusSlug)
  }, [focusSlug, reveal])

  const filtered = useMemo(() => {
    let result = notes
    if (activeTag) result = result.filter((n) => (n.tags ?? []).some((t) => t.slug === activeTag))
    if (statusFilter) result = result.filter((n) => n.status === statusFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (n) =>
          (n.title ?? '').toLowerCase().includes(q) ||
          n.plain.toLowerCase().includes(q) ||
          (n.tags ?? []).some((t) => (t.title ?? '').toLowerCase().includes(q)),
      )
    }
    return result
  }, [notes, activeTag, statusFilter, search])

  const counts = useMemo(
    () => ({
      seedling: notes.filter((n) => n.status === 'seedling').length,
      growing: notes.filter((n) => n.status === 'growing').length,
      evergreen: notes.filter((n) => n.status === 'evergreen').length,
    }),
    [notes],
  )

  const activeTagTitle = activeTag ? tags.find((t) => t.slug === activeTag)?.title ?? activeTag : null
  const usedTags = tags.filter((t) => (t.count ?? 0) > 0)

  return (
    <div>
      {/* ── Status legend / filter ─────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 mb-8" role="group" aria-label="Filter by status">
        {NOTE_STATUS_ORDER.map((key) => {
          const config = NOTE_STATUS[key]
          const on = statusFilter === key
          return (
            <button
              key={key}
              type="button"
              onClick={() => setStatusFilter(on ? null : key)}
              aria-pressed={on}
              className={`p-3 rounded-lg border text-left transition-all ${config.badge} ${on ? 'ring-1 ring-white/40' : 'hover:brightness-125'} ${FOCUS}`}
            >
              <span className="flex items-center justify-between mb-1">
                <Icon name={config.icon} size={16} />
                <span className="font-mono text-[9px] text-stone-400">{counts[key]}</span>
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.25em] block mb-1">{config.label}</span>
              <span className="font-mono text-[8px] text-stone-400 leading-snug block">{config.short}</span>
            </button>
          )
        })}
      </div>

      {/* ── Growth timeline ─────────────────────────────────────── */}
      <div className="mb-10">
        <GrowthTimeline notes={notes} onSelect={reveal} />
      </div>

      {/* ── Recently tended ─────────────────────────────────────── */}
      {recentlyTended.length > 0 && (
        <div className="mb-10 pb-8 border-b border-white/[0.08]">
          <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-stone-400 block mb-4 border-l-2 border-stone-700 pl-3">
            Recently tended
          </span>
          <ul className="flex flex-wrap gap-2">
            {recentlyTended.map((note) => {
              const config = noteStatus(note.status)
              return (
                <li key={note._id}>
                  <button
                    type="button"
                    onClick={() => note.slug && reveal(note.slug)}
                    className={`flex items-center gap-2 font-mono text-[9px] text-stone-400 hover:text-white border border-white/10 hover:border-white/25 px-3 py-1.5 rounded-sm transition-all ${FOCUS}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${config.dot}`} aria-hidden="true" />
                    {note.title}
                    <span className="text-stone-400">· {formatDate(note.lastTended, 'short')}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* ── Search ──────────────────────────────────────────────── */}
      <div className="mb-6">
        <label htmlFor="garden-search" className="sr-only">Search notes</label>
        <input
          id="garden-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search notes…"
          className={`w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-3 font-mono text-sm text-white placeholder:text-stone-500 focus:border-white/25 transition-colors ${FOCUS}`}
        />
      </div>

      {/* ── Tag cloud ───────────────────────────────────────────── */}
      {usedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8" role="group" aria-label="Filter by tag">
          <button
            type="button"
            onClick={() => setTag(null)}
            aria-pressed={activeTag === null}
            className={`font-mono text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-sm border transition-all ${FOCUS} ${
              activeTag === null ? 'bg-white text-black border-white' : 'border-white/15 text-stone-400 hover:text-white hover:border-white/30'
            }`}
          >
            All
          </button>
          {usedTags.map((tag) => (
            <button
              key={tag._id}
              type="button"
              onClick={() => setTag(activeTag === tag.slug ? null : tag.slug)}
              aria-pressed={activeTag === tag.slug}
              className={`font-mono text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-sm border transition-all ${FOCUS} ${
                activeTag === tag.slug ? 'bg-white text-black border-white' : 'border-white/15 text-stone-400 hover:text-white hover:border-white/30'
              }`}
            >
              #{tag.title} <span className="text-[8px] opacity-60">{tag.count}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── Archive header ──────────────────────────────────────── */}
      <div className="mb-5 pb-4 border-b border-white/[0.08] flex items-center justify-between">
        <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-stone-400 border-l-2 border-stone-600 pl-3">
          Notes // {[activeTagTitle && `#${activeTagTitle}`, statusFilter && NOTE_STATUS[statusFilter].label].filter(Boolean).join(' · ') || 'All'}
        </span>
        <span className="font-mono text-[9px] text-stone-400 uppercase tracking-widest" aria-live="polite">
          {filtered.length} note{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Notes grid ──────────────────────────────────────────── */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((note) => (
            <div key={note._id} id={`note-${note._id}`} className="scroll-mt-28">
              <NoteCard
                note={note}
                expanded={expandedId === note._id}
                onToggle={() => toggle(note._id)}
                onTag={(slug) => setTag(activeTag === slug ? null : slug)}
                activeTag={activeTag}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center border border-white/5 rounded-xl">
          <p className="font-mono text-[10px] text-stone-400 uppercase tracking-widest mb-3">
            {search ? `No notes matching "${search}"` : activeTagTitle ? `No notes tagged #${activeTagTitle}` : 'No notes here yet.'}
          </p>
          {(search || activeTag || statusFilter) && (
            <button
              type="button"
              onClick={() => { setSearch(''); setStatusFilter(null); setTag(null) }}
              className={`font-mono text-[9px] uppercase tracking-widest text-stone-400 hover:text-white underline underline-offset-4 ${FOCUS}`}
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  )
}
