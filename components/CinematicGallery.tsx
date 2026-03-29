'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

export default function CinematicGallery({ photos }: { photos: any[] }) {
  const [selectedImage, setSelectedImage] = useState<any | null>(null)
  const [activeCategory, setActiveCategory] = useState('All')

  // Automatically extract unique categories from your Sanity photos!
  const categories = useMemo(() => {
    const cats = photos.map(p => p.category).filter(Boolean)
    return ['All', ...Array.from(new Set(cats))]
  }, [photos])

  // Filter the photos based on the clicked category
  const filteredPhotos = photos.filter(photo => 
    activeCategory === 'All' ? true : photo.category === activeCategory
  )

  return (
    <div className="max-w-7xl mx-auto">
      
      {/* CATEGORY FILTERS */}
      <div className="flex flex-wrap justify-center gap-4 mb-12">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-6 py-2 rounded-full text-sm font-semibold tracking-widest uppercase transition-all duration-300 ${
              activeCategory === category 
                ? 'bg-stone-100 text-stone-900 shadow-[0_0_20px_rgba(255,255,255,0.1)]' 
                : 'bg-stone-900 text-stone-400 hover:text-stone-100 hover:bg-stone-800'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* MASONRY GRID */}
      {/* Added motion.div wrapper so the whole grid animates when filtering */}
      <motion.div 
        layout 
        className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6"
      >
        <AnimatePresence>
          {filteredPhotos.map((photo, index) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4 }}
              key={photo._id}
              className="break-inside-avoid relative group cursor-pointer overflow-hidden rounded-xl bg-stone-900"
              onClick={() => setSelectedImage(photo)}
            >
              {photo.imageUrl && (
                <>
                  <Image
                    src={photo.imageUrl}
                    alt={photo.caption || photo.title || 'Photography'}
                    width={800}
                    height={1200}
                    className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  
                  {/* THE HOVER OVERLAY (Darker and sleeker) */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6">
                    <h2 className="text-white text-2xl font-serif font-bold translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                      {photo.title}
                    </h2>
                    {photo.category && (
                      <span className="text-stone-300 text-xs font-bold uppercase tracking-widest mt-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-75">
                        {photo.category}
                      </span>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* FULLSCREEN IMMERSIVE LIGHTBOX */}
      {/* Upped the z-index and forced a pure black background to hide everything else */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/98 backdrop-blur-xl p-4 md:p-8 cursor-zoom-out"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-6xl max-h-screen flex flex-col items-center justify-center"
              onClick={(e) => e.stopPropagation()} 
            >
              {/* Sleek, minimal close button */}
              <button 
                className="absolute top-4 right-4 md:-top-12 md:right-0 text-stone-500 hover:text-white transition-colors p-2 z-50"
                onClick={() => setSelectedImage(null)}
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>

              <img
                src={selectedImage.imageUrl}
                alt={selectedImage.title}
                className="max-w-full max-h-[80vh] object-contain shadow-2xl rounded-sm"
              />
              
              <div className="mt-8 text-center">
                <h3 className="text-white text-3xl font-serif tracking-wide">{selectedImage.title}</h3>
                {selectedImage.caption && (
                  <p className="text-stone-400 mt-3 font-sans max-w-2xl mx-auto text-sm md:text-base leading-relaxed">{selectedImage.caption}</p>
                )}
              </div>
              
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}