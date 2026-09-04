'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useArticleReducedMotion } from '@/components/article/ArticleProvider'
// components/blog/SwipeNavigation.tsx
// Mobile end-of-article navigation. Listens on the document once the hint cards
// are in view: a deliberate horizontal swipe (threshold + dominant axis) goes to
// the next post (left) or back to the archive (right) via the App Router.

interface SwipeNavigationProps {
  nextPost?: { title: string; slug: string } | null
  prevUrl?: string
}

const THRESHOLD = 80       // px travelled to navigate
const HINT_THRESHOLD = 24  // px travelled to show the hint overlay

export function SwipeNavigation({ nextPost, prevUrl = '/blog' }: SwipeNavigationProps) {
  const router = useRouter()
  const reduced = useArticleReducedMotion()
  const [hint, setHint] = useState<'left' | 'right' | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const armedRef = useRef(false)
  const startRef = useRef<{ x: number; y: number } | null>(null)
  const deltaRef = useRef(0)

  // Only arm swipe handling while the hint cards are on screen.
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => { armedRef.current = entry.isIntersecting }, { threshold: 0.3 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!window.matchMedia('(pointer: coarse)').matches) return

    const onStart = (e: TouchEvent) => {
      if (!armedRef.current) return
      startRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      deltaRef.current = 0
    }
    const onMove = (e: TouchEvent) => {
      const s = startRef.current
      if (!s) return
      const dx = e.touches[0].clientX - s.x
      const dy = e.touches[0].clientY - s.y
      if (Math.abs(dy) > Math.abs(dx) * 1.2) { startRef.current = null; setHint(null); return }
      deltaRef.current = dx
      const next = dx < -HINT_THRESHOLD && nextPost ? 'left' : dx > HINT_THRESHOLD ? 'right' : null
      setHint((h) => (h === next ? h : next))
    }
    const onEnd = () => {
      const dx = deltaRef.current
      const had = !!startRef.current
      startRef.current = null
      setHint(null)
      if (!had) return
      if (dx < -THRESHOLD && nextPost) router.push(`/blog/${nextPost.slug}`)
      else if (dx > THRESHOLD) router.push(prevUrl)
    }

    document.addEventListener('touchstart', onStart, { passive: true })
    document.addEventListener('touchmove', onMove, { passive: true })
    document.addEventListener('touchend', onEnd, { passive: true })
    document.addEventListener('touchcancel', onEnd, { passive: true })
    return () => {
      document.removeEventListener('touchstart', onStart)
      document.removeEventListener('touchmove', onMove)
      document.removeEventListener('touchend', onEnd)
      document.removeEventListener('touchcancel', onEnd)
    }
  }, [nextPost, prevUrl, router])

  return (
    <div ref={rootRef} className="mt-16 lg:hidden" data-print-hide>
      <div className="relative flex items-stretch gap-3">
        <Link
          href={prevUrl}
          className="flex-1 flex flex-col items-start p-4 border border-white/[0.08] rounded-xl bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04] transition-all group focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
        >
          <span className="font-mono text-[8px] uppercase tracking-widest text-stone-500 mb-2 group-hover:text-stone-300 transition-colors">
            ← Swipe right
          </span>
          <span className="font-serif text-sm text-stone-400 group-hover:text-stone-200 transition-colors">
            Back to Archive
          </span>
        </Link>

        {nextPost ? (
          <Link
            href={`/blog/${nextPost.slug}`}
            className="flex-1 flex flex-col items-end text-right p-4 border border-white/[0.08] rounded-xl bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04] transition-all group focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
          >
            <span className="font-mono text-[8px] uppercase tracking-widest text-stone-500 mb-2 group-hover:text-stone-300 transition-colors">
              Swipe left →
            </span>
            <span className="font-serif text-sm text-stone-400 group-hover:text-stone-200 transition-colors line-clamp-2">
              {nextPost.title}
            </span>
          </Link>
        ) : (
          <div className="flex-1 flex flex-col items-end text-right p-4 border border-white/5 rounded-xl opacity-50">
            <span className="font-mono text-[8px] uppercase tracking-widest text-stone-500 mb-2">
              No next post
            </span>
          </div>
        )}
      </div>

      <AnimatePresence>
        {hint && (
          <motion.div
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.15 }}
            className="fixed inset-0 z-30 pointer-events-none flex items-center justify-center"
            aria-hidden="true"
          >
            <div className="px-8 py-4 rounded-2xl font-mono text-sm uppercase tracking-widest text-white backdrop-blur-lg bg-white/10 border border-white/15">
              {hint === 'left' && nextPost
                ? `→ ${nextPost.title.slice(0, 28)}${nextPost.title.length > 28 ? '…' : ''}`
                : '← Archive'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
