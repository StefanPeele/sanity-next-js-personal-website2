'use client'

// components/CinematicGallery.tsx
// Masonry grid + accessible lightbox. Tiles are buttons; the lightbox is a
// modal dialog with a focus trap, arrow-key navigation and Escape to close.
// The "Developing" overlay is skippable and capped at 900ms under reduced motion.

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { FOCUS } from '@/lib/ui'

export interface GalleryPhoto {
  _id: string
  title?: string | null
  alt?: string | null
  imageUrl?: string | null
  lqip?: string | null
  caption?: string | null
  category?: string | null
  system?: string | null
  lens?: string | null
  aperture?: string | null
  shutter?: string | null
  iso?: string | null
  focalLength?: string | null
  location?: string | null
  notes?: string | null
}

interface CinematicGalleryProps {
  photos: GalleryPhoto[]
  /** Show the red "Developing" intro once on mount. Default true. */
  developing?: boolean
}

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'

function lightboxSrc(url: string): string {
  return `${url}${url.includes('?') ? '&' : '?'}w=2000&auto=format`
}

export default function CinematicGallery({ photos, developing = true }: CinematicGalleryProps) {
  const reduceMotion = useReducedMotion()
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [isZoomed, setIsZoomed] = useState(false)
  const [isDeveloping, setIsDeveloping] = useState(developing)
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const lastTileRef = useRef<HTMLElement | null>(null)
  const titleId = useId()

  // ── Developing overlay: auto-dismiss, skippable ───────────────
  useEffect(() => {
    if (!isDeveloping) return
    const timer = setTimeout(() => setIsDeveloping(false), reduceMotion ? 600 : 2000)
    const skip = (e: KeyboardEvent) => { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') setIsDeveloping(false) }
    window.addEventListener('keydown', skip)
    return () => { clearTimeout(timer); window.removeEventListener('keydown', skip) }
  }, [isDeveloping, reduceMotion])

  const count = photos.length
  const current = selectedIndex !== null ? photos[selectedIndex] : undefined

  const close = useCallback(() => {
    setSelectedIndex(null)
    setIsZoomed(false)
  }, [])
  const next = useCallback(() => { setIsZoomed(false); setSelectedIndex((i) => (i === null ? i : (i + 1) % count)) }, [count])
  const prev = useCallback(() => { setIsZoomed(false); setSelectedIndex((i) => (i === null ? i : (i - 1 + count) % count)) }, [count])

  const open = (index: number, el: HTMLElement) => {
    lastTileRef.current = el
    setIsZoomed(false)
    setSelectedIndex(index)
  }

  // ── Lightbox keyboard handling + focus trap ───────────────────
  useEffect(() => {
    if (selectedIndex === null) return
    const previouslyFocused = lastTileRef.current
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); next() }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); prev() }
      else if (e.key === 'Escape') { e.preventDefault(); close() }
      else if (e.key === 'Tab') {
        const root = dialogRef.current
        if (!root) return
        const items = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null)
        if (items.length === 0) return
        const first = items[0]!
        const last = items[items.length - 1]!
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      previouslyFocused?.focus()
    }
  }, [selectedIndex, next, prev, close])

  const handleDragEnd = (_e: unknown, { offset }: { offset: { x: number } }) => {
    if (isZoomed || selectedIndex === null) return
    if (offset.x < -50) next()
    else if (offset.x > 50) prev()
  }

  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start end', 'end start'] })
  const yMiddle = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : -150])

  const columns = useMemo(
    () => [0, 1, 2].map((c) => photos.map((p, i) => ({ p, i })).filter(({ i }) => i % 3 === c)),
    [photos],
  )

  const specs = current
    ? [
        { label: 'Aperture', value: current.aperture },
        { label: 'Shutter', value: current.shutter },
        { label: 'ISO', value: current.iso },
        { label: 'Focal length', value: current.focalLength },
        { label: 'Camera', value: current.system },
        { label: 'Lens', value: current.lens },
        { label: 'Location', value: current.location },
      ].filter((s) => !!s.value)
    : []

  return (
    <>
      {/* ── Darkroom loader ───────────────────────────────────────── */}
      <AnimatePresence>
        {isDeveloping && (
          <motion.div
            key="darkroom-loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.2 : 0.8, ease: 'easeInOut' }}
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-6 bg-red-950/90 backdrop-blur-3xl"
            onClick={() => setIsDeveloping(false)}
            role="status"
            aria-live="polite"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-t-2 border-r-2 border-red-400 rounded-full animate-spin" aria-hidden="true" />
              <p className="text-red-300 font-mono text-xs tracking-[0.5em] uppercase">Developing</p>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setIsDeveloping(false) }}
 className={`meta-label text-red-200/80 hover:text-white border border-red-400/40 px-4 py-2 rounded-full ${FOCUS}`}
            >
              Skip
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto relative">
        {count === 0 && (
          <p className="text-center font-mono text-xs text-stone-400 uppercase tracking-widest py-16">No frames in this selection yet.</p>
        )}

        {/* ── Masonry grid ──────────────────────────────────────────── */}
        <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start px-4">
          {columns.map((col, colIndex) => (
            <motion.div key={`col-${colIndex}`} className="flex flex-col gap-6" style={{ y: colIndex === 1 ? yMiddle : 0 }}>
              {col.map(({ p: photo, i }) => (
                <motion.button
                  type="button"
                  key={photo._id}
                  initial={reduceMotion ? false : { opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
                  aria-label={`Open ${photo.title || 'photograph'}${photo.category ? ` — ${photo.category}` : ''}`}
                  onClick={(e) => open(i, e.currentTarget)}
                  className={`relative w-full aspect-[3/4] overflow-hidden rounded-xl group bg-stone-900 shadow-[0_0_20px_rgba(0,0,0,0.6)] block cursor-zoom-in text-left ${FOCUS}`}
                >
                  {photo.imageUrl && (
                    <>
                      <Image
                        src={photo.imageUrl}
                        alt={photo.alt || photo.title || ''}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        placeholder={photo.lqip ? 'blur' : 'empty'}
                        blurDataURL={photo.lqip || undefined}
                        className="object-cover transition-all duration-700 ease-out opacity-70 grayscale-[60%] group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105 group-focus-visible:grayscale-0 group-focus-visible:opacity-100"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-700 flex flex-col justify-end p-6 md:p-8">
                        <span className="text-white text-2xl md:text-3xl font-serif font-bold translate-y-4 group-hover:translate-y-0 group-focus-visible:translate-y-0 transition-transform duration-500 ease-out drop-shadow-lg">
                          {photo.title}
                        </span>
                        {photo.category && (
                          <span className="meta-label text-stone-300 mt-2">{photo.category}</span>
                        )}
                      </div>
                    </>
                  )}
                </motion.button>
              ))}
            </motion.div>
          ))}
        </div>

        {/* ── Lightbox ──────────────────────────────────────────────── */}
        <AnimatePresence>
          {selectedIndex !== null && current && (
            <motion.div
              key="lightbox-overlay"
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0.1 : 0.3 }}
              className="fixed inset-0 z-[150] flex bg-black/95 backdrop-blur-xl"
            >
              <div className="absolute top-6 left-6 md:top-8 md:left-8 text-stone-400 font-mono text-xs tracking-[0.3em] z-50" aria-live="polite">
                {String(selectedIndex + 1).padStart(2, '0')} — {String(count).padStart(2, '0')}
              </div>

              <button
                ref={closeRef}
                type="button"
                aria-label="Close"
                className={`absolute top-6 right-6 md:top-8 md:right-8 text-stone-400 hover:text-white transition-colors p-2 z-50 group rounded-full ${FOCUS}`}
                onClick={close}
              >
                <svg className="w-8 h-8 group-hover:rotate-90 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="flex flex-col md:flex-row w-full h-full">
                {/* Image side */}
                <div className="flex-1 relative flex items-center justify-center p-4 md:p-12 h-[60vh] md:h-full overflow-hidden" onClick={close}>
                  <button
                    type="button"
                    aria-label="Previous photo"
                    onClick={(e) => { e.stopPropagation(); prev() }}
                    className={`absolute left-4 md:left-8 p-4 text-stone-400 hover:text-white transition-colors hidden sm:block z-20 rounded-full ${FOCUS}`}
                  >
                    <svg className="w-8 h-8 md:w-12 md:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  <motion.div
                    key={selectedIndex}
                    drag={isZoomed ? true : 'x'}
                    dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                    dragElastic={isZoomed ? 0.4 : 0.8}
                    onDragEnd={handleDragEnd}
                    initial={reduceMotion ? false : { opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: isZoomed ? 2.2 : 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.2 } }}
                    transition={{ type: 'spring', stiffness: 260, damping: 26 }}
                    className={`relative w-full h-full flex items-center justify-center z-10 origin-center ${isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
                    onClick={(e) => { e.stopPropagation(); setIsZoomed((z) => !z) }}
                  >
                    {current.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={lightboxSrc(current.imageUrl)}
                        alt={current.alt || current.title || ''}
                        width={2000}
                        height={1333}
                        decoding="async"
                        className="max-w-full max-h-full w-auto h-auto object-contain drop-shadow-[0_0_40px_rgba(0,0,0,0.8)] pointer-events-none select-none"
                      />
                    )}
                  </motion.div>

                  <button
                    type="button"
                    aria-label="Next photo"
                    onClick={(e) => { e.stopPropagation(); next() }}
                    className={`absolute right-4 md:right-8 p-4 text-stone-400 hover:text-white transition-colors hidden sm:block z-20 rounded-full ${FOCUS}`}
                  >
                    <svg className="w-8 h-8 md:w-12 md:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                {/* Metadata side */}
                <div className="w-full md:w-[400px] lg:w-[450px] bg-stone-950/80 border-l border-white/5 p-8 md:p-12 flex flex-col justify-center shrink-0 h-[40vh] md:h-full overflow-y-auto">
                  <div className="space-y-8">
                    <div>
                      {current.category && (
                        <span className="text-stone-400 text-xs font-bold uppercase tracking-[0.3em] block mb-4">{current.category}</span>
                      )}
                      <h3 id={titleId} className="text-white text-3xl md:text-5xl font-serif tracking-wide leading-tight">{current.title}</h3>
                    </div>

                    {current.caption && (
                      <p className="text-stone-400 font-sans text-sm md:text-base leading-relaxed tracking-wide">{current.caption}</p>
                    )}

                    {specs.length > 0 && (
                      <div className="pt-8 mt-8 border-t border-white/10 space-y-5">
                        <p className="text-stone-400 text-xs uppercase tracking-[0.2em] font-semibold">Technical profile</p>
                        <dl className="grid grid-cols-2 gap-y-6 gap-x-4">
                          {specs.map(({ label, value }) => (
                            <div key={label} className={`flex flex-col min-w-0 ${label === 'Lens' || label === 'Location' || label === 'Camera' ? 'col-span-2' : ''}`}>
                              <dt className="text-xs text-stone-400 tracking-widest uppercase">{label}</dt>
                              <dd className="text-sm font-mono tracking-tight text-stone-200 truncate m-0">{value}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    )}

                    {current.notes && (
                      <div className="pt-4 mt-4 border-t border-white/5">
                        <span className="text-xs text-stone-400 tracking-widest uppercase mb-2 block">Field notes</span>
                        <p className="text-stone-400 font-mono text-xs leading-relaxed italic">“{current.notes}”</p>
                      </div>
                    )}

                    <div className="flex gap-3 sm:hidden">
                      <button type="button" onClick={prev} className={`meta-label flex-1 border border-white/15 rounded-lg py-2 text-stone-300 ${FOCUS}`}>← Prev</button>
                      <button type="button" onClick={next} className={`meta-label flex-1 border border-white/15 rounded-lg py-2 text-stone-300 ${FOCUS}`}>Next →</button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
