'use client'

import { useEffect, useRef } from 'react'
// components/blog/BlogBackground.tsx
//
// Two layers:
// 1. CSS-animated base gradient — slow, 30s cycle, barely perceptible tonal shift
// 2. Mouse-tracking radial spotlight — follows cursor at very low opacity
//
// Both are subtle enough to not distract from content but add enough
// depth that pure-black sections no longer swallow subtle text.

export function BlogBackground() {
  const spotlightRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = spotlightRef.current
    if (!el) return

    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth)  * 100
      const y = (e.clientY / window.innerHeight) * 100
      el.style.setProperty('--x', `${x}%`)
      el.style.setProperty('--y', `${y}%`)
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <>
      {/* ── Layer 1: Slow animated base gradient ─────────────────── */}
      {/* Shifts between near-black with very subtle cool and warm tones */}
      <div
        className="fixed inset-0 -z-20 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 20% 0%,   rgba(30, 35, 45, 0.6) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 80% 100%, rgba(25, 28, 35, 0.5) 0%, transparent 60%),
            radial-gradient(ellipse 100% 80% at 50% 50%, rgba(15, 15, 18, 1)   0%, transparent 100%),
            #0a0a0a
          `,
          animation: 'blogGradientDrift 30s ease-in-out infinite alternate',
        }}
      />

      {/* ── Layer 2: Mouse spotlight ──────────────────────────────── */}
      {/* Extremely subtle warm-white glow that follows the cursor.   */}
      {/* opacity is low enough to be felt but not seen consciously.  */}
      <div
        ref={spotlightRef}
        className="fixed inset-0 -z-10 pointer-events-none"
        style={{
          background: `radial-gradient(
            600px circle at var(--x, 50%) var(--y, 50%),
            rgba(255, 255, 255, 0.025) 0%,
            rgba(200, 210, 255, 0.015) 30%,
            transparent 70%
          )`,
          transition: 'background 0.1s ease-out',
        }}
      />

      {/* ── CSS animation keyframes ───────────────────────────────── */}
      <style>{`
        @keyframes blogGradientDrift {
          0% {
            background:
              radial-gradient(ellipse 80% 60% at 20% 0%,   rgba(30, 35, 45, 0.6) 0%, transparent 60%),
              radial-gradient(ellipse 60% 40% at 80% 100%, rgba(25, 28, 35, 0.5) 0%, transparent 60%),
              radial-gradient(ellipse 100% 80% at 50% 50%, rgba(15, 15, 18, 1)   0%, transparent 100%),
              #0a0a0a;
          }
          33% {
            background:
              radial-gradient(ellipse 70% 50% at 70% 10%,  rgba(28, 32, 42, 0.5) 0%, transparent 60%),
              radial-gradient(ellipse 80% 60% at 10% 90%,  rgba(20, 22, 30, 0.6) 0%, transparent 60%),
              radial-gradient(ellipse 100% 80% at 50% 50%, rgba(15, 15, 18, 1)   0%, transparent 100%),
              #0a0a0a;
          }
          66% {
            background:
              radial-gradient(ellipse 90% 70% at 50% 5%,   rgba(32, 36, 48, 0.4) 0%, transparent 60%),
              radial-gradient(ellipse 60% 50% at 90% 80%,  rgba(22, 24, 32, 0.5) 0%, transparent 60%),
              radial-gradient(ellipse 100% 80% at 50% 50%, rgba(15, 15, 18, 1)   0%, transparent 100%),
              #0a0a0a;
          }
          100% {
            background:
              radial-gradient(ellipse 75% 55% at 30% 15%,  rgba(26, 30, 40, 0.55) 0%, transparent 60%),
              radial-gradient(ellipse 65% 45% at 75% 95%,  rgba(20, 22, 28, 0.5)  0%, transparent 60%),
              radial-gradient(ellipse 100% 80% at 50% 50%, rgba(15, 15, 18, 1)    0%, transparent 100%),
              #0a0a0a;
          }
        }
      `}</style>
    </>
  )
}