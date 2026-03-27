'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

export default function CinematicGallery({ photos }: { photos: any[] }) {
  const [selectedImage, setSelectedImage] = useState<any | null>(null)

  return (
    <>
      {/* MASONRY GRID */}
      {/* 'columns-1 md:columns-2 lg:columns-3' creates the interlocking Pinterest-style layout */}
      <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
        {photos.map((photo, index) => (
          <motion.div
            key={photo._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="break-inside-avoid relative group cursor-pointer overflow-hidden rounded-xl bg-[#F5F2EB]"
            onClick={() => setSelectedImage(photo)}
          >
            {photo.imageUrl && (
              <>
                {/* We use width/height but override with w-full h-auto 
                  so the image scales naturally without being forced into a square!
                */}
                <Image
                  src={photo.imageUrl}
                  alt={photo.caption || photo.title || 'Photography portfolio image'}
                  width={800}
                  height={1200}
                  className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                />
                
                {/* THE HOVER OVERLAY */}
                <div className="absolute inset-0 bg-gradient-to-t from-stone-900/90 via-stone-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6">
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
      </div>

      {/* FULLSCREEN LIGHTBOX */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/95 backdrop-blur-sm p-4 md:p-12 cursor-zoom-out"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-5xl max-h-[90vh] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()} // Prevents clicking the image from closing the lightbox
            >
              <img
                src={selectedImage.imageUrl}
                alt={selectedImage.title}
                className="max-w-full max-h-[85vh] object-contain rounded-sm shadow-2xl"
              />
              
              <div className="mt-6 text-center">
                <h3 className="text-white text-2xl font-serif">{selectedImage.title}</h3>
                {selectedImage.caption && (
                  <p className="text-stone-400 mt-2 font-sans max-w-2xl mx-auto">{selectedImage.caption}</p>
                )}
              </div>
              
              {/* Close Button */}
              <button 
                className="absolute -top-12 right-0 text-white hover:text-[#4A5D6E] transition-colors p-2"
                onClick={() => setSelectedImage(null)}
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}