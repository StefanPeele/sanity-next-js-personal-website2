'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { useArticleReducedMotion } from '@/components/article/ArticleProvider'
import { HeadingAnchor } from '@/components/article/HeadingAnchor'
import { enumKey } from '@/lib/stega'
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
  // enumKey: `style` here is the sectionBreak object's own field, not a Portable Text
  // block style (those measure clean). Encoded, it is neither 'subtle' nor 'cinematic', so a
  // break the author set to subtle rendered as the full cinematic card in every preview.
  const { title, teaser } = value
  const style = enumKey(value.style) ?? 'cinematic'
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-20% 0px -20% 0px' })
  const reduced = useArticleReducedMotion()
  // With reduced motion everything is simply visible; no reveal.
  const show = reduced || inView
  const dur = (d: number) => (reduced ? 0 : d)

  if (style === 'subtle') {
    // A short centred rule with real air around it — the pacing device Craig Mod and
    // Maggie Appleton both use to mark a beat. It replaced two full-width flanking rules
    // and a 9px "Next" eyebrow: the rules read as a divider rather than a pause, and the
    // eyebrow was below the 12px floor.
    return (
      <div className="mt-20 mb-[4.5rem] text-center" role="separator" aria-label={title ? `Next: ${title}` : 'Section break'}>
        <div className="mx-auto h-px w-24 bg-white/[0.18]" />
        {title && <p className="mt-7 font-serif italic text-stone-300 text-[1.05em]">{title}</p>}
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
          className="meta-label text-stone-400 block mb-5"
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
            className="meta-label text-stone-400 max-w-sm mx-auto leading-relaxed"
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
