'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { searchPosts, type SearchResult } from '@/app/actions/search'
// components/SearchModal.tsx

export function SearchModal() {
  const [open, setOpen]             = useState(false)
  const [query, setQuery]           = useState('')
  const [results, setResults]       = useState<SearchResult[]>([])
  const [activeIdx, setActiveIdx]   = useState(0)
  const [isPending, startTransition] = useTransition()
  const inputRef                    = useRef<HTMLInputElement>(null)
  const router                      = useRouter()

  // ── Cmd+K / Ctrl+K to open ───────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Focus input when modal opens, lock scroll
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setQuery('')
      setResults([])
      setActiveIdx(0)
    }
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Debounced search
  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const timer = setTimeout(() => {
      startTransition(async () => {
        const res = await searchPosts(query)
        setResults(res)
        setActiveIdx(0)
      })
    }, 200)
    return () => clearTimeout(timer)
  }, [query])

  // Keyboard navigation
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIdx((i) => Math.min(i + 1, results.length - 1))
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIdx((i) => Math.max(i - 1, 0))
      }
      if (e.key === 'Enter' && results[activeIdx]) {
        navigate(results[activeIdx].slug)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, results, activeIdx])

  const navigate = (slug: string) => {
    setOpen(false)
    router.push(`/blog/${slug}`)
  }

  return (
    <>
      {/* ── Trigger button ────────────────────────────────────────── */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Search posts"
        className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-stone-500 hover:text-stone-200 transition-colors group"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <span className="hidden lg:inline">Search</span>
        <kbd className="hidden lg:inline font-mono text-[8px] text-stone-700 border border-white/10 px-1.5 py-0.5 rounded group-hover:border-white/20 transition-colors">
          ⌘K
        </kbd>
      </button>

      {/* ── Modal ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[1000]"
              onClick={() => setOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="fixed top-[15vh] left-1/2 -translate-x-1/2 w-full max-w-xl z-[1001] px-4"
            >
              <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden shadow-2xl">

                {/* Input row */}
                <div className="flex items-center gap-3 px-4 py-4 border-b border-white/5">
                  <svg className="w-4 h-4 text-stone-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                  </svg>
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search posts, topics, commands..."
                    className="flex-1 bg-transparent font-mono text-sm text-white placeholder:text-stone-700 outline-none"
                  />
                  {isPending && (
                    <div className="w-3 h-3 border border-stone-600 border-t-stone-300 rounded-full animate-spin flex-shrink-0" />
                  )}
                  <button
                    onClick={() => setOpen(false)}
                    className="font-mono text-[9px] text-stone-700 hover:text-white transition-colors uppercase tracking-widest flex-shrink-0"
                  >
                    Esc
                  </button>
                </div>

                {/* Results */}
                <div className="max-h-80 overflow-y-auto">
                  {query.length >= 2 && !isPending && results.length === 0 && (
                    <div className="px-4 py-8 text-center">
                      <p className="font-mono text-[10px] text-stone-700 uppercase tracking-widest">
                        No results for "{query}"
                      </p>
                    </div>
                  )}

                  {results.map((result, i) => (
                    <button
                      key={result._id}
                      onClick={() => navigate(result.slug)}
                      onMouseEnter={() => setActiveIdx(i)}
                      className={`w-full text-left px-4 py-4 flex flex-col gap-1.5 transition-colors border-b border-white/[0.04] last:border-0 ${
                        activeIdx === i ? 'bg-white/5' : 'hover:bg-white/[0.03]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <span className="font-serif text-base text-white leading-snug line-clamp-1">
                          {result.title}
                        </span>
                        {activeIdx === i && (
                          <span className="font-mono text-[8px] text-stone-700 uppercase tracking-widest flex-shrink-0">
                            ↵ Open
                          </span>
                        )}
                      </div>

                      {result.excerpt && (
                        <p className="font-sans text-xs text-stone-600 line-clamp-1">
                          {result.excerpt}
                        </p>
                      )}

                      <div className="flex items-center gap-3">
                        {result.categories?.slice(0, 2).map((cat) => (
                          <span key={cat} className="font-mono text-[8px] uppercase tracking-widest text-stone-700">
                            {cat}
                          </span>
                        ))}
                        <span className="font-mono text-[8px] text-stone-800">
                          {new Date(result.publishedAt).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric',
                          })}
                        </span>
                      </div>
                    </button>
                  ))}

                  {/* Empty state before typing */}
                  {query.length < 2 && (
                    <div className="px-4 py-6">
                      <p className="font-mono text-[9px] text-stone-700 uppercase tracking-widest mb-4">
                        Quick access
                      </p>
                      <div className="space-y-1">
                        {[
                          { label: 'OSI Model Explorer', href: '/blog/osi-model' },
                          { label: 'All Posts', href: '/blog' },
                        ].map((link) => (
                          <button
                            key={link.href}
                            onClick={() => { setOpen(false); router.push(link.href) }}
                            className="w-full text-left font-mono text-[10px] uppercase tracking-[0.2em] text-stone-600 hover:text-white transition-colors py-2 flex items-center gap-2"
                          >
                            <span className="text-stone-800">→</span>
                            {link.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer hints */}
                <div className="px-4 py-3 border-t border-white/5 flex items-center gap-4">
                  <span className="font-mono text-[8px] text-stone-800 uppercase tracking-widest">↑↓ navigate</span>
                  <span className="font-mono text-[8px] text-stone-800 uppercase tracking-widest">↵ open</span>
                  <span className="font-mono text-[8px] text-stone-800 uppercase tracking-widest">esc close</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}