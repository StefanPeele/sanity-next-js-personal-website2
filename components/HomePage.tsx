'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { PortableText } from '@portabletext/react'

// 1. Define custom rendering for Sanity blocks
const portableTextComponents = {
  marks: {
    // Styles links found in your "overview" array
    link: ({ children, value }: any) => {
      const rel = !value.href.startsWith('/') ? 'noreferrer noopener' : undefined
      return (
        <a 
          href={value.href} 
          rel={rel} 
          className="text-white underline decoration-stone-600 underline-offset-4 hover:decoration-white transition-colors"
        >
          {children}
        </a>
      )
    },
    // Styles bold text
    strong: ({ children }: any) => <strong className="font-bold text-stone-200">{children}</strong>,
  },
  block: {
    // Adds spacing between paragraphs if you have multiple blocks
    normal: ({ children }: any) => <p className="mb-4 last:mb-0">{children}</p>,
  },
}

const destinations = [
  { name: 'Photography', href: '/photography', desc: 'Visual Archive & Galleries' },
  { name: 'Projects', href: '/projects', desc: 'Case Studies & Work' },
  { name: 'Resume', href: '/resume', desc: 'Professional History' },
  { name: 'Blog', href: '/blog', desc: 'Thoughts & Essays' },
]

export function HomePage({ data }: { data: any }) {
  const siteTitle = data?.title || "Stefs Test"
  const bio = data?.overview
  const currently = data?.currently || "Exploring light & architecture"
  const location = data?.location || "New York City"
  const manifesto = data?.manifesto || "I believe in capturing the quiet moments between the noise."

  const [isHoveringName, setIsHoveringName] = useState(false)

  return (
    <div className="w-full flex flex-col items-center">
      <main className="relative w-full min-h-[85vh] overflow-hidden bg-black flex items-center justify-center p-8 md:p-16 select-none shadow-2xl rounded-sm">
        
        {/* Hover Portrait Background */}
        <motion.div
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ 
            opacity: isHoveringName ? 0.35 : 0, 
            scale: isHoveringName ? 1 : 1.05 
          }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute inset-0 z-10 pointer-events-none mix-blend-lighten"
          style={{
            backgroundImage: 'url("/fabshots2026018.jpg")', 
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'grayscale(100%) contrast(120%) brightness(1.2)' 
          }}
        />

        <div className="relative z-30 w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-8 items-center pb-12">
          <div className="flex flex-col items-start justify-center space-y-8 pr-0 lg:pr-12">
            <span className="text-stone-500 font-mono text-xs tracking-[0.4em] uppercase block mb-4 border-l border-stone-500 pl-4">Directory / Index</span>
            
            <motion.h1 
              onMouseEnter={() => setIsHoveringName(true)}
              onMouseLeave={() => setIsHoveringName(false)}
              className="text-stone-50 text-5xl md:text-7xl font-serif tracking-wide font-bold leading-tight cursor-default relative z-20"
            >
              {siteTitle}
            </motion.h1>

            <div className="text-stone-400 font-sans text-sm md:text-base leading-relaxed max-w-md relative z-20">
              {/* 2. Pass the custom components here */}
              {bio ? <PortableText value={bio} components={portableTextComponents} /> : "No bio provided."}
            </div>
          </div>

          <div className="flex flex-col w-full group/list relative z-20">
            {destinations.map((item) => (
              <Link key={item.name} href={item.href} className="group relative flex items-center justify-between py-8 border-b border-white/10 transition-all duration-500 hover:border-white/40 hover:pl-6">
                <div className="flex flex-col">
                  <span className="text-white text-3xl md:text-4xl font-serif">{item.name}</span>
                  <span className="text-stone-500 font-mono text-[10px] sm:text-xs tracking-[0.3em] uppercase mt-2 opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">{item.desc}</span>
                </div>
                <svg className="w-6 h-6 text-stone-600 group-hover:text-white transition-all duration-500 transform -translate-x-full opacity-0 group-hover:translate-x-0 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            ))}
          </div>
        </div>

        {/* Dynamic Status Bar */}
        <div className="absolute bottom-6 left-8 right-8 md:bottom-10 md:left-16 md:right-16 flex flex-col md:flex-row justify-between text-[10px] sm:text-xs font-mono tracking-widest text-stone-500 uppercase border-t border-white/10 pt-4 z-30">
          <div className="flex gap-4">
            <span className="text-stone-300">Currently:</span>
            <span>{currently}</span>
          </div>
          <div className="flex gap-4">
            <span className="text-stone-300">Location:</span>
            <span>{location}</span>
          </div>
        </div>
      </main>

      {/* Dynamic Manifesto Section */}
      <section className="w-full max-w-4xl mx-auto py-32 px-8 text-center flex flex-col items-center justify-center">
        <motion.p 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-2xl md:text-4xl font-serif leading-relaxed text-stone-800"
        >
          "{manifesto}"
        </motion.p>
        <span className="block mt-12 font-mono text-xs tracking-[0.3em] uppercase text-stone-400 border-b border-stone-300 pb-2">The Philosophy</span>
      </section>
    </div>
  )
}