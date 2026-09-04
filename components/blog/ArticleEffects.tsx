'use client'

import { useEffect, useRef, useState } from 'react'
import { useArticle } from '@/components/article/ArticleProvider'
// components/blog/ArticleEffects.tsx
// DOM-level effects for the article page:
//   1. Magnetic cursor (desktop, pointer:fine, motion allowed) — pull applies to buttons only
//   2. CRT overlay while the terminal theme is active
//   3. Lexend font loaded on demand for dyslexia mode
//   4. Service worker registration (production only) for offline reading

export function ArticleEffects() {
  const { settings, reducedMotion } = useArticle()
  const cursorRef = useRef<HTMLDivElement>(null)
  const mouseRef = useRef({ x: -100, y: -100 })
  const rafRef = useRef(0)
  const [cursorOn, setCursorOn] = useState(false)

  // ── 1. Magnetic cursor ──────────────────────────────────────────
  useEffect(() => {
    const cursor = cursorRef.current
    if (!cursor) return
    const fine = window.matchMedia('(pointer: fine)').matches && window.matchMedia('(min-width: 1024px)').matches
    if (reducedMotion || !fine) { setCursorOn(false); return }
    setCursorOn(true)

    document.documentElement.classList.add('sp-cursor-active')
    cursor.classList.add('cursor-visible')

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick)
    }
    const tick = () => {
      rafRef.current = 0
      const { x, y } = mouseRef.current
      cursor.style.left = `${x}px`
      cursor.style.top = `${y}px`
    }

    // Magnetic pull: buttons only. Transforming inline anchors inside prose has no
    // visible effect and can shift line boxes, so links just grow the cursor ring.
    const article = document.querySelector<HTMLElement>('[data-article]')
    if (!article) return

    const cleanups: Array<() => void> = []
    const onEnterLink = () => cursor.classList.add('cursor-hover')
    const onLeaveLink = () => cursor.classList.remove('cursor-hover')

    article.querySelectorAll<HTMLElement>('a, button, [role="button"]').forEach((el) => {
      el.addEventListener('mouseenter', onEnterLink)
      el.addEventListener('mouseleave', onLeaveLink)
      cleanups.push(() => {
        el.removeEventListener('mouseenter', onEnterLink)
        el.removeEventListener('mouseleave', onLeaveLink)
      })
    })

    article.querySelectorAll<HTMLElement>('button').forEach((btn) => {
      // Skip inline text buttons (sidenotes, glossary terms): moving them breaks the line.
      if (btn.classList.contains('glossary-term') || btn.closest('p, li, blockquote')) return
      const onMove = (ev: MouseEvent) => {
        const rect = btn.getBoundingClientRect()
        const dX = ev.clientX - (rect.left + rect.width / 2)
        const dY = ev.clientY - (rect.top + rect.height / 2)
        const dist = Math.max(1, Math.hypot(dX, dY))
        const pull = Math.min(6, 6 * (1 - dist / 120))
        btn.style.transform = `translate(${(dX / dist) * pull}px, ${(dY / dist) * pull}px)`
        btn.style.transition = 'transform 0.12s ease-out'
      }
      const onLeave = () => {
        btn.style.transform = ''
        btn.style.transition = 'transform 0.4s ease-out'
      }
      btn.addEventListener('mousemove', onMove)
      btn.addEventListener('mouseleave', onLeave)
      cleanups.push(() => {
        btn.removeEventListener('mousemove', onMove)
        btn.removeEventListener('mouseleave', onLeave)
        btn.style.transform = ''
        btn.style.transition = ''
      })
    })

    window.addEventListener('mousemove', onMouseMove, { passive: true })
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      window.removeEventListener('mousemove', onMouseMove)
      document.documentElement.classList.remove('sp-cursor-active')
      cursor.classList.remove('cursor-visible', 'cursor-hover')
      cleanups.forEach((fn) => fn())
    }
  }, [reducedMotion])

  // ── 3. Lexend for dyslexia mode ─────────────────────────────────
  useEffect(() => {
    if (!settings.dyslexia || document.getElementById('sp-lexend-font')) return
    const link = document.createElement('link')
    link.id = 'sp-lexend-font'
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600&display=swap'
    document.head.appendChild(link)
  }, [settings.dyslexia])

  // ── 4. Service worker — production only ─────────────────────────
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {})
  }, [])

  return (
    <>
      <div ref={cursorRef} className="sp-cursor" aria-hidden="true" hidden={!cursorOn} />

      <div className={`sp-crt-overlay ${settings.theme === 'terminal' ? 'crt-active' : ''}`} aria-hidden="true" />
    </>
  )
}
