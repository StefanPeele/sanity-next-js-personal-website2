'use client'

import { useEffect, useRef } from 'react'
// components/blog/BlogBackground.tsx
//
// Ambient background for the archive shell. Two rules keep it cheap:
// 1. Only `opacity` and `transform` animate (compositor-only). Animating gradient
//    `background` forces a full-viewport repaint every frame and freezes low-end GPUs.
// 2. The cursor spotlight is a positioned layer moved with translate3d, throttled to rAF.
// Both respect prefers-reduced-motion via the motion-safe class.

export function BlogBackground() {
  const spotlightRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = spotlightRef.current
    if (!el) return
    if (window.matchMedia('(pointer: coarse)').matches) return

    let raf = 0
    let x = window.innerWidth / 2
    let y = window.innerHeight / 2

    const paint = () => {
      raf = 0
      el.style.transform = `translate3d(${x - 600}px, ${y - 600}px, 0)`
    }
    const onMove = (e: MouseEvent) => {
      x = e.clientX
      y = e.clientY
      if (!raf) raf = requestAnimationFrame(paint)
    }

    paint()
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
    }
  }, [])

  return (
    <div aria-hidden className="fixed inset-0 -z-20 overflow-hidden pointer-events-none bg-[#0a0a0a]">
      {/* Static base tone */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 20% 0%, rgba(30,35,45,0.6) 0%, transparent 60%),' +
            'radial-gradient(ellipse 60% 40% at 80% 100%, rgba(25,28,35,0.5) 0%, transparent 60%)',
        }}
      />
      {/* Second tone that slowly crossfades in and out — opacity only */}
      <div
        className="absolute inset-0 motion-safe:animate-[bgDrift_40s_ease-in-out_infinite_alternate]"
        style={{
          opacity: 0,
          willChange: 'opacity',
          background:
            'radial-gradient(ellipse 70% 50% at 70% 10%, rgba(28,32,42,0.55) 0%, transparent 60%),' +
            'radial-gradient(ellipse 80% 60% at 10% 90%, rgba(20,22,30,0.6) 0%, transparent 60%)',
        }}
      />
      {/* Cursor spotlight — a fixed-size circle moved with transform */}
      <div
        ref={spotlightRef}
        className="absolute top-0 left-0 h-[1200px] w-[1200px] rounded-full"
        style={{
          willChange: 'transform',
          background:
            'radial-gradient(circle at center, rgba(255,255,255,0.025) 0%, rgba(200,210,255,0.015) 30%, transparent 60%)',
        }}
      />
      <style>{`
        @keyframes bgDrift {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
