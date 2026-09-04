'use client'

import { useEffect, useRef, useState } from 'react'
// components/blog/ArticleEffects.tsx
// Handles three visual effects that require DOM access:
//   1. Magnetic cursor — subtle pull toward interactive elements (desktop only)
//   2. CRT overlay — scanline effect when terminal theme is active
//   3. Lexend font — dynamically loaded when dyslexia mode is active

export function ArticleEffects() {
  const cursorRef   = useRef<HTMLDivElement>(null)
  const crtRef      = useRef<HTMLDivElement>(null)
  const [crtActive, setCrtActive] = useState(false)
  const mouseRef    = useRef({ x: -100, y: -100 })
  const rafRef      = useRef<number>(0)

  // ── 1. Magnetic cursor ──────────────────────────────────────────
  useEffect(() => {
    const cursor = cursorRef.current
    if (!cursor) return

    // Only activate on non-touch, non-reduced-motion devices
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isMobile       = window.matchMedia('(max-width: 1024px)').matches
    if (prefersReduced || isMobile) return

    document.documentElement.classList.add('sp-cursor-active')
    cursor.classList.add('cursor-visible')

    const SELECTORS = 'a, button, [role="button"], input, textarea, select, label, [data-interactive]'
    let hovered: HTMLElement | null = null
    let pullX = 0
    let pullY = 0

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }

    // Animate cursor with rAF for smooth tracking
    const tick = () => {
      const cursor = cursorRef.current
      if (!cursor) return

      const { x, y } = mouseRef.current
      cursor.style.left = `${x}px`
      cursor.style.top  = `${y}px`
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    // Magnetic pull on interactive elements
    const onMouseEnter = (e: Event) => {
      const target = e.currentTarget as HTMLElement
      hovered = target
      cursor.classList.add('cursor-hover')

      const onMove = (ev: MouseEvent) => {
        if (!hovered) return
        const rect    = hovered.getBoundingClientRect()
        const centerX = rect.left + rect.width  / 2
        const centerY = rect.top  + rect.height / 2
        const dX = ev.clientX - centerX
        const dY = ev.clientY - centerY
        // Pull is proportional to distance — max 6px
        const maxPull = 6
        const distRaw = Math.sqrt(dX * dX + dY * dY)
        const dist    = Math.max(distRaw, 1)
        const pull    = Math.min(maxPull, maxPull * (1 - dist / 120))

        pullX = (dX / dist) * pull
        pullY = (dY / dist) * pull
        hovered.style.transform = `translate(${pullX}px, ${pullY}px)`
        hovered.style.transition = 'transform 0.12s ease-out'
      }

      hovered.addEventListener('mousemove', onMove)
      ;(hovered as any)._spMoveHandler = onMove
    }

    const onMouseLeave = (e: Event) => {
      const target = e.currentTarget as HTMLElement
      cursor.classList.remove('cursor-hover')

      const handler = (target as any)._spMoveHandler
      if (handler) target.removeEventListener('mousemove', handler)

      // Spring back
      target.style.transform  = ''
      target.style.transition = 'transform 0.4s ease-out'
      setTimeout(() => { target.style.transition = '' }, 400)
      hovered = null
    }

    // Attach to interactive elements within the article
    const article = document.querySelector('[data-article]')
    if (!article) return

    const attachToElements = () => {
      const elements = Array.from(article.querySelectorAll(SELECTORS)) as HTMLElement[]
      elements.forEach((el) => {
        el.addEventListener('mouseenter', onMouseEnter)
        el.addEventListener('mouseleave', onMouseLeave)
      })
      return elements
    }

    let elements = attachToElements()

    window.addEventListener('mousemove', onMouseMove, { passive: true })

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('mousemove', onMouseMove)
      document.documentElement.classList.remove('sp-cursor-active')
      elements.forEach((el) => {
        el.removeEventListener('mouseenter', onMouseEnter)
        el.removeEventListener('mouseleave', onMouseLeave)
        el.style.transform = ''
      })
    }
  }, [])

  // ── 2. CRT overlay — observe [data-article] class changes ──────
  useEffect(() => {
    const article = document.querySelector('[data-article]')
    if (!article) return

    const checkTheme = () => {
      setCrtActive(article.classList.contains('theme-terminal'))
    }

    checkTheme()

    const observer = new MutationObserver(checkTheme)
    observer.observe(article, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  // ── 4. Service worker registration ────────────────────────────
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])

  // ── 3. Lexend font loader — observe a11y-dyslexia class ────────
  useEffect(() => {
    const article = document.querySelector('[data-article]')
    if (!article) return

    const checkDyslexia = () => {
      if (article.classList.contains('a11y-dyslexia')) {
        // Load Lexend from Google Fonts if not already loaded
        if (!document.getElementById('sp-lexend-font')) {
          const link = document.createElement('link')
          link.id   = 'sp-lexend-font'
          link.rel  = 'stylesheet'
          link.href = 'https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600&display=swap'
          document.head.appendChild(link)
        }
      }
    }

    checkDyslexia()

    const observer = new MutationObserver(checkDyslexia)
    observer.observe(article, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  return (
    <>
      {/* Custom cursor — desktop only, hidden via CSS on mobile */}
      <div ref={cursorRef} className="sp-cursor" aria-hidden="true" />

      {/* CRT overlay — visible only when terminal theme is active */}
      <div
        ref={crtRef}
        className={`sp-crt-overlay ${crtActive ? 'crt-active' : ''}`}
        aria-hidden="true"
      />
    </>
  )
}