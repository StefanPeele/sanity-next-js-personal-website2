'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
// components/blog/SectionBreak.tsx

interface SectionBreakProps {
  value: {
    title: string
    teaser?: string
    style?: 'subtle' | 'cinematic'
  }
}

export function SectionBreak({ value }: SectionBreakProps) {
  const { title, teaser, style = 'cinematic' } = value
  const ref    = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-20% 0px -20% 0px' })

  if (style === 'subtle') {
    return (
      <div className="my-16 flex items-center gap-6">
        <div className="flex-1 h-px bg-white/[0.08]" />
        <div className="text-center">
          <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-stone-600 block mb-1">
            Next
          </span>
          <span className="font-serif text-stone-400 text-base">{title}</span>
        </div>
        <div className="flex-1 h-px bg-white/[0.08]" />
      </div>
    )
  }

  // Cinematic — full dramatic pause that feels like a chapter card
  return (
    <div
      ref={ref}
      className="my-0 -mx-6 relative overflow-hidden"
      style={{ minHeight: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      {/* Background texture */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.012) 0px, rgba(255,255,255,0.012) 1px, transparent 1px, transparent 14px)',
        }}
      />

      {/* Subtle vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/80 via-transparent to-[#0a0a0a]/80" />

      <div className="relative z-10 px-8 py-16 w-full max-w-2xl mx-auto text-center">

        {/* Top animated line — draws left to right on scroll into view */}
        <motion.div
          className="h-px bg-gradient-to-r from-transparent via-white/30 to-transparent mb-10 mx-auto"
          initial={{ width: '0%', opacity: 0 }}
          animate={inView ? { width: '100%', opacity: 1 } : {}}
          transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
        />

        {/* Section label */}
        <motion.span
          initial={{ opacity: 0, letterSpacing: '0.2em' }}
          animate={inView ? { opacity: 1, letterSpacing: '0.5em' } : {}}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="font-mono text-[9px] uppercase text-stone-600 block mb-5"
        >
          Chapter
        </motion.span>

        {/* Section title */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.4, ease: 'easeOut' }}
          className="font-serif text-3xl md:text-4xl text-white font-bold tracking-tight leading-tight mb-4"
        >
          {title}
        </motion.h2>

        {/* Teaser */}
        {teaser && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="font-mono text-[11px] text-stone-500 uppercase tracking-[0.2em] max-w-sm mx-auto leading-relaxed"
          >
            {teaser}
          </motion.p>
        )}

        {/* Bottom animated line */}
        <motion.div
          className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mt-10 mx-auto"
          initial={{ width: '0%', opacity: 0 }}
          animate={inView ? { width: '60%', opacity: 1 } : {}}
          transition={{ duration: 0.7, delay: 0.7, ease: 'easeOut' }}
        />

        {/* Scroll hint dot */}
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="mt-6 flex justify-center"
        >
          <div className="w-1 h-1 rounded-full bg-white/20" />
        </motion.div>
      </div>
    </div>
  )
}