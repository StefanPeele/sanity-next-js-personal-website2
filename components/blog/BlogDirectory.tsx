'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { EmptyThumbnail } from '@/components/blog/EmptyThumbnail'
import { PostCardSkeleton } from '@/components/blog/PostCardSkeleton'
// components/blog/BlogDirectory.tsx

interface Post {
  _id: string
  title: string
  slug: string
  publishedAt: string
  excerpt?: string
  imageUrl?: string
  categories?: string[]
  articleType?: string  // NEW
  readTime?: number     // NEW — passed from page if available
}

interface BlogDirectoryProps {
  posts: Post[]
  categories: string[]
  totalCount: number
  latestDate: string | null
}

const ARTICLE_TYPE_CONFIG: Record<string, { icon: string; color: string }> = {
  'perspective':       { icon: '🔭', color: 'text-violet-400 border-violet-500/30 bg-violet-950/10' },
  'concept-deep-dive': { icon: '⚡', color: 'text-amber-400  border-amber-500/30  bg-amber-950/10' },
  'field-notes':       { icon: '🔧', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/10' },
  'transmission':      { icon: '📡', color: 'text-blue-400   border-blue-500/30   bg-blue-950/10' },
}

function estimateReadTime(excerpt?: string): number {
  if (!excerpt) return 2
  const words = excerpt.split(/\s+/).length
  return Math.max(1, Math.ceil((words * 8) / 200))
}

const READ_POSTS_KEY = 'sp_read_posts'

function getReadPosts(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const stored = localStorage.getItem(READ_POSTS_KEY)
    return stored ? new Set(JSON.parse(stored)) : new Set()
  } catch { return new Set() }
}

function markPostRead(slug: string) {
  if (typeof window === 'undefined') return
  try {
    const current = getReadPosts()
    current.add(slug)
    localStorage.setItem(READ_POSTS_KEY, JSON.stringify([...current]))
  } catch {}
}

export function BlogDirectory({ posts, categories, totalCount, latestDate }: BlogDirectoryProps) {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()

  const activeFromUrl             = searchParams.get('category')
  const [active, setActive]       = useState<string | null>(activeFromUrl)
  const [readPosts, setReadPosts] = useState<Set<string>>(new Set())
  const [mounted, setMounted]     = useState(false)
  const archiveRef                = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setReadPosts(getReadPosts())
    setMounted(true)
  }, [])

  const updateFilter = useCallback((cat: string | null) => {
    setActive(cat)
    const params = new URLSearchParams(searchParams.toString())
    if (cat) { params.set('category', cat) } else { params.delete('category') }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, [pathname, router, searchParams])

  const handleDirectoryClick = (cat: string) => {
    updateFilter(active === cat ? null : cat)
    setTimeout(() => {
      archiveRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  const filtered = active ? posts.filter((p) => p.categories?.includes(active)) : posts

  return (
    <>
      {/* ── Section Directory ──────────────────────────────────────── */}
      <nav
        className="mb-20 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10 border border-white/15 rounded-lg overflow-hidden"
        style={{ backgroundColor: 'rgba(20,20,24,0.85)', backdropFilter: 'blur(12px)' }}
      >
        {/* Column 1 — Content Pillars */}
        <div className="p-6">
          <p className="font-mono text-[9px] uppercase tracking-[0.35em] text-stone-400 mb-5 pb-3 border-b border-white/10">
            Content Pillars
          </p>
          <ul className="space-y-1">
            {categories.length > 0 ? categories.map((cat) => (
              <li key={cat}>
                <button
                  onClick={() => handleDirectoryClick(cat)}
                  className={`w-full text-left font-mono text-[11px] uppercase tracking-[0.2em] transition-all duration-200 flex items-center justify-between px-3 py-2.5 rounded-md border group ${
                    active === cat
                      ? 'text-white bg-white/15 border-white/30 shadow-sm'
                      : 'text-stone-300 hover:text-white hover:bg-white/[0.08] border-transparent hover:border-white/15'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 transition-all ${
                      active === cat ? 'bg-white scale-125' : 'bg-stone-500 group-hover:bg-stone-300'
                    }`} />
                    {cat}
                  </span>
                  <span className={`text-[10px] font-mono transition-colors ${
                    active === cat ? 'text-stone-300' : 'text-stone-500 group-hover:text-stone-300'
                  }`}>
                    {posts.filter(p => p.categories?.includes(cat)).length}
                  </span>
                </button>
              </li>
            )) : (
              <li className="font-mono text-[10px] text-stone-500 px-3 py-2">No categories yet</li>
            )}
            {active && (
              <li className="pt-3 mt-2 border-t border-white/10">
                <button
                  onClick={() => updateFilter(null)}
                  className="font-mono text-[10px] uppercase tracking-widest text-stone-400 hover:text-white transition-colors flex items-center gap-2 px-3 py-1"
                >
                  <span className="text-xs">✕</span> Clear filter
                </button>
              </li>
            )}
          </ul>
        </div>

        {/* Column 2 — Reference Tools */}
        <div className="p-6">
          <p className="font-mono text-[9px] uppercase tracking-[0.35em] text-stone-400 mb-5 pb-3 border-b border-white/10">
            Reference Tools
          </p>
          <ul className="space-y-1">
            <li>
              <Link
                href="/blog/osi-model"
                className="group font-mono text-[11px] uppercase tracking-[0.2em] text-stone-300 hover:text-white transition-all duration-200 flex items-center justify-between px-3 py-2.5 rounded-md border border-transparent hover:border-white/15 hover:bg-white/[0.08]"
              >
                <span className="flex items-center gap-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-stone-500 group-hover:bg-white flex-shrink-0 transition-colors" />
                  OSI Model Explorer
                </span>
                <span className="text-stone-500 group-hover:text-white group-hover:translate-x-0.5 transition-all">→</span>
              </Link>
            </li>
            <li>
              <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-stone-600 flex items-center justify-between px-3 py-2.5 cursor-not-allowed">
                <span className="flex items-center gap-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-stone-700 flex-shrink-0" />
                  TCP/IP Deep Dive
                </span>
                <span className="text-[8px] tracking-widest text-stone-700 border border-stone-700 px-1.5 py-0.5 rounded-sm">Soon</span>
              </div>
            </li>
            <li className="pt-3 mt-2 border-t border-white/[0.08]">
              <Link
                href="/garden"
                className="group font-mono text-[11px] uppercase tracking-[0.2em] text-stone-300 hover:text-white transition-all duration-200 flex items-center justify-between px-3 py-2.5 rounded-md border border-transparent hover:border-white/15 hover:bg-white/[0.08]"
              >
                <span className="flex items-center gap-2.5">
                  <span className="text-sm">🌱</span>
                  The Garden
                </span>
                <span className="text-stone-500 group-hover:text-white group-hover:translate-x-0.5 transition-all">→</span>
              </Link>
            </li>
            <li>
              <Link
                href="/graph"
                className="group font-mono text-[11px] uppercase tracking-[0.2em] text-stone-300 hover:text-white transition-all duration-200 flex items-center justify-between px-3 py-2.5 rounded-md border border-transparent hover:border-white/15 hover:bg-white/[0.08]"
              >
                <span className="flex items-center gap-2.5">
                  <span className="text-sm">◉</span>
                  Knowledge Graph
                </span>
                <span className="text-stone-500 group-hover:text-white group-hover:translate-x-0.5 transition-all">→</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 3 — Archive Stats */}
        <div className="p-6">
          <p className="font-mono text-[9px] uppercase tracking-[0.35em] text-stone-400 mb-5 pb-3 border-b border-white/10">
            Archive
          </p>
          <ul className="space-y-4">
            <li className="flex items-baseline justify-between">
              <span className="font-mono text-[10px] uppercase tracking-widest text-stone-400">Total Posts</span>
              <span className="font-serif text-3xl text-white font-bold">{totalCount}</span>
            </li>
            <li className="flex items-baseline justify-between">
              <span className="font-mono text-[10px] uppercase tracking-widest text-stone-400">Latest</span>
              <span className="font-mono text-[10px] text-stone-200">{latestDate ?? '—'}</span>
            </li>
            <li className="flex items-baseline justify-between">
              <span className="font-mono text-[10px] uppercase tracking-widest text-stone-400">Status</span>
              <span className="font-mono text-[10px] text-emerald-400 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active
              </span>
            </li>
            {mounted && readPosts.size > 0 && (
              <li className="flex items-baseline justify-between">
                <span className="font-mono text-[10px] uppercase tracking-widest text-stone-400">Read</span>
                <span className="font-mono text-[10px] text-stone-300">{readPosts.size} / {totalCount}</span>
              </li>
            )}
          </ul>
        </div>
      </nav>

      {/* ── Archive header ─────────────────────────────────────────── */}
      <div
        ref={archiveRef}
        className="mb-6 border-b border-white/10 pb-5 flex items-end justify-between scroll-mt-24"
      >
        <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-stone-300 border-l-2 border-stone-400 pl-4">
          Archive // {active ?? 'All Posts'}
        </span>
        <span className="font-mono text-[9px] text-stone-400 uppercase tracking-widest">
          {filtered.length} post{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Filter bar ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap mb-10">
        <button
          onClick={() => updateFilter(null)}
          className={`font-mono text-[10px] uppercase tracking-[0.2em] px-4 py-2 rounded-sm border transition-all duration-200 ${
            active === null
              ? 'border-white/50 text-white bg-white/15 shadow-sm'
              : 'border-white/20 text-stone-300 hover:border-white/40 hover:text-white hover:bg-white/[0.08]'
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => updateFilter(active === cat ? null : cat)}
            className={`font-mono text-[10px] uppercase tracking-[0.2em] px-4 py-2 rounded-sm border transition-all duration-200 ${
              active === cat
                ? 'border-white/50 text-white bg-white/15 shadow-sm'
                : 'border-white/20 text-stone-300 hover:border-white/40 hover:text-white hover:bg-white/[0.08]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── Post grid ──────────────────────────────────────────────── */}
      {!mounted ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 3 }).map((_, i) => <PostCardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.length > 0 ? filtered.map((post) => {
            const isRead     = readPosts.has(post.slug)
            const readTime   = post.readTime ?? estimateReadTime(post.excerpt)
            const firstCat   = post.categories?.[0]
            const typeConfig = post.articleType ? ARTICLE_TYPE_CONFIG[post.articleType] : null

            return (
              <a
                href={`/blog/${post.slug}`}
                key={post._id}
                onClick={() => markPostRead(post.slug)}
                className={`group flex flex-col space-y-4 cursor-pointer transition-all duration-300 ${
                  isRead ? 'opacity-50 hover:opacity-100' : 'opacity-100'
                }`}
              >
                {/* Thumbnail */}
                <div
                  className="aspect-[4/3] w-full overflow-hidden rounded-lg border border-white/15 relative"
                  style={{ backgroundColor: 'rgba(20,20,24,0.8)' }}
                >
                  <div className="absolute inset-0 z-10 bg-black/20 group-hover:bg-transparent transition-all duration-500" />

                  {post.imageUrl ? (
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                      style={{ backgroundImage: `url(${post.imageUrl})`, filter: 'grayscale(30%)' }}
                    />
                  ) : (
                    <EmptyThumbnail title={post.title} category={firstCat} />
                  )}

                  {/* Article type badge — top left */}
                  {typeConfig && (
                    <div className={`absolute top-3 left-3 z-20 font-mono text-[8px] uppercase tracking-widest px-2 py-1 rounded-sm border backdrop-blur-sm ${typeConfig.color}`}>
                      {typeConfig.icon}
                    </div>
                  )}

                  {/* Read badge — top right */}
                  {isRead && (
                    <div className="absolute top-3 right-3 z-20 font-mono text-[8px] uppercase tracking-widest text-stone-300 bg-black/70 px-2 py-1 rounded-sm border border-white/15 backdrop-blur-sm">
                      Read
                    </div>
                  )}

                  {/* Hover CTA */}
                  <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="font-mono text-[11px] uppercase tracking-widest text-white bg-black/75 px-5 py-2.5 rounded-sm backdrop-blur-sm border border-white/25 shadow-lg">
                      {isRead ? 'Read Again →' : 'Read Article →'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col flex-grow">
                  {/* Article type label + read time */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex gap-2 flex-wrap items-center">
                      {/* Article type text badge */}
                      {typeConfig && post.articleType && (
                        <span className={`font-mono text-[8px] tracking-[0.2em] uppercase border px-2 py-0.5 rounded-sm ${typeConfig.color}`}>
                          {post.articleType.replace(/-/g, ' ')}
                        </span>
                      )}
                      {/* Category tags */}
                      {post.categories?.slice(0, 1).map((cat) => (
                        <span
                          key={cat}
                          className={`font-mono text-[9px] tracking-[0.2em] uppercase border px-2 py-1 rounded-sm ${
                            cat === active
                              ? 'border-stone-300 text-stone-200 bg-white/[0.08]'
                              : 'border-stone-600 text-stone-400'
                          }`}
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                    <span className="font-mono text-[9px] text-stone-500 uppercase tracking-widest flex-shrink-0">
                      {readTime} min
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-serif text-white group-hover:text-stone-100 transition-colors mb-2 leading-snug">
                    {post.title}
                  </h3>

                  {/* Excerpt */}
                  <p className="text-stone-300 text-sm line-clamp-2 mb-4 flex-grow leading-relaxed">
                    {post.excerpt}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-widest border-t border-white/10 pt-4">
                    <span className="text-stone-400">
                      {new Date(post.publishedAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </span>
                    <span className="text-stone-300 group-hover:text-white flex items-center gap-1.5 transition-colors">
                      Read
                      <span className="group-hover:translate-x-0.5 transition-transform inline-block">→</span>
                    </span>
                  </div>
                </div>
              </a>
            )
          }) : (
            <div className="col-span-3 py-20 text-center">
              <p className="font-mono text-[10px] text-stone-500 uppercase tracking-widest">
                No posts in this category yet.
              </p>
            </div>
          )}
        </div>
      )}
    </>
  )
}