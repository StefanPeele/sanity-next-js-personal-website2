// lib/articleThemeStyles.ts
// Shared constants for the article reader controls. The CSS itself lives in
// styles/article.css (imported by the [slug] page) so it is served as a real
// stylesheet instead of riding along in the RSC payload.

// Paper and Broadcast were removed because theme classes only reached <article data-article>,
// so on a cream ground every framed component and all page chrome stayed near-black. That
// blocker is gone: the class now lands on [data-article-root] (the full-width route wrapper)
// and each theme restates the eight palette tokens from styles/index.css, so a light theme IS
// now the token swap this note was waiting for rather than 20 selector rewrites. Adding one
// back is a design decision, not a technical one — it is deliberately NOT done here.
// A reader with a stale `sp_theme` falls back to archive via isArticleTheme() in ArticleProvider.
// Phase 5.2 asked for more than two themes and specifically for a light mode. The note above
// said the blocker was gone and that adding one back was "a design decision, not a technical
// one". These are that decision:
//
//   archive   the default. Near-black, the site's own ground.
//   slate     a SOFTER dark. Pure black behind white text causes halation -- the text
//             appears to bleed -- and it is worst for readers with astigmatism, which is
//             most people who wear glasses. #16161a with slightly dimmed ink removes it.
//             This is an accessibility option wearing a theme's clothes, which is why it is
//             here rather than in the toggles: it should be as easy to reach as a taste.
//   paper     the light mode. Warm cream rather than white, for the same halation reason
//             inverted -- pure white at full brightness is its own kind of glare.
//   terminal  unchanged.
export const ARTICLE_THEMES = ['archive', 'slate', 'paper', 'terminal'] as const
export type ArticleTheme = (typeof ARTICLE_THEMES)[number]

export const ARTICLE_WIDTHS = ['narrow', 'standard', 'wide'] as const
export type ArticleWidth = (typeof ARTICLE_WIDTHS)[number]

// `label` and `desc` were never rendered: ReaderMenu.tsx reads its labels from Studio
// (articleUi.readerMenu.themeLabels — "Dark"/"Green") and uses only `preview` from here.
export const THEME_OPTIONS: { id: ArticleTheme; preview: string; light?: boolean }[] = [
  { id: 'archive',  preview: 'bg-[#0a0a0a] border-stone-600' },
  { id: 'slate',    preview: 'bg-[#16161a] border-stone-500' },
  { id: 'paper',    preview: 'bg-[#f4f1ea] border-stone-400', light: true },
  { id: 'terminal', preview: 'bg-[#0d1117] border-green-600' },
]

export const WIDTH_OPTIONS: { id: ArticleWidth; label: string; desc: string }[] = [
  { id: 'narrow',   label: 'Narrow',   desc: '~60 characters' },
  { id: 'standard', label: 'Standard', desc: '~72 characters' },
  { id: 'wide',     label: 'Wide',     desc: '~90 characters' },
]

/**
 * Index → CSS value written to --article-fs on [data-article].
 *
 * Phase 5.2 asked for finer granularity than the four steps below it. Seven now, in even
 * 1px increments from 15 to 21px, because the old jumps were 2px each and the one that
 * mattered -- 17 to 19 -- is exactly where most readers settle.
 *
 * The DEFAULT INDEX IS 4 (19px, 1.1875rem). styles/article.css hard-codes that value for the
 * pre-hydration paint, and ArticleProvider's DEFAULT_SETTINGS.fontSize must equal this index
 * or the prose visibly resizes on load. Three places, one number; they are commented in all
 * three.
 */
export const FONT_SIZES = [
  { label: '15', value: '0.9375rem' },
  { label: '16', value: '1rem' },
  { label: '17', value: '1.0625rem' },
  { label: '18', value: '1.125rem' },
  { label: '19', value: '1.1875rem' },
  { label: '20', value: '1.25rem' },
  { label: '21', value: '1.3125rem' },
] as const

/** The index FONT_SIZES defaults to. Exported so nothing has to restate the number 4. */
export const DEFAULT_FONT_SIZE_INDEX = 4

/** True for themes with a light ground — the root needs `color-scheme: light` for them. */
export function isLightTheme(v: ArticleTheme): boolean {
  return THEME_OPTIONS.find((t) => t.id === v)?.light === true
}

export function isArticleTheme(v: unknown): v is ArticleTheme {
  return typeof v === 'string' && (ARTICLE_THEMES as readonly string[]).includes(v)
}
export function isArticleWidth(v: unknown): v is ArticleWidth {
  return typeof v === 'string' && (ARTICLE_WIDTHS as readonly string[]).includes(v)
}
