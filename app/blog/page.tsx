import { client } from '@/sanity/lib/client'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
<<<<<<< HEAD
// this is Blog/page.tsx
// Updated Query: Grabs settings, image URLs, categories, and separates the featured post
=======
import { BlogDirectory } from '@/components/blog/BlogDirectory'
// app/blog/page.tsx

>>>>>>> de11245de0e76e3ef7d82b90228251740dea284e
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

const getReadingTime = (text: string) => {
  const words = text ? text.split(/\s+/).length : 0
  const time = Math.ceil((words * 5) / 200)
  return time < 1 ? 1 : time
}

export default async function BlogPage() {
  const { settings, featuredPost, posts } = await client.fetch(blogDataQuery)

  // Derive unique sorted categories from all posts
  const allCategories: string[] = Array.from(
    new Set(
      posts?.flatMap((p: { categories?: string[] }) => p.categories ?? []) ?? []
    )
  ).sort() as string[]

  const totalCount = (posts?.length ?? 0) + (featuredPost ? 1 : 0)

  const latestDate = posts?.[0]?.publishedAt
    ? new Date(posts[0].publishedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-stone-300 selection:bg-stone-500/30">
      <Navbar data={settings} />

      <main className="max-w-7xl mx-auto px-6 pt-32 pb-24">

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

        {/* ─── SECTION DIRECTORY + FILTER + GRID ──────────────────── */}
        {/* BlogDirectory owns active category state and connects     */}
        {/* the directory nav, filter bar, and post grid together.    */}
        <BlogDirectory
          posts={posts ?? []}
          categories={allCategories}
          totalCount={totalCount}
          latestDate={latestDate}
        />

        {/* ─── HERO FEATURED POST ──────────────────────────────────── */}
        {featuredPost && (
          <>
            <div className="my-16 border-b border-white/5 pb-6">
              <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-stone-500 block border-l border-stone-700 pl-4">
                Featured // Latest Report
              </span>
            </div>

            <Link
              href={`/blog/${featuredPost.slug}`}
              className="block group mb-20 relative overflow-hidden rounded-lg border border-white/5"
            >
              <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent transition-opacity duration-500 group-hover:opacity-90" />
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105"
                style={{
                  backgroundImage: `url(${featuredPost.imageUrl || '/fabshots2026051.jpg'})`,
                  filter: 'grayscale(80%)',
                }}
              />
              <div className="relative z-20 pt-96 pb-12 px-8 md:px-16 flex flex-col justify-end h-full">
                <div className="flex gap-3 mb-4">
                  <span className="bg-white text-black font-mono text-[9px] tracking-[0.2em] uppercase px-3 py-1 rounded-sm">
                    Featured Intel
                  </span>
                  {featuredPost.categories?.map((cat: string) => (
                    <span
                      key={cat}
                      className="border border-stone-700 text-stone-400 font-mono text-[9px] tracking-[0.2em] uppercase px-3 py-1 rounded-sm backdrop-blur-md"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
                <h2 className="text-4xl md:text-6xl font-serif font-bold text-white mb-4 group-hover:text-stone-300 transition-colors">
                  {featuredPost.title}
                </h2>
                <p className="text-stone-400 font-sans md:text-lg max-w-2xl mb-6 line-clamp-2">
                  {featuredPost.excerpt}
                </p>
                <div className="flex items-center gap-4 font-mono text-[10px] text-stone-500 uppercase tracking-widest">
                  <span>
                    {new Date(featuredPost.publishedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <span>•</span>
                  <span>{getReadingTime(featuredPost.excerpt)} MIN READ</span>
                </div>
              </div>
            </Link>
          </>
        )}

        {/* ─── REFERENCE TOOLS ─────────────────────────────────────── */}
        <div className="mb-10 border-b border-white/5 pb-6">
          <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-stone-500 block border-l border-stone-700 pl-4">
            Reference // Interactive Tools
          </span>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/blog/osi-model"
            className="group p-6 border border-white/10 rounded-lg bg-[#0f0f0f] hover:border-white/20 transition-all duration-300 flex flex-col justify-between min-h-[180px]"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-stone-600">
                  Reference
                </span>
                <span className="font-mono text-[9px] text-stone-700 group-hover:text-white transition-colors">
                  Open →
                </span>
              </div>
              <h2 className="font-serif text-2xl text-white mb-2 group-hover:text-stone-300 transition-colors">
                OSI Model Explorer
              </h2>
              <p className="text-stone-600 text-sm leading-relaxed">
                7 layers. Protocols, real-world examples, and a full packet journey walkthrough.
              </p>
            </div>
            <div className="flex gap-2 mt-6 flex-wrap">
              {['Layer 7', 'Layer 4', 'Layer 3', 'Layer 2', 'Packet Journey'].map((l) => (
                <span key={l} className="font-mono text-[9px] text-stone-700 border border-white/5 px-2 py-1 rounded-sm">
                  {l}
                </span>
              ))}
            </div>
          </Link>

          <div className="p-6 border border-white/5 rounded-lg bg-[#0a0a0a] flex flex-col justify-between min-h-[180px] opacity-40">
            <div>
              <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-stone-700 block mb-4">
                Coming Soon
              </span>
              <h2 className="font-serif text-2xl text-stone-600 mb-2">
                TCP/IP Deep Dive
              </h2>
              <p className="text-stone-700 text-sm leading-relaxed">
                Packet-level walkthrough of the TCP/IP model and how it maps to OSI.
              </p>
            </div>
          </div>
        </section>

      </main>
    </div>
  )
}