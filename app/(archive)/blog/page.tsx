import { Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { sanityFetch } from '@/sanity/lib/live'
import { blogIndexQuery } from '@/sanity/lib/queries'
import { BlogDirectory } from '@/components/blog/BlogDirectory'
import { PostCardSkeleton } from '@/components/blog/PostCardSkeleton'
import { JsonLd } from '@/components/JsonLd'
import { formatDate } from '@/lib/dates'
import { readingTime } from '@/lib/reading'
import { absoluteUrl, articleTypeMeta, SITE } from '@/lib/site'
// app/(archive)/blog/page.tsx
// Supports ?category= ?lane= ?tag= ?sort= (handled client-side in BlogDirectory).

export const metadata: Metadata = {
  title: 'Writing',
  description: 'Perspective pieces, concept deep dives, and field notes on network engineering, infrastructure, and the work of learning it.',
  alternates: { canonical: '/blog' },
}

export default async function BlogPage() {
  const { data } = await sanityFetch({ query: blogIndexQuery })
  const featuredPost = data?.featuredPost ?? null
  const posts = (data?.posts ?? []).filter((p) => p.slug && p.title)
  const series = data?.series ?? []
  const currentlyReading = data?.currentlyReading ?? []
  const recentNotes = (data?.recentNotes ?? []).filter((n) => n.slug)

  const allCategories: string[] = Array.from(
    new Set(posts.flatMap((p) => (p.categories ?? []).filter((c): c is string => Boolean(c)))),
  ).sort()

  const totalCount = posts.length + (featuredPost ? 1 : 0)
  const latestDate = formatDate(posts[0]?.publishedAt ?? featuredPost?.publishedAt, 'short') || null
  const featuredMeta = articleTypeMeta(featuredPost?.articleType)

  const allPosts = [featuredPost, ...posts].filter((p): p is NonNullable<typeof p> => Boolean(p))

  return (
    <div className="relative min-h-screen text-stone-300 selection:bg-stone-500/30">
      <JsonLd
        data={[
          {
            '@context': 'https://schema.org',
            '@type': 'Blog',
            name: 'Editorial',
            url: absoluteUrl('/blog'),
            description: metadata.description,
            author: { '@type': 'Person', name: SITE.name, url: SITE.url },
            blogPost: allPosts.slice(0, 30).map((p) => ({
              '@type': 'BlogPosting',
              headline: p.title,
              url: absoluteUrl(`/blog/${p.slug}`),
              datePublished: p.publishedAt ?? undefined,
              description: p.excerpt ?? undefined,
              image: p.imageUrl ?? undefined,
            })),
          },
          {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'Writing archive',
            url: absoluteUrl('/blog'),
            mainEntity: { '@type': 'ItemList', numberOfItems: totalCount },
          },
        ]}
      />

      <main id="content" className="relative max-w-7xl mx-auto px-6 pt-32 pb-24">
        {/* ─── HEADER ─────────────────────────────────────────────── */}
        <header className="mb-12 border-b border-white/5 pb-8 flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
            <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-stone-500 block mb-4 border-l border-stone-700 pl-4">
              Intelligence // Archive
            </span>
            <h1 className="text-5xl md:text-7xl font-serif font-bold tracking-tight text-white leading-none">
              Editorial<span className="text-stone-600">.</span>
            </h1>
          </div>
          <div className="font-mono text-[9px] uppercase tracking-widest text-stone-500 text-right">
            {totalCount} post{totalCount === 1 ? '' : 's'} · {series.length} series<br />
            Latest: {latestDate ?? '—'}
          </div>
        </header>

        {/* ─── HERO FEATURED POST ──────────────────────────────────── */}
        {featuredPost && featuredPost.slug && (
          <>
            <div className="mb-6 pb-6">
              <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-stone-500 block border-l border-stone-700 pl-4">
                Featured // Latest Report
              </span>
            </div>

            <Link
              href={`/blog/${featuredPost.slug}`}
              className="block group mb-20 relative overflow-hidden rounded-lg border border-white/10 min-h-[480px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
            >
              <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/70 to-transparent transition-opacity duration-500 group-hover:opacity-90" />

              {featuredPost.imageUrl ? (
                <Image
                  src={featuredPost.imageUrl}
                  alt=""
                  fill
                  priority
                  sizes="(max-width: 1280px) 100vw, 1280px"
                  placeholder={featuredPost.lqip ? 'blur' : 'empty'}
                  blurDataURL={featuredPost.lqip ?? undefined}
                  className="object-cover transition-transform duration-1000 group-hover:scale-105"
                  style={{ filter: 'grayscale(70%)' }}
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900">
                  <div
                    className="absolute inset-0 opacity-50"
                    style={{ backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 16px)' }}
                  />
                </div>
              )}

              <div className="relative z-20 pt-64 pb-12 px-8 md:px-16 flex flex-col justify-end h-full">
                <div className="flex gap-3 mb-4 flex-wrap">
                  <span className="bg-white text-black font-mono text-[9px] tracking-[0.2em] uppercase px-3 py-1 rounded-sm">Featured</span>
                  {featuredMeta && (
                    <span className="font-mono text-[9px] tracking-[0.2em] uppercase px-3 py-1 rounded-sm border backdrop-blur-md" style={{ color: featuredMeta.color, borderColor: `${featuredMeta.color}66`, backgroundColor: featuredMeta.bg }}>
                      {featuredMeta.label}
                    </span>
                  )}
                  {featuredPost.categories?.filter(Boolean).map((cat) => (
                    <span key={cat} className="border border-stone-600 text-stone-300 font-mono text-[9px] tracking-[0.2em] uppercase px-3 py-1 rounded-sm backdrop-blur-md bg-black/30">
                      {cat}
                    </span>
                  ))}
                </div>

                <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white mb-4 group-hover:text-stone-200 transition-colors leading-tight">
                  {featuredPost.title}
                </h2>

                <p className="text-stone-300 font-sans text-base md:text-lg max-w-2xl mb-6 line-clamp-2 leading-relaxed">{featuredPost.excerpt}</p>

                <div className="flex items-center gap-4 font-mono text-[10px] text-stone-400 uppercase tracking-widest">
                  <time dateTime={formatDate(featuredPost.publishedAt, 'iso')}>{formatDate(featuredPost.publishedAt, 'short', 'Undated')}</time>
                  <span className="text-stone-600" aria-hidden="true">•</span>
                  <span>{readingTime(featuredPost.wordCount ?? 0)} min read</span>
                  <span className="ml-auto text-white group-hover:translate-x-1 transition-transform inline-block">Read Report →</span>
                </div>
              </div>
            </Link>
          </>
        )}

        {/* ─── DIRECTORY + FILTER + GRID ───────────────────────────── */}
        <Suspense
          fallback={
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" aria-busy="true">
              {Array.from({ length: 3 }).map((_, i) => <PostCardSkeleton key={i} />)}
            </div>
          }
        >
          <BlogDirectory
            posts={posts}
            categories={allCategories}
            totalCount={totalCount}
            latestDate={latestDate}
            series={series}
            currentlyReading={currentlyReading}
            recentNotes={recentNotes}
          />
        </Suspense>
      </main>
    </div>
  )
}
