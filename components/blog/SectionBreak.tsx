'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { useArticleReducedMotion } from '@/components/article/ArticleProvider'
import { HeadingAnchor } from '@/components/article/HeadingAnchor'
// components/blog/SectionBreak.tsx
// Chapter card between major acts of an article. The cinematic variant renders a
// real h2 (with the id assigned by CustomPortableText) so it joins the TOC.

interface SectionBreakProps {
  value: {
    title: string
    teaser?: string
    style?: 'subtle' | 'cinematic'
  }
  id?: string
  words?: number
}

export function SectionBreak({ value, id, words }: SectionBreakProps) {
  const { title, teaser, style = 'cinematic' } = value
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-20% 0px -20% 0px' })
  const reduced = useArticleReducedMotion()
  // With reduced motion everything is simply visible; no reveal.
  const show = reduced || inView
  const dur = (d: number) => (reduced ? 0 : d)

  if (style === 'subtle') {
    return (
      <div className="my-16 flex items-center gap-6" role="separator" aria-label={`Next: ${title}`}>
        <div className="flex-1 h-px bg-white/[0.08]" />
        <div className="text-center">
          <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-stone-400 block mb-1">
            Next
          </span>
          <span className="font-serif text-stone-400 text-base">{title}</span>
        </div>
        <div className="flex-1 h-px bg-white/[0.08]" />
      </div>
    )
  }

  return (
    <div
      ref={ref}
      className="my-0 -mx-6 relative overflow-hidden"
      style={{ minHeight: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.012) 0px, rgba(255,255,255,0.012) 1px, transparent 1px, transparent 14px)',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/80 via-transparent to-[#0a0a0a]/80" />

      <div className="relative z-10 px-8 py-16 w-full max-w-2xl mx-auto text-center">
        <motion.div
          className="h-px bg-gradient-to-r from-transparent via-white/30 to-transparent mb-10 mx-auto"
          initial={reduced ? false : { width: '0%', opacity: 0 }}
          animate={show ? { width: '100%', opacity: 1 } : {}}
          transition={{ duration: dur(0.9), ease: [0.25, 0.46, 0.45, 0.94] }}
        />

        <motion.span
          initial={reduced ? false : { opacity: 0, letterSpacing: '0.2em' }}
          animate={show ? { opacity: 1, letterSpacing: '0.5em' } : {}}
          transition={{ duration: dur(0.8), delay: dur(0.3) }}
          className="font-mono text-[9px] uppercase text-stone-400 block mb-5"
        >
          Chapter
        </motion.span>

        <motion.h2
          id={id}
          data-words={words}
          data-heading-text={title}
          initial={reduced ? false : { opacity: 0, y: 20 }}
          animate={show ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: dur(0.7), delay: dur(0.4), ease: 'easeOut' }}
          className="group font-serif text-3xl md:text-4xl text-white font-bold tracking-tight leading-tight mb-4 scroll-mt-28"
        >
          {title}
          {id && <HeadingAnchor id={id} />}
        </motion.h2>

        {teaser && (
          <motion.p
            initial={reduced ? false : { opacity: 0, y: 10 }}
            animate={show ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: dur(0.6), delay: dur(0.55) }}
            className="font-mono text-[11px] text-stone-400 uppercase tracking-[0.2em] max-w-sm mx-auto leading-relaxed"
          >
            {teaser}
          </motion.p>
        )}

        <motion.div
          className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mt-10 mx-auto"
          initial={reduced ? false : { width: '0%', opacity: 0 }}
          animate={show ? { width: '60%', opacity: 1 } : {}}
          transition={{ duration: dur(0.7), delay: dur(0.7), ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}
