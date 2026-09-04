'use client'

import { useEffect, useState } from 'react'
// components/blog/ReadingRuler.tsx
// A subtle horizontal highlight that follows the mouse Y position within the article.
// Helps readers with tracking difficulties follow a line of text.
// Only active when [data-article] has the a11y-reading-ruler class (toggled by toolbar).

export function ReadingRuler() {
  const [y, setY]           = useState(-200)
  const [active, setActive] = useState(false)
  const [inArticle, setInArticle] = useState(false)

  // Observe a11y class on [data-article]
  useEffect(() => {
    const article = document.querySelector('[data-article]')
    if (!article) return

    const check = () => setActive(article.classList.contains('a11y-reading-ruler'))
    check()

    const obs = new MutationObserver(check)
    obs.observe(article, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])

  // Track mouse Y and article hover state
  useEffect(() => {
    if (!active) return

    const article = document.querySelector('[data-article]') as HTMLElement
    if (!article) return

    const onMove = (e: MouseEvent) => setY(e.clientY)
    const onEnter = () => setInArticle(true)
    const onLeave = () => setInArticle(false)

    window.addEventListener('mousemove', onMove, { passive: true })
    article.addEventListener('mouseenter', onEnter)
    article.addEventListener('mouseleave', onLeave)

    return () => {
      window.removeEventListener('mousemove', onMove)
      article.removeEventListener('mouseenter', onEnter)
      article.removeEventListener('mouseleave', onLeave)
    }
  }, [active])

  if (!active || !inArticle) return null

  return (
    <div
      className="fixed left-0 right-0 pointer-events-none z-30 transition-none"
      style={{
        top: y - 14,
        height: 28,
        background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.025) 30%, rgba(255,255,255,0.035) 50%, rgba(255,255,255,0.025) 70%, transparent)',
      }}
      aria-hidden="true"
    />
  )
}