'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  List, Maximize2, Minimize2, Type, Bookmark, Share2, Check, ChevronRight, X,
  Palette, AlignJustify, Accessibility, Volume2, Pause, Play, Square, Printer, FileText, Link2,
} from 'lucide-react'
import { useArticle } from '@/components/article/ArticleProvider'
import { useReadAloud } from '@/components/article/useReadAloud'
import { FONT_SIZES, THEME_OPTIONS, WIDTH_OPTIONS } from '@/lib/articleThemeStyles'
// components/blog/ArticleFloatingToolbar.tsx
// Desktop (lg+) reader controls. All heading / progress / settings state comes
// from ArticleProvider; this component only owns panel visibility, the bookmark
// action, share actions and the read-aloud control.

type PanelId = 'toc' | 'font' | 'theme' | 'width' | 'a11y' | 'share' | 'listen' | null

export const bookmarkKey = (slug: string) => `sp_bookmark_${slug}`

// ── Module-level building blocks ──────────────────────────────────

function Btn({
  onClick, active = false, label, children, badge = false, pressed, expanded, controls,
}: {
  onClick: () => void
  active?: boolean
  label: string
  children: React.ReactNode
  badge?: boolean
  /** Use for on/off actions (aria-pressed). */
  pressed?: boolean
  /** Use for panel openers (aria-expanded). */
  expanded?: boolean
  controls?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={pressed}
      aria-expanded={expanded}
      aria-controls={controls}
      className={`relative w-10 h-10 flex items-center justify-center rounded-lg transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 ${
        active ? 'bg-white text-black' : 'text-stone-400 hover:text-white hover:bg-white/10'
      }`}
    >
      {children}
      {badge && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-400" aria-hidden="true" />}
    </button>
  )
}

function Toggle({ label, desc, value, onToggle }: { label: string; desc?: string; value: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={onToggle}
      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 ${
        value ? 'bg-white/10 text-white' : 'text-stone-400 hover:text-white hover:bg-white/5'
      }`}
    >
      <span className="text-left">
        <span className="font-mono text-[10px] uppercase tracking-widest block">{label}</span>
        {desc && <span className="font-mono text-[9px] text-stone-500 block mt-0.5">{desc}</span>}
      </span>
      <span className={`w-8 h-5 rounded-full border flex-shrink-0 ml-3 flex items-center px-0.5 transition-colors ${
        value ? 'bg-white/20 border-white/30' : 'bg-white/5 border-white/10'
      }`} aria-hidden="true">
        <span className={`w-3 h-3 rounded-full transition-transform duration-200 ${value ? 'bg-white translate-x-4' : 'bg-stone-500 translate-x-0'}`} />
      </span>
    </button>
  )
}

function PanelHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="pl-4 pr-1 py-1.5 border-b border-white/[0.08] flex items-center justify-between">
      <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-stone-400">{title}</span>
      <button
        type="button"
        onClick={onClose}
        aria-label={`Close ${title.toLowerCase()} panel`}
        className="w-10 h-10 flex items-center justify-center rounded-lg text-stone-400 hover:text-white hover:bg-white/5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
      >
        <X size={14} />
      </button>
    </div>
  )
}

function ActionRow({ onClick, icon, label, desc, done }: { onClick: () => void; icon: React.ReactNode; label: string; desc?: string; done?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-stone-300 hover:text-white hover:bg-white/5 transition-colors text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
    >
      <span className="text-stone-400 flex-shrink-0" aria-hidden="true">{done ? <Check size={14} /> : icon}</span>
      <span>
        <span className="font-mono text-[10px] uppercase tracking-widest block">{done ? 'Done' : label}</span>
        {desc && <span className="font-mono text-[9px] text-stone-500 block mt-0.5">{desc}</span>}
      </span>
    </button>
  )
}

// ── Toolbar ───────────────────────────────────────────────────────

export function ArticleFloatingToolbar({ markdown }: { markdown: string }) {
  const { slug, headings, activeId, progress, settings, setSetting, resetA11y, scrollTo, reducedMotion } = useArticle()
  const reader = useReadAloud()
  const [activePanel, setActivePanel] = useState<PanelId>(null)
  const [focusMode, setFocusMode] = useState(false)
  const [copied, setCopied] = useState<'link' | 'md' | null>(null)
  const [bookmarked, setBookmarked] = useState(false)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const panelId = 'sp-toolbar-panel'

  const visible = progress > 0.04

  useEffect(() => {
    document.documentElement.classList.toggle('focus-mode', focusMode)
    return () => document.documentElement.classList.remove('focus-mode')
  }, [focusMode])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) setActivePanel(null)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setFocusMode(false); setActivePanel(null) }
    }
    document.addEventListener('mousedown', onClick)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  const flash = (what: 'link' | 'md') => {
    setCopied(what)
    setTimeout(() => setCopied(null), 2000)
  }

  const copyLink = () => {
    navigator.clipboard?.writeText(window.location.href.split('#')[0]).then(() => flash('link')).catch(() => {})
  }
  const copyMarkdown = () => {
    navigator.clipboard?.writeText(markdown).then(() => flash('md')).catch(() => {})
  }
  const nativeShare = () => {
    if (navigator.share) navigator.share({ title: document.title, url: window.location.href }).catch(() => {})
    else copyLink()
  }

  const handleBookmark = () => {
    try {
      localStorage.setItem(bookmarkKey(slug), JSON.stringify({ pct: progress, at: Date.now() }))
      setBookmarked(true)
      setTimeout(() => setBookmarked(false), 2000)
    } catch { /* ignore */ }
  }

  const togglePanel = (panel: PanelId) => setActivePanel((p) => (p === panel ? null : panel))
  const hasA11yActive = settings.dyslexia || settings.highContrast || settings.reducedMotion || settings.ruler
  const dur = (d: number) => (reducedMotion ? 0 : d)

  return (
    <div className="hidden lg:block" data-print-hide>
      <AnimatePresence>
        {visible && (
          <motion.div
            ref={toolbarRef}
            initial={reducedMotion ? false : { opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: dur(0.25) }}
            className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-1"
            role="toolbar"
            aria-label="Reading tools"
            aria-orientation="vertical"
          >
            <div className="flex flex-col gap-0.5 bg-[#111]/95 border border-white/10 rounded-xl p-1.5 backdrop-blur-xl shadow-2xl">
              <Btn onClick={() => togglePanel('toc')} active={activePanel === 'toc'} label="Table of contents" expanded={activePanel === 'toc'} controls={panelId}>
                <List size={15} />
              </Btn>
              <Btn onClick={() => { setFocusMode((v) => !v); setActivePanel(null) }} active={focusMode} pressed={focusMode} label={focusMode ? 'Exit focus mode (Esc)' : 'Focus mode'}>
                {focusMode ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              </Btn>
              <Btn onClick={() => togglePanel('font')} active={activePanel === 'font'} label="Text size" expanded={activePanel === 'font'} controls={panelId}>
                <Type size={15} />
              </Btn>
              <Btn onClick={() => togglePanel('width')} active={activePanel === 'width'} label="Reading width" expanded={activePanel === 'width'} controls={panelId}>
                <AlignJustify size={15} />
              </Btn>
              <Btn onClick={() => togglePanel('theme')} active={activePanel === 'theme'} label="Reading theme" expanded={activePanel === 'theme'} controls={panelId}>
                <Palette size={15} />
              </Btn>
              <Btn onClick={() => togglePanel('a11y')} active={activePanel === 'a11y'} label="Accessibility" badge={hasA11yActive} expanded={activePanel === 'a11y'} controls={panelId}>
                <Accessibility size={15} />
              </Btn>
              {reader.supported && (
                <Btn onClick={() => togglePanel('listen')} active={activePanel === 'listen' || reader.status === 'playing'} label="Read aloud" expanded={activePanel === 'listen'} controls={panelId}>
                  <Volume2 size={15} />
                </Btn>
              )}
              <div className="h-px bg-white/[0.08] my-0.5" aria-hidden="true" />
              <Btn onClick={handleBookmark} active={bookmarked} label={bookmarked ? 'Position saved' : 'Bookmark reading position'}>
                {bookmarked ? <Check size={15} /> : <Bookmark size={15} />}
              </Btn>
              <Btn onClick={() => togglePanel('share')} active={activePanel === 'share'} label="Share and export" expanded={activePanel === 'share'} controls={panelId}>
                <Share2 size={15} />
              </Btn>
            </div>

            <AnimatePresence>
              {activePanel && (
                <motion.div
                  key={activePanel}
                  id={panelId}
                  initial={reducedMotion ? false : { opacity: 0, x: 8, scale: 0.96 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 8, scale: 0.96 }}
                  transition={{ duration: dur(0.18) }}
                  className="absolute right-14 top-0 w-72 bg-[#111]/[0.98] border border-white/[0.12] rounded-xl shadow-2xl backdrop-blur-xl overflow-hidden"
                >
                  {activePanel === 'toc' && (
                    <>
                      <PanelHeader title="Contents" onClose={() => setActivePanel(null)} />
                      <nav aria-label="Table of contents" className="max-h-80 overflow-y-auto p-2">
                        {headings.length > 0 ? headings.map((h) => (
                          <button
                            key={h.id}
                            type="button"
                            onClick={() => { scrollTo(h.id); setActivePanel(null) }}
                            aria-current={h.id === activeId ? 'location' : undefined}
                            className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg transition-colors group focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 ${h.level === 3 ? 'pl-6' : ''} ${
                              h.id === activeId ? 'bg-white/10 text-white' : 'text-stone-400 hover:text-stone-100 hover:bg-white/5'
                            }`}
                          >
                            {h.id === activeId && <span className="w-1 h-1 rounded-full bg-white flex-shrink-0" aria-hidden="true" />}
                            <span className="font-mono text-[10px] leading-snug truncate">{h.text}</span>
                            {h.minutes > 0 && <span className="ml-auto font-mono text-[9px] text-stone-500 flex-shrink-0">{h.minutes}m</span>}
                            <ChevronRight size={10} className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                          </button>
                        )) : (
                          <p className="font-mono text-[10px] text-stone-500 text-center py-6 uppercase tracking-widest">No sections found</p>
                        )}
                      </nav>
                    </>
                  )}

                  {activePanel === 'font' && (
                    <>
                      <PanelHeader title="Text size" onClose={() => setActivePanel(null)} />
                      <div className="p-3 flex gap-2" role="radiogroup" aria-label="Text size">
                        {FONT_SIZES.map((f, i) => (
                          <button
                            key={f.label}
                            type="button"
                            role="radio"
                            aria-checked={settings.fontSize === i}
                            onClick={() => setSetting('fontSize', i)}
                            className={`flex-1 py-2.5 rounded-lg font-mono transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 ${
                              settings.fontSize === i ? 'bg-white text-black font-bold' : 'border border-white/10 text-stone-300 hover:text-white hover:border-white/30'
                            }`}
                            style={{ fontSize: `${10 + i * 2}px` }}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                      <p className="px-4 pb-3 font-mono text-[9px] text-stone-500 uppercase tracking-widest text-center">Saved on this device</p>
                    </>
                  )}

                  {activePanel === 'width' && (
                    <>
                      <PanelHeader title="Reading width" onClose={() => setActivePanel(null)} />
                      <div className="p-3 space-y-1.5" role="radiogroup" aria-label="Reading width">
                        {WIDTH_OPTIONS.map((w) => (
                          <button
                            key={w.id}
                            type="button"
                            role="radio"
                            aria-checked={settings.width === w.id}
                            onClick={() => { setSetting('width', w.id); setActivePanel(null) }}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 ${
                              settings.width === w.id ? 'bg-white/10 text-white' : 'text-stone-400 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            <span className="text-left">
                              <span className="font-mono text-[10px] uppercase tracking-widest block">{w.label}</span>
                              <span className="font-mono text-[9px] text-stone-500">{w.desc}</span>
                            </span>
                            {settings.width === w.id && <Check size={12} className="flex-shrink-0" aria-hidden="true" />}
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  {activePanel === 'theme' && (
                    <>
                      <PanelHeader title="Reading theme" onClose={() => setActivePanel(null)} />
                      <div className="p-3 space-y-1.5" role="radiogroup" aria-label="Reading theme">
                        {THEME_OPTIONS.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            role="radio"
                            aria-checked={settings.theme === t.id}
                            onClick={() => { setSetting('theme', t.id); setActivePanel(null) }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 ${
                              settings.theme === t.id ? 'bg-white/10 text-white' : 'text-stone-400 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            <span className={`w-6 h-6 rounded-md border flex-shrink-0 ${t.preview}`} aria-hidden="true" />
                            <span className="text-left">
                              <span className="font-mono text-[10px] uppercase tracking-widest block">{t.label}</span>
                              <span className="font-mono text-[9px] text-stone-500">{t.desc}</span>
                            </span>
                            {settings.theme === t.id && <Check size={12} className="ml-auto flex-shrink-0" aria-hidden="true" />}
                          </button>
                        ))}
                      </div>
                      <p className="px-4 pb-3 font-mono text-[9px] text-stone-500 uppercase tracking-widest text-center">Scoped to the article</p>
                    </>
                  )}

                  {activePanel === 'a11y' && (
                    <>
                      <PanelHeader title="Accessibility" onClose={() => setActivePanel(null)} />
                      <div className="p-3 space-y-1.5">
                        <Toggle label="Dyslexia mode" desc="Lexend font + wider spacing" value={settings.dyslexia} onToggle={() => setSetting('dyslexia', !settings.dyslexia)} />
                        <Toggle label="High contrast" desc="Maximises contrast ratios" value={settings.highContrast} onToggle={() => setSetting('highContrast', !settings.highContrast)} />
                        <Toggle label="Reduce motion" desc="Disables animations site-wide" value={settings.reducedMotion} onToggle={() => setSetting('reducedMotion', !settings.reducedMotion)} />
                        <Toggle label="Reading ruler" desc="Horizontal guide line" value={settings.ruler} onToggle={() => setSetting('ruler', !settings.ruler)} />
                      </div>
                      {hasA11yActive && (
                        <div className="px-4 pb-3">
                          <button
                            type="button"
                            onClick={resetA11y}
                            className="font-mono text-[9px] uppercase tracking-widest text-stone-400 hover:text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 rounded-sm"
                          >
                            Reset all →
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {activePanel === 'listen' && (
                    <>
                      <PanelHeader title="Read aloud" onClose={() => setActivePanel(null)} />
                      <div className="p-3 space-y-1.5">
                        {reader.status !== 'playing' ? (
                          <ActionRow onClick={reader.play} icon={<Play size={14} />} label={reader.status === 'paused' ? 'Resume' : 'Play'} desc="Uses your browser's voice" />
                        ) : (
                          <ActionRow onClick={reader.pause} icon={<Pause size={14} />} label="Pause" desc={reader.total ? `Paragraph ${reader.index + 1} of ${reader.total}` : undefined} />
                        )}
                        {reader.status !== 'idle' && (
                          <ActionRow onClick={reader.stop} icon={<Square size={14} />} label="Stop" />
                        )}
                      </div>
                      <p className="px-4 pb-3 font-mono text-[9px] text-stone-500 uppercase tracking-widest text-center" aria-live="polite">
                        {reader.status === 'idle' ? 'Highlights each paragraph as it reads' : reader.status}
                      </p>
                    </>
                  )}

                  {activePanel === 'share' && (
                    <>
                      <PanelHeader title="Share and export" onClose={() => setActivePanel(null)} />
                      <div className="p-3 space-y-1" aria-live="polite">
                        <ActionRow onClick={copyLink} icon={<Link2 size={14} />} label="Copy link" done={copied === 'link'} />
                        <ActionRow onClick={copyMarkdown} icon={<FileText size={14} />} label="Copy as Markdown" desc="Title, TL;DR, headings, text, code" done={copied === 'md'} />
                        <ActionRow onClick={() => window.print()} icon={<Printer size={14} />} label="Print" desc="Widgets hidden, links expanded" />
                        {typeof navigator !== 'undefined' && 'share' in navigator && (
                          <ActionRow onClick={nativeShare} icon={<Share2 size={14} />} label="Share…" />
                        )}
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
