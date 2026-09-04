'use client'

import { useEffect, useState } from 'react'
import { useArticle } from '@/components/article/ArticleProvider'
import { bookmarkKey } from '@/components/blog/ArticleFloatingToolbar'
// components/blog/ResumePill.tsx
// Reads the bookmark the toolbar wrote and offers to jump back to it.

export function ResumePill() {
  const { slug, reducedMotion } = useArticle()
  const [pct, setPct] = useState<number | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(bookmarkKey(slug))
      if (!raw) return
      const parsed: unknown = JSON.parse(raw)
      const value = typeof parsed === 'object' && parsed !== null ? (parsed as { pct?: unknown }).pct : parsed
      const n = Number(value)
      if (Number.isFinite(n) && n > 0.05 && n < 0.98 && window.scrollY < 200) setPct(n)
    } catch { /* ignore */ }
  }, [slug])

  if (pct === null) return null

  const resume = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    window.scrollTo({ top: max * pct, behavior: reducedMotion ? 'auto' : 'smooth' })
    setPct(null)
  }
  const dismiss = () => {
    try { localStorage.removeItem(bookmarkKey(slug)) } catch { /* ignore */ }
    setPct(null)
  }

  return (
    <div
      className="fixed top-20 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 pl-4 pr-1 py-1 bg-[#111]/95 border border-white/15 rounded-full backdrop-blur-xl shadow-2xl"
      role="status"
      data-print-hide
    >
      <button
        type="button"
        onClick={resume}
        className="font-mono text-[10px] uppercase tracking-widest text-stone-200 hover:text-white py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 rounded-sm"
      >
        Resume at {Math.round(pct * 100)}%
      </button>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss and clear bookmark"
        className="w-10 h-10 flex items-center justify-center rounded-full text-stone-400 hover:text-white hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
      >
        ×
      </button>
    </div>
  )
}
