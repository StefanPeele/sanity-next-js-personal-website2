'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
// components/CinematicGallery.tsx

export interface GalleryPhoto {
  _id: string
  title?: string | null
  imageUrl?: string | null
  lqip?: string | null
  caption?: string | null
  category?: string | null
  system?: string | null
  lens?: string | null
  aperture?: string | null
  shutter?: string | null
  iso?: string | null
  location?: string | null
  notes?: string | null
}

export default function CinematicGallery({ photos }: { photos: GalleryPhoto[] }) {
  const [activeCategory, setActiveCategory]   = useState('All')
  const [selectedIndex, setSelectedIndex]     = useState<number | null>(null)
  const [isZoomed, setIsZoomed]               = useState(false)
  const [mousePos, setMousePos]               = useState({ x: 0, y: 0 })
  const [isHoveringImage, setIsHoveringImage] = useState(false)
  const [isDeveloping, setIsDeveloping]       = useState(true)

  // Scroll state for fade indicators on category strip
  const [canScrollLeft, setCanScrollLeft]   = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const stripRef = useRef<HTMLDivElement>(null)

  const playShutterSound = () => {
    try {
      const audio = new Audio('/sounds/shutter.mp3')
      audio.volume = 0.4
      audio.play().catch(() => {})
    } catch {
      // silent
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => setIsDeveloping(false), 2500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Check scroll position of category strip for fade indicators
  const checkScroll = () => {
    const el = stripRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 8)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8)
  }

  useEffect(() => {
    const el = stripRef.current
    if (!el) return
    checkScroll()
    el.addEventListener('scroll', checkScroll, { passive: true })
    window.addEventListener('resize', checkScroll)
    return () => {
      el.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [])

  // Re-check after categories load
  const categories = useMemo(() => {
    const cats = photos.map(p => p.category).filter(Boolean) as string[]
    return ['All', ...Array.from(new Set(cats))]
  }, [photos])

  useEffect(() => {
    setTimeout(checkScroll, 100)
  }, [categories])

  const filteredPhotos = useMemo(() => {
    return photos.filter(photo =>
      activeCategory === 'All' ? true : photo.category === activeCategory
    )
  }, [photos, activeCategory])

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: photos.length }
    photos.forEach(p => {
      if (p.category) counts[p.category] = (counts[p.category] || 0) + 1
    })
    return counts
  }, [photos])

  useEffect(() => { setIsZoomed(false) }, [selectedIndex])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIndex === null) return
      if (e.key === 'ArrowRight') setSelectedIndex((prev) => (prev! + 1) % filteredPhotos.length)
      else if (e.key === 'ArrowLeft') setSelectedIndex((prev) => (prev! - 1 + filteredPhotos.length) % filteredPhotos.length)
      else if (e.key === 'Escape') setSelectedIndex(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedIndex, filteredPhotos.length])

  const handleDragEnd = (_e: unknown, { offset }: { offset: { x: number } }) => {
    if (isZoomed || selectedIndex === null) return
    if (offset.x < -50) setSelectedIndex((selectedIndex + 1) % filteredPhotos.length)
    else if (offset.x > 50) setSelectedIndex((selectedIndex - 1 + filteredPhotos.length) % filteredPhotos.length)
  }

  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start end', 'end start'] })
  const yMiddle = useTransform(scrollYProgress, [0, 1], [0, -150])

  const columns = [
    filteredPhotos.filter((_, i) => i % 3 === 0),
    filteredPhotos.filter((_, i) => i % 3 === 1),
    filteredPhotos.filter((_, i) => i % 3 === 2),
  ]

  const handleCategoryClick = (cat: string) => {
    setActiveCategory(cat)
    // Scroll the active pill into view
    const el = stripRef.current
    if (!el) return
    const btn = el.querySelector(`[data-cat="${cat}"]`) as HTMLElement
    if (btn) {
      const offset = btn.offsetLeft - el.clientWidth / 2 + btn.offsetWidth / 2
      el.scrollTo({ left: offset, behavior: 'smooth' })
    }
  }

  return (
    <>
      {/* ── Darkroom loader ───────────────────────────────────────── */}
      <AnimatePresence>
        {isDeveloping && (
          <motion.div
            key="darkroom-loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-red-950/90 backdrop-blur-3xl pointer-events-none"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              className="flex flex-col items-center gap-4"
            >
              <div className="w-12 h-12 border-t-2 border-r-2 border-red-500 rounded-full animate-spin" />
              <p className="text-red-500 font-mono text-xs tracking-[0.5em] uppercase">Developing</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto relative cursor-none sm:cursor-auto">

        {/* ── Custom cursor ─────────────────────────────────────────── */}
        <motion.div
          className="fixed top-0 left-0 w-4 h-4 bg-white rounded-full pointer-events-none z-[110] mix-blend-difference hidden md:flex items-center justify-center text-black font-bold tracking-widest overflow-hidden"
          animate={{
            x: mousePos.x - (isHoveringImage ? 32 : 8),
            y: mousePos.y - (isHoveringImage ? 32 : 8),
            width: isHoveringImage ? 64 : 16,
            height: isHoveringImage ? 64 : 16,
          }}
          transition={{ type: 'tween', ease: 'backOut', duration: 0.3 }}
        >
          <AnimatePresence>
            {isHoveringImage && (
              <motion.span
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="text-[10px]"
              >
                VIEW
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Category strip ────────────────────────────────────────── */}
        {/* Lives here — below the hero section — not floating under the CTAs */}
        <div className="relative mb-12 px-4">

          {/* Left fade */}
          <div className={`absolute left-4 top-0 bottom-0 w-12 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none transition-opacity duration-300 ${canScrollLeft ? 'opacity-100' : 'opacity-0'}`} />
          {/* Right fade */}
          <div className={`absolute right-4 top-0 bottom-0 w-12 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none transition-opacity duration-300 ${canScrollRight ? 'opacity-100' : 'opacity-0'}`} />

          {/* Scrollable strip — no wrapping */}
          <div
            ref={stripRef}
            className="flex items-center gap-1 overflow-x-auto scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {/* Left spacer */}
            <div className="flex-shrink-0 w-2" />

            {categories.map((category) => {
              const isActive = activeCategory === category
              return (
                <button
                  key={category}
                  data-cat={category}
                  onClick={() => handleCategoryClick(category)}
                  className={`relative flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full font-mono text-[10px] uppercase tracking-[0.25em] transition-all duration-300 whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-black'
                      : 'text-stone-400 hover:text-white border border-white/10 hover:border-white/30'
                  }`}
                >
                  {category}
                  {/* Count badge — only on inactive */}
                  {!isActive && (
                    <span className="font-mono text-[8px] text-stone-600">
                      {categoryCounts[category] ?? 0}
                    </span>
                  )}
                </button>
              )
            })}

            {/* Right spacer */}
            <div className="flex-shrink-0 w-2" />
          </div>

          {/* Scroll hint — only shown when there are many categories and user hasn't scrolled */}
          {canScrollRight && !canScrollLeft && (
            <p className="text-center font-mono text-[8px] text-stone-700 uppercase tracking-widest mt-3">
              scroll for more →
            </p>
          )}
        </div>

        {/* ── Masonry grid ──────────────────────────────────────────── */}
        <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start px-4">
          {columns.map((col, colIndex) => (
            <motion.div
              key={`col-${colIndex}`}
              className="flex flex-col gap-6"
              style={{ y: colIndex === 1 ? yMiddle : 0 }}
            >
              <AnimatePresence>
                {col.map((photo) => {
                  const originalIndex = filteredPhotos.findIndex(p => p._id === photo._id)
                  return (
                    <motion.div
                      layout="position"
                      layoutId={`photo-${photo._id}`}
                      initial={{ opacity: 0, y: 50, filter: 'brightness(2) sepia(100%) blur(10px)' }}
                      whileInView={{ opacity: 1, y: 0, filter: 'brightness(1) sepia(0%) blur(0px)' }}
                      viewport={{ once: true, margin: '-50px' }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{
                        layout: { type: 'spring', stiffness: 200, damping: 25 },
                        duration: 1.2,
                        ease: [0.25, 0.46, 0.45, 0.94],
                      }}
                      key={photo._id}
                      className="relative w-full aspect-[3/4] overflow-hidden rounded-xl group cursor-none bg-stone-900 shadow-[0_0_20px_rgba(0,0,0,0.6)] block"
                      onClick={() => {
                        playShutterSound()
                        setSelectedIndex(originalIndex)
                        setIsHoveringImage(false)
                      }}
                      onMouseEnter={() => setIsHoveringImage(true)}
                      onMouseLeave={() => setIsHoveringImage(false)}
                    >
                      {photo.imageUrl && (
                        <>
                          <Image
                            src={photo.imageUrl}
                            alt={photo.caption || photo.title || 'Photography'}
                            fill
                            sizes="(max-width: 768px) 100vw, 33vw"
                            placeholder={photo.lqip ? 'blur' : 'empty'}
                            blurDataURL={photo.lqip || undefined}
                            className="object-cover transform transition-all duration-700 ease-out opacity-60 grayscale-[60%] group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 flex flex-col justify-end p-6 md:p-8">
                            <h2 className="text-white text-2xl md:text-3xl font-serif font-bold translate-y-4 group-hover:translate-y-0 transition-transform duration-500 ease-out drop-shadow-lg">
                              {photo.title}
                            </h2>
                          </div>
                        </>
                      )}
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* ─-─ Lightbox ──────────────────────────────────────────────── */}
        <AnimatePresence>
          {selectedIndex !== null && filteredPhotos[selectedIndex] && (
            <motion.div
              key="lightbox-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex bg-black/95 backdrop-blur-xl cursor-auto"
            >
              <div className="absolute top-6 left-6 md:top-8 md:left-8 text-stone-500 font-mono text-xs tracking-[0.3em] z-50 mix-blend-difference">
                {(selectedIndex + 1).toString().padStart(2, '0')} — {filteredPhotos.length.toString().padStart(2, '0')}
              </div>

              <button
                className="absolute top-6 right-6 md:top-8 md:right-8 text-stone-500 hover:text-white transition-colors p-2 z-50 group"
                onClick={() => setSelectedIndex(null)}
              >
                <svg className="w-8 h-8 group-hover:rotate-90 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="flex flex-col md:flex-row w-full h-full">
                {/* Image side */}
                <div
                  className="flex-1 relative flex items-center justify-center p-4 md:p-12 h-[60vh] md:h-full overflow-hidden"
                  onClick={() => setSelectedIndex(null)}
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedIndex((selectedIndex - 1 + filteredPhotos.length) % filteredPhotos.length) }}
                    className="absolute left-4 md:left-8 p-4 text-stone-600 hover:text-white transition-colors hidden sm:block z-20"
                  >
                    <svg className="w-8 h-8 md:w-12 md:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  <motion.div
                    key={selectedIndex}
                    drag={isZoomed ? true : 'x'}
                    dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                    dragElastic={isZoomed ? 0.4 : 0.8}
                    onDragEnd={handleDragEnd}
                    initial={{ opacity: 0, filter: 'blur(10px)', scale: 0.95 }}
                    animate={{
                      opacity: 1,
                      filter: 'blur(0px)',
                      scale: isZoomed ? 2.5 : [1, 1.05],
                      x: isZoomed ? 0 : [0, 15],
                    }}
                    exit={{ opacity: 0, filter: 'blur(10px)', scale: 1, transition: { duration: 0.3 } }}
                    transition={{
                      opacity: { duration: 0.4 },
                      filter: { duration: 0.4 },
                      scale: isZoomed
                        ? { type: 'spring', stiffness: 300, damping: 25 }
                        : { duration: 20, ease: 'linear', repeat: Infinity, repeatType: 'reverse' },
                      x: isZoomed
                        ? { type: 'spring', stiffness: 300, damping: 25 }
                        : { duration: 20, ease: 'linear', repeat: Infinity, repeatType: 'reverse' },
                    }}
                    className={`relative w-full h-full flex items-center justify-center z-10 origin-center ${isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
                    onClick={(e) => { e.stopPropagation(); setIsZoomed(!isZoomed) }}
                  >
                    {filteredPhotos[selectedIndex].imageUrl && (
                      <img
                        src={filteredPhotos[selectedIndex].imageUrl!}
                        alt={filteredPhotos[selectedIndex].title || 'Gallery image'}
                        className="max-w-full max-h-full object-contain drop-shadow-[0_0_40px_rgba(0,0,0,0.8)] pointer-events-none"
                      />
                    )}
                  </motion.div>

                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedIndex((selectedIndex + 1) % filteredPhotos.length) }}
                    className="absolute right-4 md:right-8 p-4 text-stone-600 hover:text-white transition-colors hidden sm:block z-20"
                  >
                    <svg className="w-8 h-8 md:w-12 md:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                {/* Metadata side */}
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="w-full md:w-[400px] lg:w-[450px] bg-stone-950/80 border-l border-white/5 p-8 md:p-12 flex flex-col justify-center shrink-0 h-[40vh] md:h-full overflow-y-auto"
                >
                  <div className="space-y-8">
                    <div>
                      {filteredPhotos[selectedIndex].category && (
                        <span className="text-stone-500 text-xs font-bold uppercase tracking-[0.3em] block mb-4">
                          {filteredPhotos[selectedIndex].category}
                        </span>
                      )}
                      <h3 className="text-white text-3xl md:text-5xl font-serif tracking-wide leading-tight">
                        {filteredPhotos[selectedIndex].title}
                      </h3>
                    </div>

                    {filteredPhotos[selectedIndex].caption && (
                      <p className="text-stone-400 font-sans text-sm md:text-base leading-relaxed tracking-wide">
                        {filteredPhotos[selectedIndex].caption}
                      </p>
                    )}

                    <div className="pt-8 mt-8 border-t border-white/10 space-y-5">
                      <p className="text-stone-600 text-[10px] uppercase tracking-[0.2em] font-semibold">
                        Technical Profile
                      </p>
                      <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                        {[
                          { label: 'Aperture', value: filteredPhotos[selectedIndex].aperture, icon: <circle cx="12" cy="12" r="10" strokeWidth="1" />, span: false },
                          { label: 'Shutter',  value: filteredPhotos[selectedIndex].shutter,  icon: <><circle cx="12" cy="12" r="10" strokeWidth="1" strokeDasharray="4 4" /><path d="M12 12L16 8" strokeWidth="1.5" strokeLinecap="round" /></>, span: false },
                          { label: 'Film / ISO', value: filteredPhotos[selectedIndex].iso,    icon: <><rect x="4" y="4" width="16" height="16" rx="2" strokeWidth="1" /><path d="M8 12h8M12 8v8" strokeWidth="1" opacity="0.5" /></>, span: false },
                          { label: 'System',   value: filteredPhotos[selectedIndex].system,   icon: <path d="M4 8V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2M4 8v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8M4 8h16M12 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />, span: false },
                          { label: 'Lens / Gear', value: filteredPhotos[selectedIndex].lens,  icon: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>, span: true },
                          { label: 'Location', value: filteredPhotos[selectedIndex].location,  icon: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></>, span: true },
                        ].map(({ label, value, icon, span }) => (
                          <div key={label} className={`flex items-center gap-3 text-stone-300 ${span ? 'col-span-2' : ''}`}>
                            <svg className="w-5 h-5 text-stone-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              {icon}
                            </svg>
                            <div className="flex flex-col truncate">
                              <span className="text-[9px] text-stone-600 tracking-widest uppercase">{label}</span>
                              <span className="text-sm font-mono tracking-tight truncate">{value || '---'}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {filteredPhotos[selectedIndex].notes && (
                        <div className="pt-4 mt-4 border-t border-white/5">
                          <span className="text-[9px] text-stone-600 tracking-widest uppercase mb-2 block">
                            Field Notes
                          </span>
                          <p className="text-stone-400 font-mono text-xs leading-relaxed italic">
                            "{filteredPhotos[selectedIndex].notes}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}