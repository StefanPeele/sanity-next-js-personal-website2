'use client'

import { useEffect, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { articleTypeMeta } from '@/lib/site'
import { useArticleReducedMotion } from '@/components/article/ArticleProvider'
import { heroImageUrl } from '@/components/article/heroImage'
// components/blog/BlogArticleHeader.tsx
// Parallax article hero. The h1 and metadata are fully visible in server HTML —
// motion only ever adds to what is already rendered. Parallax and the atmospheric
// colour sample are skipped under reduced motion.

interface BlogArticleHeaderProps {
  title: string
  /** Already formatted with lib/dates formatDate. */
  publishDate: string
  readTime: number
  categories: string[]
  articleType?: string | null
  mainImageUrl?: string | null
  mainImageAlt?: string | null
  lqip?: string | null
  sourceCount?: number
  conceptCardCount?: number
  reviewStatus?: string | null
}

const TYPE_ICON: Record<string, string> = {
  'perspective': '🔭',
  'concept-deep-dive': '⚡',
  'field-notes': '🔧',
  'transmission': '📡',
}

/** Average colour of the LQIP — tiny base64 image, no CORS involved. */
function sampleAtmosphereColor(lqip: string): Promise<[number, number, number]> {
  return new Promise((resolve) => {
    const img = new window.Image()
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = 4
        canvas.height = 4
        const ctx = canvas.getContext('2d')
        if (!ctx) return resolve([10, 10, 10])
        ctx.drawImage(img, 0, 0, 4, 4)
        const d = ctx.getImageData(2, 2, 1, 1).data
        resolve([d[0], d[1], d[2]])
      } catch {
        resolve([10, 10, 10])
      }
    }
    img.onerror = () => resolve([10, 10, 10])
    img.src = lqip
  })
}

export function BlogArticleHeader({
  title,
  publishDate,
  readTime,
  categories,
  articleType,
  mainImageUrl,
  mainImageAlt,
  lqip,
  sourceCount = 0,
  conceptCardCount = 0,
  reviewStatus,
}: BlogArticleHeaderProps) {
  const reduced = useArticleReducedMotion()
  const [atmosphere, setAtmosphere] = useState<[number, number, number]>([10, 10, 10])

  const { scrollY } = useScroll()
  const imageY = useTransform(scrollY, [0, 700], [0, reduced ? 0 : 180])
  const contentY = useTransform(scrollY, [0, 700], [0, reduced ? 0 : -60])
  const headerOpacity = useTransform(scrollY, [0, 400], [1, reduced ? 1 : 0])

  useEffect(() => {
    if (!lqip) return
    let cancelled = false
    sampleAtmosphereColor(lqip).then((c) => { if (!cancelled) setAtmosphere(c) })
    return () => { cancelled = true }
  }, [lqip])

  const typeMeta = articleTypeMeta(articleType)
  const [r, g, b] = atmosphere

  const reviewBadge = reviewStatus === 'seeking-review'
    ? { label: 'Seeking Review', className: 'text-amber-400 border-amber-500/30' }
    : reviewStatus === 'expert-verified'
    ? { label: 'Expert Verified', className: 'text-emerald-400 border-emerald-500/30' }
    : null

  const metaItems = [
    publishDate,
    `${readTime} min read`,
    ...(sourceCount > 0 ? [`${sourceCount} source${sourceCount !== 1 ? 's' : ''}`] : []),
    ...(conceptCardCount > 0 ? [`${conceptCardCount} cards`] : []),
  ]

  const reveal = (delay: number) => reduced
    ? {}
    : { initial: { opacity: 0.6, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay } }

  return (
    <motion.header
      style={{ opacity: headerOpacity }}
      className="relative w-full min-h-[68vh] md:min-h-[75vh] flex items-end justify-center pb-16 md:pb-24 border-b border-white/5 overflow-hidden"
    >
      <div
        className="absolute inset-0 z-0 transition-colors duration-1000"
        style={{ background: `radial-gradient(ellipse at 50% 30%, rgba(${r},${g},${b},0.18) 0%, transparent 70%)` }}
        aria-hidden="true"
      />

      {mainImageUrl && (
        <motion.div className="absolute inset-0 z-0" style={{ y: imageY }} aria-hidden={!mainImageAlt}>
          <div className="absolute inset-0 scale-[1.15]">
            <Image
              src={heroImageUrl(mainImageUrl)}
              alt={mainImageAlt ?? ''}
              fill
              priority
              unoptimized
              sizes="100vw"
              placeholder={lqip ? 'blur' : 'empty'}
              blurDataURL={lqip ?? undefined}
              className="object-cover"
              style={{ filter: 'grayscale(55%) contrast(110%) brightness(0.7)' }}
            />
          </div>
        </motion.div>
      )}

      <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/70 to-transparent" aria-hidden="true" />
      <div
        className="absolute bottom-0 left-0 right-0 h-1/3 z-10"
        style={{ background: `linear-gradient(to top, rgba(${r},${g},${b},0.06), transparent)` }}
        aria-hidden="true"
      />

      <motion.div className="relative z-20 w-full max-w-3xl px-6 mx-auto text-center pt-32" style={{ y: contentY }}>
        <Link
          href="/blog"
          className="text-stone-400 hover:text-white font-mono text-[10px] uppercase tracking-[0.3em] transition-colors mb-8 inline-block focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 rounded-sm"
        >
          ← Return to Archive
        </Link>

        <motion.div {...reveal(0.05)} className="flex flex-wrap gap-2 justify-center mb-5">
          {typeMeta && (
            <span
              className="font-mono text-[9px] uppercase tracking-[0.3em] px-3 py-1.5 rounded-sm border backdrop-blur-md bg-black/20"
              style={{ color: typeMeta.color, borderColor: typeMeta.bg.replace('0.12', '0.4') }}
            >
              {TYPE_ICON[articleType ?? ''] ?? ''} {typeMeta.label}
            </span>
          )}
          {reviewBadge && (
            <span className={`font-mono text-[9px] uppercase tracking-[0.3em] px-3 py-1.5 rounded-sm border backdrop-blur-md bg-black/20 ${reviewBadge.className}`}>
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

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white mb-6 leading-tight tracking-tight">
          {title}
        </h1>

        <motion.div
          {...reveal(0.25)}
          className="flex items-center justify-center gap-3 font-mono text-[10px] text-stone-400 uppercase tracking-widest flex-wrap"
        >
          {metaItems.map((item, i) => (
            <span key={item} className="flex items-center gap-3">
              {i > 0 && <span className="text-stone-600" aria-hidden="true">·</span>}
              {item}
            </span>
          ))}
        </motion.div>
      </motion.div>

      <div
        className="absolute bottom-0 left-0 right-0 h-px z-20"
        style={{ background: `linear-gradient(to right, transparent, rgba(${r},${g},${b},0.4), transparent)` }}
        aria-hidden="true"
      />
    </motion.header>
  )
}
