// lib/articleThemeStyles.ts
// Shared constants for the article reader controls. The CSS itself lives in
// styles/article.css (imported by the [slug] page) so it is served as a real
// stylesheet instead of riding along in the RSC payload.

export const ARTICLE_THEMES = ['archive', 'terminal', 'paper', 'broadcast'] as const
export type ArticleTheme = (typeof ARTICLE_THEMES)[number]

export const ARTICLE_WIDTHS = ['narrow', 'standard', 'wide'] as const
export type ArticleWidth = (typeof ARTICLE_WIDTHS)[number]

export const THEME_OPTIONS: { id: ArticleTheme; label: string; desc: string; preview: string }[] = [
  { id: 'archive',   label: 'Archive',   desc: 'Dark default',        preview: 'bg-[#0a0a0a] border-stone-600' },
  { id: 'terminal',  label: 'Terminal',  desc: 'Phosphor green',      preview: 'bg-[#0d1117] border-green-600' },
  { id: 'paper',     label: 'Paper',     desc: 'Warm cream',          preview: 'bg-[#f8f4ef] border-stone-400' },
  { id: 'broadcast', label: 'Broadcast', desc: 'High contrast white', preview: 'bg-white border-stone-300' },
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
