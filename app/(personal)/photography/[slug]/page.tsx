import { sanityFetch } from '@/sanity/lib/live'
import Link from 'next/link'
import CinematicGallery from '@/components/CinematicGallery' 
import { galleryBySlugQuery } from '@/sanity/lib/queries'
import { notFound } from 'next/navigation'

// 1. UPDATE: params is now a Promise in Next.js 15+
export default async function AlbumPage({ params }: { params: Promise<{ slug: string }> }) {
  
  // 2. UPDATE: Await the params to extract the slug correctly
  const resolvedParams = await params

  // Fetch the specific gallery based on the URL slug
  const { data: gallery } = await sanityFetch({ 
    query: galleryBySlugQuery, 
    params: { slug: resolvedParams.slug } // Now it has the actual string!
  })

  if (!gallery) {
    notFound()
  }

  // Map the gallery's images so they perfectly match what your 
  // CinematicGallery component expects
  const formattedImages = (gallery.images || []).map((img: any) => ({
    ...img, // This safely brings in imageUrl, lqip, aperture, shutter, iso, etc!
    _id: img._key,
    category: gallery.category?.title,
    title: gallery.title,
    // Use the specific override if it exists, otherwise fall back to the album settings
    system: img.systemOverride || gallery.system,
    lens: img.lensOverride || gallery.lens,
    location: gallery.location,
  }))

  return (
    <main className="min-h-screen bg-black text-stone-50 pt-32 pb-20 relative overflow-hidden rounded-xl">
      
      {/* Cinematic Film Grain Overlay */}
      <div 
        className="pointer-events-none fixed inset-0 z-[100] h-full w-full opacity-[0.04] mix-blend-overlay" 
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      ></div>

      <div className="max-w-7xl mx-auto px-6 mb-20 relative z-10">
        
        {/* Navigation */}
        <Link 
          href="/photography/albums" 
          className="inline-flex items-center gap-2 text-stone-500 font-mono text-[10px] tracking-[0.3em] uppercase hover:text-white transition-colors mb-16"
        >
          <span>←</span> Return to Archives
        </Link>

        {/* Editorial Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-end border-b border-white/10 pb-16">
          
          {/* Title & Category (Left side) */}
          <div className="lg:col-span-8">
            <span className="text-red-500 font-mono text-[10px] tracking-[0.4em] uppercase mb-4 block">
              {gallery.category?.title || 'Volume'}
            </span>
            <h1 className="text-5xl md:text-7xl font-serif tracking-tight text-white mb-6">
              {gallery.title}
            </h1>
            {gallery.description && (
              <p className="text-stone-400 max-w-2xl font-serif text-lg italic leading-relaxed">
                {gallery.description}
              </p>
            )}
          </div>

          {/* Technical Readout (Right side) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
              <div>
                <span className="block text-stone-600 font-mono text-[8px] uppercase tracking-widest mb-1">Location</span>
                <span className="block text-stone-300 font-mono text-[10px] uppercase tracking-wider">{gallery.location || 'Undisclosed'}</span>
              </div>
              <div>
                <span className="block text-stone-600 font-mono text-[8px] uppercase tracking-widest mb-1">Frames</span>
                <span className="block text-stone-300 font-mono text-[10px] uppercase tracking-wider">{formattedImages.length} Captures</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
              <div>
                <span className="block text-stone-600 font-mono text-[8px] uppercase tracking-widest mb-1">System</span>
                <span className="block text-stone-300 font-mono text-[10px] uppercase tracking-wider">{gallery.system || 'Digital Format'}</span>
              </div>
              <div>
                <span className="block text-stone-600 font-mono text-[8px] uppercase tracking-widest mb-1">Primary Lens</span>
                <span className="block text-stone-300 font-mono text-[10px] uppercase tracking-wider">{gallery.lens || 'Prime Array'}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* The Gallery Drop-in */}
      <div className="relative z-10">
        <CinematicGallery photos={formattedImages} />
      </div>

    </main>
  )
}