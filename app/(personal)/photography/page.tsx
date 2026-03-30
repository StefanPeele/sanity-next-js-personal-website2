import { sanityFetch } from '@/sanity/lib/live'
import { galleriesQuery, categoriesQuery } from '@/sanity/lib/queries'
import CinematicGallery from '@/components/CinematicGallery'
import BookingSection from '@/components/BookingSection'
import Link from 'next/link'

// 1. Locally defined GalleryPhoto to fix the TS export error
export interface GalleryPhoto {
  _id: string
  title: string
  imageUrl: string
  lqip?: string
  category?: string
  location?: string | null
  system?: string | null
  lens?: string | null
  aperture?: string | null
  shutter?: string | null
  iso?: string | null
  notes?: string | null
}

// 2. Updated Interface to fix the SanityGallery property errors
interface SanityGallery {
  _id: string
  title: string | null
  slug: string | null
  location?: string | null
  system?: string | null
  lens?: string | null
  mainImage?: {
    asset?: {
      url: string | null
      metadata?: { lqip: string | null }
    }
  } | null
  category?: { title: string | null; slug: string | null; themeColor?: string } | null
  images?: any[] | null
}

export default async function PhotographyPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams

  const [{ data: galleriesData }, { data: categoriesData }] = await Promise.all([
    sanityFetch({ query: galleriesQuery }),
    sanityFetch({ query: categoriesQuery }),
  ])

  const allGalleries = (galleriesData as any) as SanityGallery[]

  const flattenedPhotos: GalleryPhoto[] = allGalleries.flatMap((gallery) => 
    (gallery.images || []).map((img: any) => ({
      _id: img._key || Math.random().toString(36).substring(7),
      title: img.title ?? gallery.title ?? 'Untitled',
      imageUrl: img.imageUrl ?? img.asset?.url ?? '',
      lqip: img.lqip ?? img.asset?.metadata?.lqip ?? '',
      category: gallery.category?.title ?? 'Archive',
      location: gallery.location ?? null,
      system: gallery.system ?? null,
      lens: gallery.lens ?? null,
      aperture: img.aperture ?? null,
      shutter: img.shutter ?? null,
      iso: img.iso ?? null,
      notes: img.notes ?? null
    }))
  ).filter(p => p.imageUrl).slice(0, 15)

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-stone-50 pb-20 relative overflow-hidden">
      
      <div 
        className="pointer-events-none fixed inset-0 z-[100] h-full w-full opacity-[0.04] mix-blend-overlay" 
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      />

      <Link 
        href="/" 
        className="absolute top-8 left-6 md:fixed md:top-10 md:left-10 z-[60] group flex items-center gap-3 text-stone-500 hover:text-white transition-all duration-500"
      >
        <svg className="w-5 h-5 transform transition-transform duration-500 group-hover:-translate-x-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span className="text-xs tracking-[0.3em] uppercase font-semibold hidden sm:block">Return</span>
      </Link>

      <section className="relative z-20 flex flex-col items-center justify-center pt-32 pb-16 text-center px-6">
        <h1 className="text-5xl md:text-6xl font-serif text-white mb-6 tracking-wide">The Gallery</h1>
        <p className="text-stone-500 font-mono text-[9px] md:text-[10px] tracking-[0.3em] uppercase max-w-xl mx-auto leading-relaxed mb-8">
          A curated collection of cinematic moments, capturing the essence of sports, portraits, and live events.
        </p>
        
        {/* Buttons side-by-side. View Albums route updated to fix 404 */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative">
          <Link 
            href="/photography/albums" 
            className="flex items-center justify-center px-6 py-3 border border-stone-700/50 hover:border-stone-400 bg-stone-900/50 backdrop-blur-md rounded-full text-stone-300 hover:text-white transition-all duration-500 text-xs tracking-[0.2em] uppercase font-semibold"
          >
            View Albums
          </Link>
          <BookingSection />
        </div>
      </section>

      <section className="relative z-10 w-full min-h-[50vh] mb-32 pt-10 mt-8">
        <div className="max-w-7xl mx-auto px-6 mb-16 flex flex-col items-center text-center">
          <h2 className="text-xs font-mono tracking-[0.4em] uppercase text-stone-500 mb-6">Recent Captures</h2>
          <div className="w-[1px] h-16 bg-gradient-to-b from-stone-500/50 to-transparent"></div>
        </div>
        <div className="w-full">
          <CinematicGallery photos={flattenedPhotos} />
        </div>
      </section>

    </main>
  )
}