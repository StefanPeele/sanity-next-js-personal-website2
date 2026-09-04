'use client'

import { useEffect, useRef, useState } from 'react'
import { useArticle } from '@/components/article/ArticleProvider'
// components/blog/ReadingRuler.tsx
// Horizontal highlight following the pointer inside the article. Enabled from the
// toolbar (settings.ruler). Position is written straight to the DOM inside rAF —
// no React state per mousemove.

export function ReadingRuler() {
  const { settings } = useArticle()
  const active = settings.ruler
  const [inArticle, setInArticle] = useState(false)
  const barRef = useRef<HTMLDivElement>(null)
  const yRef = useRef(-200)
  const rafRef = useRef(0)

  useEffect(() => {
    if (!active) return
    const article = document.querySelector<HTMLElement>('[data-article]')
    if (!article) return

    const paint = () => {
      rafRef.current = 0
      if (barRef.current) barRef.current.style.transform = `translateY(${yRef.current - 14}px)`
    }
    const onMove = (e: MouseEvent) => {
      yRef.current = e.clientY
      if (!rafRef.current) rafRef.current = window.requestAnimationFrame(paint)
    }
    const onEnter = () => setInArticle(true)
    const onLeave = () => setInArticle(false)

    window.addEventListener('mousemove', onMove, { passive: true })
    article.addEventListener('mouseenter', onEnter)
    article.addEventListener('mouseleave', onLeave)
    return () => {
      window.removeEventListener('mousemove', onMove)
      article.removeEventListener('mouseenter', onEnter)
      article.removeEventListener('mouseleave', onLeave)
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current)
    }
  }, [active])

  if (!active || !inArticle) return null

  return (
    <div
      ref={barRef}
      className="fixed left-0 right-0 top-0 h-7 pointer-events-none z-30 will-change-transform"
      style={{
        transform: `translateY(${yRef.current - 14}px)`,
        background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.025) 30%, rgba(255,255,255,0.035) 50%, rgba(255,255,255,0.025) 70%, transparent)',
      }}
      aria-hidden="true"
      data-print-hide
    />
  )
}
