'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { EmptyThumbnail } from '@/components/blog/EmptyThumbnail'
import { ARTICLE_TYPES, articleTypeMeta, type ArticleType } from '@/lib/site'
import { formatDate } from '@/lib/dates'
import { readingTime } from '@/lib/reading'
import { noteStatus } from '@/components/garden/status'
import type { BlogIndexQueryResult } from '@/sanity.types'
import { DEFAULT_BLOG_PAGE, type BlogPageCopy } from '@/lib/cms/defaults/blogPage'
import { type VocabEntry } from '@/lib/cms/defaults/taxonomy'
import { navHref } from '@/lib/cms/defaults/navigation'
import { Icon } from '@/lib/cms/icons'
// components/blog/BlogDirectory.tsx
// Directory + filters + grid for /blog. Filters live in the URL:
//   ?category=  ?lane=  ?tag=  ?sort=newest|oldest|longest
// Posts paint immediately on the server; read-state dimming applies after mount.

export type DirectoryPost = BlogIndexQueryResult['posts'][number]

interface BlogDirectoryProps {
  copy?: BlogPageCopy
  lanes?: VocabEntry[]
  mediaTypes?: VocabEntry[]
  posts: DirectoryPost[]
  categories: string[]
  totalCount: number
  latestDate: string | null
  series: BlogIndexQueryResult['series']
  currentlyReading: BlogIndexQueryResult['currentlyReading']
  recentNotes: BlogIndexQueryResult['recentNotes']
}

type Sort = 'newest' | 'oldest' | 'longest'

const READ_POSTS_KEY = 'sp_read_posts'
const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400'

function getReadPosts(): Set<string> {
  try {
    const stored = localStorage.getItem(READ_POSTS_KEY)
    return stored ? new Set(JSON.parse(stored)) : new Set()
  } catch { return new Set() }
}

function markPostRead(slug: string) {
  try {
    const current = getReadPosts()
    current.add(slug)
    localStorage.setItem(READ_POSTS_KEY, JSON.stringify([...current]))
  } catch {}
}


function chip(active: boolean) {
  return `font-sans text-sm px-3 py-1.5 rounded-full border transition-all duration-200 ${FOCUS} ${
    active
      ? 'border-white/50 text-white bg-white/15 shadow-sm'
      : 'border-white/20 text-stone-300 hover:border-white/40 hover:text-white hover:bg-white/[0.08]'
  }`
}

export function BlogDirectory({ copy = DEFAULT_BLOG_PAGE, lanes, mediaTypes, posts, categories, totalCount, latestDate, series, currentlyReading, recentNotes }: BlogDirectoryProps) {
  const L = copy.list
  const mediaLabel = (key?: string | null) => mediaTypes?.find((m) => m.key === key)?.label ?? key ?? ''
  const laneMeta = (key: string) => articleTypeMeta(key, lanes) ?? ARTICLE_TYPES[key as ArticleType]
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const active = searchParams.get('category')
  const lane = searchParams.get('lane')
  const tag = searchParams.get('tag')
  const sort = (searchParams.get('sort') as Sort | null) ?? 'newest'

  const [readPosts, setReadPosts] = useState<Set<string>>(new Set())
  const [mounted, setMounted] = useState(false)
  const archiveRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage after mount (avoids a server/client mismatch)
    setReadPosts(getReadPosts())
    setMounted(true)
  }, [])

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) params.set(key, value)
      else params.delete(key)
      const qs = params.toString()
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  const clearAll = useCallback(() => router.replace(pathname, { scroll: false }), [router, pathname])

  const handleDirectoryClick = (cat: string) => {
    setParam('category', active === cat ? null : cat)
    setTimeout(() => archiveRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  const allTags = useMemo(() => {
    const map = new Map<string, { title: string; count: number }>()
    posts.forEach((p) => (p.tags ?? []).forEach((t) => {
      if (!t?.slug) return
      const cur = map.get(t.slug)
      map.set(t.slug, { title: t.title ?? t.slug, count: (cur?.count ?? 0) + 1 })
    }))
    return [...map.entries()].map(([slug, v]) => ({ slug, ...v })).sort((a, b) => b.count - a.count || a.title.localeCompare(b.title))
  }, [posts])

  const filtered = useMemo(() => {
    let list = posts
    if (active) list = list.filter((p) => p.categories?.includes(active))
    if (lane) list = list.filter((p) => p.articleType === lane)
    if (tag) list = list.filter((p) => (p.tags ?? []).some((t) => t?.slug === tag))
    const byDate = (a: DirectoryPost, b: DirectoryPost) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? '')
    if (sort === 'oldest') list = [...list].sort((a, b) => byDate(b, a))
    else if (sort === 'longest') list = [...list].sort((a, b) => (b.wordCount ?? 0) - (a.wordCount ?? 0))
    else list = [...list].sort(byDate)
    return list
  }, [posts, active, lane, tag, sort])

  const anyFilter = Boolean(active || lane || tag)
  const activeLabel = [active, lane && articleTypeMeta(lane)?.label, tag && `#${allTags.find((t) => t.slug === tag)?.title ?? tag}`].filter(Boolean).join(' · ')

  return (
    <>
      {/* ── Section Directory ──────────────────────────────────────── */}
      {copy.directory.enabled && <nav
        aria-label="Directory"
        className="mb-12 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10 border border-white/15 rounded-lg overflow-hidden"
        style={{ backgroundColor: 'rgba(20,20,24,0.85)', backdropFilter: 'blur(12px)' }}
      >
        {/* Column 1 — Content Pillars */}
        <div className="p-6">
          <p className="section-label mb-5 pb-3 border-b border-white/10">{copy.directory.topicsHeading}</p>
          <ul className="space-y-1">
            {categories.length > 0 ? categories.map((cat) => (
              <li key={cat}>
                <button
                  type="button"
                  onClick={() => handleDirectoryClick(cat)}
                  aria-pressed={active === cat}
                  className={`w-full text-left font-sans text-xs transition-all duration-200 flex items-center justify-between px-3 py-2.5 rounded-md border group ${FOCUS} ${
                    active === cat
                      ? 'text-white bg-white/15 border-white/30 shadow-sm'
                      : 'text-stone-300 hover:text-white hover:bg-white/[0.08] border-transparent hover:border-white/15'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 transition-all ${active === cat ? 'bg-white scale-125' : 'bg-stone-500 group-hover:bg-stone-300'}`} aria-hidden="true" />
                    {cat}
                  </span>
                  <span className={`text-[10px] font-mono transition-colors ${active === cat ? 'text-stone-300' : 'text-stone-400 group-hover:text-stone-300'}`}>
                    {posts.filter((p) => p.categories?.includes(cat)).length}
                  </span>
                </button>
              </li>
            )) : (
              <li className="font-mono text-[10px] text-stone-400 px-3 py-2">No categories yet</li>
            )}
            {anyFilter && (
              <li className="pt-3 mt-2 border-t border-white/10">
                <button type="button" onClick={clearAll} className={`font-sans text-xs text-stone-400 hover:text-white transition-colors flex items-center gap-2 px-3 py-1 rounded-sm ${FOCUS}`}>
                  <span className="text-xs" aria-hidden="true">✕</span> Clear filters
                </button>
              </li>
            )}
          </ul>
        </div>

        {/* Column 2 — Reference Tools */}
        <div className="p-6">
          <p className="section-label mb-5 pb-3 border-b border-white/10">{copy.directory.toolsHeading}</p>
          <ul className="space-y-1">
            {copy.referenceLinks.map((item) => (
              <li key={navHref(item) + item.label}>
                <Link
                  href={navHref(item)}
                  className={`group font-sans text-sm text-stone-300 hover:text-white transition-all duration-200 flex items-center justify-between px-3 py-2 rounded-md border border-transparent hover:border-white/15 hover:bg-white/[0.08] ${FOCUS}`}
                >
                  <span className="flex items-center gap-2.5">
                    <span className="w-4 text-stone-400 group-hover:text-white" aria-hidden="true"><Icon name={item.icon} /></span>
                    {item.label}
                  </span>
                  <span className="text-stone-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 3 — Archive Stats */}
        <div className="p-6">
          <p className="section-label mb-5 pb-3 border-b border-white/10">{copy.directory.statsHeading}</p>
          <ul className="space-y-4">
            <li className="flex items-baseline justify-between">
              <span className="font-sans text-sm text-stone-400">{copy.directory.totalLabel}</span>
              <span className="font-serif text-3xl text-white font-bold">{totalCount}</span>
            </li>
            <li className="flex items-baseline justify-between">
              <span className="font-sans text-sm text-stone-400">{copy.directory.latestLabel}</span>
              <span className="font-mono text-[10px] text-stone-200">{latestDate ?? '—'}</span>
            </li>
            <li className="flex items-baseline justify-between">
              <span className="font-sans text-sm text-stone-400">{copy.directory.seriesLabel}</span>
              <span className="font-mono text-[10px] text-stone-200">{series.length}</span>
            </li>
            {mounted && readPosts.size > 0 && (
              <li className="flex items-baseline justify-between">
                <span className="font-sans text-sm text-stone-400">{copy.directory.readLabel}</span>
                <span className="font-mono text-[10px] text-stone-300">{Math.min(readPosts.size, totalCount)} / {totalCount}</span>
              </li>
            )}
          </ul>
        </div>
      </nav>}

      {/* ── Series rail ───────────────────────────────────────────── */}
      {copy.seriesRail.enabled && series.length > 0 && (
        <section className="mb-12" aria-labelledby="series-rail">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="series-rail" className="section-label">{copy.seriesRail.heading}</h2>
            <Link href={copy.seriesRail.ctaHref || '/blog/series'} className={`font-sans text-sm text-stone-400 hover:text-white transition-colors rounded-sm ${FOCUS}`}>{copy.seriesRail.ctaLabel} →</Link>
          </div>
          <ul className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
            {series.map((s) => (
              <li key={s._id} className="snap-start flex-shrink-0 w-64">
                <Link
                  href={`/blog/series/${s.slug}`}
                  className={`block h-full rounded-lg border border-white/10 hover:border-white/30 bg-white/[0.02] p-4 transition-colors ${FOCUS}`}
                >
                  <span className="font-sans text-xs text-stone-400 block mb-2">{s.count} part{s.count === 1 ? '' : 's'}</span>
                  <span className="font-serif text-white text-base leading-snug block mb-1">{s.title}</span>
                  {s.description && <span className="text-stone-400 text-xs line-clamp-2 block">{s.description}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Currently reading + Recently tended ───────────────────── */}
      {((copy.readingStrip.enabled && currentlyReading.length > 0) || (copy.notesStrip.enabled && recentNotes.length > 0)) && (
        <div className="mb-16 grid grid-cols-1 md:grid-cols-2 gap-6">
          {copy.readingStrip.enabled && currentlyReading.length > 0 && (
            <section className="rounded-lg border border-white/10 bg-white/[0.02] p-5" aria-labelledby="reading-strip">
              <div className="mb-3 flex items-center justify-between">
                <h2 id="reading-strip" className="section-label">{copy.readingStrip.heading}</h2>
                <Link href={copy.readingStrip.ctaHref || '/library'} className={`font-sans text-sm text-stone-400 hover:text-white transition-colors rounded-sm ${FOCUS}`}>{copy.readingStrip.ctaLabel} →</Link>
              </div>
              <ul className="space-y-3">
                {currentlyReading.map((item) => (
                  <li key={item._id}>
                    <Link href={`/library#${item._id}`} className={`block rounded-sm ${FOCUS}`}>
                      <span className="flex items-baseline justify-between gap-3">
                        <span className="font-serif text-sm text-white leading-snug">{item.title}</span>
                        <span className="font-sans text-xs text-stone-400 flex-shrink-0">{mediaLabel(item.mediaType)}</span>
                      </span>
                      {item.author && <span className="font-mono text-[9px] text-stone-400 block">{item.author}</span>}
                      {typeof item.progressPercent === 'number' && (
                        <span className="flex items-center gap-2 mt-1.5">
                          <span className="flex-1 h-0.5 bg-white/[0.08] rounded-full overflow-hidden" role="progressbar" aria-valuenow={item.progressPercent} aria-valuemin={0} aria-valuemax={100} aria-label={`${item.title} progress`}>
                            <span className="block h-full bg-emerald-500/70 rounded-full" style={{ width: `${item.progressPercent}%` }} />
                          </span>
                          <span className="font-mono text-[8px] text-stone-400">{item.progressPercent}%</span>
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {copy.notesStrip.enabled && recentNotes.length > 0 && (
            <section className="rounded-lg border border-white/10 bg-white/[0.02] p-5" aria-labelledby="notes-strip">
              <div className="mb-3 flex items-center justify-between">
                <h2 id="notes-strip" className="section-label">{copy.notesStrip.heading}</h2>
                <Link href={copy.notesStrip.ctaHref || '/garden'} className={`font-sans text-sm text-stone-400 hover:text-white transition-colors rounded-sm ${FOCUS}`}>{copy.notesStrip.ctaLabel} →</Link>
              </div>
              <ul className="space-y-2">
                {recentNotes.map((n) => {
                  const s = noteStatus(n.status)
                  return (
                    <li key={n._id}>
                      <Link href={`/garden/${n.slug}`} className={`group flex items-center gap-2.5 rounded-sm ${FOCUS}`}>
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} aria-hidden="true" />
                        <span className="font-serif text-sm text-stone-200 group-hover:text-white transition-colors">{n.title}</span>
                        <span className="ml-auto font-sans text-xs text-stone-400 flex-shrink-0">{s.label}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}
        </div>
      )}

      {/* ── Archive header ─────────────────────────────────────────── */}
      <div ref={archiveRef} className="mb-6 border-b border-white/10 pb-5 flex items-end justify-between scroll-mt-24">
        <h2 className="text-2xl font-serif font-bold text-white">
          {activeLabel || L.heading}
        </h2>
        <span className="font-sans text-sm text-stone-400" aria-live="polite">
          {L.postCount.replace('{n}', String(filtered.length))}
        </span>
      </div>

      {/* ── Filter bars ────────────────────────────────────────────── */}
      <div className="space-y-3 mb-10">
        <div className="flex items-center gap-2 flex-wrap" role="group" aria-label="Filter by lane">
          <span className="font-sans text-xs text-stone-400 w-16">{L.filterLabels.lane}</span>
          <button type="button" onClick={() => setParam('lane', null)} aria-pressed={lane === null} className={chip(lane === null)}>{L.allLabel}</button>
          {(Object.keys(ARTICLE_TYPES) as ArticleType[]).map((key) => {
            const meta = laneMeta(key)
            const on = lane === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => setParam('lane', on ? null : key)}
                aria-pressed={on}
                className={chip(on)}
                style={on ? { borderColor: meta.color, color: meta.color, backgroundColor: meta.bg } : undefined}
              >
                <span className="w-1.5 h-1.5 rounded-full inline-block mr-2 align-middle" style={{ backgroundColor: meta.color }} aria-hidden="true" />
                {meta.label}
              </button>
            )
          })}
        </div>

        {categories.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap" role="group" aria-label="Filter by category">
            <span className="font-sans text-xs text-stone-400 w-16">{L.filterLabels.category}</span>
            <button type="button" onClick={() => setParam('category', null)} aria-pressed={active === null} className={chip(active === null)}>{L.allLabel}</button>
            {categories.map((cat) => (
              <button key={cat} type="button" onClick={() => setParam('category', active === cat ? null : cat)} aria-pressed={active === cat} className={chip(active === cat)}>
                {cat}
              </button>
            ))}
          </div>
        )}

        {allTags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap" role="group" aria-label="Filter by tag">
            <span className="font-sans text-xs text-stone-400 w-16">{L.filterLabels.tag}</span>
            {allTags.map((t) => (
              <button key={t.slug} type="button" onClick={() => setParam('tag', tag === t.slug ? null : t.slug)} aria-pressed={tag === t.slug} className={chip(tag === t.slug)}>
                #{t.title} <span className="opacity-60 text-[8px]">{t.count}</span>
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap" role="group" aria-label="Sort">
          <span className="font-sans text-xs text-stone-400 w-16">{L.filterLabels.sort}</span>
          {(['newest', 'oldest', 'longest'] as Sort[]).map((s) => (
            <button key={s} type="button" onClick={() => setParam('sort', s === 'newest' ? null : s)} aria-pressed={sort === s} className={chip(sort === s)}>
              {L.sortLabels[s]}
            </button>
          ))}
        </div>
      </div>

      {/* ── Post grid ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.length > 0 ? filtered.map((post) => {
          const isRead = mounted && post.slug ? readPosts.has(post.slug) : false
          const minutes = readingTime(post.wordCount ?? 0)
          const firstCat = post.categories?.[0] ?? undefined
          const meta = articleTypeMeta(post.articleType)

          return (
            <Link
              href={`/blog/${post.slug}`}
              key={post._id}
              onClick={() => post.slug && markPostRead(post.slug)}
              className={`group flex flex-col space-y-4 transition-all duration-300 rounded-lg ${FOCUS} ${isRead ? 'opacity-60 hover:opacity-100' : 'opacity-100'}`}
            >
              <div className="aspect-[4/3] w-full overflow-hidden rounded-lg border border-white/15 relative" style={{ backgroundColor: 'rgba(20,20,24,0.8)' }}>
                <div className="absolute inset-0 z-10 bg-black/20 group-hover:bg-transparent transition-all duration-500" />

                {post.imageUrl ? (
                  <Image
                    src={post.imageUrl}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    placeholder={post.lqip ? 'blur' : 'empty'}
                    blurDataURL={post.lqip ?? undefined}
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    style={{ filter: 'grayscale(30%)' }}
                  />
                ) : (
                  <EmptyThumbnail title={post.title ?? 'Untitled'} category={firstCat} />
                )}

                {meta && (
                  <div
                    className="absolute top-3 left-3 z-20 font-sans text-xs px-2 py-1 rounded-sm border backdrop-blur-sm"
                    style={{ color: meta.color, borderColor: `${meta.color}55`, backgroundColor: meta.bg }}
                  >
                    {meta.short}
                  </div>
                )}

                {isRead && (
                  <div className="absolute top-3 right-3 z-20 font-sans text-xs text-stone-300 bg-black/70 px-2 py-1 rounded-sm border border-white/15 backdrop-blur-sm">
                    Read
                  </div>
                )}

                <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden="true">
                  <span className="font-sans text-xs text-white bg-black/75 px-5 py-2.5 rounded-sm backdrop-blur-sm border border-white/25 shadow-lg">
                    {isRead ? `${L.readAgainLabel} →` : `${L.readLabel} →`}
                  </span>
                </div>
              </div>

              <div className="flex flex-col flex-grow">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex gap-2 flex-wrap items-center">
                    {meta && (
                      <span className="font-mono text-[8px] tracking-[0.2em] uppercase border px-2 py-0.5 rounded-sm" style={{ color: meta.color, borderColor: `${meta.color}55`, backgroundColor: meta.bg }}>
                        {meta.label}
                      </span>
                    )}
                    {firstCat && (
                      <span className={`font-mono text-[9px] tracking-[0.2em] uppercase border px-2 py-1 rounded-sm ${firstCat === active ? 'border-stone-300 text-stone-200 bg-white/[0.08]' : 'border-stone-600 text-stone-400'}`}>
                        {firstCat}
                      </span>
                    )}
                    {post.series?.title && (
                      <span className="font-mono text-[8px] tracking-[0.2em] uppercase text-orange-300/80"><Icon name="layers" size={9} className="inline -mt-px mr-1" />{post.series.title}</span>
                    )}
                  </div>
                  <span className="font-mono text-[9px] text-stone-400 uppercase tracking-widest flex-shrink-0">{minutes} min</span>
                </div>

                <h3 className="text-xl font-serif text-white group-hover:text-stone-100 transition-colors mb-2 leading-snug">{post.title}</h3>

                <p className="text-stone-300 text-sm line-clamp-2 mb-4 flex-grow leading-relaxed">{post.excerpt}</p>

                <div className="flex items-center justify-between font-sans text-xs border-t border-white/10 pt-4">
                  <time dateTime={formatDate(post.publishedAt, 'iso')} className="text-stone-400">{formatDate(post.publishedAt, 'short', 'Undated')}</time>
                  <span className="text-stone-300 group-hover:text-white flex items-center gap-1.5 transition-colors">
                    Read <span className="group-hover:translate-x-0.5 transition-transform inline-block" aria-hidden="true">→</span>
                  </span>
                </div>
              </div>
            </Link>
          )
        }) : (
          <div className="col-span-3 py-20 text-center">
            <p className="font-sans text-sm text-stone-400 mb-3">{L.emptyState}</p>
            {anyFilter && (
              <button type="button" onClick={clearAll} className={`font-sans text-xs text-stone-400 hover:text-white underline underline-offset-4 rounded-sm ${FOCUS}`}>
                {L.clearLabel}
              </button>
            )}
          </div>
        )}
      </div>
    </>
  )
}
