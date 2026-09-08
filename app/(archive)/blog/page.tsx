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
import { getCopy, getTaxonomy } from '@/lib/cms/loaders'
import { blogPageQuery } from '@/sanity/lib/queries-article-ui'
import { DEFAULT_BLOG_PAGE } from '@/lib/cms/defaults/blogPage'
// app/(archive)/blog/page.tsx
// Supports ?category= ?lane= ?tag= ?sort= (handled client-side in BlogDirectory).

export async function generateMetadata(): Promise<Metadata> {
  const copy = await getCopy(blogPageQuery, DEFAULT_BLOG_PAGE)
  return { title: copy.header.metaTitle || copy.header.title, description: copy.header.metaDescription || copy.header.lede, alternates: { canonical: '/blog' } }
}

export default async function BlogPage() {
  const [{ data }, copy, taxonomy] = await Promise.all([sanityFetch({ query: blogIndexQuery }), getCopy(blogPageQuery, DEFAULT_BLOG_PAGE), getTaxonomy()])
  const featuredPost = data?.featuredPost ?? null
  // `posts` now contains every post; drop the one shown in the featured slot.
  const posts = (data?.posts ?? []).filter((p) => p.slug && p.title && p._id !== featuredPost?._id)
  const series = data?.series ?? []
  const currentlyReading = data?.currentlyReading ?? []
  const recentNotes = (data?.recentNotes ?? []).filter((n) => n.slug)

  const allCategories: string[] = Array.from(
    new Set(posts.flatMap((p) => (p.categories ?? []).filter((c): c is string => Boolean(c)))),
  ).sort()

  const totalCount = posts.length + (featuredPost ? 1 : 0)
  const latestDate = formatDate(posts[0]?.publishedAt ?? featuredPost?.publishedAt, 'short') || null
  const featuredMeta = articleTypeMeta(featuredPost?.articleType, taxonomy.articleLanes)

  const allPosts = [featuredPost, ...posts].filter((p): p is NonNullable<typeof p> => Boolean(p))

  return (
    <div className="relative min-h-screen text-stone-300 selection:bg-stone-500/30">
      <JsonLd
        data={[
          {
            '@context': 'https://schema.org',
            '@type': 'Blog',
            name: copy.header.title,
            url: absoluteUrl('/blog'),
            description: copy.header.metaDescription || copy.header.lede,
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
            <h1 className="text-5xl md:text-7xl font-serif font-bold tracking-tight text-white leading-none">{copy.header.title}</h1>
            {copy.header.lede && <p className="mt-4 max-w-2xl font-sans text-base text-stone-400 leading-relaxed">{copy.header.lede}</p>}
          </div>
          <div className="font-sans text-sm text-stone-400 text-right">
            {/* The series count is only worth showing once there is one. "0 series" advertised
                an empty shelf next to the post count. */}
            {totalCount} {copy.statsLabels.posts}
            {series.length > 0 && <> · {series.length} {copy.statsLabels.series}</>}<br />
            {copy.statsLabels.latest}: {latestDate ?? '—'}
          </div>
        </header>

        {/* ─── HERO FEATURED POST ──────────────────────────────────── */}
        {featuredPost && featuredPost.slug && (
          <>
            <h2 className="section-label mb-4">{copy.featured.heading}</h2>

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

                <div className="flex items-center gap-4 font-sans text-sm text-stone-400">
                  <time dateTime={formatDate(featuredPost.publishedAt, 'iso')}>{formatDate(featuredPost.publishedAt, 'short', 'Undated')}</time>
                  <span className="text-stone-600" aria-hidden="true">•</span>
                  <span>{readingTime(featuredPost.wordCount ?? 0)} min read</span>
                  <span className="ml-auto text-white group-hover:translate-x-1 transition-transform inline-block">{copy.featured.readLabel} →</span>
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
            copy={copy}
            lanes={taxonomy.articleLanes}
            mediaTypes={taxonomy.mediaTypes}
            posts={posts}
            categories={allCategories}
            series={series}
            currentlyReading={currentlyReading}
            recentNotes={recentNotes}
          />
        </Suspense>
      </main>
    </div>
  )
}
