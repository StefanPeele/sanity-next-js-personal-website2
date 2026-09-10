// app/(personal)/photography/page.tsx
// Photography index: a deterministic selection of the newest frames (newest
// gallery first, image order preserved), filterable by ?category=<slug>.

import BookingSection from '@/components/BookingSection'
import CinematicGallery from '@/components/CinematicGallery'
import { galleryPhotos } from '@/components/photography/photo-utils'
import { slugify } from '@/lib/reading'
import { sanityFetch } from '@/sanity/lib/live'
import { categoriesQuery, galleriesQuery } from '@/sanity/lib/queries'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getCopy } from '@/lib/cms/loaders'
import { personalPagesQuery } from '@/sanity/lib/queries-services'
import { DEFAULT_PERSONAL_PAGES } from '@/lib/cms/defaults/personalPages'
import { FOCUS } from '@/lib/ui'

export async function generateMetadata(): Promise<Metadata> {
  const h = (await getCopy(personalPagesQuery, DEFAULT_PERSONAL_PAGES)).photography.index.header
  return { title: h.metaTitle || h.title, description: h.metaDescription || h.lede }
}

const RECENT_LIMIT = 15

function categoryKey(slug?: string | null, title?: string | null): string {
  return (slug || slugify(title ?? '')).toLowerCase()
}

export default async function PhotographyPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const copy = (await getCopy(personalPagesQuery, DEFAULT_PERSONAL_PAGES)).photography.index
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
        <h1 className="text-5xl md:text-6xl font-serif text-white mb-4 tracking-wide">{copy.header.title}</h1>
        <p className="text-stone-400 font-sans text-base max-w-xl mx-auto leading-relaxed mb-3">{copy.header.lede}</p>
        <p className="text-stone-400 font-sans text-sm mb-8">{copy.countLine.replace('{albums}', String(galleries.length)).replace('{frames}', String(totalFrames))}</p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative">
          <Link
            href="/photography/albums"
            className={`flex items-center justify-center px-6 py-3 border border-stone-700/50 hover:border-stone-400 bg-stone-900/50 backdrop-blur-md rounded-full text-stone-300 hover:text-white transition-all duration-500 text-sm font-sans ${FOCUS}`}
          >
            {copy.albumsCta}
          </Link>
          <BookingSection triggerLabel={copy.bookCta} />
        </div>
      </section>

      {/* ── Category filter (URL-driven) ─────────────────────────── */}
      {categories.length > 0 && (
        <nav aria-label="Filter by category" className="relative z-10 flex flex-wrap items-center justify-center gap-2 px-6 mb-12">
          <Link
            href="/photography"
            aria-current={!active ? 'page' : undefined}
 className={`meta-label px-4 py-2 rounded-full transition-colors ${FOCUS} ${
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
 className={`meta-label px-4 py-2 rounded-full transition-colors ${FOCUS} ${
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
          <h2 id="recent-heading" className="section-label mb-6">
            {activeCategory ? copy.recentWithCategory.replace('{category}', activeCategory.title ?? '') : copy.recentHeading}
          </h2>
          <div className="w-px h-16 bg-gradient-to-b from-stone-500/50 to-transparent" aria-hidden="true" />
        </div>
        <CinematicGallery photos={recent} />
        {filtered.length > 0 && (
          <div className="text-center mt-16">
            <Link href="/photography/albums" className={`meta-label text-stone-300 hover:text-white border-b border-stone-700 hover:border-white pb-1 transition-colors ${FOCUS}`}>
              {copy.browseAllLabel} →
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}
