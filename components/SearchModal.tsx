'use client'

import { useEffect, useRef, useState, useTransition, useCallback, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, usePathname } from 'next/navigation'
import { searchSite, type SearchGroup, type SearchResult, type SearchType } from '@/app/actions/search'
import { DEFAULT_NAVIGATION, navHref, type NavLink } from '@/lib/cms/defaults/navigation'
// components/SearchModal.tsx
// Cmd/Ctrl+K site search. Grouped results with type chips, keyboard navigation across
// groups, dialog semantics + focus trap, closes on route change, recent searches in
// localStorage, quick links when empty.

const RECENT_KEY = 'sp_recent_searches'
const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400'

const TYPE_CHIP: Record<SearchType, { label: string; className: string }> = {
  post: { label: 'Post', className: 'text-amber-300 border-amber-400/30' },
  note: { label: 'Note', className: 'text-emerald-300 border-emerald-400/30' },
  project: { label: 'Project', className: 'text-pink-300 border-pink-400/30' },
  library: { label: 'Library', className: 'text-cyan-300 border-cyan-400/30' },
  glossary: { label: 'Term', className: 'text-violet-300 border-violet-400/30' },
}

const DEFAULT_QUICK_LINKS = DEFAULT_NAVIGATION.searchQuickLinks.map((l) => ({ label: l.label, href: navHref(l), hint: l.description ?? '' }))

function loadRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr.filter((s) => typeof s === 'string').slice(0, 6) : []
  } catch { return [] }
}

function saveRecent(q: string) {
  try {
    const next = [q, ...loadRecent().filter((s) => s !== q)].slice(0, 6)
    localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  } catch {}
}

export function SearchModal({ quickLinks }: { quickLinks?: NavLink[] } = {}) {
  const QUICK_LINKS = quickLinks?.length ? quickLinks.map((l) => ({ label: l.label, href: navHref(l), hint: l.description ?? '' })) : DEFAULT_QUICK_LINKS
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [groups, setGroups] = useState<SearchGroup[]>([])
  const [total, setTotal] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [activeIdx, setActiveIdx] = useState(0)
  const [recent, setRecent] = useState<string[]>([])
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const router = useRouter()
  const pathname = usePathname()
  const titleId = useId()
  const listId = useId()

  const flat: SearchResult[] = groups.flatMap((g) => g.results)

  const close = useCallback(() => setOpen(false), [])

  // Cmd/Ctrl+K toggles, Escape closes
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Close on route change (state adjusted during render, per React docs).
  const [openedAt, setOpenedAt] = useState(pathname)
  if (openedAt !== pathname) {
    setOpenedAt(pathname)
    setOpen(false)
  }

  // Open: reset, focus, lock scroll. Close: restore focus to trigger.
  //
  // hasOpened gates the restore branch. Without it this effect runs on mount with
  // open === false, falls past the early return and focuses the trigger — so the
  // search button became document.activeElement on first paint of every page. That
  // painted a :focus-visible ring (the brightest thing above the fold, sitewide) and
  // put the tab sequence past the skip link, which defeated it entirely.
  const hasOpened = useRef(false)
  useEffect(() => {
    if (open) {
      hasOpened.current = true
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset the dialog each time it opens
      setQuery('')
      setGroups([])
      setTotal(0)
      setError(null)
      setActiveIdx(0)
      setRecent(loadRecent())
      const t = setTimeout(() => inputRef.current?.focus(), 50)
      document.body.style.overflow = 'hidden'
      return () => { clearTimeout(t); document.body.style.overflow = '' }
    }
    if (hasOpened.current) triggerRef.current?.focus({ preventScroll: true })
    return undefined
  }, [open])

  // Debounced search
  useEffect(() => {
    if (query.trim().length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clear results when the query empties
      setGroups([]); setTotal(0); setError(null); return
    }
    const timer = setTimeout(() => {
      startTransition(async () => {
        const res = await searchSite(query)
        setGroups(res.groups)
        setTotal(res.total)
        setError(res.error === 'rate-limited' ? 'Too many searches — try again in a minute.' : res.error ? 'Search is unavailable right now.' : null)
        setActiveIdx(0)
      })
    }, 200)
    return () => clearTimeout(timer)
  }, [query])

  const navigate = useCallback((href: string, q?: string) => {
    if (q && q.trim().length >= 2) saveRecent(q.trim())
    setOpen(false)
    router.push(href)
  }, [router])

  // Keyboard navigation + focus trap
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, Math.max(flat.length - 1, 0))) }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)) }
      else if (e.key === 'Home') { e.preventDefault(); setActiveIdx(0) }
      else if (e.key === 'End') { e.preventDefault(); setActiveIdx(Math.max(flat.length - 1, 0)) }
      else if (e.key === 'Enter' && flat[activeIdx]) { e.preventDefault(); navigate(flat[activeIdx].href, query) }
      else if (e.key === 'Tab' && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>('input, button, a[href], [tabindex]:not([tabindex="-1"])')
        if (focusables.length === 0) return
        const first = focusables[0]!
        const last = focusables[focusables.length - 1]!
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, flat, activeIdx, navigate, query])

  // Keep the active row visible
  useEffect(() => {
    if (!open) return
    const el = panelRef.current?.querySelector<HTMLElement>(`[data-idx="${activeIdx}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIdx, open])

  const activeResult = flat[activeIdx]
  const showEmpty = query.trim().length < 2

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search the site (Ctrl+K)"
        aria-haspopup="dialog"
        aria-expanded={open}
        // p-2 gives a >=24px hit area; below sm the label is hidden and the icon alone was 14x14.
        className={`flex items-center justify-center gap-2 p-2 -m-2 font-mono text-[10px] uppercase tracking-[0.3em] text-stone-400 hover:text-stone-200 transition-colors group rounded-sm ${FOCUS}`}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <span className="hidden lg:inline">Search</span>
        <kbd className="hidden lg:inline font-mono text-[8px] text-stone-400 border border-white/10 px-1.5 py-0.5 rounded group-hover:border-white/20 transition-colors">⌘K</kbd>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[1000]"
              onClick={close}
              aria-hidden="true"
            />

            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="fixed top-[12vh] left-1/2 -translate-x-1/2 w-full max-w-xl z-[1001] px-4"
            >
              <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className="bg-[#111] border border-white/10 rounded-xl overflow-hidden shadow-2xl"
              >
                <h2 id={titleId} className="sr-only">Search the site</h2>

                <div className="flex items-center gap-3 px-4 py-4 border-b border-white/5">
                  <svg className="w-4 h-4 text-stone-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                  </svg>
                  <input
                    ref={inputRef}
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search posts, notes, projects, library, glossary…"
                    aria-label="Search query"
                    role="combobox"
                    aria-expanded={flat.length > 0}
                    aria-controls={listId}
                    aria-activedescendant={activeResult ? `${listId}-${activeIdx}` : undefined}
                    aria-autocomplete="list"
                    autoComplete="off"
                    className="flex-1 bg-transparent font-mono text-sm text-white placeholder:text-stone-500 outline-none"
                  />
                  {isPending && <div className="w-3 h-3 border border-stone-600 border-t-stone-300 rounded-full animate-spin flex-shrink-0" aria-label="Searching" role="status" />}
                  <button type="button" onClick={close} className={`font-mono text-[9px] text-stone-400 hover:text-white transition-colors uppercase tracking-widest flex-shrink-0 rounded-sm ${FOCUS}`}>
                    Esc
                  </button>
                </div>

                <div className="max-h-[60vh] overflow-y-auto" id={listId} role={flat.length > 0 ? 'listbox' : undefined} aria-label="Search results">
                  {error && (
                    <p className="px-4 py-6 text-center font-mono text-[10px] text-amber-300 uppercase tracking-widest" role="alert">{error}</p>
                  )}

                  {!showEmpty && !isPending && !error && flat.length === 0 && (
                    <div className="px-4 py-8 text-center">
                      <p className="font-mono text-[10px] text-stone-400 uppercase tracking-widest">No results for “{query}”</p>
                    </div>
                  )}

                  {groups.map((group) => {
                    const offset = flat.findIndex((r) => r.type === group.type)
                    return (
                      <div key={group.type} role="group" aria-label={group.label}>
                        <div className="px-4 pt-3 pb-1 font-mono text-[8px] uppercase tracking-[0.3em] text-stone-400 flex items-center justify-between">
                          <span>{group.label}</span>
                          <span>{group.results.length}</span>
                        </div>
                        {group.results.map((result, i) => {
                          const idx = offset + i
                          const isActive = idx === activeIdx
                          const chip = TYPE_CHIP[result.type]
                          return (
                            <button
                              key={result._id}
                              type="button"
                              id={`${listId}-${idx}`}
                              data-idx={idx}
                              role="option"
                              aria-selected={isActive}
                              onClick={() => navigate(result.href, query)}
                              onMouseEnter={() => setActiveIdx(idx)}
                              className={`w-full text-left px-4 py-3 flex flex-col gap-1 transition-colors border-b border-white/[0.04] last:border-0 ${FOCUS} ${isActive ? 'bg-white/5' : 'hover:bg-white/[0.03]'}`}
                            >
                              <span className="flex items-center justify-between gap-4">
                                <span className="flex items-center gap-2 min-w-0">
                                  <span className={`font-mono text-[7px] uppercase tracking-widest border px-1.5 py-0.5 rounded-sm flex-shrink-0 ${chip.className}`}>{chip.label}</span>
                                  <span className="font-serif text-base text-white leading-snug truncate">{result.title}</span>
                                </span>
                                {isActive && <span className="font-mono text-[8px] text-stone-400 uppercase tracking-widest flex-shrink-0">↵ Open</span>}
                              </span>
                              {result.excerpt && <span className="font-sans text-xs text-stone-400 line-clamp-1">{result.excerpt}</span>}
                              {result.meta && <span className="font-mono text-[8px] uppercase tracking-widest text-stone-400">{result.meta}</span>}
                            </button>
                          )
                        })}
                      </div>
                    )
                  })}

                  {total > flat.length && (
                    <p className="px-4 py-3 font-mono text-[8px] uppercase tracking-widest text-stone-400 border-t border-white/5">
                      Showing the top {flat.length} of {total} matches — refine your query to narrow down.
                    </p>
                  )}

                  {showEmpty && (
                    <div className="px-4 py-5">
                      {recent.length > 0 && (
                        <div className="mb-5">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-mono text-[9px] text-stone-400 uppercase tracking-widest">Recent</p>
                            <button
                              type="button"
                              onClick={() => { try { localStorage.removeItem(RECENT_KEY) } catch {} setRecent([]) }}
                              className={`font-mono text-[8px] uppercase tracking-widest text-stone-400 hover:text-white rounded-sm ${FOCUS}`}
                            >
                              Clear
                            </button>
                          </div>
                          <ul className="flex flex-wrap gap-2">
                            {recent.map((r) => (
                              <li key={r}>
                                <button type="button" onClick={() => setQuery(r)} className={`font-mono text-[10px] text-stone-300 hover:text-white border border-white/10 hover:border-white/30 px-2.5 py-1 rounded-sm transition-colors ${FOCUS}`}>
                                  {r}
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <p className="font-mono text-[9px] text-stone-400 uppercase tracking-widest mb-2">Quick access</p>
                      <ul className="space-y-0.5">
                        {QUICK_LINKS.map((link) => (
                          <li key={link.href}>
                            <button
                              type="button"
                              onClick={() => navigate(link.href)}
                              className={`w-full text-left font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400 hover:text-white transition-colors py-2 flex items-center gap-3 rounded-sm ${FOCUS}`}
                            >
                              <span className="text-stone-600" aria-hidden="true">→</span>
                              {link.label}
                              <span className="ml-auto normal-case tracking-normal text-[9px] text-stone-400">{link.hint}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="px-4 py-3 border-t border-white/5 flex items-center gap-4">
                  <span className="font-mono text-[8px] text-stone-400 uppercase tracking-widest">↑↓ navigate</span>
                  <span className="font-mono text-[8px] text-stone-400 uppercase tracking-widest">↵ open</span>
                  <span className="font-mono text-[8px] text-stone-400 uppercase tracking-widest">esc close</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
