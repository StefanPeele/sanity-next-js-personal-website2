import type { Metadata } from 'next'
import Link from 'next/link'
import { sanityFetch } from '@/sanity/lib/live'
import { featuredArchiveQuery } from '@/sanity/lib/queries'
import { formatDate } from '@/lib/dates'
import { articleTypeMeta } from '@/lib/site'
import { getTaxonomy } from '@/lib/cms/loaders'
import { FOCUS, QUIET_LINK } from '@/lib/ui'
// app/(archive)/blog/featured/page.tsx
//
// The archive of what has been highlighted, and the reason `featuredAt` replaced an
// `isFeatured` boolean. A boolean cannot have a history: "every post I have flagged" meant
// "the post that is flagged", so featuring something new erased the last one and this page
// could only ever have had one row in it.
//
// THE NOTE IS THE CONTENT HERE. A list of posts there is already an index for is not a
// reason to build a route. A list where each entry says why it mattered at the time is a
// record of editorial judgement, and it is the cheapest thing on this site that makes it
// read as a publication with a beat rather than a blog with a flag.
//
// No cards and no cover images, deliberately: an image grid would bury the sentence that is
// the whole point.

export const metadata: Metadata = {
  title: 'Featured',
  description: 'Every post I have put at the top of the blog, and why, at the time.',
  alternates: { canonical: '/blog/featured' },
}

export default async function FeaturedPage() {
  const [{ data }, taxonomy] = await Promise.all([
    sanityFetch({ query: featuredArchiveQuery }),
    getTaxonomy(),
  ])
  const posts = (data ?? []).filter((p) => p.slug)

  return (
    <main id="content" className="relative max-w-3xl mx-auto px-6 pt-32 pb-24">
      <header className="mb-16">
        <Link href="/blog" className={`font-sans text-sm ${QUIET_LINK}`}>← Blog</Link>
        <h1 className="mt-6 text-5xl font-serif font-bold tracking-tight text-white leading-none">Featured</h1>
        <p className="mt-4 font-sans text-base text-stone-400 leading-relaxed max-w-2xl">
          Every post I have put at the top of the blog, newest first, with the reason I chose
          it at the time. The reasons are not edited afterwards.
        </p>
      </header>

      {posts.length === 0 ? (
        <p className="font-sans text-base text-stone-400">
          Nothing featured yet. The first one will appear here the day it goes up.
        </p>
      ) : (
        <ul className="list-none m-0 p-0 space-y-12">
          {posts.map((p) => {
            const lane = articleTypeMeta(p.articleType, taxonomy.articleLanes)
            return (
              <li key={p._id}>
                <p className="meta-label text-sm mb-1" style={lane ? { color: lane.color } : undefined}>
                  <time dateTime={p.featuredAt ?? undefined}>{formatDate(p.featuredAt, 'short', '')}</time>
                  {lane && ` · ${lane.label}`}
                </p>
                <h2 className="text-2xl font-serif font-semibold text-white leading-snug">
                  <Link href={`/blog/${p.slug}`} className={`hover:text-stone-200 transition-colors rounded-sm ${FOCUS}`}>
                    {p.title}
                  </Link>
                </h2>
                {/* The note, not the excerpt. The excerpt is on the index already; this is
                    the sentence that only exists here. */}
                {p.featuredNote && (
                  <p className="mt-2 font-sans text-base text-stone-300 leading-relaxed">{p.featuredNote}</p>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
