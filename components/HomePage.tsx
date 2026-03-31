'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { PortableText } from '@portabletext/react'
import ImageBox from '@/components/ImageBox'

const portableTextComponents = {
  marks: {
    link: ({ children, value }: any) => (
      <a href={value.href} className="text-white underline decoration-stone-600 underline-offset-4 hover:decoration-white transition-colors" target={value?.href?.startsWith('/') ? undefined : '_blank'} rel="noreferrer noopener">
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
  { name: 'Projects', href: '/projects', desc: 'Case Studies & Infrastructure' },
  { name: 'Photography', href: '/photography', desc: 'Visual Archive & Galleries' },
  { name: 'Resume', href: '/resume', desc: 'Professional History' },
  { name: 'Editorial', href: '/blog', desc: 'Thoughts & Intel' },
]

export function HomePage({ data, intelData }: { data: any; intelData?: any }) {
  const [isHoveringName, setIsHoveringName] = useState(false)

  // Use Sanity image for the About section
  const profileImage = data?.profileImage
  
  // Fallback for the CSS background hover (since CSS needs a direct URL string)
  // Ensure "fabshots2026051.jpg" is in your /public folder as a backup
  const fallbackHero = "/fabshots2026051.jpg" 

  const featured = intelData?.featuredPost
  const recents = intelData?.recentPosts || []

  return (
<div className="w-full flex flex-col items-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-stone-900/40 via-black to-black">      
      {/* 1. HERO DIRECTORY */}
      <main className="relative w-full min-h-screen overflow-hidden flex items-center justify-center p-6 md:p-12 lg:p-20 select-none">
        
        {/* Hover Portrait Background */}
        <motion.div
          animate={{ opacity: isHoveringName ? 0.3 : 0, scale: isHoveringName ? 1 : 1.05 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            backgroundImage: `url("${fallbackHero}")`, 
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'grayscale(100%) contrast(120%) brightness(0.8)' 
          }}
        />

        <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
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
              {data?.overview ? <PortableText value={data.overview} components={portableTextComponents} /> : "IT Infrastructure & Architecture Portfolio"}
            </div>
          </div>

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

        <div className="absolute bottom-8 left-8 right-8 md:left-12 md:right-12 flex flex-col md:flex-row justify-between items-end md:items-center text-[9px] font-mono tracking-widest text-stone-500 uppercase border-t border-white/5 pt-6 z-10">
          <div className="flex flex-col md:flex-row gap-2 md:gap-8 mb-4 md:mb-0">
            <p><span className="text-stone-600 mr-2">Currently:</span> {data?.currently || "Operating"}</p>
            <p><span className="text-stone-600 mr-2">Location:</span> {data?.location || "Classified"}</p>
          </div>
          <span className="opacity-40">2026 ARCHIVE — NJIT</span>
        </div>
      </main>

      {/* 2. THE PROFILE (About Section) */}
      <section className="w-full max-w-6xl mx-auto py-32 px-6 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="relative group aspect-[4/5] bg-stone-900 rounded-2xl overflow-hidden border border-white/5"
        >
          {profileImage ? (
            <ImageBox 
               image={profileImage} 
               alt="Stefan Peele Profile" 
               classesWrapper="w-full h-full object-cover grayscale transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0 opacity-70 group-hover:opacity-100" 
            />
          ) : (
            <div className="w-full h-full bg-stone-800 animate-pulse flex items-center justify-center text-stone-600 font-mono text-[10px] uppercase tracking-widest">
              Upload Image in Sanity
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.2 }}
          className="space-y-8"
        >
          <div className="space-y-4">
            <span className="text-stone-600 font-mono text-[10px] tracking-[0.4em] uppercase">The Architect</span>
            <h2 className="text-stone-50 text-4xl md:text-5xl font-serif font-bold tracking-tight leading-[1.1]">
              Logic in Infrastructure. <br />
              Intent in Imagery.
            </h2>
          </div>

          <div className="space-y-6 text-stone-400 font-sans text-sm md:text-base leading-relaxed max-w-md border-l border-stone-800 pl-6">
            <p>
              I specialize in the intersection of high-availability systems and visual storytelling. Whether I am architecting resilient server environments or capturing editorial portraits, my philosophy remains the same: clarity, efficiency, and aesthetic discipline.
            </p>
            <p>
              Currently navigating IT Infrastructure at NJIT, I view technical challenges through the same lens as a photography composition—everything is an arrangement of light, logic, and structure.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 pt-8 border-t border-white/5">
             <div>
                <span className="block text-white font-serif text-lg">Infrastructure</span>
                <span className="text-stone-600 font-mono text-[9px] uppercase tracking-widest mt-1 block">Systems & Network</span>
             </div>
             <div>
                <span className="block text-white font-serif text-lg">Imagery</span>
                <span className="text-stone-600 font-mono text-[9px] uppercase tracking-widest mt-1 block">Editorial Direction</span>
             </div>
          </div>
        </motion.div>
      </section>

      {/* 3. THE COMMAND CENTER (Latest Intel) */}
      {(featured || recents.length > 0) && (
        <section className="w-full max-w-6xl mx-auto py-24 px-6 md:px-12 border-t border-white/5">
          <div className="flex items-center gap-4 mb-16">
            <div className="h-[1px] w-12 bg-stone-700" />
            <h2 className="font-mono text-[10px] tracking-[0.4em] text-stone-500 uppercase">Latest Intel</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {featured && (
              <Link href={`/blog/${featured.slug.current}`} className="lg:col-span-7 group block relative rounded-xl overflow-hidden bg-[#111] border border-white/5 hover:border-white/20 transition-all duration-500">
                <div className="relative h-64 md:h-80 w-full overflow-hidden">
                  {featured.mainImage ? (
                    <div className="w-full h-full transform group-hover:scale-105 transition-transform duration-700">
                      <ImageBox image={featured.mainImage} alt={featured.title} classesWrapper="w-full h-full object-cover grayscale opacity-50 group-hover:opacity-80 transition-opacity" />
                    </div>
                  ) : (
                    <div className="w-full h-full bg-[#1a1a1a]" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-[#111]/40 to-transparent" />
                  <div className="absolute top-4 left-4 border border-white/10 bg-black/50 backdrop-blur-md px-3 py-1 rounded-sm">
                    <span className="text-[9px] font-mono tracking-widest text-white uppercase">Featured</span>
                  </div>
                </div>
                <div className="p-8">
                  <h3 className="text-2xl md:text-3xl font-serif font-bold text-white mb-3 group-hover:text-stone-300 transition-colors">
                    {featured.title}
                  </h3>
                  <p className="text-stone-400 text-sm leading-relaxed mb-6 line-clamp-2">
                    {featured.excerpt || "Access the full classified report..."}
                  </p>
                  <div className="flex items-center gap-4 font-mono text-[10px] text-stone-600 uppercase tracking-widest">
                    <span>{featured.publishedAt ? new Date(featured.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : 'DRAFT'}</span>                    <span>•</span>
                    <span className="group-hover:text-white transition-colors">Read Report →</span>
                  </div>
                </div>
              </Link>
            )}

            {recents.length > 0 && (
              <div className="lg:col-span-5 flex flex-col gap-6">
                <h3 className="font-mono text-[10px] text-stone-500 tracking-widest uppercase mb-4 border-b border-white/5 pb-4">
                  Archive Logs
                </h3>
                {recents.map((post: any, i: number) => (
                  <Link key={i} href={`/blog/${post.slug.current}`} className="group block p-6 rounded-xl bg-[#111] border border-white/5 hover:border-white/20 transition-all">
                    <h4 className="text-lg font-serif font-bold text-white mb-2 group-hover:text-stone-300">
                      {post.title}
                    </h4>
                    <div className="flex items-center gap-3 font-mono text-[9px] text-stone-500 uppercase tracking-widest mt-4">
                      <span>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric', timeZone: 'UTC' }) : '--/--/----'}</span>                       <span className="w-4 h-[1px] bg-stone-700" />
                      <span className="group-hover:text-white transition-colors">Open →</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 4. EXPERTISE PILLARS */}
      {data?.expertisePillars && (
        <section className="w-full bg-[#111] py-24 px-8 border-t border-white/5">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
            {data.expertisePillars.map((p: any, i: number) => (
              <div key={i} className="space-y-4">
                <span className="text-stone-600 font-mono text-xs tracking-widest">0{i+1}</span>
                <h3 className="text-xl font-serif font-bold text-white">{p.title}</h3>
                <p className="text-stone-400 text-sm leading-relaxed">{p.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}