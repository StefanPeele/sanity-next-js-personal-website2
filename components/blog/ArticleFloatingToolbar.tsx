'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  List, Maximize2, Minimize2, Type, Bookmark,
  Link2, Check, ChevronRight, X, Palette, AlignJustify, Accessibility
} from 'lucide-react'
// components/blog/ArticleFloatingToolbar.tsx

interface Heading { id: string; text: string; level: number }
type ThemeId  = 'archive' | 'terminal' | 'paper' | 'broadcast'
type WidthId  = 'narrow' | 'standard' | 'wide'
type PanelId  = 'toc' | 'font' | 'theme' | 'width' | 'a11y' | null

const THEMES: { id: ThemeId; label: string; desc: string; preview: string }[] = [
  { id: 'archive',   label: 'Archive',   desc: 'Dark default',        preview: 'bg-[#0a0a0a] border-stone-700' },
  { id: 'terminal',  label: 'Terminal',  desc: 'Phosphor green',      preview: 'bg-[#0d1117] border-green-700' },
  { id: 'paper',     label: 'Paper',     desc: 'Warm cream',          preview: 'bg-[#f8f4ef] border-stone-400' },
  { id: 'broadcast', label: 'Broadcast', desc: 'High contrast white', preview: 'bg-white border-stone-300' },
]

const WIDTHS: { id: WidthId; label: string; desc: string; maxW: string }[] = [
  { id: 'narrow',   label: 'Narrow',   desc: '~60 chars', maxW: 'max-w-xl' },
  { id: 'standard', label: 'Standard', desc: '~72 chars', maxW: 'max-w-3xl' },
  { id: 'wide',     label: 'Wide',     desc: '~90 chars', maxW: 'max-w-5xl' },
]

const FONT_SIZE_LABELS = ['S', 'M', 'L', 'XL']

export function ArticleFloatingToolbar() {
  const [visible, setVisible]         = useState(false)
  const [activePanel, setActivePanel] = useState<PanelId>(null)
  const [headings, setHeadings]       = useState<Heading[]>([])
  const [activeId, setActiveId]       = useState('')
  const [focusMode, setFocusMode]     = useState(false)
  const [copied, setCopied]           = useState(false)
  const [bookmarked, setBookmarked]   = useState(false)
  const [fontSizeIndex, setFontSizeIndex] = useState(1)
  const [theme, setTheme]             = useState<ThemeId>('archive')
  const [width, setWidth]             = useState<WidthId>('standard')

  // Accessibility state
  const [dyslexia, setDyslexia]             = useState(false)
  const [highContrast, setHighContrast]     = useState(false)
  const [reducedMotion, setReducedMotion]   = useState(false)
  const [readingRuler, setReadingRuler]     = useState(false)

  const toolbarRef = useRef<HTMLDivElement>(null)

  // ── Scroll visibility ────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => {
      const pct = window.scrollY / (document.body.scrollHeight - window.innerHeight)
      setVisible(pct > 0.08)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // ── Collect headings ─────────────────────────────────────────────
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('main h2, main h3')) as HTMLElement[]
    setHeadings(els.map((el, i) => {
      const id = el.id || `h-${i}`
      if (!el.id) el.id = id
      return { id, text: el.textContent?.trim() ?? `Section ${i + 1}`, level: el.tagName === 'H2' ? 2 : 3 }
    }))
  }, [])

  // ── Active heading tracker ───────────────────────────────────────
  useEffect(() => {
    if (!headings.length) return
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) setActiveId(e.target.id) }),
      { rootMargin: '-20% 0px -70% 0px' }
    )
    headings.forEach((h) => { const el = document.getElementById(h.id); if (el) obs.observe(el) })
    return () => obs.disconnect()
  }, [headings])

  // ── Load persisted settings ──────────────────────────────────────
  useEffect(() => {
    const t  = localStorage.getItem('sp_theme') as ThemeId | null
    const f  = localStorage.getItem('sp_font_size')
    const w  = localStorage.getItem('sp_width') as WidthId | null
    const dy = localStorage.getItem('sp_dyslexia') === 'true'
    const hc = localStorage.getItem('sp_high_contrast') === 'true'
    const rm = localStorage.getItem('sp_reduced_motion') === 'true'
    const rr = localStorage.getItem('sp_reading_ruler') === 'true'
    if (t)  setTheme(t)
    if (f)  setFontSizeIndex(Number(f))
    if (w)  setWidth(w)
    if (dy) setDyslexia(dy)
    if (hc) setHighContrast(hc)
    if (rm) setReducedMotion(rm)
    if (rr) setReadingRuler(rr)
  }, [])

  // ── Apply theme ──────────────────────────────────────────────────
  useEffect(() => {
    const article = document.querySelector('[data-article]') as HTMLElement
    if (!article) return
    THEMES.forEach((t) => article.classList.remove(`theme-${t.id}`))
    article.classList.add(`theme-${theme}`)
    localStorage.setItem('sp_theme', theme)
  }, [theme])

  // ── Apply font size ──────────────────────────────────────────────
  useEffect(() => {
    const article = document.querySelector('[data-article]') as HTMLElement
    if (!article) return
    ;['text-base', 'text-lg', 'text-xl', 'text-2xl'].forEach((s) => article.classList.remove(s))
    article.classList.add(['text-base', 'text-lg', 'text-xl', 'text-2xl'][fontSizeIndex])
    localStorage.setItem('sp_font_size', String(fontSizeIndex))
  }, [fontSizeIndex])

  // ── Apply reading width ──────────────────────────────────────────
  useEffect(() => {
    const article = document.querySelector('[data-article]') as HTMLElement
    if (!article) return
    WIDTHS.forEach((w) => article.classList.remove(w.maxW))
    const w = WIDTHS.find((w) => w.id === width)
    if (w) article.classList.add(w.maxW)
    localStorage.setItem('sp_width', width)
  }, [width])

  // ── Apply focus mode ─────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.classList.toggle('focus-mode', focusMode)
    return () => document.documentElement.classList.remove('focus-mode')
  }, [focusMode])

  // ── Apply reading ruler ────────────────────────────────────────
  useEffect(() => {
    const article = document.querySelector('[data-article]') as HTMLElement
    if (!article) return
    article.classList.toggle('a11y-reading-ruler', readingRuler)
    localStorage.setItem('sp_reading_ruler', String(readingRuler))
  }, [readingRuler])

  // ── Apply accessibility classes ──────────────────────────────────
  useEffect(() => {
    const article = document.querySelector('[data-article]') as HTMLElement
    if (!article) return
    article.classList.toggle('a11y-dyslexia', dyslexia)
    localStorage.setItem('sp_dyslexia', String(dyslexia))
  }, [dyslexia])

  useEffect(() => {
    const article = document.querySelector('[data-article]') as HTMLElement
    if (!article) return
    article.classList.toggle('a11y-high-contrast', highContrast)
    localStorage.setItem('sp_high_contrast', String(highContrast))
  }, [highContrast])

  useEffect(() => {
    const article = document.querySelector('[data-article]') as HTMLElement
    if (!article) return
    article.classList.toggle('a11y-reduced-motion', reducedMotion)
    localStorage.setItem('sp_reduced_motion', String(reducedMotion))
  }, [reducedMotion])

  // ── Outside click closes panel ───────────────────────────────────
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) setActivePanel(null)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  // ── Escape key ───────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setFocusMode(false); setActivePanel(null) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleBookmark = () => {
    localStorage.setItem(`sp_bookmark_${window.location.pathname}`, String(window.scrollY))
    setBookmarked(true)
    setTimeout(() => setBookmarked(false), 2000)
  }

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setActivePanel(null)
  }

  const togglePanel = (panel: PanelId) => setActivePanel((p) => (p === panel ? null : panel))

  const hasA11yActive = dyslexia || highContrast || reducedMotion || readingRuler

  const Btn = ({ onClick, active = false, title: t, children, badge = false }: {
    onClick: () => void
    active?: boolean
    title: string
    children: React.ReactNode
    badge?: boolean
  }) => (
    <button
      onClick={onClick} title={t} aria-label={t}
      className={`relative w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-150 ${
        active ? 'bg-white text-black' : 'text-stone-500 hover:text-white hover:bg-white/10'
      }`}
    >
      {children}
      {badge && (
        <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400" />
      )}
    </button>
  )

  const Toggle = ({ label, desc, value, onToggle, color = 'white' }: {
    label: string; desc?: string; value: boolean; onToggle: () => void; color?: string
  }) => (
    <button
      onClick={onToggle}
      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${
        value ? 'bg-white/10 text-white' : 'text-stone-500 hover:text-white hover:bg-white/5'
      }`}
    >
      <div className="text-left">
        <span className="font-mono text-[10px] uppercase tracking-widest block">{label}</span>
        {desc && <span className="font-mono text-[8px] text-stone-600 block mt-0.5">{desc}</span>}
      </div>
      <div className={`w-8 h-5 rounded-full border flex-shrink-0 ml-3 flex items-center px-0.5 transition-colors ${
        value ? 'bg-white/20 border-white/30' : 'bg-white/5 border-white/10'
      }`}>
        <div className={`w-3 h-3 rounded-full transition-all duration-200 ${
          value ? 'bg-white translate-x-4' : 'bg-stone-600 translate-x-0'
        }`} />
      </div>
    </button>
  )

  return (
    <>
      {/* Focus mode + base styles (not in article CSS to avoid duplication) */}
      <style>{`
        html.focus-mode header,
        html.focus-mode nav,
        html.focus-mode footer { opacity:0.06!important; pointer-events:none!important; transition:opacity 0.6s ease!important; }
      `}</style>

      <AnimatePresence>
        {visible && (
          <motion.div
            ref={toolbarRef}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.25 }}
            className="fixed right-3 md:right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-1"
          >
            {/* Main toolbar */}
            <div className="flex flex-col gap-0.5 bg-[#111]/95 border border-white/10 rounded-xl p-1.5 backdrop-blur-xl shadow-2xl">
              <Btn onClick={() => togglePanel('toc')}   active={activePanel === 'toc'}   title="Table of contents">
                <List size={15} />
              </Btn>
              <Btn onClick={() => { setFocusMode(v => !v); setActivePanel(null) }} active={focusMode} title={focusMode ? 'Exit focus (Esc)' : 'Focus mode'}>
                {focusMode ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              </Btn>
              <Btn onClick={() => togglePanel('font')}  active={activePanel === 'font'}  title="Font size">
                <Type size={15} />
              </Btn>
              <Btn onClick={() => togglePanel('width')} active={activePanel === 'width'} title="Reading width">
                <AlignJustify size={15} />
              </Btn>
              <Btn onClick={() => togglePanel('theme')} active={activePanel === 'theme'} title="Theme">
                <Palette size={15} />
              </Btn>
              <Btn onClick={() => togglePanel('a11y')}  active={activePanel === 'a11y'}  title="Accessibility" badge={hasA11yActive}>
                <Accessibility size={15} />
              </Btn>
              <div className="h-px bg-white/[0.08] my-0.5" />
              <Btn onClick={handleBookmark} active={bookmarked} title="Bookmark scroll position">
                {bookmarked ? <Check size={15} /> : <Bookmark size={15} />}
              </Btn>
              <Btn onClick={handleCopyLink} active={copied} title="Copy link">
                {copied ? <Check size={15} /> : <Link2 size={15} />}
              </Btn>
            </div>

            {/* Panels */}
            <AnimatePresence>
              {activePanel && (
                <motion.div
                  key={activePanel}
                  initial={{ opacity: 0, x: 8, scale: 0.96 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 8, scale: 0.96 }}
                  transition={{ duration: 0.18 }}
                  className="absolute right-12 top-0 w-64 bg-[#111]/[0.98] border border-white/[0.12] rounded-xl shadow-2xl backdrop-blur-xl overflow-hidden"
                >

                  {/* ── TOC ─────────────────────────────────────── */}
                  {activePanel === 'toc' && (
                    <>
                      <div className="px-4 py-3 border-b border-white/[0.08] flex items-center justify-between">
                        <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-stone-500">Contents</span>
                        <button onClick={() => setActivePanel(null)} className="text-stone-700 hover:text-white transition-colors"><X size={12} /></button>
                      </div>
                      <div className="max-h-80 overflow-y-auto p-2">
                        {headings.length > 0 ? headings.map((h) => (
                          <button
                            key={h.id}
                            onClick={() => scrollTo(h.id)}
                            className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg transition-all group ${h.level === 3 ? 'pl-6' : ''} ${
                              h.id === activeId ? 'bg-white/10 text-white' : 'text-stone-500 hover:text-stone-200 hover:bg-white/5'
                            }`}
                          >
                            {h.id === activeId && <span className="w-1 h-1 rounded-full bg-white flex-shrink-0" />}
                            <span className="font-mono text-[10px] leading-snug truncate">{h.text}</span>
                            <ChevronRight size={10} className="ml-auto flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        )) : (
                          <p className="font-mono text-[10px] text-stone-700 text-center py-6 uppercase tracking-widest">No sections found</p>
                        )}
                      </div>
                    </>
                  )}

                  {/* ── Font size ────────────────────────────────── */}
                  {activePanel === 'font' && (
                    <>
                      <div className="px-4 py-3 border-b border-white/[0.08] flex items-center justify-between">
                        <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-stone-500">Text size</span>
                        <button onClick={() => setActivePanel(null)} className="text-stone-700 hover:text-white transition-colors"><X size={12} /></button>
                      </div>
                      <div className="p-3 flex gap-2">
                        {FONT_SIZE_LABELS.map((label, i) => (
                          <button
                            key={i}
                            onClick={() => setFontSizeIndex(i)}
                            className={`flex-1 py-2.5 rounded-lg font-mono transition-all ${
                              fontSizeIndex === i ? 'bg-white text-black font-bold' : 'border border-white/10 text-stone-400 hover:text-white hover:border-white/30'
                            }`}
                            style={{ fontSize: `${10 + i * 2}px` }}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      <p className="px-4 pb-3 font-mono text-[8px] text-stone-700 uppercase tracking-widest text-center">Saved per device</p>
                    </>
                  )}

                  {/* ── Width ────────────────────────────────────── */}
                  {activePanel === 'width' && (
                    <>
                      <div className="px-4 py-3 border-b border-white/[0.08] flex items-center justify-between">
                        <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-stone-500">Reading width</span>
                        <button onClick={() => setActivePanel(null)} className="text-stone-700 hover:text-white transition-colors"><X size={12} /></button>
                      </div>
                      <div className="p-3 space-y-1.5">
                        {WIDTHS.map((w) => (
                          <button
                            key={w.id}
                            onClick={() => { setWidth(w.id); setActivePanel(null) }}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${
                              width === w.id ? 'bg-white/10 text-white' : 'text-stone-500 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            <div>
                              <span className="font-mono text-[10px] uppercase tracking-widest block">{w.label}</span>
                              <span className="font-mono text-[8px] text-stone-600">{w.desc}</span>
                            </div>
                            {width === w.id && <Check size={12} className="flex-shrink-0" />}
                          </button>
                        ))}
                      </div>
                      <p className="px-4 pb-3 font-mono text-[8px] text-stone-700 uppercase tracking-widest text-center">Applies to article column</p>
                    </>
                  )}

                  {/* ── Theme ────────────────────────────────────── */}
                  {activePanel === 'theme' && (
                    <>
                      <div className="px-4 py-3 border-b border-white/[0.08] flex items-center justify-between">
                        <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-stone-500">Reading theme</span>
                        <button onClick={() => setActivePanel(null)} className="text-stone-700 hover:text-white transition-colors"><X size={12} /></button>
                      </div>
                      <div className="p-3 space-y-1.5">
                        {THEMES.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => { setTheme(t.id); setActivePanel(null) }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                              theme === t.id ? 'bg-white/10 text-white' : 'text-stone-500 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            <div className={`w-6 h-6 rounded-md border flex-shrink-0 ${t.preview}`} />
                            <div className="text-left">
                              <span className="font-mono text-[10px] uppercase tracking-widest block">{t.label}</span>
                              <span className="font-mono text-[8px] text-stone-600">{t.desc}</span>
                            </div>
                            {theme === t.id && <Check size={12} className="ml-auto flex-shrink-0" />}
                          </button>
                        ))}
                      </div>
                      <p className="px-4 pb-3 font-mono text-[8px] text-stone-700 uppercase tracking-widest text-center">Scoped to article only</p>
                    </>
                  )}

                  {/* ── Accessibility ────────────────────────────── */}
                  {activePanel === 'a11y' && (
                    <>
                      <div className="px-4 py-3 border-b border-white/[0.08] flex items-center justify-between">
                        <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-stone-500">Accessibility</span>
                        <button onClick={() => setActivePanel(null)} className="text-stone-700 hover:text-white transition-colors"><X size={12} /></button>
                      </div>
                      <div className="p-3 space-y-1.5">
                        <Toggle
                          label="Dyslexia mode"
                          desc="Lexend font + wider spacing"
                          value={dyslexia}
                          onToggle={() => setDyslexia(v => !v)}
                        />
                        <Toggle
                          label="High contrast"
                          desc="Maximises contrast ratios"
                          value={highContrast}
                          onToggle={() => setHighContrast(v => !v)}
                        />
                        <Toggle
                          label="Reduce motion"
                          desc="Disables animations"
                          value={reducedMotion}
                          onToggle={() => setReducedMotion(v => !v)}
                        />
                        <Toggle
                          label="Reading ruler"
                          desc="Horizontal guide line"
                          value={readingRuler}
                          onToggle={() => setReadingRuler(v => !v)}
                        />
                      </div>
                      {hasA11yActive && (
                        <div className="px-4 pb-3">
                          <button
                            onClick={() => { setDyslexia(false); setHighContrast(false); setReducedMotion(false) }}
                            className="font-mono text-[9px] uppercase tracking-widest text-stone-600 hover:text-stone-400 transition-colors"
                          >
                            Reset all →
                          </button>
                        </div>
                      )}
                      <p className="px-4 pb-3 font-mono text-[8px] text-stone-700 uppercase tracking-widest text-center border-t border-white/5 pt-2">
                        Settings saved per device
                      </p>
                    </>
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