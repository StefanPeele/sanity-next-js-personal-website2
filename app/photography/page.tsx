// app/photography/page.tsx
import { client } from '@/sanity/lib/client'
import CinematicGallery from '@/components/CinematicGallery'
import AnimatedHero from '@/components/AnimatedHero' // <-- Import the new hero
import Link from 'next/link'

const galleryQuery = `*[_type == "gallery"] | order(_createdAt desc) {
  _id,
  title,
  "imageUrl": image.asset->url,
  caption,
  category
}`

export default async function PhotographyPage() {
  const photos = await client.fetch(galleryQuery)

  return (
    <main className="min-h-screen text-stone-50 pt-24 pb-20 px-4 md:px-8 transition-colors duration-500 relative bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-stone-800 via-stone-950 to-black overflow-hidden">
      
      {/* Cinematic Film Grain Overlay */}
      <div 
        className="pointer-events-none fixed inset-0 z-[100] h-full w-full opacity-[0.04] mix-blend-overlay" 
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      ></div>

      <Link 
        href="/" 
        className="absolute top-8 left-6 md:fixed md:top-10 md:left-10 z-[60] group flex items-center gap-3 text-stone-500 hover:text-white transition-all duration-500"
      >
        <svg className="w-5 h-5 transform transition-transform duration-500 group-hover:-translate-x-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span className="text-xs tracking-[0.3em] uppercase font-semibold hidden sm:block">Return</span>
      </Link>

      {/* THE UPGRADE: Replace static text with AnimatedHero */}
      <AnimatedHero />

      <CinematicGallery photos={photos} />
      
    </main>
  )
}