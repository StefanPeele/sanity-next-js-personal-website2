// app/(personal)/photography/page.tsx
import { client } from '@/sanity/lib/client'
import CinematicGallery from '@/components/CinematicGallery'
import AnimatedHero from '@/components/AnimatedHero'
import BookingSection from '@/components/BookingSection'

const galleryQuery = `*[_type == "gallery"] | order(_createdAt desc) {
  _id,
  title,
  "imageUrl": image.asset->url,
  "lqip": image.asset->metadata.lqip,
  caption,
  category,
  system,
  lens,
  aperture,
  shutter,
  iso,
  location,
  notes
}`

export default async function PhotographyPage() {
  const photos = await client.fetch(galleryQuery)

  return (
    <main className="min-h-screen text-stone-50 pt-12 pb-20 transition-colors duration-500 relative bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-stone-800 via-stone-950 to-black overflow-hidden rounded-xl">
      
      {/* Cinematic Film Grain Overlay */}
      <div 
        className="pointer-events-none fixed inset-0 z-[100] h-full w-full opacity-[0.04] mix-blend-overlay" 
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      ></div>

      <AnimatedHero />

      <BookingSection />

      <CinematicGallery photos={photos} />
      
    </main>
  )
}