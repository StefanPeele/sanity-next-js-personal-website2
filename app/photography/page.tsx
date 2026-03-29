import { client } from '@/sanity/lib/client'
import CinematicGallery from '@/components/CinematicGallery'

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
    // We are forcing a deep stone-950 background and light text specifically for this page!
    <main className="bg-stone-950 min-h-screen text-stone-50 pt-24 pb-20 px-4 md:px-8 transition-colors duration-500">
      
      {/* High-End Editorial Header */}
      <div className="max-w-4xl mx-auto text-center mb-16 mt-10">
        <h1 className="text-5xl md:text-7xl font-bold font-serif mb-6 tracking-tight">
          The Gallery
        </h1>
        <p className="text-lg md:text-xl text-stone-400 font-sans leading-relaxed max-w-2xl mx-auto">
          A curated collection of cinematic moments, capturing the essence of sports, portraits, and live events.
        </p>
      </div>

      {/* Render our upgraded interactive Client Component */}
      <CinematicGallery photos={photos} />
      
    </main>
  )
}