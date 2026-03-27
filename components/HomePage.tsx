'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import type { PortableTextBlock } from 'next-sanity'

// This interface ensures TypeScript knows what data is coming from your page.tsx
export interface HomePageProps {
  data: {
    title?: string;
    overview?: PortableTextBlock[];
  } | null;
}

export function HomePage({ data }: HomePageProps) {
  // We can use your Sanity title if you set one, otherwise it defaults to "Hi, I'm Stef."
  const title = data?.title || "Hi, I'm Stef."

  return (
    <main className="flex flex-col items-center justify-center min-h-[75vh] text-center px-4">
      
      {/* The Greeting */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <h1 className="text-6xl md:text-8xl font-serif text-stone-800 tracking-tight mb-6">
          {title}
        </h1>
      </motion.div>

      {/* The Elevator Pitch */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        <p className="text-lg md:text-xl text-stone-500 font-sans max-w-2xl mx-auto leading-relaxed mb-12">
          A multidisciplinary creator specializing in <span className="text-[#4A5D6E] font-semibold">software engineering</span>, cinematic <span className="text-[#4A5D6E] font-semibold">photography</span>, and infrastructure <span className="text-[#4A5D6E] font-semibold">architecture</span>.
        </p>
      </motion.div>

      {/* Minimalist Navigation Hub */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.6 }}
        className="flex flex-wrap justify-center gap-6 md:gap-12 font-sans text-xs md:text-sm font-bold uppercase tracking-widest text-stone-400"
      >
        {/* Using Next.js <Link> tags for faster, smoother page routing */}
        <Link href="/photography" className="hover:text-[#4A5D6E] hover:-translate-y-1 transition-all duration-300">
          Explore Photography
        </Link>
        <Link href="/projects" className="hover:text-[#4A5D6E] hover:-translate-y-1 transition-all duration-300">
          View Infrastructure
        </Link>
        <Link href="/resume" className="hover:text-[#4A5D6E] hover:-translate-y-1 transition-all duration-300">
          Read Resume
        </Link>
      </motion.div>

    </main>
  )
}