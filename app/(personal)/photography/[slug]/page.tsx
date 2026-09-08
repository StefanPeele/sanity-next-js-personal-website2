// app/(personal)/photography/[slug]/page.tsx
import CinematicGallery from '@/components/CinematicGallery'
import { JsonLd } from '@/components/JsonLd'
import { galleryPhotos } from '@/components/photography/photo-utils'
import { SITE, absoluteUrl } from '@/lib/site'
import { client } from '@/sanity/lib/client'
import { sanityFetch } from '@/sanity/lib/live'
import { galleryBySlugQuery, slugsByTypeQuery } from '@/sanity/lib/queries'
import type { Metadata, ResolvingMetadata } from 'next'
import { draftMode } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCopy } from '@/lib/cms/loaders'
import { personalPagesQuery } from '@/sanity/lib/queries-services'
import { DEFAULT_PERSONAL_PAGES } from '@/lib/cms/defaults/personalPages'
import { FOCUS } from '@/lib/ui'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const { slug } = await params
  const { data: gallery } = await sanityFetch({ query: galleryBySlugQuery, params: { slug }, stega: false })
  if (!gallery) return {}
  const cover = gallery.mainImage?.asset?.url
  const description = gallery.overview ?? `${gallery.title} — ${gallery.images?.length ?? 0} photographs by ${SITE.name}.`
  return {
    title: gallery.title,
    description,
    alternates: { canonical: absoluteUrl(`/photography/${slug}`) },
    openGraph: {
      title: gallery.title,
      description,
      type: 'article',
      images: cover ? [{ url: `${cover}?w=1200&h=630&fit=crop&auto=format`, width: 1200, height: 630 }] : (await parent).openGraph?.images ?? [],
    },
  }
}

export async function generateStaticParams() {
  const data = await client.fetch(slugsByTypeQuery, { type: 'gallery' })
  return data.filter((d) => !!d.slug).map((d) => ({ slug: d.slug as string }))
}

export default async function AlbumPage({ params }: Props) {
  const copy = (await getCopy(personalPagesQuery, DEFAULT_PERSONAL_PAGES)).photography.gallery
  const { slug } = await params
  const { data: gallery } = await sanityFetch({ query: galleryBySlugQuery, params: { slug } })

  if (!gallery && !(await draftMode()).isEnabled) notFound()
  if (!gallery) {
    return <p className="pt-32 text-center font-mono text-xs text-stone-400 uppercase tracking-widest">Draft album — add content in the Studio.</p>
  }

  const photos = galleryPhotos(gallery)

  // Only fields with data are rendered — nothing is invented.
  const readout = [
    { label: copy.readoutLabels.location, value: gallery.location },
    { label: copy.readoutLabels.frames, value: copy.framesLabel.replace('{n}', String(photos.length)) },
    { label: copy.readoutLabels.camera, value: gallery.system },
    { label: copy.readoutLabels.lens, value: gallery.lens },
    { label: copy.readoutLabels.iso, value: gallery.iso },
  ].filter((r) => !!r.value)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    name: gallery.title,
    description: gallery.overview ?? undefined,
    url: absoluteUrl(`/photography/${slug}`),
    author: { '@type': 'Person', name: SITE.name, url: SITE.url },
    image: photos.slice(0, 10).map((p) => p.imageUrl),
  }

  return (
    <div className="min-h-screen text-stone-50 pt-24 pb-20 relative">
      <JsonLd data={jsonLd} />

      <div className="max-w-7xl mx-auto px-6 mb-20 relative z-10">
        <Link
          href="/photography/albums"
          className={`inline-flex items-center gap-2 text-stone-400 font-sans text-sm hover:text-white transition-colors mb-16 ${FOCUS}`}
        >
          <span aria-hidden="true">←</span> {copy.backLabel}
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-end border-b border-white/10 pb-16">
          <div className="lg:col-span-8">
            {gallery.category?.title && (
              <span className="text-amber-300 font-sans text-sm mb-4 block">{gallery.category.title}</span>
            )}
            <h1 className="text-5xl md:text-7xl font-serif tracking-tight text-white mb-6">{gallery.title}</h1>
            {gallery.overview && (
              <p className="text-stone-300 max-w-2xl font-serif text-lg italic leading-relaxed whitespace-pre-line">{gallery.overview}</p>
            )}
          </div>

          {readout.length > 0 && (
            <dl className="lg:col-span-4 grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
              {readout.map((r) => (
                <div key={r.label}>
                  <dt className="block text-stone-400 font-sans text-xs mb-1">{r.label}</dt>
                  <dd className="block text-stone-200 font-sans text-sm m-0">{r.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        {gallery.notes && (
          <p className="mt-8 max-w-2xl font-sans text-sm text-stone-400 leading-relaxed">
            <span className="text-stone-300 mr-2">{copy.notesLabel}:</span>{gallery.notes}
          </p>
        )}
      </div>

      <div className="relative z-10">
        <CinematicGallery photos={photos} developing={false} />
      </div>
    </div>
  )
}
