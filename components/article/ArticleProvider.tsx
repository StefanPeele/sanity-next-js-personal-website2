'use client'

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode,
} from 'react'
import { useReducedMotion } from 'framer-motion'
import { slugify } from '@/lib/reading'
import {
  ARTICLE_THEMES, DEFAULT_FONT_SIZE_INDEX, FONT_SIZES, READING_SCALES, READING_SCALE_KEYS,
  clampScale, isArticleTheme, isArticleWidth, isLightTheme, type ArticleTheme, type ArticleWidth,
} from '@/lib/articleThemeStyles'
import { readPosition, writePosition } from '@/lib/articleStorage'
// components/article/ArticleProvider.tsx
// Single source of truth for everything the article navigators share:
//   - the heading list (collected ONCE from [data-article], ids already assigned server-side)
//   - the active heading + overall / per-section progress from ONE rAF-throttled scroll handler
//   - reader settings (theme, font size, width, accessibility) persisted to localStorage
// ArticleToc, ReaderMenu and ReadingProgressBar consume this.

export interface ArticleHeading {
  id: string
  text: string
  level: 2 | 3
  /** Words between this heading and the next one (any level). */
  words: number
  /** Reading minutes for that span at 220 wpm, 0 when under half a minute. */
  minutes: number
}

export interface ArticleSettings {
  theme: ArticleTheme
  fontSize: number
  width: ArticleWidth
  dyslexia: boolean
  highContrast: boolean
  reducedMotion: boolean
  ruler: boolean
  // 5.2's expanded set. The four scales are indexes into READING_SCALES; the three new
  // booleans are toggles. "Animation off" is not here because `reducedMotion` already is.
  lineHeight: number
  letterSpacing: number
  wordSpacing: number
  paraSpacing: number
  linkUnderline: boolean
  bigFocus: boolean
  muteColour: boolean
  /** 5.1's index-only control: how tightly the card grid packs. */
  density: 'comfortable' | 'compact'
  /**
   * 7.6. The progress bar's own off switch. The standing rule is that anything occupying
   * persistent screen space carries one -- chrome accumulates, and a reader who finds a
   * live bar at the top of the viewport distracting currently has no way to stop it.
   * Defaults ON: it is information, and the brief asks for MORE of it, not less.
   */
  progressBar: boolean
  /**
   * 7.6. Resume where you stopped. Off by default, because silently moving a reader down a
   * page they just opened is the kind of help that reads as a bug the first time it
   * happens. A reader who wants it turns it on once.
   */
  resumeScroll: boolean
}

const DEFAULT_SETTINGS: ArticleSettings = {
  theme: 'archive',
  // Index into FONT_SIZES. 5.2 widened that table from four steps to seven, so 19px moved
  // from index 2 to index 4 -- the VALUE is unchanged, only its position. The pre-hydration
  // value in styles/article.css must stay equal to FONT_SIZES[this] or the prose resizes on
  // load, and it is 1.1875rem, which is still what index 4 holds.
  fontSize: DEFAULT_FONT_SIZE_INDEX,
  width: 'standard',
  dyslexia: false,
  highContrast: false,
  reducedMotion: false,
  ruler: false,
  lineHeight: READING_SCALES.lineHeight.initial,
  letterSpacing: READING_SCALES.letterSpacing.initial,
  wordSpacing: READING_SCALES.wordSpacing.initial,
  paraSpacing: READING_SCALES.paraSpacing.initial,
  linkUnderline: false,
  bigFocus: false,
  muteColour: false,
  density: 'comfortable',
  progressBar: true,
  resumeScroll: false,
}

const STORAGE = {
  theme: 'sp_theme',
  fontSize: 'sp_font_size',
  width: 'sp_width',
  dyslexia: 'sp_dyslexia',
  highContrast: 'sp_high_contrast',
  reducedMotion: 'sp_reduced_motion',
  ruler: 'sp_reading_ruler',
  lineHeight: 'sp_line_height',
  letterSpacing: 'sp_letter_spacing',
  wordSpacing: 'sp_word_spacing',
  paraSpacing: 'sp_para_spacing',
  linkUnderline: 'sp_link_underline',
  bigFocus: 'sp_big_focus',
  muteColour: 'sp_mute_colour',
  density: 'sp_density',
  progressBar: 'sp_progress_bar',
  resumeScroll: 'sp_resume_scroll',
} as const

interface ArticleContextValue {
  slug: string
  title: string
  totalWords: number
  headings: ArticleHeading[]
  activeId: string
  /** 0–1 through the whole document. */
  progress: number
  settings: ArticleSettings
  setSetting: <K extends keyof ArticleSettings>(key: K, value: ArticleSettings[K]) => void
  resetA11y: () => void
  /** OS preference OR the in-app toggle. */
  reducedMotion: boolean
  scrollTo: (id: string) => void
  minutesLeft: number
}

const ArticleContext = createContext<ArticleContextValue | null>(null)

export function useArticle(): ArticleContextValue {
  const ctx = useContext(ArticleContext)
  if (!ctx) throw new Error('useArticle must be used inside <ArticleProvider>')
  return ctx
}

export function useArticleOptional(): ArticleContextValue | null {
  return useContext(ArticleContext)
}

/** Reduced motion that honours both the OS setting and the reader's toolbar toggle. */
export function useArticleReducedMotion(): boolean {
  const os = useReducedMotion()
  const ctx = useContext(ArticleContext)
  return !!os || !!ctx?.settings.reducedMotion
}

function readStoredSettings(fallbackTheme?: string | null): ArticleSettings {
  try {
    const stored = localStorage.getItem(STORAGE.theme)
    const theme = stored ?? (isArticleTheme(fallbackTheme) ? fallbackTheme : null)
    // getItem returns null for a reader who has never touched the control, and Number(null)
    // is 0 — which satisfies every guard below, so the default was unreachable and everyone
    // silently got the smallest size. Treat "absent" and "empty" as "no preference".
    const rawFs = localStorage.getItem(STORAGE.fontSize)
    const fs = rawFs === null || rawFs === '' ? DEFAULT_SETTINGS.fontSize : Number(rawFs)
    const width = localStorage.getItem(STORAGE.width)
    return {
      theme: isArticleTheme(theme) ? theme : DEFAULT_SETTINGS.theme,
      fontSize: Number.isFinite(fs) && fs >= 0 && fs < FONT_SIZES.length ? Math.floor(fs) : DEFAULT_SETTINGS.fontSize,
      width: isArticleWidth(width) ? width : DEFAULT_SETTINGS.width,
      lineHeight: clampScale('lineHeight', localStorage.getItem(STORAGE.lineHeight)),
      letterSpacing: clampScale('letterSpacing', localStorage.getItem(STORAGE.letterSpacing)),
      wordSpacing: clampScale('wordSpacing', localStorage.getItem(STORAGE.wordSpacing)),
      paraSpacing: clampScale('paraSpacing', localStorage.getItem(STORAGE.paraSpacing)),
      linkUnderline: localStorage.getItem(STORAGE.linkUnderline) === 'true',
      bigFocus: localStorage.getItem(STORAGE.bigFocus) === 'true',
      muteColour: localStorage.getItem(STORAGE.muteColour) === 'true',
      density: localStorage.getItem(STORAGE.density) === 'compact' ? 'compact' : 'comfortable',
      // `!== 'false'`, not `=== 'true'`: this one defaults ON, so an absent key must read as
      // true. Spelling it the other way would silently turn the bar off for every reader who
      // has never opened the menu -- the same shape as the font-size bug above.
      progressBar: localStorage.getItem(STORAGE.progressBar) !== 'false',
      resumeScroll: localStorage.getItem(STORAGE.resumeScroll) === 'true',
      dyslexia: localStorage.getItem(STORAGE.dyslexia) === 'true',
      highContrast: localStorage.getItem(STORAGE.highContrast) === 'true',
      reducedMotion: localStorage.getItem(STORAGE.reducedMotion) === 'true',
      ruler: localStorage.getItem(STORAGE.ruler) === 'true',
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

function collectHeadings(root: HTMLElement): { headings: ArticleHeading[]; els: HTMLElement[] } {
  const taken = new Set<string>()
  const els: HTMLElement[] = []
  const headings: ArticleHeading[] = []
  // h2..h6, not h2..h3. The Studio offers every level and authors use them: one post
  // is written entirely in h5 and had a completely empty Contents column because of this.
  // H2 stays level 2; everything below indents as level 3.
  root.querySelectorAll<HTMLElement>('h2, h3, h4, h5, h6').forEach((el) => {
    if (el.closest('[data-no-toc]')) return
    let id = el.id
    if (!id) {
      const base = slugify(el.textContent ?? '')
      id = base
      let n = 2
      while (taken.has(id) || document.getElementById(id)) id = `${base}-${n++}`
      el.id = id
    }
    taken.add(id)
    const words = Number(el.dataset.words ?? 0) || 0
    // Visible text minus the "#" anchor link.
    const text = el.dataset.headingText ?? Array.from(el.childNodes)
      .filter((n) => !(n instanceof HTMLElement && n.classList.contains('heading-anchor')))
      .map((n) => n.textContent ?? '')
      .join('')
    els.push(el)
    headings.push({
      id,
      text: text.trim(),
      level: el.tagName === 'H2' ? 2 : 3,
      words,
      // No Math.max(1, ...) here. That floor is correct for a WHOLE POST -- nothing is a
      // "0 min read" -- but wrong for a section: it charged every heading a full minute
      // however short, so the TOC's sections summed to more than the post. Measured on
      // production: the portfolio post's four sections read 1/1/1/1 = 4 against a 2-minute
      // header, and the home-lab post's read 1/1/2/1 = 5 against 3. The JSDoc on `minutes`
      // above already documented the intended behaviour -- "0 when under half a minute" --
      // and the floor contradicted it. Found by the verifier subagent, outside the claim
      // it was given, while checking that card and article agree (Phase 0.1).
      minutes: words ? Math.round(words / 220) : 0,
    })
  })
  return { headings, els }
}

/**
 * 5.1 asks for the SAME toolbar on `/blog` and inside an article, and the toolbar reads every
 * one of its settings from here. So the index needs this provider too — and the three props
 * below are article facts the index does not have.
 *
 * They are optional rather than required. On the index `slug` is empty, `headings` collects
 * nothing (there is no `[data-article]` to walk), and the bookmark controls are never
 * rendered, because the toolbar's `variant="index"` gates that whole group out. Nothing
 * article-shaped is reachable there, so nothing article-shaped needs a value.
 *
 * THE CLEANER SHAPE, recorded rather than done: the reader SETTINGS half of this file is not
 * article-specific and wants to be its own `ReaderSettingsProvider`, with this one composing
 * it. That is a refactor of the most load-bearing client component on the site, and it buys
 * a better name rather than a better page. Logged in OVERHAUL-PROGRESS as a follow-up.
 */
export function ArticleProvider({
  slug = '', title = '', totalWords = 0, initialTheme, children,
}: {
  slug?: string
  title?: string
  totalWords?: number
  /** From post.recommendedTheme; used only when the reader has no saved theme. */
  initialTheme?: string | null
  children: ReactNode
}) {
  const [headings, setHeadings] = useState<ArticleHeading[]>([])
  const [activeId, setActiveId] = useState('')
  const [progress, setProgress] = useState(0)
  const [settings, setSettings] = useState<ArticleSettings>(DEFAULT_SETTINGS)
  const [hydrated, setHydrated] = useState(false)
  const osReducedMotion = useReducedMotion()

  const elsRef = useRef<HTMLElement[]>([])
  const offsetsRef = useRef<number[]>([])
  const rafRef = useRef(0)
  const lastRef = useRef({ activeId: '', progress: -1 })

  // ── Load persisted settings once on the client ─────────────────
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage after mount (avoids a server/client mismatch)
    setSettings(readStoredSettings(initialTheme))
    setHydrated(true)
  }, [initialTheme])

  // ── Collect headings + cache offsets; recompute on resize / content changes ──
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-article]')
    if (!root) return

    const measure = () => {
      const scrollY = window.scrollY
      offsetsRef.current = elsRef.current.map((el) => el.getBoundingClientRect().top + scrollY)
    }

    const { headings: found, els } = collectHeadings(root)
    elsRef.current = els
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncs from the DOM after layout
    setHeadings(found)
    measure()

    let resizeTimer = 0
    const onResize = () => {
      window.clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(measure, 120)
    }
    window.addEventListener('resize', onResize)
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onResize) : null
    ro?.observe(root)
    // Fonts and images shift offsets after first paint.
    const t = window.setTimeout(measure, 800)

    return () => {
      window.removeEventListener('resize', onResize)
      window.clearTimeout(resizeTimer)
      window.clearTimeout(t)
      ro?.disconnect()
    }
  }, [slug])

  // ── ONE scroll handler, rAF-throttled, updates state only on change ──
  useEffect(() => {
    const update = () => {
      rafRef.current = 0
      const scrollY = window.scrollY
      const vh = window.innerHeight
      const max = document.documentElement.scrollHeight - vh
      const pct = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0
      const rounded = Math.round(pct * 1000) / 1000
      if (rounded !== lastRef.current.progress) {
        lastRef.current.progress = rounded
        setProgress(rounded)
      }

      const offsets = offsetsRef.current
      if (offsets.length) {
        const marker = scrollY + vh * 0.25
        let idx = -1
        for (let i = 0; i < offsets.length; i++) {
          if (offsets[i] <= marker) idx = i
          else break
        }
        const nextActive = idx >= 0 ? elsRef.current[idx].id : ''
        if (nextActive !== lastRef.current.activeId) {
          lastRef.current.activeId = nextActive
          setActiveId(nextActive)
        }

      }
    }

    const onScroll = () => {
      if (rafRef.current) return
      rafRef.current = window.requestAnimationFrame(update)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current)
    }
  }, [headings])

  // ── 7.6. Remember where the reader stopped, and offer it back ──
  //
  // The store is lib/articleStorage.ts, beside the manual bookmark, and NOT a second
  // per-slug map invented here. This project has removed four separate copies of one table
  // already; a fifth would have been written in this file.
  useEffect(() => {
    if (!hydrated || !slug) return
    let timer = 0
    const save = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      if (max <= 0) return
      writePosition(slug, Math.min(1, Math.max(0, window.scrollY / max)))
    }
    const onScroll = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(save, 400)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('pagehide', save)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pagehide', save)
      window.clearTimeout(timer)
      save()
    }
  }, [hydrated, slug])

  // The restore. Deliberately narrow: only when the reader asked for it, only when they are
  // still at the top -- so it cannot fight a back-button restoration or a fragment link --
  // and only once per mount. It waits for fonts and images to settle, the same 800-900ms
  // the heading offsets wait for and for the same reason: restoring against a pre-image
  // layout lands in the wrong place.
  const restoredRef = useRef('')
  useEffect(() => {
    if (!hydrated || !slug || !settings.resumeScroll) return
    if (restoredRef.current === slug) return
    if (window.location.hash) return
    if (window.scrollY > 8) return
    const frac = readPosition(slug)
    if (frac === null) return
    restoredRef.current = slug
    const t = window.setTimeout(() => {
      if (window.scrollY > 8) return
      const max = document.documentElement.scrollHeight - window.innerHeight
      if (max <= 0) return
      window.scrollTo({ top: Math.round(frac * max), behavior: 'instant' })
    }, 900)
    return () => window.clearTimeout(t)
  }, [hydrated, slug, settings.resumeScroll])

  // ── Apply settings to the DOM + persist ─────────────────────────
  useEffect(() => {
    if (!hydrated) return
    const article = document.querySelector<HTMLElement>('[data-article]')
    // The theme and accessibility classes belong on the ROUTE root, not on the prose
    // element: [data-article] lives inside a 36rem column, so theming it painted a
    // rectangle instead of a page. Font size stays on the prose, where it means
    // something. Falls back to the article element if the root is ever absent.
    const themeRoot = document.querySelector<HTMLElement>('[data-article-root]') ?? article
    const main = document.getElementById('content')
    const html = document.documentElement
    if (article) {
      article.style.setProperty('--article-fs', FONT_SIZES[settings.fontSize]?.value ?? FONT_SIZES[1].value)
    }
    // The theme also goes on <body>, not only on [data-article-root].
    //
    // The article root does NOT contain the navbar, the footer, or the reading toolbar --
    // the toolbar is portalled to <body> precisely so it escapes a transformed ancestor. On
    // a light theme that left the site logo at pure white on cream (~1.1:1, invisible) and
    // the toolbar as a dark blob on a pale page. Measured, not noticed by eye.
    //
    // On <body> rather than <html> so it cannot outlive the route: the cleanup below removes
    // it when the provider unmounts, and a reader who picks Light and then navigates to a
    // page with no article would otherwise keep a half-applied theme.
    const body = document.body
    body.classList.remove(...ARTICLE_THEMES.map((t) => `theme-${t}`))
    body.classList.add(`theme-${settings.theme}`)
    // The focus ring and the link underline are PAGE concerns, not prose concerns. The navbar,
    // the footer and the reading toolbar all sit outside [data-article-root], so a reader who
    // asks for a larger focus ring and then tabs into the nav would get the default one --
    // measured, and exactly what the first version did.
    body.classList.toggle('a11y-big-focus', settings.bigFocus)
    body.classList.toggle('a11y-link-underline', settings.linkUnderline)
    if (themeRoot) {
      themeRoot.classList.remove(...ARTICLE_THEMES.map((t) => `theme-${t}`))
      themeRoot.classList.add(`theme-${settings.theme}`)
      themeRoot.classList.toggle('a11y-dyslexia', settings.dyslexia)
      themeRoot.classList.toggle('a11y-high-contrast', settings.highContrast)
      themeRoot.classList.toggle('a11y-reduced-motion', settings.reducedMotion)
      themeRoot.classList.toggle('a11y-reading-ruler', settings.ruler)
      themeRoot.classList.toggle('a11y-link-underline', settings.linkUnderline)
      themeRoot.classList.toggle('a11y-big-focus', settings.bigFocus)
      themeRoot.classList.toggle('a11y-mute-colour', settings.muteColour)
      // The four scales are custom properties rather than a class per step: eleven classes
      // for four controls, and the prose rules would each need to know about all of them.
      READING_SCALE_KEYS.forEach((k) => {
        const scale = READING_SCALES[k]
        themeRoot.style.setProperty(scale.prop, scale.values[settings[k] as number] ?? scale.values[scale.initial])
      })
    }
    if (main) main.dataset.width = settings.width
    // The index reads this off the container; the article has no grid to pack.
    document.body.dataset.density = settings.density
    html.classList.toggle('sp-reduced-motion', settings.reducedMotion)
    // 5.2's light mode needs the ROOT to say so. `html { color-scheme: dark }` in
    // styles/index.css is what makes the scrollbar, form controls and the browser's own
    // focus rings dark; leaving it on a cream page gives a dark scrollbar down the side of a
    // light article and white-on-white text in a <select>. This is the one part of a theme
    // that cannot live in a class on [data-article-root].
    html.style.colorScheme = isLightTheme(settings.theme) ? 'light' : 'dark'
    try {
      localStorage.setItem(STORAGE.theme, settings.theme)
      localStorage.setItem(STORAGE.fontSize, String(settings.fontSize))
      localStorage.setItem(STORAGE.width, settings.width)
      localStorage.setItem(STORAGE.dyslexia, String(settings.dyslexia))
      localStorage.setItem(STORAGE.highContrast, String(settings.highContrast))
      localStorage.setItem(STORAGE.reducedMotion, String(settings.reducedMotion))
      localStorage.setItem(STORAGE.ruler, String(settings.ruler))
      localStorage.setItem(STORAGE.lineHeight, String(settings.lineHeight))
      localStorage.setItem(STORAGE.letterSpacing, String(settings.letterSpacing))
      localStorage.setItem(STORAGE.wordSpacing, String(settings.wordSpacing))
      localStorage.setItem(STORAGE.paraSpacing, String(settings.paraSpacing))
      localStorage.setItem(STORAGE.linkUnderline, String(settings.linkUnderline))
      localStorage.setItem(STORAGE.bigFocus, String(settings.bigFocus))
      localStorage.setItem(STORAGE.muteColour, String(settings.muteColour))
      localStorage.setItem(STORAGE.density, settings.density)
      localStorage.setItem(STORAGE.progressBar, String(settings.progressBar))
      localStorage.setItem(STORAGE.resumeScroll, String(settings.resumeScroll))
    } catch { /* private mode */ }
    return () => {
      html.classList.remove('sp-reduced-motion')
      // Leave no theme behind on a route that has no article to theme.
      document.body.classList.remove(...ARTICLE_THEMES.map((t) => `theme-${t}`))
      document.body.classList.remove('a11y-big-focus', 'a11y-link-underline')
      html.style.colorScheme = 'dark'
    }
  }, [settings, hydrated])

  const setSetting = useCallback(<K extends keyof ArticleSettings>(key: K, value: ArticleSettings[K]) => {
    setSettings((prev) => (prev[key] === value ? prev : { ...prev, [key]: value }))
  }, [])

  const resetA11y = useCallback(() => {
    // Every accessibility setting, including 5.2's additions. A Reset that leaves three of
    // ten controls where they were is worse than no Reset: the reader believes they are back
    // at the default and they are not. The scales go back to their own initial index, which
    // is not always 0 — line height defaults to the middle step.
    setSettings((prev) => ({
      ...prev,
      dyslexia: false,
      highContrast: false,
      reducedMotion: false,
      ruler: false,
      linkUnderline: false,
      bigFocus: false,
      muteColour: false,
      lineHeight: READING_SCALES.lineHeight.initial,
      letterSpacing: READING_SCALES.letterSpacing.initial,
      wordSpacing: READING_SCALES.wordSpacing.initial,
      paraSpacing: READING_SCALES.paraSpacing.initial,
    }))
  }, [])

  const reducedMotion = !!osReducedMotion || settings.reducedMotion

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    el.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' })
    // Move focus for keyboard / screen-reader users without scrolling twice.
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1')
    el.focus({ preventScroll: true })
  }, [reducedMotion])

  const minutesLeft = Math.ceil((totalWords * (1 - progress)) / 220)

  const value = useMemo<ArticleContextValue>(() => ({
    slug, title, totalWords, headings, activeId, progress,
    settings, setSetting, resetA11y, reducedMotion, scrollTo, minutesLeft,
  }), [slug, title, totalWords, headings, activeId, progress, settings, setSetting, resetA11y, reducedMotion, scrollTo, minutesLeft])

  return <ArticleContext.Provider value={value}>{children}</ArticleContext.Provider>
}
