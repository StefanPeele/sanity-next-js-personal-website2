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
    <main className="container mx-auto px-5 py-20 min-h-screen">
      
      {/* High-End Editorial Header */}
      <div className="max-w-3xl mx-auto text-center mb-16">
        <h1 className="text-5xl md:text-7xl font-bold text-stone-800 font-serif mb-6">
          The Gallery
        </h1>
        <p className="text-lg text-stone-500 font-sans leading-relaxed">
          A curated collection of cinematic moments, capturing the essence of sports, portraits, and live events.
        </p>
      </div>

      {/* Render our interactive Client Component */}
      <CinematicGallery photos={photos} />
      
    </main>
  )
}