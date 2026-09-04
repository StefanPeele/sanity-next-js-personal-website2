'use client'

import { useEffect, useState } from 'react'
import { useArticle } from '@/components/article/ArticleProvider'
import { THEME_OPTIONS, isArticleTheme } from '@/lib/articleThemeStyles'
// components/blog/ThemePrompt.tsx
// When the post recommends a reading theme that differs from the reader's saved
// one, offer a one-tap switch. Dismissal is remembered per post.

export function ThemePrompt({ recommendedTheme }: { recommendedTheme?: string | null }) {
  const { slug, settings, setSetting } = useArticle()
  const [dismissed, setDismissed] = useState(true)
  const key = `sp_theme_prompt_${slug}`

  useEffect(() => {
    try { setDismissed(localStorage.getItem(key) === 'dismissed') } catch { setDismissed(false) }
  }, [key])

  if (!isArticleTheme(recommendedTheme) || recommendedTheme === settings.theme || dismissed) return null
  const meta = THEME_OPTIONS.find((t) => t.id === recommendedTheme)
  if (!meta) return null

  const remember = () => {
    try { localStorage.setItem(key, 'dismissed') } catch { /* ignore */ }
    setDismissed(true)
  }

  return (
    <div
      className="fixed bottom-6 right-6 z-40 hidden lg:flex items-center gap-3 pl-4 pr-2 py-2 bg-[#111]/95 border border-white/15 rounded-xl backdrop-blur-xl shadow-2xl max-w-xs"
      role="status"
      data-print-hide
    >
      <span className={`w-5 h-5 rounded-md border flex-shrink-0 ${meta.preview}`} aria-hidden="true" />
      <span className="font-mono text-[10px] text-stone-300 leading-snug">
        Written for the <span className="text-white">{meta.label}</span> theme
      </span>
      <button
        type="button"
        onClick={() => { setSetting('theme', recommendedTheme); remember() }}
        className="font-mono text-[10px] uppercase tracking-widest px-3 py-2 bg-white text-black rounded-lg hover:bg-stone-200 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
      >
        Switch
      </button>
      <button
        type="button"
        onClick={remember}
        aria-label="Dismiss theme suggestion"
        className="w-10 h-10 flex items-center justify-center rounded-lg text-stone-400 hover:text-white hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
      >
        ×
      </button>
    </div>
  )
}
