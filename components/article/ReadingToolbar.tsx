'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, Pause, Play, Settings2, Square, X } from 'lucide-react'
import { useArticle, useArticleOptional } from '@/components/article/ArticleProvider'
import { useReadAloud } from '@/components/article/useReadAloud'
import type { ArticleUiCopy } from '@/lib/cms/defaults/articleUi'
import { clearBookmark, readBookmark, writeBookmark } from '@/lib/articleStorage'
import { ARTICLE_THEMES, ARTICLE_WIDTHS, FONT_SIZES, READING_SCALES, READING_SCALE_KEYS, THEME_OPTIONS } from '@/lib/articleThemeStyles'
import { FOCUS, buttonClass } from '@/lib/ui'
// components/article/ReadingToolbar.tsx — Phase 5.
//
// This was ReaderMenu, a chip sitting in the table-of-contents row. The CONTROLS are
// unchanged and deliberately so: theme, size, width, accessibility, share/export,
// read-aloud and saved place all worked, and rewriting working controls to move them is how
// you lose the accessibility work that decisions/README.md called "the best-built thing in
// the section". What changed is the shell around them.
//
// 5.4 POSITION — a fixed rail on the right edge, vertically centred, OUTSIDE the reading
// measure. The prose column is max-w-[36rem] inside a max-w-6xl container, so at 1440 there
// is ~530px to the right of it; the rail lives there and can never overlap prose.
//
// At narrow widths there is no margin to live in, and 5.4 asks which of "fit within the
// available space" or "force the layout to make room" applies. It FITS: the collapsed
// control docks to the bottom-right corner as a floating circle, and expanding opens the
// same bottom sheet the old menu already used. Forcing the layout to make room would take
// 56px of a 390px viewport away from the prose permanently to serve a control that is shut
// most of the time -- paying always for something used occasionally.
//
// 5.3 COLLAPSED BY DEFAULT, and both states are real. Collapsed is a 44px circle; expanded
// is the panel. It remembers which, per reader, across pages and sessions.
//
// 5.3 RETREATING — it fades while the reader is actually reading. `idle` is set after
// SETTLE_MS of no pointer movement and no scrolling; any pointer move, any focus, or
// opening it brings it back. It never fades while open, and never when a keyboard user has
// focus inside it.
//
// 5.3 DISMISSIBLE ENTIRELY — "Hide the toolbar" removes it completely and persistently. It
// is recoverable from the footer link rather than from a stub left on the page, because a
// stub is exactly the chrome the reader just asked to be rid of.

export type ReadingToolbarProps = {
  copy: ArticleUiCopy['readerMenu']
  markdown: string
  deck?: { filename: string; tsv: string }
  /** 5.1. `index` hides the article-only controls; the physical control is the same. */
  variant?: 'article' | 'index'
}

/** Persisted so the collapsed/expanded choice and the dismissal survive a reload. */
const TOOLBAR_STORAGE = { open: 'sp_toolbar_open', hidden: 'sp_toolbar_hidden' }
/** Milliseconds of no pointer movement and no scrolling before the rail fades back. */
const SETTLE_MS = 2600

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
      className={`font-sans text-sm ${buttonClass({ variant: 'chip', size: 'sm', active })}`}
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

/**
 * The toolbar reads every one of its settings from ArticleProvider, so without one there is
 * nothing for it to control. `useArticle()` THROWS in that case, which would turn a wiring
 * mistake into a blank page.
 *
 * This wrapper is the whole guard: one hook, and an early return before the inner component's
 * hooks run, so the rules of hooks hold. It matters because `variant="index"` is built and
 * not yet wired — /blog has no provider, and the remaining half of 5.1 is to give it one.
 * Until then, rendering it there degrades to nothing instead of to a white screen.
 */
export function ReadingToolbar(props: ReadingToolbarProps) {
  const ctx = useArticleOptional()
  if (!ctx) return null
  return <ReadingToolbarInner {...props} />
}

function ReadingToolbarInner({ copy, markdown, deck, variant = 'article' }: ReadingToolbarProps) {
  const { slug, progress, settings, setSetting, resetA11y, scrollTo, headings } = useArticle()
  const reader = useReadAloud()
  const [open, setOpen] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [idle, setIdle] = useState(false)
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

  // 5.3 state memory. Read after mount, never during render: the server has no localStorage
  // and a mismatch here would flash the panel open on every load.
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage after mount
      setHidden(localStorage.getItem(TOOLBAR_STORAGE.hidden) === 'true')
      setOpen(localStorage.getItem(TOOLBAR_STORAGE.open) === 'true')
    } catch { /* private mode: the defaults are correct */ }
  }, [])

  useEffect(() => {
    try { localStorage.setItem(TOOLBAR_STORAGE.open, String(open)) } catch { /* ignore */ }
  }, [open])

  // 5.3 "aware and retreating". Fades only while SHUT -- a panel that dimmed itself under
  // the reader's own cursor would be the opposite of helpful -- and any pointer movement,
  // scroll or focus brings it straight back.
  useEffect(() => {
    // Clearing the retreat when the panel opens is the point of the effect, not a cascading
    // render. The directive has to sit on the line IMMEDIATELY above the code -- a two-line
    // comment between them points it at the comment instead, which is how this warning came
    // back twice.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open || hidden) { setIdle(false); return }
    let t = 0
    const wake = () => {
      setIdle(false)
      window.clearTimeout(t)
      t = window.setTimeout(() => setIdle(true), SETTLE_MS)
    }
    wake()
    window.addEventListener('pointermove', wake, { passive: true })
    window.addEventListener('scroll', wake, { passive: true })
    window.addEventListener('focusin', wake)
    return () => {
      window.clearTimeout(t)
      window.removeEventListener('pointermove', wake)
      window.removeEventListener('scroll', wake)
      window.removeEventListener('focusin', wake)
    }
  }, [open, hidden])

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
  const hideToolbar = () => {
    setOpen(false)
    setHidden(true)
    try { localStorage.setItem(TOOLBAR_STORAGE.hidden, 'true') } catch { /* ignore */ }
  }

  const L = copy
  const isArticle = variant === 'article'

  // PORTALLED TO document.body, and this is not optional.
  //
  // app/template.tsx wraps EVERY page in `<div className="motion-safe:animate-page-enter">`,
  // and that keyframe is declared `both`, so it holds its final `transform: translateY(0)`
  // forever. A transform -- even an identity one -- makes the element a containing block for
  // every `position: fixed` descendant. Left in the tree, this rail would resolve `top: 50%`
  // against a div as tall as the whole document and scroll away with the page, and it would
  // do it ONLY for readers who have not asked for reduced motion, because `motion-safe:`
  // means the transform is absent for the ones who have. A bug that appears for most readers
  // and not for the ones most likely to report it.
  const [mounted, setMounted] = useState(false)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return null

  // The ruler is the reader's setting, not the toolbar's, so it survives dismissal.
  if (hidden) return createPortal(<>{settings.ruler && <RulerLine />}</>, document.body)

  return createPortal((
    <div
      className={`reading-toolbar${idle ? ' is-idle' : ''}`}
      data-toolbar={variant}
      data-print-hide
    >
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        onClick={() => setOpen((v) => !v)}
        className={`reading-toolbar-trigger ${FOCUS}`}
      >
        <Settings2 size={18} aria-hidden />
        <span className="sr-only">{L.buttonLabel}</span>
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
        // POSITIONING and ANIMATION must not share an element. `.reader-menu-panel` runs a
        // keyframe declared `both` whose final frame sets `transform: scale(1)` at lg -- which
        // REPLACES any Tailwind translate on the same element. The panel was centred with
        // `-translate-y-1/2`, the animation wiped it, and the panel hung from top:50%
        // downward with its last group ~280px below the fold and unreachable. Measured, not
        // guessed: the harness could not click "Hide the toolbar".
        //
        // This anchor does the positioning and nothing else; the panel keeps the animation.
        // Below lg the anchor is `display: contents`, so the panel's own bottom-sheet
        // positioning applies untouched.
        <div className="reader-menu-anchor">
        <div
          ref={panelRef}
          id={`${id}-panel`}
          role="dialog"
          aria-modal="false"
          aria-label={L.buttonLabel}
          // Below lg the panel is a bottom sheet: anchored as a dropdown it opened ~240px past
          // the fold at 390 and half its controls were unreachable. At lg it is a dropdown again.
          // Below lg the panel is a bottom sheet: anchored as a dropdown it opened ~240px past
          // the fold at 390 and half its controls were unreachable. At lg it is ABSOLUTE --
          // positioned against the rail, which is itself fixed and so is its containing
          // block -- and sits to the rail's LEFT, opening into the margin rather than off the
          // right edge. `lg:absolute` is load-bearing: left as `fixed`, `right-full` resolves
          // against the VIEWPORT and puts the panel entirely off the left of the screen.
          className="reader-menu-panel fixed inset-x-4 bottom-4 max-h-[75vh] lg:static lg:inset-auto lg:w-80 lg:max-h-[80vh] overflow-y-auto z-[1002] rounded-xl border border-edge bg-surface-raised shadow-2xl p-4 text-stone-200"
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

          {/* 5.1. Theme, text size and accessibility apply everywhere and stay. Width,
              share, read-aloud and saved place are all about an article BODY -- on the index
              they would be controls for something that is not on the page. Same physical
              toolbar, fewer groups, which is why the transition does not read as one control
              being swapped for another. */}
          {isArticle && (
          <Group label={L.groupLabels.width}>
            <div role="radiogroup" aria-label={L.groupLabels.width} className="flex gap-2">
              {ARTICLE_WIDTHS.map((w) => <Chip key={w} active={settings.width === w} onClick={() => setSetting('width', w)}>{L.widthLabels[w]}</Chip>)}
            </div>
          </Group>

          )}

          {/* 5.2's four SCALES. They are separated from the toggles because they are not
              toggles: forcing line height into on/off gives a reader one clumsy jump. Three
              steps each, and the step that is the site's own default is marked, so nobody has
              to guess which one is "normal". */}
          <Group label={L.groupLabels.spacing}>
            {READING_SCALE_KEYS.map((k) => (
              <div key={k} className="flex items-center justify-between gap-3 py-1.5">
                <span className="font-sans text-sm text-stone-300">{L.spacingLabels[k]}</span>
                <div role="radiogroup" aria-label={L.spacingLabels[k]} className="flex gap-1.5 shrink-0">
                  {READING_SCALES[k].values.map((_, i) => (
                    <Chip key={i} active={settings[k] === i} onClick={() => setSetting(k, i)}>
                      {i === 0 ? L.scaleSteps.less : i === 1 ? L.scaleSteps.normal : L.scaleSteps.more}
                    </Chip>
                  ))}
                </div>
              </div>
            ))}
          </Group>

          <Group label={L.groupLabels.accessibility}>
            <Switch label={L.a11yLabels.dyslexia} checked={settings.dyslexia} onChange={() => setSetting('dyslexia', !settings.dyslexia)} />
            <Switch label={L.a11yLabels.highContrast} checked={settings.highContrast} onChange={() => setSetting('highContrast', !settings.highContrast)} />
            <Switch label={L.a11yLabels.reducedMotion} checked={settings.reducedMotion} onChange={() => setSetting('reducedMotion', !settings.reducedMotion)} />
            <Switch label={L.a11yLabels.ruler} checked={settings.ruler} onChange={() => setSetting('ruler', !settings.ruler)} />
            <Switch label={L.a11yLabels.linkUnderline} checked={settings.linkUnderline} onChange={() => setSetting('linkUnderline', !settings.linkUnderline)} />
            <Switch label={L.a11yLabels.bigFocus} checked={settings.bigFocus} onChange={() => setSetting('bigFocus', !settings.bigFocus)} />
            <Switch label={L.a11yLabels.muteColour} checked={settings.muteColour} onChange={() => setSetting('muteColour', !settings.muteColour)} />
            <Row label={L.a11yLabels.reset} onClick={resetA11y} />
          </Group>

          {isArticle && (<>
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

            {/* 5.2: voice selection and speed.
                This renders only once the browser has produced a voice list. Chrome returns
                an EMPTY array from getVoices() on the first call and fills it asynchronously,
                which is why useReadAloud listens for `voiceschanged` instead of reading it
                once -- without that this control is permanently empty on the browser most
                people use. */}
            {reader.supported && reader.voices.length > 0 && (
              <div className="mt-3 space-y-2.5">
                <label className="block">
                  <span className="block font-sans text-xs text-stone-400 mb-1">{L.listenLabels.voice}</span>
                  <select
                    value={reader.voiceURI ?? ''}
                    onChange={(e) => reader.setVoice(e.target.value || null)}
                    className={`w-full bg-surface-fill border border-edge rounded-md px-2 py-1.5 font-sans text-sm text-stone-200 ${FOCUS}`}
                  >
                    <option value="">{L.listenLabels.systemVoice}</option>
                    {reader.voices.map((v) => (
                      <option key={v.voiceURI} value={v.voiceURI}>{v.name}</option>
                    ))}
                  </select>
                </label>
                <div>
                  <span className="block font-sans text-xs text-stone-400 mb-1">{L.listenLabels.speed}</span>
                  <div role="radiogroup" aria-label={L.listenLabels.speed} className="flex gap-1.5">
                    {reader.rateSteps.map((r) => (
                      <Chip key={r} active={reader.rate === r} onClick={() => reader.setRate(r)}>{r}&times;</Chip>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Group>

          <Group label={L.groupLabels.position}>
            <Row label={saved ? L.bookmarkLabels.saved : L.bookmarkLabels.save} onClick={savePlace} done={saved} />
            {hasBookmark && <Row label={L.bookmarkLabels.resume} onClick={goToPlace} />}
            {hasBookmark && <Row label={L.bookmarkLabels.clear} onClick={clearPlace} />}
            {headings.length > 0 && <p className="sr-only">{headings.length} sections</p>}
            <button type="button" className="sr-only" onClick={() => scrollTo(headings[0]?.id ?? '')}>Top</button>
          </Group>
          </>)}

          {/* 5.3: dismissible ENTIRELY. Last, and quiet, because it is a decision rather
              than a setting — and recoverable from the footer, not from a stub left behind
              on the page. A stub is the chrome the reader just asked to be rid of. */}
          <Group label={L.groupLabels.toolbar}>
            <Row label={L.toolbarLabels.hide} onClick={hideToolbar} />
            <p className="font-sans text-xs text-stone-400 leading-relaxed pt-1">{L.toolbarLabels.hideHint}</p>
          </Group>
        </div>
        </div>
      )}
    </div>
  ), document.body)
}
