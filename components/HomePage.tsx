'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { PortableText } from '@portabletext/react'

const portableTextComponents = {
  marks: {
    link: ({ children, value }: any) => (
      <a href={value.href} className="text-white underline decoration-stone-600 underline-offset-4 hover:decoration-white transition-colors">
        {children}
      </a>
    ),
    strong: ({ children }: any) => <strong className="font-bold text-stone-100">{children}</strong>,
  },
  block: {
    normal: ({ children }: any) => <p className="mb-2 last:mb-0">{children}</p>,
  },
}

const destinations = [
  { name: 'Photography', href: '/photography', desc: 'Visual Archive & Galleries' },
  { name: 'Projects', href: '/projects', desc: 'Case Studies & Work' },
  { name: 'Resume', href: '/resume', desc: 'Professional History' },
  { name: 'Blog', href: '/blog', desc: 'Thoughts & Essays' },
]

export function HomePage({ data }: { data: any }) {
  const [isHoveringName, setIsHoveringName] = useState(false)

  // Use fabshots2026051.jpg for the thoughtful vibe
  const hoverImage = "/fabshots2026051.jpg" 

  return (
    <div className="w-full flex flex-col items-center bg-[#0a0a0a]">
      <main className="relative w-full min-h-screen overflow-hidden flex items-center justify-center p-6 md:p-12 lg:p-20 select-none">
        
        {/* Hover Portrait Background */}
        <motion.div
          animate={{ opacity: isHoveringName ? 0.4 : 0, scale: isHoveringName ? 1 : 1.05 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute inset-0 z-10 pointer-events-none mix-blend-lighten"
          style={{
            backgroundImage: `url("${hoverImage}")`, 
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'grayscale(100%) contrast(110%) brightness(1.1)' 
          }}
        />

        <div className="relative z-30 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
          
          {/* LEFT CONTENT */}
          <div className="lg:col-span-2 flex flex-col items-start space-y-6">
            <span className="text-stone-500 font-mono text-[10px] tracking-[0.4em] uppercase border-l border-stone-700 pl-4">
              Directory / Index
            </span>
            
            <motion.h1 
              onMouseEnter={() => setIsHoveringName(true)}
              onMouseLeave={() => setIsHoveringName(false)}
              className="text-stone-50 text-4xl md:text-6xl lg:text-7xl font-serif tracking-tight font-bold leading-[0.9] cursor-default"
            >
              {data?.title || "Stefan Peele"}
            </motion.h1>

            <div className="text-stone-400 font-sans text-xs md:text-sm leading-relaxed max-w-xs opacity-80">
              {data?.overview ? <PortableText value={data.overview} components={portableTextComponents} /> : "Personal / Portfolio Page"}
            </div>
          </div>

          {/* RIGHT NAVIGATION */}
          <div className="lg:col-span-3 flex flex-col w-full group/list">
            {destinations.map((item) => (
              <Link key={item.name} href={item.href} className="group relative flex items-center justify-between py-6 md:py-8 border-b border-white/5 hover:border-white/20 transition-all duration-500 hover:pl-4">
                <div className="flex flex-col">
                  <span className="text-white text-2xl md:text-4xl font-serif">{item.name}</span>
                  <span className="text-stone-600 font-mono text-[9px] tracking-[0.3em] uppercase mt-1 opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all">
                    {item.desc}
                  </span>
                </div>
                <div className="w-8 h-[1px] bg-stone-700 group-hover:w-12 group-hover:bg-white transition-all" />
              </Link>
            ))}
          </div>
        </div>

        {/* REFINED STATUS BAR */}
        <div className="absolute bottom-8 left-8 right-8 md:left-12 md:right-12 flex flex-col md:flex-row justify-between items-end md:items-center text-[9px] font-mono tracking-widest text-stone-500 uppercase border-t border-white/5 pt-6 z-30">
          <div className="flex flex-col md:flex-row gap-2 md:gap-8 mb-4 md:mb-0">
            <p><span className="text-stone-600 mr-2">Currently:</span> {data?.currently}</p>
            <p><span className="text-stone-600 mr-2">Location:</span> {data?.location}</p>
          </div>
          <span className="opacity-40">2026 ARCHIVE — NJIT</span>
        </div>
      </main>

      {/* Trajectory Grid */}
      {data?.expertisePillars && (
        <section className="w-full bg-stone-50 py-24 px-8 border-t border-stone-200">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
            {data.expertisePillars.map((p: any, i: number) => (
              <div key={i} className="space-y-4">
                <span className="text-stone-300 font-mono text-xs">0{i+1}</span>
                <h3 className="text-lg font-serif font-bold text-stone-900">{p.title}</h3>
                <p className="text-stone-600 text-sm leading-relaxed">{p.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}