import { sanityFetch } from '@/sanity/lib/live'
import { galleriesQuery, categoriesQuery } from '@/sanity/lib/queries'
import CinematicGallery, { type GalleryPhoto } from '@/components/CinematicGallery'
import AnimatedHero from '@/components/AnimatedHero'
import BookingSection from '@/components/BookingSection'
import Link from 'next/link'
import Image from 'next/image'

// 1. Updated Interface: Includes 'location' and handles Sanity 'null' returns
interface SanityGallery {
  _id: string
  title: string | null
  slug: string | null
  location?: string | null // Fixed: Was missing in your previous version
  mainImage?: {
    asset?: {
      url: string | null
      metadata?: { lqip: string | null }
    }
  } | null
  category?: { title: string | null; slug: string | null } | null
  images?: any[] | null
}

export default async function PhotographyPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams

  // 1. Fetch Galleries and Categories in parallel
  const [{ data: galleriesData }, { data: categoriesData }] = await Promise.all([
    sanityFetch({ query: galleriesQuery }),
    sanityFetch({ query: categoriesQuery }),
  ])

  // Cast as the local interface to resolve the type mismatch error
  const allGalleries = (galleriesData as any) as SanityGallery[]
  const categories = (categoriesData as any) || []

  // 2. Filter logic for the "Archives" Grid
  const filteredGalleries = category 
    ? allGalleries.filter(g => g.category?.slug === category)
    : allGalleries

  // 3. Flattened photos for the Cinematic Scroller
  const flattenedPhotos: GalleryPhoto[] = allGalleries.flatMap((gallery) => 
    (gallery.images || []).map((img: any) => ({
      _id: img._key || Math.random().toString(36).substring(7),
      title: img.title || gallery.title || 'Untitled',
      imageUrl: img.imageUrl || img.asset?.url || '',
      lqip: img.lqip || img.asset?.metadata?.lqip || '',
      category: gallery.category?.title || 'Archive',
      location: gallery.location || '' // Now safe to use!
    }))
  ).filter(p => p.imageUrl).slice(0, 15)

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-stone-50 pb-32 relative overflow-hidden">
      
      {/* Cinematic Film Grain Overlay */}
      <div 
        className="pointer-events-none fixed inset-0 z-[100] h-full w-full opacity-[0.04] mix-blend-overlay" 
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      ></div>

      {/* Navigation */}
      <Link 
        href="/" 
        className="absolute top-8 left-6 md:fixed md:top-10 md:left-10 z-[60] group flex items-center gap-3 text-stone-500 hover:text-white transition-all duration-500"
      >
        <svg className="w-5 h-5 transform transition-transform duration-500 group-hover:-translate-x-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span className="text-xs tracking-[0.3em] uppercase font-semibold hidden sm:block">Return</span>
      </Link>

      <AnimatedHero />
      <BookingSection />

      {/* Highlights Scroller */}
      <section className="py-20 border-y border-white/5 bg-stone-950/30">
        <div className="px-6 mb-12">
            <h2 className="text-xs font-mono tracking-[0.4em] uppercase text-stone-600">Recent Captures</h2>
        </div>
        <CinematicGallery photos={flattenedPhotos} />
      </section>

      {/* Archives Grid */}
      <section className="max-w-7xl mx-auto px-6 mt-32">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div>
            <h2 className="text-5xl font-serif text-white mb-4">The Archives</h2>
            <p className="text-stone-500 font-mono text-[10px] tracking-[0.3em] uppercase">
              Browse by Volume and Collection
            </p>
          </div>

          <nav className="flex flex-wrap gap-4 border-b border-white/5 pb-2">
            <Link 
              href="/photography"
              className={`text-[10px] uppercase tracking-widest transition-colors ${!category ? 'text-red-500' : 'text-stone-500 hover:text-white'}`}
            >
              All
            </Link>
            {categories.map((cat: any) => (
              <Link
                key={cat._id}
                href={`/photography?category=${cat.slug}`}
                className={`text-[10px] uppercase tracking-widest transition-colors ${category === cat.slug ? 'text-red-500' : 'text-stone-500 hover:text-white'}`}
              >
                {cat.title}
              </Link>
            ))}
          </nav>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-20">
          {filteredGalleries.map((gallery) => (
            <Link 
              key={gallery._id} 
              href={gallery.slug ? `/photography/${gallery.slug}` : '#'} 
              className="group block"
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-stone-900 mb-6 border border-white/5">
                {gallery.mainImage?.asset?.url ? (
                  <Image
                    src={gallery.mainImage.asset.url}
                    alt={gallery.title || 'Archive'}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    placeholder={gallery.mainImage.asset.metadata?.lqip ? 'blur' : 'empty'}
                    blurDataURL={gallery.mainImage.asset.metadata?.lqip || ''}
                    className="object-cover transition-transform duration-1000 scale-[1.01] group-hover:scale-110"
                  />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center border border-white/5">
                        <span className="text-[9px] font-mono text-stone-700 uppercase tracking-widest">No Cover Image</span>
                    </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                    <span className="text-white font-mono text-[10px] uppercase tracking-[0.5em] border border-white/20 px-4 py-2 backdrop-blur-sm">View Volume</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                    <span className="text-red-500 font-mono text-[9px] tracking-[0.2em] uppercase">
                        {gallery.category?.title || 'Collection'}
                    </span>
                    <div className="h-[1px] flex-grow bg-white/10" />
                </div>
                <h3 className="text-2xl font-serif text-stone-200 group-hover:text-white transition-colors duration-500">
                  {gallery.title || 'Untitled'}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}