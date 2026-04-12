import { client } from '@/sanity/lib/client'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { BlogDirectory } from '@/components/blog/BlogDirectory'
import { BlogBackground } from '@/components/blog/BlogBackground'
import { Suspense } from 'react'
// app/blog/page.tsx

interface Post {
  _id: string
  title: string
  slug: string
  publishedAt: string
  excerpt?: string
  imageUrl?: string
  categories?: string[]
}

interface FeaturedPost extends Post {}

interface BlogData {
  settings: {
    _id: string
    _type: string
    menuItems?: { _key: string | null; _type: string; slug: string | null; title: string | null }[]
  } | null
  featuredPost: FeaturedPost | null
  posts: Post[]
}

const blogDataQuery = `{
  "settings": *[_type == "settings"][0],
  "featuredPost": *[_type == "post" && isFeatured == true] | order(publishedAt desc)[0] {
    _id,
    title,
    "slug": slug.current,
    publishedAt,
    excerpt,
    "imageUrl": mainImage.asset->url,
    "categories": categories[]->title
  },
  "posts": *[_type == "post" && (isFeatured != true || !defined(isFeatured))] | order(publishedAt desc) {
    _id,
    title,
    "slug": slug.current,
    publishedAt,
    excerpt,
    "imageUrl": mainImage.asset->url,
    "categories": categories[]->title
  }
}`

const getReadingTime = (text: string): number => {
  const words = text ? text.split(/\s+/).length : 0
  const time  = Math.ceil((words * 5) / 200)
  return time < 1 ? 1 : time
}

export default async function BlogPage() {
  const { settings, featuredPost, posts } =
    await client.fetch<BlogData>(blogDataQuery)

  const allCategories: string[] = Array.from(
    new Set(posts?.flatMap((p) => p.categories ?? []) ?? [])
  ).sort()

  const totalCount = (posts?.length ?? 0) + (featuredPost ? 1 : 0)

  const latestDate = posts?.[0]?.publishedAt
    ? new Date(posts[0].publishedAt).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      })
    : null

  return (
    // bg-transparent lets BlogBackground show through
    <div className="relative min-h-screen bg-transparent text-stone-300 selection:bg-stone-500/30">

      {/* Animated background — fixed, behind everything */}
      <BlogBackground />

      <Navbar data={settings} />

      <main className="relative max-w-7xl mx-auto px-6 pt-32 pb-24">

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
            Total Intel Modules: {totalCount}<br />
            Status: Secure Connection
          </div>
        </header>

        {/* ─── HERO FEATURED POST ──────────────────────────────────── */}
        {featuredPost && (
          <>
            <div className="mb-6 pb-6">
              <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-stone-500 block border-l border-stone-700 pl-4">
                Featured // Latest Report
              </span>
            </div>

            <Link
              href={`/blog/${featuredPost.slug}`}
              className="block group mb-20 relative overflow-hidden rounded-lg border border-white/10 min-h-[480px]"
            >
              <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/70 to-transparent transition-opacity duration-500 group-hover:opacity-90" />

              {featuredPost.imageUrl ? (
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105"
                  style={{
                    backgroundImage: `url(${featuredPost.imageUrl})`,
                    filter: 'grayscale(70%)',
                  }}
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900">
                  <div
                    className="absolute inset-0 opacity-50"
                    style={{
                      backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 16px)',
                    }}
                  />
                </div>
              )}

              <div className="relative z-20 pt-64 pb-12 px-8 md:px-16 flex flex-col justify-end h-full">
                <div className="flex gap-3 mb-4 flex-wrap">
                  <span className="bg-white text-black font-mono text-[9px] tracking-[0.2em] uppercase px-3 py-1 rounded-sm">
                    Featured Intel
                  </span>
                  {featuredPost.categories?.map((cat) => (
                    <span
                      key={cat}
                      className="border border-stone-600 text-stone-300 font-mono text-[9px] tracking-[0.2em] uppercase px-3 py-1 rounded-sm backdrop-blur-md bg-black/30"
                    >
                      {cat}
                    </span>
                  ))}
                </div>

                <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white mb-4 group-hover:text-stone-200 transition-colors leading-tight">
                  {featuredPost.title}
                </h2>

                <p className="text-stone-300 font-sans text-base md:text-lg max-w-2xl mb-6 line-clamp-2 leading-relaxed">
                  {featuredPost.excerpt}
                </p>

                <div className="flex items-center gap-4 font-mono text-[10px] text-stone-400 uppercase tracking-widest">
                  <span>
                    {new Date(featuredPost.publishedAt).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </span>
                  <span className="text-stone-600">•</span>
                  <span>{getReadingTime(featuredPost.excerpt ?? '')} min read</span>
                  <span className="ml-auto text-white group-hover:translate-x-1 transition-transform inline-block">
                    Read Report →
                  </span>
                </div>
              </div>
            </Link>
          </>
        )}

        {/* ─── DIRECTORY + FILTER + GRID ───────────────────────────── */}
        <Suspense fallback={null}>
          <BlogDirectory
            posts={posts ?? []}
            categories={allCategories}
            totalCount={totalCount}
            latestDate={latestDate}
          />
        </Suspense>

      </main>
    </div>
  )
}