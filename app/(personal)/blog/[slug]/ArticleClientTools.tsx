'use client'

import { useState } from 'react'
import { motion, useScroll, useSpring } from 'framer-motion'

interface ToolProps {
  title: string
  author: string
  date: string
  slug: string
}

export function ArticleClientTools({ title, author, date, slug }: ToolProps) {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 })
  const [copied, setCopied] = useState(false)
  const [citeCopied, setCiteCopied] = useState(false)

  // Get the full URL securely
  const fullUrl = typeof window !== 'undefined' ? window.location.href : `https://stefanpeele.com/blog/${slug}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const generateCitation = () => {
    const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    const citation = `${author}. "${title}." Stefan Peele | Digital Archive, ${date}, ${fullUrl}. Accessed ${today}.`
    navigator.clipboard.writeText(citation)
    setCiteCopied(true)
    setTimeout(() => setCiteCopied(false), 2000)
  }

  return (
    <>
      {/* 1. Top Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-stone-300 origin-left z-50"
        style={{ scaleX }}
      />

      {/* 2. Floating Copy Link Button */}
      <button
        onClick={handleCopyLink}
        className="fixed bottom-8 right-8 md:bottom-12 md:right-12 z-40 bg-white text-black font-mono text-[10px] uppercase tracking-widest px-5 py-3 rounded-full shadow-2xl hover:bg-stone-200 transition-all active:scale-95"
      >
        {copied ? 'Link Copied!' : 'Copy Link'}
      </button>

      {/* 3. Citation Block (Appears at the bottom of the article) */}
      <div className="mt-24 p-6 md:p-8 bg-[#111] border border-white/10 rounded-lg">
        <h3 className="font-mono text-[10px] text-stone-500 uppercase tracking-widest mb-4">Cite This Intel</h3>
        <p className="font-mono text-sm text-stone-400 mb-6 break-words">
          {author}. "{title}." Stefan Peele | Digital Archive, {date}.
        </p>
        <button
          onClick={generateCitation}
          className="text-white border border-white/20 px-4 py-2 font-mono text-[10px] uppercase tracking-widest hover:bg-white hover:text-black transition-colors"
        >
          {citeCopied ? 'Citation Copied!' : 'Copy Citation (MLA)'}
        </button>
      </div>
    </>
  )
}