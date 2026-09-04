// app/(personal)/photography/page.tsx
// Photography index: a deterministic selection of the newest frames (newest
// gallery first, image order preserved), filterable by ?category=<slug>.

import BookingSection from '@/components/BookingSection'
import CinematicGallery from '@/components/CinematicGallery'
import { galleryPhotos } from '@/components/photography/photo-utils'
import { slugify } from '@/lib/reading'
import { absoluteUrl } from '@/lib/site'
import { sanityFetch } from '@/sanity/lib/live'
import { categoriesQuery, galleriesQuery } from '@/sanity/lib/queries'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Photography',
  description: 'Sports, portraits, graduation and event photography by Stefan Peele — recent frames from the archive, with albums and booking.',
  alternates: { canonical: absoluteUrl('/photography') },
}

const RECENT_LIMIT = 15
const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400'

function categoryKey(slug?: string | null, title?: string | null): string {
  return (slug || slugify(title ?? '')).toLowerCase()
}

export default async function PhotographyPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams
  const active = category ? category.toLowerCase() : null

  const [{ data: galleries }, { data: categories }] = await Promise.all([
    sanityFetch({ query: galleriesQuery }),
    sanityFetch({ query: categoriesQuery }),
  ])

  const filtered = active
    ? galleries.filter((g) => categoryKey(g.category?.slug, g.category?.title) === active)
    : galleries

  // galleriesQuery is ordered by _createdAt desc; keep image order inside each gallery.
  const recent = filtered.flatMap((g) => galleryPhotos(g)).slice(0, RECENT_LIMIT)
  const totalFrames = galleries.reduce((n, g) => n + (g.images?.length ?? 0), 0)
  const activeCategory = categories.find((c) => categoryKey(c.slug, c.title) === active)

  return (
    <div className="min-h-screen text-stone-50 pb-20 relative">
      <section className="relative z-20 flex flex-col items-center justify-center pt-24 pb-12 text-center px-6">
        <span className="text-stone-400 font-mono text-[10px] tracking-[0.4em] uppercase mb-6 block">
          Visual archive · {galleries.length} {galleries.length === 1 ? 'album' : 'albums'} · {totalFrames} frames
        </span>
        <h1 className="text-5xl md:text-6xl font-serif text-white mb-6 tracking-wide">The Gallery</h1>
        <p className="text-stone-400 font-mono text-[10px] md:text-[11px] tracking-[0.25em] uppercase max-w-xl mx-auto leading-relaxed mb-8">
          Sports, portraits, graduations and live events — shot in and around Newark, NJ.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative">
          <Link
            href="/photography/albums"
            className={`flex items-center justify-center px-6 py-3 border border-stone-700/50 hover:border-stone-400 bg-stone-900/50 backdrop-blur-md rounded-full text-stone-300 hover:text-white transition-all duration-500 text-xs tracking-[0.2em] uppercase font-semibold ${FOCUS}`}
          >
            See all albums
          </Link>
          <BookingSection triggerLabel="Book a session" />
        </div>
      </section>

      {/* ── Category filter (URL-driven) ─────────────────────────── */}
      {categories.length > 0 && (
        <nav aria-label="Filter by category" className="relative z-10 flex flex-wrap items-center justify-center gap-2 px-6 mb-12">
          <Link
            href="/photography"
            aria-current={!active ? 'page' : undefined}
            className={`px-4 py-2 rounded-full font-mono text-[10px] uppercase tracking-[0.25em] transition-colors ${FOCUS} ${
              !active ? 'bg-white text-black' : 'text-stone-300 hover:text-white border border-white/10 hover:border-white/30'
            }`}
          >
            All
          </Link>
          {categories.map((c) => {
            const key = categoryKey(c.slug, c.title)
            const isActive = key === active
            return (
              <Link
                key={c._id}
                href={`/photography?category=${encodeURIComponent(key)}`}
                aria-current={isActive ? 'page' : undefined}
                className={`px-4 py-2 rounded-full font-mono text-[10px] uppercase tracking-[0.25em] transition-colors ${FOCUS} ${
                  isActive ? 'bg-white text-black' : 'text-stone-300 hover:text-white border border-white/10 hover:border-white/30'
                }`}
              >
                {c.title}
              </Link>
            )
          })}
        </nav>
      )}

      <section className="relative z-10 w-full min-h-[50vh] mb-24" aria-labelledby="recent-heading">
        <div className="max-w-7xl mx-auto px-6 mb-12 flex flex-col items-center text-center">
          <h2 id="recent-heading" className="text-xs font-mono tracking-[0.4em] uppercase text-stone-400 mb-6 font-sans">
            {activeCategory ? `Recent · ${activeCategory.title}` : 'Recent captures'}
          </h2>
          <div className="w-px h-16 bg-gradient-to-b from-stone-500/50 to-transparent" aria-hidden="true" />
        </div>
        <CinematicGallery photos={recent} />
        {filtered.length > 0 && (
          <div className="text-center mt-16">
            <Link href="/photography/albums" className={`font-mono text-[10px] uppercase tracking-[0.3em] text-stone-300 hover:text-white border-b border-stone-700 hover:border-white pb-1 transition-colors ${FOCUS}`}>
              Browse every album →
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}
