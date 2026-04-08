'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
// components/blog/BlogDirectory.tsx

interface Post {
  _id: string
  title: string
  slug: string
  publishedAt: string
  excerpt?: string
  imageUrl?: string
  categories?: string[]
}

interface BlogDirectoryProps {
  posts: Post[]
  categories: string[]
  totalCount: number
  latestDate: string | null
}

export function BlogDirectory({
  posts,
  categories,
  totalCount,
  latestDate,
}: BlogDirectoryProps) {
  const [active, setActive] = useState<string | null>(null)
  const archiveRef = useRef<HTMLDivElement>(null)

  const filtered = active
    ? posts.filter((p) => p.categories?.includes(active))
    : posts

  // Clicking a category in the directory scrolls to archive AND activates filter
  const handleDirectoryClick = (cat: string) => {
    setActive(active === cat ? null : cat)
    setTimeout(() => {
      archiveRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  return (
    <>
      {/* ── Section Directory ──────────────────────────────────────── */}
      <nav className="mb-20 grid grid-cols-1 md:grid-cols-3 gap-px bg-white/5 border border-white/5 rounded-lg overflow-hidden">

        {/* Column 1 — Content Pillars */}
        <div className="bg-[#0a0a0a] p-6">
          <p className="font-mono text-[9px] uppercase tracking-[0.35em] text-stone-600 mb-5 pb-3 border-b border-white/5">
            Content Pillars
          </p>
          <ul className="space-y-2">
            {categories.length > 0 ? categories.map((cat) => (
              <li key={cat}>
                <button
                  onClick={() => handleDirectoryClick(cat)}
                  className={`w-full text-left font-mono text-[10px] uppercase tracking-[0.2em] transition-colors flex items-center justify-between group ${
                    active === cat ? 'text-white' : 'text-stone-600 hover:text-stone-300'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className={`h-1 w-1 rounded-full flex-shrink-0 transition-colors ${
                      active === cat ? 'bg-white' : 'bg-stone-700 group-hover:bg-stone-500'
                    }`} />
                    {cat}
                  </span>
                  <span className="text-stone-700 group-hover:text-stone-500 transition-colors">
                    {posts.filter(p => p.categories?.includes(cat)).length}
                  </span>
                </button>
              </li>
            )) : (
              <li className="font-mono text-[9px] text-stone-700 uppercase tracking-widest">
                No categories yet
              </li>
            )}
            {active && (
              <li className="pt-2 border-t border-white/5">
                <button
                  onClick={() => setActive(null)}
                  className="font-mono text-[9px] uppercase tracking-widest text-stone-700 hover:text-stone-400 transition-colors"
                >
                  ✕ Clear filter
                </button>
              </li>
            )}
          </ul>
        </div>

        {/* Column 2 — Reference Tools */}
        <div className="bg-[#0a0a0a] p-6">
          <p className="font-mono text-[9px] uppercase tracking-[0.35em] text-stone-600 mb-5 pb-3 border-b border-white/5">
            Reference Tools
          </p>
          <ul className="space-y-2">
            <li>
              <Link
                href="/blog/osi-model"
                className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-600 hover:text-stone-300 transition-colors flex items-center gap-2 group"
              >
                <span className="h-1 w-1 rounded-full bg-stone-700 group-hover:bg-stone-500 flex-shrink-0 transition-colors" />
                OSI Model Explorer
              </Link>
            </li>
            <li>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-800 flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-stone-800 flex-shrink-0" />
                TCP/IP Deep Dive
                <span className="text-[8px] tracking-widest text-stone-800">Soon</span>
              </span>
            </li>
          </ul>
        </div>

        {/* Column 3 — Archive Stats */}
        <div className="bg-[#0a0a0a] p-6">
          <p className="font-mono text-[9px] uppercase tracking-[0.35em] text-stone-600 mb-5 pb-3 border-b border-white/5">
            Archive
          </p>
          <ul className="space-y-3">
            <li className="flex items-baseline justify-between">
              <span className="font-mono text-[9px] uppercase tracking-widest text-stone-700">
                Total Posts
              </span>
              <span className="font-serif text-2xl text-stone-400">{totalCount}</span>
            </li>
            <li className="flex items-baseline justify-between">
              <span className="font-mono text-[9px] uppercase tracking-widest text-stone-700">
                Latest
              </span>
              <span className="font-mono text-[9px] text-stone-500">
                {latestDate ?? '—'}
              </span>
            </li>
            <li className="flex items-baseline justify-between">
              <span className="font-mono text-[9px] uppercase tracking-widest text-stone-700">
                Status
              </span>
              <span className="font-mono text-[9px] text-emerald-600 flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-600" />
                Active
              </span>
            </li>
          </ul>
        </div>
      </nav>

      {/* ── Archive header ─────────────────────────────────────────── */}
      <div
        ref={archiveRef}
        className="mb-8 border-b border-white/5 pb-6 flex items-end justify-between scroll-mt-24"
      >
        <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-stone-500 block border-l border-stone-700 pl-4">
          Archive // {active ? active : 'All Posts'}
        </span>
        <span className="font-mono text-[9px] text-stone-700 uppercase tracking-widest">
          {filtered.length} post{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Inline filter bar ──────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap mb-10">
        <button
          onClick={() => setActive(null)}
          className={`font-mono text-[9px] uppercase tracking-[0.25em] px-3 py-2 rounded-sm border transition-all duration-200 ${
            active === null
              ? 'border-white/20 text-white bg-white/5'
              : 'border-white/5 text-stone-600 hover:border-white/15 hover:text-stone-400'
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActive(active === cat ? null : cat)}
            className={`font-mono text-[9px] uppercase tracking-[0.25em] px-3 py-2 rounded-sm border transition-all duration-200 ${
              active === cat
                ? 'border-white/20 text-white bg-white/5'
                : 'border-white/5 text-stone-600 hover:border-white/15 hover:text-stone-400'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── Post grid ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.length > 0 ? (
          filtered.map((post) => (
            <a
              href={`/blog/${post.slug}`}
              key={post._id}
              className="group flex flex-col space-y-4"
            >
              <div className="aspect-[4/3] w-full overflow-hidden rounded-lg border border-white/5 relative">
                <div className="absolute inset-0 z-10 bg-black/20 group-hover:bg-transparent transition-all duration-500" />
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{
                    backgroundImage: `url(${post.imageUrl || '/fabshots2026051.jpg'})`,
                    filter: 'grayscale(50%)',
                  }}
                />
              </div>

              <div className="flex flex-col flex-grow">
                <div className="flex gap-2 mb-3 flex-wrap">
                  {post.categories?.slice(0, 2).map((cat) => (
                    <span
                      key={cat}
                      className={`font-mono text-[8px] tracking-[0.2em] uppercase border px-2 py-1 rounded-sm transition-colors ${
                        cat === active
                          ? 'border-stone-600 text-stone-400'
                          : 'border-stone-800 text-stone-500'
                      }`}
                    >
                      {cat}
                    </span>
                  ))}
                </div>

                <h3 className="text-2xl font-serif text-white group-hover:text-stone-300 transition-colors mb-2">
                  {post.title}
                </h3>

                <p className="text-stone-500 text-sm line-clamp-2 mb-4 flex-grow">
                  {post.excerpt}
                </p>

                <div className="flex items-center justify-between font-mono text-[9px] text-stone-600 uppercase tracking-widest border-t border-white/5 pt-4">
                  <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                  <span className="group-hover:text-white transition-colors">Read →</span>
                </div>
              </div>
            </a>
          ))
        ) : (
          <div className="col-span-3 py-20 text-center">
            <p className="font-mono text-[10px] text-stone-700 uppercase tracking-widest">
              No posts in this category yet.
            </p>
          </div>
        )}
      </div>
    </>
  )
}