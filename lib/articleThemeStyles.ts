// lib/articleThemeStyles.ts
// Shared constants for the article reader controls. The CSS itself lives in
// styles/article.css (imported by the [slug] page) so it is served as a real
// stylesheet instead of riding along in the RSC payload.

// Paper and Broadcast were removed. Theme classes only ever reach <article data-article>, and
// styles/article.css only selects prose inside it — so on a cream or white ground every framed
// component and all page chrome stayed near-black. Fixing that properly needs the card/border
// consolidation first; revisit when a light theme is a token swap rather than 20 rewrites.
// A reader with a stale `sp_theme` falls back to archive via isArticleTheme() in ArticleProvider.
export const ARTICLE_THEMES = ['archive', 'terminal'] as const
export type ArticleTheme = (typeof ARTICLE_THEMES)[number]

export const ARTICLE_WIDTHS = ['narrow', 'standard', 'wide'] as const
export type ArticleWidth = (typeof ARTICLE_WIDTHS)[number]

// `label` and `desc` were never rendered: ReaderMenu.tsx reads its labels from Studio
// (articleUi.readerMenu.themeLabels — "Dark"/"Green") and uses only `preview` from here.
export const THEME_OPTIONS: { id: ArticleTheme; preview: string }[] = [
  { id: 'archive',  preview: 'bg-[#0a0a0a] border-stone-600' },
  { id: 'terminal', preview: 'bg-[#0d1117] border-green-600' },
]

export const WIDTH_OPTIONS: { id: ArticleWidth; label: string; desc: string }[] = [
  { id: 'narrow',   label: 'Narrow',   desc: '~60 characters' },
  { id: 'standard', label: 'Standard', desc: '~72 characters' },
  { id: 'wide',     label: 'Wide',     desc: '~90 characters' },
]

/** Index → CSS value written to --article-fs on [data-article]. */
export const FONT_SIZES = [
  { label: 'S',  value: '0.9375rem' },
  { label: 'M',  value: '1.0625rem' },
  { label: 'L',  value: '1.1875rem' },
  { label: 'XL', value: '1.3125rem' },
] as const

export function isArticleTheme(v: unknown): v is ArticleTheme {
  return typeof v === 'string' && (ARTICLE_THEMES as readonly string[]).includes(v)
}
export function isArticleWidth(v: unknown): v is ArticleWidth {
  return typeof v === 'string' && (ARTICLE_WIDTHS as readonly string[]).includes(v)
}
