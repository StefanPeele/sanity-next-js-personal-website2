'use client'

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode,
} from 'react'
import { useReducedMotion } from 'framer-motion'
import { slugify } from '@/lib/reading'
import {
  ARTICLE_THEMES, DEFAULT_FONT_SIZE_INDEX, FONT_SIZES, isArticleTheme, isArticleWidth,
  isLightTheme, type ArticleTheme, type ArticleWidth,
} from '@/lib/articleThemeStyles'
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
}

const STORAGE = {
  theme: 'sp_theme',
  fontSize: 'sp_font_size',
  width: 'sp_width',
  dyslexia: 'sp_dyslexia',
  highContrast: 'sp_high_contrast',
  reducedMotion: 'sp_reduced_motion',
  ruler: 'sp_reading_ruler',
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

export function ArticleProvider({
  slug, title, totalWords, initialTheme, children,
}: {
  slug: string
  title: string
  totalWords: number
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
    if (themeRoot) {
      themeRoot.classList.remove(...ARTICLE_THEMES.map((t) => `theme-${t}`))
      themeRoot.classList.add(`theme-${settings.theme}`)
      themeRoot.classList.toggle('a11y-dyslexia', settings.dyslexia)
      themeRoot.classList.toggle('a11y-high-contrast', settings.highContrast)
      themeRoot.classList.toggle('a11y-reduced-motion', settings.reducedMotion)
      themeRoot.classList.toggle('a11y-reading-ruler', settings.ruler)
    }
    if (main) main.dataset.width = settings.width
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
    } catch { /* private mode */ }
    return () => {
      html.classList.remove('sp-reduced-motion')
      // Leave no theme behind on a route that has no article to theme.
      document.body.classList.remove(...ARTICLE_THEMES.map((t) => `theme-${t}`))
      html.style.colorScheme = 'dark'
    }
  }, [settings, hydrated])

  const setSetting = useCallback(<K extends keyof ArticleSettings>(key: K, value: ArticleSettings[K]) => {
    setSettings((prev) => (prev[key] === value ? prev : { ...prev, [key]: value }))
  }, [])

  const resetA11y = useCallback(() => {
    setSettings((prev) => ({ ...prev, dyslexia: false, highContrast: false, reducedMotion: false, ruler: false }))
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
