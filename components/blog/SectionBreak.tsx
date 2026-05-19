'use client'

import { motion } from 'framer-motion'
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

  if (style === 'subtle') {
    return (
      <div className="my-16 flex items-center gap-6">
        <div className="flex-1 h-px bg-white/8" />
        <div className="text-center">
          <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-stone-600 block mb-1">
            Next
          </span>
          <span className="font-serif text-stone-400 text-base">{title}</span>
        </div>
        <div className="flex-1 h-px bg-white/8" />
      </div>
    )
  }

  // Cinematic style
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="my-20 -mx-6 px-6 py-16 relative overflow-hidden"
    >
      {/* Background texture */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,1) 0px, rgba(255,255,255,1) 1px, transparent 1px, transparent 12px)',
        }}
      />

      {/* Top rule */}
      <div className="flex items-center gap-4 mb-8">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <span className="font-mono text-[9px] uppercase tracking-[0.5em] text-stone-700">
          Section
        </span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>

      {/* Title */}
      <div className="text-center space-y-4 relative z-10">
        <h2 className="font-serif text-3xl md:text-4xl text-white font-bold tracking-tight leading-tight">
          {title}
        </h2>
        {teaser && (
          <p className="font-mono text-[11px] text-stone-500 uppercase tracking-[0.2em] max-w-md mx-auto leading-relaxed">
            {teaser}
          </p>
        )}
      </div>

      {/* Bottom rule */}
      <div className="flex items-center gap-4 mt-8">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="w-1 h-1 rounded-full bg-white/20" />
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>
    </motion.div>
  )
}
