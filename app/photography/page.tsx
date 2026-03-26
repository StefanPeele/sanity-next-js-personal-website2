import { client } from '@/sanity/lib/client'
import Image from 'next/image'

// 1. The GROQ Query: This asks Sanity to grab all your gallery documents, 
// sorted by newest first, and extract the title, image URL, caption, and category.
const galleryQuery = `*[_type == "gallery"] | order(_createdAt desc) {
  _id,
  title,
  "imageUrl": image.asset->url,
  caption,
  category
}`

export default async function PhotographyPage() {
  // 2. Fetch the data from Sanity
  const photos = await client.fetch(galleryQuery)

  // 3. The Front-End UI
  return (
    <main className="container mx-auto px-5 py-20">
      <h1 className="text-4xl md:text-5xl font-bold mb-12 text-center">Photography Portfolio</h1>

      {/* The Photo Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {photos.map((photo: any) => (
          <div key={photo._id} className="flex flex-col group">
            
            {/* The Image Container */}
            {photo.imageUrl && (
              <div className="relative w-full h-80 overflow-hidden rounded-xl bg-gray-100">
                <Image
                  src={photo.imageUrl}
                  alt={photo.caption || photo.title || 'Photography portfolio image'}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            )}
            
            {/* The Text Underneath */}
            <div className="mt-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">{photo.title}</h2>
                {photo.category && (
                  <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                    {photo.category}
                  </span>
                )}
              </div>
              {photo.caption && <p className="text-gray-600 mt-2">{photo.caption}</p>}
            </div>

          </div>
        ))}
      </div>
    </main>
  )
}