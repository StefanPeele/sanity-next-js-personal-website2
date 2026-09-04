'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import Link from 'next/link'
// components/blog/BlogArticleHeader.tsx
// Full cinematic parallax header with atmospheric color sampling from cover image.

const ARTICLE_TYPE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  'perspective':       { label: 'Perspective',       icon: '🔭', color: 'text-violet-400 border-violet-500/30' },
  'concept-deep-dive': { label: 'Concept Deep Dive', icon: '⚡', color: 'text-amber-400  border-amber-500/30' },
  'field-notes':       { label: 'Field Notes',       icon: '🔧', color: 'text-emerald-400 border-emerald-500/30' },
  'transmission':      { label: 'Transmission',      icon: '📡', color: 'text-blue-400   border-blue-500/30' },
}

interface BlogArticleHeaderProps {
  title: string
  publishDate: string
  readTime: number
  categories: string[]
  articleType?: string
  mainImage?: any
  mainImageUrl?: string
  lqip?: string
  sourceCount?: number
  conceptCardCount?: number
  reviewStatus?: string
}

// Sample dominant color from a tiny canvas render of the image
// Uses the LQIP (base64 blur placeholder) to avoid CORS entirely
function sampleAtmosphereColor(lqip: string | undefined, imageUrl: string | undefined): Promise<[number, number, number]> {
  return new Promise((resolve) => {
    const src = lqip ?? imageUrl
    if (!src) return resolve([10, 10, 10])

    const img = new Image()
    if (!lqip && imageUrl) img.crossOrigin = 'anonymous'

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width  = 4
        canvas.height = 4
        const ctx = canvas.getContext('2d')
        if (!ctx) return resolve([10, 10, 10])
        ctx.drawImage(img, 0, 0, 4, 4)
        // Sample center pixel
        const d = ctx.getImageData(2, 2, 1, 1).data
        resolve([d[0], d[1], d[2]])
      } catch {
        resolve([10, 10, 10])
      }
    }
    img.onerror = () => resolve([10, 10, 10])
    img.src = lqip ? lqip : `${imageUrl}?w=4&h=4&fit=crop`
  })
}

export function BlogArticleHeader({
  title,
  publishDate,
  readTime,
  categories,
  articleType,
  mainImageUrl,
  lqip,
  sourceCount = 0,
  conceptCardCount = 0,
  reviewStatus,
}: BlogArticleHeaderProps) {
  const headerRef = useRef<HTMLElement>(null)
  const [atmosphere, setAtmosphere] = useState<[number, number, number]>([10, 10, 10])
  const [metaVisible, setMetaVisible] = useState(false)

  const { scrollY } = useScroll()

  // Parallax: image moves down slower than scroll — creates depth
  const imageY       = useTransform(scrollY, [0, 700], [0, 180])
  // Content stays mostly in place as hero scrolls away
  const contentY     = useTransform(scrollY, [0, 700], [0, -60])
  // Header fades out as you scroll into the article
  const headerOpacity = useTransform(scrollY, [0, 400], [1, 0])

  // Sample atmospheric color from cover image
  useEffect(() => {
    sampleAtmosphereColor(lqip, mainImageUrl).then(setAtmosphere)
  }, [lqip, mainImageUrl])

  // Staggered metadata reveal on mount
  useEffect(() => {
    const t = setTimeout(() => setMetaVisible(true), 200)
    return () => clearTimeout(t)
  }, [])

  const typeConfig = articleType ? ARTICLE_TYPE_CONFIG[articleType] : null
  const [r, g, b]  = atmosphere

  const reviewBadge = reviewStatus === 'seeking-review'
    ? { label: 'Seeking Review', color: 'text-amber-400 border-amber-500/30' }
    : reviewStatus === 'expert-verified'
    ? { label: 'Expert Verified', color: 'text-emerald-400 border-emerald-500/30' }
    : null

  const META_ITEMS = [
    { value: publishDate, label: null },
    { value: `${readTime} min read`, label: null },
    ...(sourceCount > 0 ? [{ value: `${sourceCount} source${sourceCount !== 1 ? 's' : ''}`, label: null }] : []),
    ...(conceptCardCount > 0 ? [{ value: `${conceptCardCount} cards`, label: null }] : []),
  ]

  return (
    <motion.header
      ref={headerRef}
      style={{ opacity: headerOpacity }}
      className="relative w-full h-[68vh] md:h-[75vh] flex items-end justify-center pb-16 md:pb-24 border-b border-white/5 overflow-hidden"
    >
      {/* ── Atmospheric glow behind image ────────────────────────── */}
      <div
        className="absolute inset-0 z-0 transition-colors duration-1000"
        style={{
          background: `radial-gradient(ellipse at 50% 30%, rgba(${r},${g},${b},0.18) 0%, transparent 70%)`,
        }}
      />

      {/* ── Parallax cover image ──────────────────────────────────── */}
      {mainImageUrl && (
        <motion.div
          className="absolute inset-0 z-0"
          style={{ y: imageY }}
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${mainImageUrl})`,
              filter: 'grayscale(55%) contrast(110%) brightness(0.7)',
              transform: 'scale(1.15)', // overshoot so parallax doesn't show edges
            }}
          />
        </motion.div>
      )}

      {/* ── Gradient overlay — bottom heavy so content is readable ── */}
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/70 to-transparent" />

      {/* ── Atmospheric tint from image color ─────────────────────── */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1/3 z-10"
        style={{
          background: `linear-gradient(to top, rgba(${r},${g},${b},0.06), transparent)`,
        }}
      />

      {/* ── Content ───────────────────────────────────────────────── */}
      <motion.div
        className="relative z-20 w-full max-w-3xl px-6 mx-auto text-center"
        style={{ y: contentY }}
      >
        {/* Back link */}
        <Link
          href="/blog"
          className="text-stone-500 hover:text-white font-mono text-[10px] uppercase tracking-[0.3em] transition-colors mb-8 inline-block"
        >
          ← Return to Archive
        </Link>

        {/* Staggered badge row */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={metaVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="flex flex-wrap gap-2 justify-center mb-5"
        >
          {typeConfig && (
            <span className={`font-mono text-[9px] uppercase tracking-[0.3em] px-3 py-1.5 rounded-sm border backdrop-blur-md bg-black/20 ${typeConfig.color}`}>
              {typeConfig.icon} {typeConfig.label}
            </span>
          )}
          {reviewBadge && (
            <span className={`font-mono text-[9px] uppercase tracking-[0.3em] px-3 py-1.5 rounded-sm border backdrop-blur-md bg-black/20 ${reviewBadge.color}`}>
              {reviewBadge.label}
            </span>
          )}
          {categories.map((cat) => (
            <span
              key={cat}
              className="text-stone-400 font-mono text-[9px] tracking-[0.2em] uppercase border border-stone-700 px-3 py-1 rounded-sm backdrop-blur-md bg-black/20"
            >
              {cat}
            </span>
          ))}
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={metaVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white mb-6 leading-tight tracking-tight"
        >
          {title}
        </motion.h1>

        {/* Staggered metadata row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={metaVisible ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="flex items-center justify-center gap-3 font-mono text-[10px] text-stone-400 uppercase tracking-widest flex-wrap"
        >
          {META_ITEMS.map((item, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 4 }}
              animate={metaVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.35 + i * 0.1 }}
              className="flex items-center gap-3"
            >
              {i > 0 && <span className="text-stone-700">·</span>}
              {item.value}
            </motion.span>
          ))}
        </motion.div>
      </motion.div>

      {/* ── Atmospheric bottom line ───────────────────────────────── */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-px z-20"
        style={{
          background: `linear-gradient(to right, transparent, rgba(${r},${g},${b},0.4), transparent)`,
        }}
      />
    </motion.header>
  )
}