// components/AnimatedHero.tsx
'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

export default function AnimatedHero() {
  const title = "The Gallery"
  const heroRef = useRef(null)

  // 1. Track the scroll position of the hero section
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  })

  // 2. Map scroll progress to vertical movement (Parallax) and opacity
  const yTitle = useTransform(scrollYProgress, [0, 1], [0, 150]) 
  const ySubtitle = useTransform(scrollYProgress, [0, 1], [0, 100]) 
  const opacityOut = useTransform(scrollYProgress, [0, 0.8], [1, 0]) 
  
  // Animation variants for the staggering effect
  const containerVars = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { 
        staggerChildren: 0.08, 
        // DELAYED: Wait 2.5s for the Darkroom loader to finish
        delayChildren: 2.5 
      }
    }
  }

  const letterVars = {
    hidden: { y: "105%", opacity: 0 }, 
    show: { 
      y: "0%", 
      opacity: 1, 
      transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] } 
    }
  }

  return (
    <motion.div 
      ref={heroRef}
      style={{ opacity: opacityOut }} // Fades the whole hero block out as you scroll down
      className="max-w-4xl mx-auto text-center mb-16 mt-6 md:mt-10 relative z-10 flex flex-col items-center select-none"
    >
      {/* Title Masking Container */}
      <motion.h1 
        variants={containerVars}
        initial="hidden"
        animate="show"
        style={{ y: yTitle }} // Parallax movement
        className="text-5xl md:text-7xl font-bold font-serif mb-6 tracking-tight drop-shadow-lg flex flex-wrap justify-center overflow-hidden"
      >
        {title.split("").map((char, index) => (
          <motion.span 
            key={`${char}-${index}`} 
            variants={letterVars}
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
        // DELAYED: Bumping from 1.5s -> 3.5s to wait for the Darkroom and the title
        transition={{ delay: 3.5, duration: 1.5, ease: "easeOut" }} 
        style={{ y: ySubtitle }} // Parallax movement
        className="mt-6 text-stone-400 max-w-2xl mx-auto text-[10px] md:text-xs uppercase leading-loose text-balance px-4"
      >
        A curated collection of cinematic moments, capturing the essence of sports, portraits, and live events.
      </motion.p>
      
      {/* Decorative Divider */}
      <motion.div 
        suppressHydrationWarning // <-- 1. Add this to ignore harmless SSR style differences
        initial={{ scaleX: 0, opacity: 0, y: 0 }} // <-- 2. Explicitly set y: 0 to stop inheritance
        animate={{ scaleX: 1, opacity: 1, y: 0 }} // <-- 3. Explicitly set y: 0 here too
        // DELAYED: Bumping from 2s -> 4s
        transition={{ delay: 4, duration: 1, ease: "easeOut" }}
        className="h-[1px] w-12 bg-stone-700 mt-8"
      />
    </motion.div>
  )
}