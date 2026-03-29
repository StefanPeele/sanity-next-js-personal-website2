// components/AnimatedHero.tsx
'use client'

import { motion } from 'framer-motion'

export default function AnimatedHero() {
  const title = "The Gallery"
  
  // Animation variants for the staggering effect
  const containerVars = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { 
        staggerChildren: 0.08, 
        delayChildren: 0.2 
      }
    }
  }

  const letterVars = {
    hidden: { y: "105%", opacity: 0 }, // Slightly more than 100% to ensure clean hide
    show: { 
      y: "0%", 
      opacity: 1, 
      transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] } 
    }
  }

  return (
    <div className="max-w-4xl mx-auto text-center mb-16 mt-6 md:mt-10 relative z-10 flex flex-col items-center select-none">
      {/* Title Masking Container */}
      <motion.h1 
        variants={containerVars}
        initial="hidden"
        animate="show"
        className="text-5xl md:text-7xl font-bold font-serif mb-6 tracking-tight drop-shadow-lg flex flex-wrap justify-center overflow-hidden"
      >
        {title.split("").map((char, index) => (
          <motion.span 
            key={`${char}-${index}`} // Fix: Stable key for animation
            variants={letterVars}
            // Fix: Use inline-flex and handle spaces with non-breaking space for better layout stability
            className={`${char === " " ? "mr-[0.25em]" : "inline-block"}`}
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>
        ))}
      </motion.h1>

      {/* Subtext Fade-in & Track-out */}
      <motion.p 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0, letterSpacing: "0.2em" }}
        transition={{ delay: 1.5, duration: 1.5, ease: "easeOut" }}
        className="mt-6 text-stone-400 max-w-2xl mx-auto text-[10px] md:text-xs uppercase leading-loose text-balance px-4"
      >
        A curated collection of cinematic moments, capturing the essence of sports, portraits, and live events.
      </motion.p>
      
      {/* Decorative Divider */}
      <motion.div 
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        className="h-[1px] w-12 bg-stone-700 mt-8"
      />
    </div>
  )
}