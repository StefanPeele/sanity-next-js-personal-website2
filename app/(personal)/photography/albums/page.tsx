import { sanityFetch } from '@/sanity/lib/live'
import { galleriesQuery, settingsQuery } from '@/sanity/lib/queries'
import Link from 'next/link'
import Image from 'next/image'

export default async function ArchivesPage() {
  // 1. Fetch live data from Sanity
  const { data: galleries } = await sanityFetch({ query: galleriesQuery })
  const { data: settings } = await sanityFetch({ query: settingsQuery })

  // 2. Set dynamic title/subtitle with safe fallbacks
  const title = settings?.archiveTitle || "The Archives"
  const subtitle = settings?.archiveSubtitle || "STRUCTURED VOLUMES AND EDITORIAL COLLECTIONS."

  return (
    <main className="min-h-screen bg-black text-stone-50 pt-32 pb-20">
      
      {/* Header Section */}
      <div className="text-center mb-24 px-6">
        <h1 className="text-5xl md:text-7xl font-serif tracking-tight text-white mb-6">
          {title}
        </h1>
        <p className="text-stone-500 font-mono text-[10px] tracking-[0.3em] uppercase">
          {subtitle}
        </p>
      </div>

      {/* Dynamic Grid Section */}
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
        {galleries?.length > 0 ? (
          galleries.map((gallery: any) => (
            <Link 
              key={gallery._id} 
              href={`/photography/${gallery.slug}`}
              className="group block relative aspect-[4/5] bg-stone-900 overflow-hidden"
            >
              {gallery.mainImage?.asset?.url && (
                <Image 
                  src={gallery.mainImage.asset.url} 
                  alt={gallery.title} 
                  fill
                  className="object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 ease-out"
                />
              )}
              
              <div className="absolute inset-0 p-6 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/20 to-transparent">
                <span className="text-red-500 font-mono text-[9px] tracking-widest uppercase mb-2 block">
                  {gallery.category?.title || 'Volume'}
                </span>
                <h2 className="text-white text-xl font-serif">{gallery.title}</h2>
              </div>
            </Link>
          ))
        ) : (
          <p className="col-span-full text-center text-stone-600 font-mono text-xs mt-10">
            No collections published yet.
          </p>
        )}
      </div>

    </main>
  )
}