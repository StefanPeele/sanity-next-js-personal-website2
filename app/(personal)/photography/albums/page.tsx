// app/(personal)/photography/albums/page.tsx
import { absoluteUrl } from '@/lib/site'
import { sanityFetch } from '@/sanity/lib/live'
import { galleriesQuery } from '@/sanity/lib/queries'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getCopy } from '@/lib/cms/loaders'
import { personalPagesQuery } from '@/sanity/lib/queries-services'
import { DEFAULT_PERSONAL_PAGES } from '@/lib/cms/defaults/personalPages'

export async function generateMetadata(): Promise<Metadata> {
  const a = (await getCopy(personalPagesQuery, DEFAULT_PERSONAL_PAGES)).photography.albums
  return { title: a.title, description: a.metaDescription }
}

const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400'

export default async function ArchivesPage() {
  const [{ data: galleries }, copy] = await Promise.all([
    sanityFetch({ query: galleriesQuery }),
    getCopy(personalPagesQuery, DEFAULT_PERSONAL_PAGES).then((c) => c.photography.albums),
  ])

  const title = copy.title
  const subtitle = copy.subtitle

  return (
    <div className="min-h-screen text-stone-50 pt-24 pb-20">
      <div className="text-center mb-24 px-6">
        <h1 className="text-5xl md:text-7xl font-serif tracking-tight text-white mb-6">{title}</h1>
        <p className="text-stone-400 font-sans text-base">{subtitle}</p>
      </div>

      {galleries.length > 0 ? (
        <ul className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 list-none m-0 p-0">
          {galleries.map((gallery) => {
            const cover = gallery.mainImage?.asset?.url
            const frames = gallery.images?.length ?? 0
            return (
              <li key={gallery._id}>
                <Link
                  href={`/photography/${gallery.slug}`}
                  className={`group block relative aspect-[4/5] bg-stone-900 overflow-hidden rounded-xl ${FOCUS}`}
                >
                  {cover && (
                    <Image
                      src={cover}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      placeholder={gallery.mainImage?.asset?.metadata?.lqip ? 'blur' : 'empty'}
                      blurDataURL={gallery.mainImage?.asset?.metadata?.lqip ?? undefined}
                      className="object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 group-focus-visible:opacity-100 transition-all duration-700 ease-out"
                    />
                  )}
                  <div className="absolute inset-0 p-6 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/20 to-transparent">
                    <span className="text-amber-400 font-mono text-[9px] tracking-widest uppercase mb-2 block">
                      {gallery.category?.title || copy.uncategorized}{frames ? ` · ${copy.framesLabel.replace('{n}', String(frames))}` : ''}
                    </span>
                    <h2 className="text-white text-xl font-serif">{gallery.title}</h2>
                    {gallery.location && (
                      <span className="text-stone-400 font-mono text-[9px] uppercase tracking-widest mt-1">{gallery.location}</span>
                    )}
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-center text-stone-400 font-mono text-xs mt-10">No albums published yet.</p>
      )}
    </div>
  )
}
