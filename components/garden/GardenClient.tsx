'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
// components/garden/GardenClient.tsx

// ── Types ─────────────────────────────────────────────────────────
interface Tag {
  _id: string
  title: string
  slug: string
  category?: string
}

interface RelatedNote {
  _id: string
  title: string
  slug: string
  status: string
}

interface RelatedPost {
  _id: string
  title: string
  slug: string
}

interface Note {
  _id: string
  title: string
  slug: string
  status: 'seedling' | 'growing' | 'evergreen'
  body?: any[]
  rendered?: React.ReactNode
  tags?: Tag[]
  relatedNotes?: RelatedNote[]
  relatedPosts?: RelatedPost[]
  origin?: string
  lastTended?: string
}

interface GardenClientProps {
  notes: Note[]
  tags: Tag[]
  recentlyTended: Note[]
}

// ── Config ────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  seedling:  { icon: '🌱', label: 'Seedling',  color: 'text-stone-400 border-stone-600/40 bg-stone-900/40', dot: 'bg-stone-500' },
  growing:   { icon: '🌿', label: 'Growing',   color: 'text-emerald-400 border-emerald-600/40 bg-emerald-950/20', dot: 'bg-emerald-500' },
  evergreen: { icon: '🌲', label: 'Evergreen', color: 'text-green-400 border-green-600/40 bg-green-950/20', dot: 'bg-green-400' },
}

const ORIGIN_LABELS: Record<string, string> = {
  original:     '💡 Original thought',
  lab:          '🔬 Lab observation',
  reading:      '📚 Reading',
  conversation: '💬 Conversation',
  course:       '🎓 Course material',
}

// ── Text extraction for search ─────────────────────────────────────
function extractText(body: any[]): string {
  if (!body) return ''
  return body
    .map((block) => {
      if (block._type !== 'block') return ''
      return (block.children ?? []).map((c: any) => c.text ?? '').join('')
    })
    .join(' ')
}

// ── Note card ─────────────────────────────────────────────────────
function NoteCard({
  note,
  expanded,
  onToggle,
}: {
  note: Note
  expanded: boolean
  onToggle: () => void
}) {
  const config = STATUS_CONFIG[note.status] ?? STATUS_CONFIG.seedling
  const preview = note.body ? extractText(note.body).slice(0, 120) : ''

  return (
    <div
      className={`rounded-xl border transition-all duration-300 overflow-hidden ${
        expanded ? 'border-white/25 shadow-lg shadow-black/40' : 'border-white/[0.08] hover:border-white/[0.18]'
      }`}
      style={{ backgroundColor: expanded ? 'rgba(20,20,24,0.98)' : 'rgba(14,14,16,0.9)' }}
    >
      {/* ── Card header — always visible ──────────────────────────── */}
      <button
        onClick={onToggle}
        className="w-full text-left p-5 group"
        aria-expanded={expanded}
      >
        <div className="flex items-start justify-between gap-4 mb-3">
          {/* Status badge */}
          <span className={`font-mono text-[8px] uppercase tracking-[0.3em] px-2 py-1 rounded-sm border flex-shrink-0 ${config.color}`}>
            {config.icon} {config.label}
          </span>

          {/* Expand indicator */}
          <motion.span
            animate={{ rotate: expanded ? 45 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-stone-600 group-hover:text-stone-400 transition-colors text-lg flex-shrink-0 mt-0.5"
          >
            +
          </motion.span>
        </div>

        {/* Title */}
        <h3 className="font-serif text-lg text-white leading-snug mb-2 group-hover:text-stone-100 transition-colors">
          {note.title}
        </h3>

        {/* Preview text — hidden when expanded */}
        {!expanded && preview && (
          <p className="font-mono text-[10px] text-stone-600 leading-relaxed line-clamp-2">
            {preview}
            {extractText(note.body ?? []).length > 120 ? '...' : ''}
          </p>
        )}

        {/* Tags */}
        {(note.tags ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {(note.tags ?? []).map((tag) => (
              <span
                key={tag._id}
                className="font-mono text-[8px] uppercase tracking-widest text-stone-600 border border-stone-800 px-2 py-0.5 rounded-sm"
              >
                #{tag.title}
              </span>
            ))}
          </div>
        )}

        {/* Seedling disclaimer */}
        {note.status === 'seedling' && !expanded && (
          <p className="font-mono text-[8px] text-stone-700 uppercase tracking-widest mt-2 italic">
            Early-stage thought — treat accordingly
          </p>
        )}
      </button>

      {/* ── Expanded content ─────────────────────────────────────── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-white/[0.08] pt-4">

              {/* Seedling disclaimer when expanded */}
              {note.status === 'seedling' && (
                <div className="mb-4 p-3 border border-stone-700/40 rounded-lg bg-stone-900/40">
                  <p className="font-mono text-[9px] text-stone-500 uppercase tracking-widest">
                    🌱 This is an early-stage thought. It may be incomplete or wrong. Treat accordingly.
                  </p>
                </div>
              )}

              {/* Body */}
              {note.rendered ? (
                <div className="text-sm leading-relaxed text-stone-300">
                  {note.rendered}
                </div>
              ) : (
                <p className="font-mono text-[10px] text-stone-700 italic">No content yet — this note is a placeholder.</p>
              )}

              {/* Metadata row */}
              <div className="flex flex-wrap items-center gap-4 mt-5 pt-4 border-t border-white/5">
                {note.origin && (
                  <span className="font-mono text-[9px] text-stone-600 uppercase tracking-widest">
                    {ORIGIN_LABELS[note.origin] ?? note.origin}
                  </span>
                )}
                {note.lastTended && (
                  <span className="font-mono text-[9px] text-stone-700 uppercase tracking-widest">
                    Tended {new Date(note.lastTended).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                )}
              </div>

              {/* Related notes */}
              {(note.relatedNotes ?? []).length > 0 && (
                <div className="mt-4">
                  <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-stone-600 block mb-2">
                    Related notes
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {(note.relatedNotes ?? []).map((related) => {
                      const rc = STATUS_CONFIG[related.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.seedling
                      return (
                        <span
                          key={related._id}
                          className="font-mono text-[9px] text-stone-400 border border-white/10 px-2.5 py-1 rounded-sm flex items-center gap-1.5"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${rc.dot}`} />
                          {related.title}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Related posts */}
              {(note.relatedPosts ?? []).length > 0 && (
                <div className="mt-3">
                  <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-stone-600 block mb-2">
                    Related posts
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {(note.relatedPosts ?? []).map((post) => (
                      <a
                        key={post._id}
                        href={`/blog/${post.slug}`}
                        className="font-mono text-[9px] text-stone-400 hover:text-white border border-white/10 hover:border-white/30 px-2.5 py-1 rounded-sm transition-all"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {post.title} →
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Main GardenClient ─────────────────────────────────────────────
export function GardenClient({ notes, tags, recentlyTended }: GardenClientProps) {
  const [activeTag, setActiveTag]   = useState<string | null>(null)
  const [search, setSearch]         = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const toggle = (id: string) => setExpandedId((prev) => (prev === id ? null : id))

  // Filter notes by tag and search
  const filtered = useMemo(() => {
    let result = notes

    if (activeTag) {
      result = result.filter((n) => (n.tags ?? []).some((t) => t._id === activeTag))
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((n) => {
        const titleMatch   = n.title.toLowerCase().includes(q)
        const bodyMatch    = extractText(n.body ?? []).toLowerCase().includes(q)
        const tagMatch     = (n.tags ?? []).some((t) => t.title.toLowerCase().includes(q))
        return titleMatch || bodyMatch || tagMatch
      })
    }

    return result
  }, [notes, activeTag, search])

  // Counts for status legend
  const counts = useMemo(() => ({
    seedling:  notes.filter((n) => n.status === 'seedling').length,
    growing:   notes.filter((n) => n.status === 'growing').length,
    evergreen: notes.filter((n) => n.status === 'evergreen').length,
  }), [notes])

  return (
    <div>

      {/* ── Status legend ────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 mb-10">
        {(Object.entries(STATUS_CONFIG) as [keyof typeof STATUS_CONFIG, typeof STATUS_CONFIG[keyof typeof STATUS_CONFIG]][]).map(([key, config]) => (
          <div key={key} className={`p-3 rounded-lg border ${config.color}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-base">{config.icon}</span>
              <span className="font-mono text-[9px] text-stone-600">{counts[key]}</span>
            </div>
            <span className="font-mono text-[9px] uppercase tracking-[0.25em] block mb-1">{config.label}</span>
            <p className="font-mono text-[8px] text-stone-700 leading-snug">
              {key === 'seedling'  && 'Raw idea, possibly wrong'}
              {key === 'growing'   && 'Being developed, partially verified'}
              {key === 'evergreen' && 'Stable and reliably linkable'}
            </p>
          </div>
        ))}
      </div>

      {/* ── Recently tended ──────────────────────────────────────── */}
      {recentlyTended.length > 0 && (
        <div className="mb-10 pb-8 border-b border-white/[0.08]">
          <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-stone-600 block mb-4 border-l-2 border-stone-700 pl-3">
            Recently tended
          </span>
          <div className="flex flex-wrap gap-2">
            {recentlyTended.map((note) => {
              const config = STATUS_CONFIG[note.status] ?? STATUS_CONFIG.seedling
              return (
                <button
                  key={note._id}
                  onClick={() => {
                    setExpandedId(note._id)
                    setTimeout(() => {
                      document.getElementById(`note-${note._id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
                    }, 100)
                  }}
                  className="flex items-center gap-2 font-mono text-[9px] text-stone-400 hover:text-white border border-white/10 hover:border-white/25 px-3 py-1.5 rounded-sm transition-all"
                >
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${config.dot}`} />
                  {note.title}
                  {note.lastTended && (
                    <span className="text-stone-700">
                      · {new Date(note.lastTended).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Search ───────────────────────────────────────────────── */}
      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search notes..."
          className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-3 font-mono text-sm text-white placeholder:text-stone-700 focus:outline-none focus:border-white/25 transition-colors"
        />
      </div>

      {/* ── Tag cloud ─────────────────────────────────────────────── */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setActiveTag(null)}
            className={`font-mono text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-sm border transition-all ${
              activeTag === null
                ? 'bg-white text-black border-white'
                : 'border-white/15 text-stone-400 hover:text-white hover:border-white/30'
            }`}
          >
            All
          </button>
          {tags.map((tag) => (
            <button
              key={tag._id}
              onClick={() => setActiveTag(activeTag === tag._id ? null : tag._id)}
              className={`font-mono text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-sm border transition-all ${
                activeTag === tag._id
                  ? 'bg-white text-black border-white'
                  : 'border-white/15 text-stone-400 hover:text-white hover:border-white/30'
              }`}
            >
              #{tag.title}
            </button>
          ))}
        </div>
      )}

      {/* ── Archive header ────────────────────────────────────────── */}
      <div className="mb-5 pb-4 border-b border-white/[0.08] flex items-center justify-between">
        <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-stone-500 border-l-2 border-stone-600 pl-3">
          Notes // {activeTag ? `#${tags.find(t => t._id === activeTag)?.title ?? activeTag}` : 'All'}
        </span>
        <span className="font-mono text-[9px] text-stone-600 uppercase tracking-widest">
          {filtered.length} note{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Notes grid ───────────────────────────────────────────── */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((note) => (
            <div key={note._id} id={`note-${note._id}`}>
              <NoteCard
                note={note}
                expanded={expandedId === note._id}
                onToggle={() => toggle(note._id)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
          <p className="font-mono text-[10px] text-stone-600 uppercase tracking-widest">
            {search ? `No notes matching "${search}"` : 'No notes yet.'}
          </p>
        </div>
      )}
    </div>
  )
}