'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
// components/blog/SwipeNavigation.tsx
// Detects horizontal swipe at the end of an article on mobile.
// Left swipe → next post. Right swipe → back to /blog.
// Also renders visible swipe hint cards for discoverability.

interface SwipeNavigationProps {
  nextPost?: { title: string; slug: string } | null
  prevUrl?: string
}

export function SwipeNavigation({ nextPost, prevUrl = '/blog' }: SwipeNavigationProps) {
  const [swipeX, setSwipeX]         = useState(0)
  const [swiping, setSwiping]       = useState(false)
  const [hint, setHint]             = useState<'left' | 'right' | null>(null)
  const touchStartX                  = useRef(0)
  const touchStartY                  = useRef(0)
  const THRESHOLD                    = 60 // px to trigger navigation
  const HINT_THRESHOLD               = 20 // px to show hint

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    setSwiping(false)
    setSwipeX(0)
    setHint(null)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - touchStartX.current
    const dy = e.touches[0].clientY - touchStartY.current

    // Only process horizontal swipes (ignore vertical scroll)
    if (Math.abs(dy) > Math.abs(dx) * 1.5) return

    setSwiping(true)
    setSwipeX(dx)

    if (dx < -HINT_THRESHOLD && nextPost) setHint('left')
    else if (dx > HINT_THRESHOLD) setHint('right')
    else setHint(null)
  }

  const handleTouchEnd = () => {
    if (!swiping) return

    if (swipeX < -THRESHOLD && nextPost) {
      window.location.href = `/blog/${nextPost.slug}`
    } else if (swipeX > THRESHOLD) {
      window.location.href = prevUrl
    }

    setSwiping(false)
    setSwipeX(0)
    setHint(null)
  }

  return (
    <div
      className="mt-16 lg:hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Visual swipe hint cards */}
      <div className="relative flex items-stretch gap-3">

        {/* Back to blog (swipe right) */}
        <a
          href={prevUrl}
          className="flex-1 flex flex-col items-start p-4 border border-white/[0.08] rounded-xl bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04] transition-all group"
        >
          <span className="font-mono text-[8px] uppercase tracking-widest text-stone-700 mb-2 group-hover:text-stone-500 transition-colors">
            ← Swipe right
          </span>
          <span className="font-serif text-sm text-stone-400 group-hover:text-stone-200 transition-colors">
            Back to Archive
          </span>
        </a>

        {/* Next post (swipe left) */}
        {nextPost ? (
          <a
            href={`/blog/${nextPost.slug}`}
            className="flex-1 flex flex-col items-end text-right p-4 border border-white/[0.08] rounded-xl bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04] transition-all group"
          >
            <span className="font-mono text-[8px] uppercase tracking-widest text-stone-700 mb-2 group-hover:text-stone-500 transition-colors">
              Swipe left →
            </span>
            <span className="font-serif text-sm text-stone-400 group-hover:text-stone-200 transition-colors line-clamp-2">
              {nextPost.title}
            </span>
          </a>
        ) : (
          <div className="flex-1 flex flex-col items-end text-right p-4 border border-white/5 rounded-xl opacity-30">
            <span className="font-mono text-[8px] uppercase tracking-widest text-stone-700 mb-2">
              No next post
            </span>
          </div>
        )}
      </div>

      {/* Swipe feedback overlay */}
      <AnimatePresence>
        {hint && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-30 pointer-events-none flex items-center justify-center"
          >
            <div className={`px-8 py-4 rounded-2xl font-mono text-sm uppercase tracking-widest text-white backdrop-blur-lg ${
              hint === 'left' ? 'bg-white/10 border border-white/15' : 'bg-white/10 border border-white/15'
            }`}>
              {hint === 'left' && nextPost ? `→ ${nextPost.title.slice(0, 28)}${nextPost.title.length > 28 ? '…' : ''}` : '← Archive'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}