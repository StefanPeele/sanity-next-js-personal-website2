'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Check, Pause, Play, Settings2, Square, X } from 'lucide-react'
import { useArticle } from '@/components/article/ArticleProvider'
import { useReadAloud } from '@/components/article/useReadAloud'
import type { ArticleUiCopy } from '@/lib/cms/defaults/articleUi'
import { clearBookmark, readBookmark, writeBookmark } from '@/lib/articleStorage'
import { ARTICLE_THEMES, ARTICLE_WIDTHS, FONT_SIZES, THEME_OPTIONS } from '@/lib/articleThemeStyles'
import { FOCUS } from '@/lib/ui'
// components/article/ReaderMenu.tsx — the one reader-settings control.
// Popover with theme, text size, width, accessibility, share/export, read-aloud, saved place.

export type ReaderMenuProps = {
  copy: ArticleUiCopy['readerMenu']
  markdown: string
  deck?: { filename: string; tsv: string }
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="py-3 border-b border-edge last:border-b-0">
      <h3 className="text-xs font-sans text-stone-400 mb-2">{label}</h3>
      {children}
    </section>
  )
}

function Chip({ active, onClick, children, role = 'radio' }: { active: boolean; onClick: () => void; children: React.ReactNode; role?: 'radio' | 'button' }) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={role === 'radio' ? active : undefined}
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm font-sans border transition-colors ${FOCUS} ${active ? 'bg-white text-black border-white' : 'border-edge text-stone-300 hover:border-edge-strong'}`}
    >
      {children}
    </button>
  )
}

function Switch({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={onChange}
      className={`w-full flex items-center justify-between py-2 text-sm font-sans rounded-sm ${FOCUS} ${checked ? 'text-white' : 'text-stone-300'}`}>
      <span>{label}</span>
      <span aria-hidden="true" className={`w-9 h-5 rounded-full border flex items-center px-0.5 transition-colors ${checked ? 'bg-white/20 border-edge-strong' : 'bg-surface-fill border-edge'}`}>
        <span className={`w-4 h-4 rounded-full transition-transform ${checked ? 'bg-white translate-x-4' : 'bg-stone-500'}`} />
      </span>
    </button>
  )
}

function Row({ label, onClick, done }: { label: string; onClick: () => void; done?: boolean }) {
  return (
    <button type="button" onClick={onClick} className={`w-full flex items-center justify-between py-2 text-sm font-sans text-stone-300 hover:text-white rounded-sm ${FOCUS}`}>
      <span>{label}</span>
      {done && <Check size={14} aria-hidden />}
    </button>
  )
}

function RulerLine() {
  const [y, setY] = useState<number | null>(null)
  useEffect(() => {
    let raf = 0
    const onMove = (e: MouseEvent) => {
      if (raf) return
      raf = requestAnimationFrame(() => { raf = 0; setY(e.clientY) })
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => { window.removeEventListener('mousemove', onMove); cancelAnimationFrame(raf) }
  }, [])
  if (y === null) return null
  return <div aria-hidden="true" className="pointer-events-none fixed left-0 right-0 z-[1000] h-8 bg-amber-300/[0.07] border-y border-amber-300/20" style={{ top: y - 16 }} />
}

export function ReaderMenu({ copy, markdown, deck }: ReaderMenuProps) {
  const { slug, progress, settings, setSetting, resetA11y, scrollTo, headings } = useArticle()
  const reader = useReadAloud()
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [hasBookmark, setHasBookmark] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const id = useId()

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage after mount (avoids a server/client mismatch)
    setHasBookmark(!!readBookmark(slug))
  }, [slug])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); buttonRef.current?.focus() } }
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node) && !buttonRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    panelRef.current?.querySelector<HTMLElement>('button')?.focus()
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onClick) }
  }, [open])

  const flash = (what: string) => { setCopied(what); setTimeout(() => setCopied(null), 2000) }
  const copyLink = () => navigator.clipboard?.writeText(window.location.href.split('#')[0]).then(() => flash('link')).catch(() => {})
  const copyMd = () => navigator.clipboard?.writeText(markdown).then(() => flash('md')).catch(() => {})
  const share = () => { if (navigator.share) navigator.share({ title: document.title, url: window.location.href }).catch(() => {}); else copyLink() }
  const downloadDeck = () => {
    if (!deck) return
    const blob = new Blob([deck.tsv], { type: 'text/tab-separated-values' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = deck.filename
    a.click()
    URL.revokeObjectURL(a.href)
  }
  const savePlace = () => { writeBookmark(slug, progress); setSaved(true); setHasBookmark(true); setTimeout(() => setSaved(false), 2000) }
  const goToPlace = () => {
    const b = readBookmark(slug)
    if (!b) return
    const max = document.documentElement.scrollHeight - window.innerHeight
    window.scrollTo({ top: max * b.pct, behavior: settings.reducedMotion ? 'auto' : 'smooth' })
    setOpen(false)
  }
  const clearPlace = () => { clearBookmark(slug); setHasBookmark(false) }

  const L = copy

  return (
    <div className="relative shrink-0" data-print-hide>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-2 px-3 py-2 rounded-full border border-edge text-sm font-sans text-stone-300 hover:text-white hover:border-edge-strong transition-colors ${FOCUS}`}
      >
        <Settings2 size={14} aria-hidden />
        <span className="hidden sm:inline">{L.buttonLabel}</span>
        <span className="sm:hidden sr-only">{L.buttonLabel}</span>
      </button>

      {settings.ruler && <RulerLine />}

      {open && (
        <div
          className="reader-menu-scrim"
          aria-hidden="true"
          onClick={() => { setOpen(false); buttonRef.current?.focus() }}
        />
      )}
      {open && (
        <div
          ref={panelRef}
          id={`${id}-panel`}
          role="dialog"
          aria-modal="false"
          aria-label={L.buttonLabel}
          // Below lg the panel is a bottom sheet: anchored as a dropdown it opened ~240px past
          // the fold at 390 and half its controls were unreachable. At lg it is a dropdown again.
          className="reader-menu-panel fixed inset-x-4 bottom-4 max-h-[75vh] lg:absolute lg:inset-x-auto lg:bottom-auto lg:right-0 lg:top-full lg:mt-2 lg:w-80 lg:max-h-[70vh] overflow-y-auto z-[1002] rounded-xl border border-edge bg-surface-raised shadow-2xl p-4 text-stone-200"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="section-label">{L.buttonLabel}</span>
            <button type="button" onClick={() => { setOpen(false); buttonRef.current?.focus() }} aria-label={L.closeLabel} className={`w-9 h-9 flex items-center justify-center rounded-lg text-stone-400 hover:text-white ${FOCUS}`}><X size={16} /></button>
          </div>

          <Group label={L.groupLabels.theme}>
            <div role="radiogroup" aria-label={L.groupLabels.theme} className="flex flex-wrap gap-2">
              {ARTICLE_THEMES.map((t) => (
                <Chip key={t} active={settings.theme === t} onClick={() => setSetting('theme', t)}>
                  <span className={`inline-block w-2.5 h-2.5 rounded-full border mr-2 align-middle ${THEME_OPTIONS.find((o) => o.id === t)?.preview ?? ''}`} aria-hidden />
                  {L.themeLabels[t]}
                </Chip>
              ))}
            </div>
          </Group>

          <Group label={L.groupLabels.textSize}>
            <div role="radiogroup" aria-label={L.groupLabels.textSize} className="flex gap-2">
              {FONT_SIZES.map((f, i) => <Chip key={f.label} active={settings.fontSize === i} onClick={() => setSetting('fontSize', i)}>{f.label}</Chip>)}
            </div>
          </Group>

          <Group label={L.groupLabels.width}>
            <div role="radiogroup" aria-label={L.groupLabels.width} className="flex gap-2">
              {ARTICLE_WIDTHS.map((w) => <Chip key={w} active={settings.width === w} onClick={() => setSetting('width', w)}>{L.widthLabels[w]}</Chip>)}
            </div>
          </Group>

          <Group label={L.groupLabels.accessibility}>
            <Switch label={L.a11yLabels.dyslexia} checked={settings.dyslexia} onChange={() => setSetting('dyslexia', !settings.dyslexia)} />
            <Switch label={L.a11yLabels.highContrast} checked={settings.highContrast} onChange={() => setSetting('highContrast', !settings.highContrast)} />
            <Switch label={L.a11yLabels.reducedMotion} checked={settings.reducedMotion} onChange={() => setSetting('reducedMotion', !settings.reducedMotion)} />
            <Switch label={L.a11yLabels.ruler} checked={settings.ruler} onChange={() => setSetting('ruler', !settings.ruler)} />
            <Row label={L.a11yLabels.reset} onClick={resetA11y} />
          </Group>

          <Group label={L.groupLabels.share}>
            <Row label={copied === 'link' ? L.shareLabels.copied : L.shareLabels.copyLink} onClick={copyLink} done={copied === 'link'} />
            <Row label={copied === 'md' ? L.shareLabels.copied : L.shareLabels.copyMarkdown} onClick={copyMd} done={copied === 'md'} />
            <Row label={L.shareLabels.print} onClick={() => window.print()} />
            {deck && <Row label={L.shareLabels.studyDeck} onClick={downloadDeck} />}
            <Row label={L.shareLabels.share} onClick={share} />
          </Group>

          <Group label={L.groupLabels.listen}>
            {reader.supported ? (
              <div className="flex items-center gap-2">
                {reader.status === 'playing' ? (
                  <Chip role="button" active={false} onClick={reader.pause}><Pause size={12} className="inline mr-1" aria-hidden />{L.listenLabels.pause}</Chip>
                ) : (
                  <Chip role="button" active={false} onClick={reader.play}><Play size={12} className="inline mr-1" aria-hidden />{reader.status === 'paused' ? L.listenLabels.resume : L.listenLabels.play}</Chip>
                )}
                {reader.status !== 'idle' && <Chip role="button" active={false} onClick={reader.stop}><Square size={12} className="inline mr-1" aria-hidden />{L.listenLabels.stop}</Chip>}
              </div>
            ) : (
              <p className="text-sm text-stone-400">{L.listenLabels.unsupported}</p>
            )}
          </Group>

          <Group label={L.groupLabels.position}>
            <Row label={saved ? L.bookmarkLabels.saved : L.bookmarkLabels.save} onClick={savePlace} done={saved} />
            {hasBookmark && <Row label={L.bookmarkLabels.resume} onClick={goToPlace} />}
            {hasBookmark && <Row label={L.bookmarkLabels.clear} onClick={clearPlace} />}
            {headings.length > 0 && <p className="sr-only">{headings.length} sections</p>}
            <button type="button" className="sr-only" onClick={() => scrollTo(headings[0]?.id ?? '')}>Top</button>
          </Group>
        </div>
      )}
    </div>
  )
}
