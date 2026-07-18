'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  List, Maximize2, Minimize2, Type, Bookmark,
  Link2, Check, ChevronRight, X, Palette
} from 'lucide-react'
// components/blog/ArticleFloatingToolbar.tsx

interface Heading {
  id: string
  text: string
  level: number
}

type ThemeId = 'archive' | 'terminal' | 'paper' | 'broadcast'

const THEMES: { id: ThemeId; label: string; preview: string }[] = [
  { id: 'archive',   label: 'Archive',   preview: 'bg-[#0a0a0a] border-stone-700' },
  { id: 'terminal',  label: 'Terminal',  preview: 'bg-[#0d1117] border-green-700' },
  { id: 'paper',     label: 'Paper',     preview: 'bg-[#f8f4ef] border-stone-400' },
  { id: 'broadcast', label: 'Broadcast', preview: 'bg-white border-stone-300' },
]

const FONT_SIZES = ['text-base', 'text-lg', 'text-xl', 'text-2xl']
const FONT_SIZE_LABELS = ['S', 'M', 'L', 'XL']

export function ArticleFloatingToolbar() {
  const [visible, setVisible]       = useState(false)
  const [activePanel, setActivePanel] = useState<'toc' | 'font' | 'theme' | null>(null)
  const [headings, setHeadings]     = useState<Heading[]>([])
  const [activeId, setActiveId]     = useState<string>('')
  const [focusMode, setFocusMode]   = useState(false)
  const [copied, setCopied]         = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [fontSizeIndex, setFontSizeIndex] = useState(1)
  const [theme, setTheme]           = useState<ThemeId>('archive')
  const toolbarRef                  = useRef<HTMLDivElement>(null)

  // Show toolbar after 20% scroll
  useEffect(() => {
    const handleScroll = () => {
      const pct = window.scrollY / (document.body.scrollHeight - window.innerHeight)
      setVisible(pct > 0.08)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Detect headings in the article
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('main h2, main h3')) as HTMLElement[]
    const detected: Heading[] = els.map((el, i) => {
      const id = el.id || `heading-${i}`
      if (!el.id) el.id = id
      return { id, text: el.textContent?.trim() ?? `Section ${i + 1}`, level: el.tagName === 'H2' ? 2 : 3 }
    })
    setHeadings(detected)
  }, [])

  // Track active heading
  useEffect(() => {
    if (headings.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id)
        })
      },
      { rootMargin: '-20% 0px -70% 0px' }
    )
    headings.forEach((h) => {
      const el = document.getElementById(h.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [headings])

  // Load persisted settings
  useEffect(() => {
    const savedTheme = localStorage.getItem('sp_article_theme') as ThemeId | null
    const savedFont  = localStorage.getItem('sp_article_font_size')
    if (savedTheme)                       setTheme(savedTheme)
    if (savedFont !== null)               setFontSizeIndex(Number(savedFont))
  }, [])

  // Apply theme to article
  useEffect(() => {
    const article = document.querySelector('[data-article]') as HTMLElement
    if (!article) return
    THEMES.forEach((t) => article.classList.remove(`theme-${t.id}`))
    article.classList.add(`theme-${theme}`)
    localStorage.setItem('sp_article_theme', theme)
  }, [theme])

  // Apply font size to article
  useEffect(() => {
    const article = document.querySelector('[data-article]') as HTMLElement
    if (!article) return
    FONT_SIZES.forEach((s) => article.classList.remove(s))
    article.classList.add(FONT_SIZES[fontSizeIndex])
    localStorage.setItem('sp_article_font_size', String(fontSizeIndex))
  }, [fontSizeIndex])

  // Focus mode
  useEffect(() => {
    document.documentElement.classList.toggle('focus-mode', focusMode)
    return () => document.documentElement.classList.remove('focus-mode')
  }, [focusMode])

  // Close panel on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setActivePanel(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Escape closes focus mode
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setFocusMode(false); setActivePanel(null) }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleBookmark = () => {
    const key = `sp_bookmark_${window.location.pathname}`
    localStorage.setItem(key, String(window.scrollY))
    setBookmarked(true)
    setTimeout(() => setBookmarked(false), 2000)
  }

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setActivePanel(null)
  }

  const togglePanel = (panel: 'toc' | 'font' | 'theme') => {
    setActivePanel((p) => p === panel ? null : panel)
  }

  const ToolBtn = ({
    onClick, active = false, title: btnTitle, children,
  }: {
    onClick: () => void
    active?: boolean
    title: string
    children: React.ReactNode
  }) => (
    <button
      onClick={onClick}
      title={btnTitle}
      aria-label={btnTitle}
      className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-200 ${
        active
          ? 'bg-white text-black'
          : 'text-stone-500 hover:text-white hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  )

  return (
    <>
      {/* Focus mode style injection */}
      <style>{`
        .focus-mode header,
        .focus-mode nav,
        .focus-mode footer,
        .focus-mode [data-not-article] {
          opacity: 0.08 !important;
          pointer-events: none !important;
          transition: opacity 0.5s ease !important;
        }
        .focus-mode [data-article] {
          opacity: 1 !important;
        }

        /* Theme overrides scoped to the article */
        [data-article].theme-terminal {
          --article-bg: #0d1117;
          --article-text: rgba(0,255,65,0.85);
          --article-heading: #00ff41;
          --article-muted: rgba(0,255,65,0.4);
          color: var(--article-text) !important;
          font-family: 'IBM Plex Mono', monospace !important;
        }
        [data-article].theme-terminal h1,
        [data-article].theme-terminal h2,
        [data-article].theme-terminal h3 {
          color: var(--article-heading) !important;
          font-family: 'IBM Plex Mono', monospace !important;
        }
        [data-article].theme-paper {
          --article-text: #2c1810;
          --article-heading: #1a0f08;
          --article-muted: #6b4c3b;
          background: #f8f4ef !important;
          color: var(--article-text) !important;
          padding: 2rem !important;
          border-radius: 4px !important;
        }
        [data-article].theme-paper h1,
        [data-article].theme-paper h2,
        [data-article].theme-paper h3 {
          color: var(--article-heading) !important;
        }
        [data-article].theme-broadcast {
          --article-text: #111111;
          --article-heading: #000000;
          background: #ffffff !important;
          color: var(--article-text) !important;
          padding: 2rem !important;
          border-radius: 4px !important;
        }
        [data-article].theme-broadcast h1,
        [data-article].theme-broadcast h2,
        [data-article].theme-broadcast h3 {
          color: var(--article-heading) !important;
          font-weight: 900 !important;
        }
      `}</style>

      <AnimatePresence>
        {visible && (
          <motion.div
            ref={toolbarRef}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed right-4 md:right-8 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-1"
          >
            {/* Main toolbar */}
            <div className="flex flex-col gap-0.5 bg-[#111]/95 border border-white/10 rounded-xl p-1.5 backdrop-blur-xl shadow-2xl">

              {/* TOC */}
              <ToolBtn onClick={() => togglePanel('toc')} active={activePanel === 'toc'} title="Table of contents">
                <List size={15} />
              </ToolBtn>

              {/* Focus mode */}
              <ToolBtn onClick={() => setFocusMode((v) => !v)} active={focusMode} title={focusMode ? 'Exit focus mode (Esc)' : 'Focus mode'}>
                {focusMode ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              </ToolBtn>

              {/* Font */}
              <ToolBtn onClick={() => togglePanel('font')} active={activePanel === 'font'} title="Font size">
                <Type size={15} />
              </ToolBtn>

              {/* Theme */}
              <ToolBtn onClick={() => togglePanel('theme')} active={activePanel === 'theme'} title="Reading theme">
                <Palette size={15} />
              </ToolBtn>

              <div className="h-px bg-white/8 my-0.5" />

              {/* Bookmark */}
              <ToolBtn onClick={handleBookmark} active={bookmarked} title="Bookmark scroll position">
                {bookmarked ? <Check size={15} /> : <Bookmark size={15} />}
              </ToolBtn>

              {/* Copy link */}
              <ToolBtn onClick={handleCopyLink} active={copied} title="Copy link">
                {copied ? <Check size={15} /> : <Link2 size={15} />}
              </ToolBtn>
            </div>

            {/* Panels — appear to the left of the toolbar */}
            <AnimatePresence>
              {activePanel && (
                <motion.div
                  key={activePanel}
                  initial={{ opacity: 0, x: 8, scale: 0.96 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 8, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-12 top-0 w-64 bg-[#111]/98 border border-white/12 rounded-xl shadow-2xl backdrop-blur-xl overflow-hidden"
                >
                  {/* TOC Panel */}
                  {activePanel === 'toc' && (
                    <div>
                      <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between">
                        <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-stone-500">Contents</span>
                        <button onClick={() => setActivePanel(null)} className="text-stone-700 hover:text-white transition-colors">
                          <X size={12} />
                        </button>
                      </div>
                      <div className="max-h-80 overflow-y-auto p-2">
                        {headings.length > 0 ? headings.map((h) => (
                          <button
                            key={h.id}
                            onClick={() => scrollTo(h.id)}
                            className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-150 group ${
                              h.id === activeId
                                ? 'bg-white/10 text-white'
                                : 'text-stone-500 hover:text-stone-200 hover:bg-white/5'
                            } ${h.level === 3 ? 'pl-6' : ''}`}
                          >
                            {h.id === activeId && <span className="w-1 h-1 rounded-full bg-white flex-shrink-0" />}
                            <span className="font-mono text-[10px] leading-snug truncate">{h.text}</span>
                            <ChevronRight size={10} className="ml-auto flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        )) : (
                          <p className="font-mono text-[10px] text-stone-700 text-center py-4 uppercase tracking-widest">
                            No sections found
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Font Panel */}
                  {activePanel === 'font' && (
                    <div>
                      <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between">
                        <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-stone-500">Text size</span>
                        <button onClick={() => setActivePanel(null)} className="text-stone-700 hover:text-white transition-colors">
                          <X size={12} />
                        </button>
                      </div>
                      <div className="p-3 flex gap-2">
                        {FONT_SIZE_LABELS.map((label, i) => (
                          <button
                            key={i}
                            onClick={() => setFontSizeIndex(i)}
                            className={`flex-1 py-2.5 rounded-lg font-mono transition-all ${
                              fontSizeIndex === i
                                ? 'bg-white text-black font-bold'
                                : 'border border-white/10 text-stone-400 hover:text-white hover:border-white/30'
                            }`}
                            style={{ fontSize: `${10 + i * 2}px` }}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      <p className="px-4 pb-3 font-mono text-[8px] text-stone-700 uppercase tracking-widest text-center">
                        Saved automatically
                      </p>
                    </div>
                  )}

                  {/* Theme Panel */}
                  {activePanel === 'theme' && (
                    <div>
                      <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between">
                        <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-stone-500">Reading theme</span>
                        <button onClick={() => setActivePanel(null)} className="text-stone-700 hover:text-white transition-colors">
                          <X size={12} />
                        </button>
                      </div>
                      <div className="p-3 space-y-2">
                        {THEMES.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => { setTheme(t.id); setActivePanel(null) }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                              theme === t.id
                                ? 'bg-white/10 text-white'
                                : 'text-stone-500 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            <div className={`w-6 h-6 rounded-md border ${t.preview} flex-shrink-0`} />
                            <span className="font-mono text-[10px] uppercase tracking-widest">{t.label}</span>
                            {theme === t.id && <Check size={12} className="ml-auto" />}
                          </button>
                        ))}
                      </div>
                      <p className="px-4 pb-3 font-mono text-[8px] text-stone-700 uppercase tracking-widest text-center">
                        Applies to article only
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}