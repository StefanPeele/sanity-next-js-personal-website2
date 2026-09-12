'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { EmptyThumbnail } from '@/components/blog/EmptyThumbnail'
import { articleTypeMeta } from '@/lib/site'
import { formatDate } from '@/lib/dates'
import { readingTime } from '@/lib/reading'
import { noteStatus } from '@/components/garden/status'
import type { BlogIndexQueryResult } from '@/sanity.types'
import { DEFAULT_BLOG_PAGE, type BlogPageCopy } from '@/lib/cms/defaults/blogPage'
import { type VocabEntry } from '@/lib/cms/defaults/taxonomy'
import { Icon } from '@/lib/cms/icons'
import { auraProps, effectiveReviewStatus, REVIEW_STATUS, reviewFlags, revisionState } from '@/lib/status'
import { enumKey, enumKeys } from '@/lib/stega'
import { PostPreview } from '@/components/blog/PostPreview'
import { PlaceholderCards } from '@/components/blog/PlaceholderCards'
import { FOCUS, QUIET_LINK, buttonClass } from '@/lib/ui'
import { ArrowRight } from 'lucide-react'
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
  series: BlogIndexQueryResult['series']
  currentlyReading: BlogIndexQueryResult['currentlyReading']
  recentNotes: BlogIndexQueryResult['recentNotes']
}

type Sort = 'newest' | 'oldest' | 'longest'

const READ_POSTS_KEY = 'sp_read_posts'

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
  return `font-sans text-sm ${buttonClass({ variant: 'chip', size: 'sm', active })}`
}

export function BlogDirectory({ copy = DEFAULT_BLOG_PAGE, lanes, mediaTypes, posts, categories, series, currentlyReading, recentNotes }: BlogDirectoryProps) {
  const L = copy.list
  const mediaLabel = (key?: string | null) => mediaTypes?.find((m) => m.key === key)?.label ?? key ?? ''
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const active = searchParams.get('category')
  // 4.3 renamed `field-notes` to `lab-notes`. Any link already shared with the old key --
  // or bookmarked, or sitting in someone's RSS reader -- keeps working. One line is cheaper
  // than a dead filter.
  const LANE_ALIASES: Record<string, string> = { 'field-notes': 'lab-notes' }
  const rawLane = searchParams.get('lane')
  const lane = rawLane ? (LANE_ALIASES[rawLane] ?? rawLane) : null
  const tag = searchParams.get('tag')
  const sort = (searchParams.get('sort') as Sort | null) ?? 'newest'
  const status = searchParams.get('status')

  // 4.4. The text filter that the facets fold into. Deliberately NOT a URL param: a
  // half-typed query is not a place anyone wants to link to or land on from history, unlike
  // a chosen lane or status.
  const [q, setQ] = useState('')
  const [facetsOpen, setFacetsOpen] = useState(false)
  const filtersButtonRef = useRef<HTMLButtonElement>(null)
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

  // 3.5. Computed once here rather than in the render map, so the chip counts, the filter
  // and the mark on each card are provably the same values. `revised` is derived, so this
  // has to go through effectiveReviewStatus -- reading post.reviewStatus raw would filter
  // out posts whose only status is a revision.
  const statusById = useMemo(() => {
    const m = new Map<string, string[]>()
    posts.forEach((p) => m.set(p._id, effectiveReviewStatus(p.reviewStatus, revisionState(p.lastRevised, p.correctionKinds, p.publishedAt).flag)))
    return m
  }, [posts])

  // One facet per status actually present, in REVIEW_FLAG_ORDER, with counts. An empty
  // result hides the whole row: no published post carries a status yet, and a filter bar
  // offering nothing to filter by is worse than no filter bar.
  const statusFacets = useMemo(() => {
    const counts = new Map<string, number>()
    statusById.forEach((keys) => keys.forEach((k) => counts.set(k, (counts.get(k) ?? 0) + 1)))
    return reviewFlags([...counts.keys()]).map((f) => ({ ...f, count: counts.get(f.key) ?? 0 }))
  }, [statusById])

  const allTags = useMemo(() => {
    const map = new Map<string, { title: string; count: number }>()
    posts.forEach((p) => (p.tags ?? []).forEach((t) => {
      if (!t?.slug) return
      // The SLUG is a key -- it goes into the URL and is compared against ?tag=. In draft
      // mode Sanity encodes the source path into every string as zero-width characters, so
      // the raw slug would put invisible characters in the address bar and make the
      // comparison below depend on both sides having been encoded identically. The TITLE is
      // left alone on purpose: it is displayed, stega is invisible, and keeping it is what
      // makes the chip click-to-editable in Presentation.
      const key = enumKey(t.slug)
      if (!key) return
      const cur = map.get(key)
      map.set(key, { title: t.title ?? key, count: (cur?.count ?? 0) + 1 })
    }))
    return [...map.entries()].map(([slug, v]) => ({ slug, ...v })).sort((a, b) => b.count - a.count || a.title.localeCompare(b.title))
  }, [posts])

  const needle = q.trim().toLowerCase()

  const filtered = useMemo(() => {
    let list = posts
    // Same reason: `active` comes from the URL and is clean, while p.categories carries
    // stega in draft mode, so a raw includes() never matches and the category filter
    // silently returns nothing.
    if (active) list = list.filter((p) => enumKeys(p.categories).includes(active))
    if (lane) list = list.filter((p) => p.articleType === lane)
    if (tag) list = list.filter((p) => (p.tags ?? []).some((t) => enumKey(t?.slug) === tag))
    if (status) list = list.filter((p) => (statusById.get(p._id) ?? []).includes(status))
    if (needle) {
      list = list.filter((p) => `${p.title ?? ''} ${p.excerpt ?? ''} ${(p.categories ?? []).join(' ')}`
        .toLowerCase().includes(needle))
    }
    const byDate = (a: DirectoryPost, b: DirectoryPost) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? '')
    if (sort === 'oldest') list = [...list].sort((a, b) => byDate(b, a))
    else if (sort === 'longest') list = [...list].sort((a, b) => (b.wordCount ?? 0) - (a.wordCount ?? 0))
    else list = [...list].sort(byDate)
    return list
  }, [posts, active, lane, tag, sort, status, statusById, needle])

  const anyFilter = Boolean(active || lane || tag || status)
  const activeCount = [active, lane, tag, status].filter(Boolean).length
  const hasFacets = categories.length > 0 || allTags.length > 0 || statusFacets.length > 0
  const resetAll = useCallback(() => { setQ(''); clearAll() }, [clearAll])

  // Escape closes the facets. Found by a verifier: the disclosure opened and nothing shut
  // it but a second click on the same button. It is not a focus trap -- Tab still escapes --
  // but every other expandable thing on this site closes on Escape, and a reader who learns
  // the gesture once expects it everywhere.
  useEffect(() => {
    if (!facetsOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setFacetsOpen(false)
      // Return focus to the control that opened it, or the reader is left at the top of the
      // document with no idea where their place went.
      filtersButtonRef.current?.focus()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [facetsOpen])

  /* ── 4.1 / 4.5: what changes between 3 posts and 50 ──────────────────────────
     Under SECTION_MIN the page is ONE grid. Three lane sections holding one card each is
     more chrome than navigation, and a "river" of two rows is a list with a heading.

     At or above it the page has four weights: the lead (rendered by the page above this),
     a SECONDARY pair at card size, one SECTION per lane that has enough posts to be one,
     and then the RIVER -- everything else, as rows.

     Sections are suppressed the moment a filter or a search is active. Sectioning a set the
     reader has already narrowed answers a question they stopped asking. */
  const SECTION_MIN = 12
  const LANE_MIN = 3
  const SECTION_SHOW = 6
  const SECONDARY_COUNT = 2

  const sectioned = !anyFilter && !needle && filtered.length >= SECTION_MIN

  const { secondary, laneSections, river } = useMemo(() => {
    if (!sectioned) return { secondary: [], laneSections: [], river: [] }
    const used = new Set<string>()
    const secondaryPosts = filtered.slice(0, SECONDARY_COUNT)
    secondaryPosts.forEach((p) => used.add(p._id))

    const sections = (lanes ?? []).map((l) => {
      const inLane = filtered.filter((p) => p.articleType === l.key)
      const show = inLane.filter((p) => !used.has(p._id)).slice(0, SECTION_SHOW)
      return { key: l.key, label: l.label, color: l.color ?? '#d6d3d1', description: l.description ?? null, total: inLane.length, posts: show }
    }).filter((s) => s.total >= LANE_MIN && s.posts.length > 0)
    sections.forEach((s) => s.posts.forEach((p) => used.add(p._id)))

    return { secondary: secondaryPosts, laneSections: sections, river: filtered.filter((p) => !used.has(p._id)) }
  }, [sectioned, filtered, lanes])


  const activeLabel = [
    active,
    lane && articleTypeMeta(lane)?.label,
    tag && `#${allTags.find((t) => t.slug === tag)?.title ?? tag}`,
    status && REVIEW_STATUS[status]?.label,
  ].filter(Boolean).join(' · ')

  // The card, lifted out of the grid so the lane sections, the secondary pair and the
  // grid under the threshold all render the SAME card instead of three near-copies
  // that drift apart.
  const renderCard = (post: DirectoryPost) => {
          const isRead = mounted && post.slug ? readPosts.has(post.slug) : false
          const minutes = readingTime(post.wordCount ?? 0)
          // enumKey: this is compared against `active` below to highlight the card's own
          // category when it is the one being filtered on, and `active` comes from the URL.
          const firstCat = enumKey(post.categories?.[0])
          const meta = articleTypeMeta(post.articleType)
          // null for a post with no status, which is most of them -- no data-aura is
          // emitted and the tile renders exactly as it did before 3.4.
          // The same values the filter chips counted -- not a second computation, and not
          // named `status`, which is the filter's URL param in this scope.
          const postStatus = statusById.get(post._id) ?? []
          const aura = auraProps(postStatus)

          return (
            <PostPreview
              key={post._id}
              data={{
                title: post.title ?? 'Untitled',
                excerpt: post.excerpt,
                imageUrl: post.imageUrl,
                lane: meta ? { label: meta.short, color: meta.color } : null,
                minutes,
                // 3.3's fifth surface: the SAME call the card mark uses, so the preview and
                // the card can never show a different status for the same post.
                status: postStatus,
              }}
            >
            <Link
              href={`/blog/${post.slug}`}
              onClick={() => post.slug && markPostRead(post.slug)}
              className={`group flex flex-col h-full space-y-4 transition-all duration-300 rounded-lg ${FOCUS} ${isRead ? 'opacity-60 hover:opacity-100' : 'opacity-100'}`}
            >
              <div
                className="aspect-[4/3] w-full overflow-hidden rounded-lg border border-edge relative"
                data-aura={aura?.['data-aura']}
                style={{ backgroundColor: 'rgba(20,20,24,0.8)', ...aura?.style }}
              >
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
                  <div className="absolute top-3 right-3 z-20 font-sans text-xs text-stone-300 bg-black/70 px-2 py-1 rounded-sm border border-edge backdrop-blur-sm">
                    Read
                  </div>
                )}

                <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden="true">
                  <span className="font-sans text-xs text-white bg-black/75 px-5 py-2.5 rounded-sm backdrop-blur-sm border border-edge-strong shadow-lg">
                    {isRead ? `${L.readAgainLabel} →` : `${L.readLabel} →`}
                  </span>
                </div>
              </div>

              <div className="flex flex-col flex-grow">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex gap-2 flex-wrap items-center">
                    {meta && (
                      <span className="font-sans text-xs px-3 py-1.5 rounded-full border" style={{ color: meta.color, borderColor: `${meta.color}66`, backgroundColor: meta.bg }}>
                        {meta.label}
                      </span>
                    )}
                    {firstCat && (
                      <span className={`font-sans text-xs px-3 py-1.5 rounded-full border ${firstCat === active ? 'border-stone-300 text-stone-200 bg-surface-fill-strong' : 'border-edge text-stone-400'}`}>
                        {firstCat}
                      </span>
                    )}
                    {post.series?.title && (
                      <span className="font-sans text-xs px-3 py-1.5 rounded-full border border-orange-300/30 text-orange-300/90 inline-flex items-center gap-1.5"><Icon name="layers" size={12} aria-hidden />{post.series.title}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Phase 3.3's smallest tier: a mark, not a label. The ICON carries the
                        distinction -- a different shape per status -- because the brief
                        requires it to be readable without colour, for colourblind readers
                        and greyscale printing. Colour is only the second cue. 14px, which
                        is 3.3's floor. At most two, so a heavily-flagged post does not turn
                        its card into a badge rack. */}
                    {reviewFlags(postStatus, 2).map((f) => (
                      <span key={f.key} className={`inline-flex items-center ${f.color}`} title={f.label}>
                        <Icon name={f.icon} size={14} aria-hidden />
                        <span className="sr-only">{f.label}</span>
                      </span>
                    ))}
                    <span className="meta-label text-stone-400">{minutes} min</span>
                  </div>
                </div>

                <h3 className="text-xl font-serif text-white group-hover:text-stone-100 transition-colors mb-2 leading-snug">{post.title}</h3>

                <p className="text-stone-300 text-sm line-clamp-2 mb-4 flex-grow leading-relaxed">{post.excerpt}</p>

                <div className="flex items-center justify-between font-sans text-xs border-t border-edge pt-4">
                  <time dateTime={formatDate(post.publishedAt, 'iso')} className="text-stone-400">{formatDate(post.publishedAt, 'short', 'Undated')}</time>
                  <span className="text-stone-300 group-hover:text-white flex items-center gap-1.5 transition-colors">
                    Read <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform inline-block" aria-hidden="true" />
                  </span>
                </div>
              </div>
            </Link>
            </PostPreview>
    )
  }

  // 4.5's river: a row, not a card. At fifty posts the tail is most of the page, and fifty
  // cards is a wall. A row still carries the five things that decide whether to click --
  // date, lane, title, status and length -- in one line instead of a 4:3 image and a
  // two-line excerpt.
  const renderRiverRow = (post: DirectoryPost) => {
    const isRead = mounted && post.slug ? readPosts.has(post.slug) : false
    const minutes = readingTime(post.wordCount ?? 0)
    const meta = articleTypeMeta(post.articleType, lanes)
    const postStatus = statusById.get(post._id) ?? []
    return (
      <li key={post._id}>
        <Link
          href={`/blog/${post.slug}`}
          onClick={() => post.slug && markPostRead(post.slug)}
          className={`group flex items-baseline gap-3 py-3 rounded-sm ${FOCUS} ${isRead ? 'opacity-60 hover:opacity-100' : ''}`}
        >
          <time dateTime={formatDate(post.publishedAt, 'iso')} className="font-mono text-xs text-stone-400 shrink-0 w-24">
            {formatDate(post.publishedAt, 'short', 'Undated')}
          </time>
          {meta && (
            <span className="w-1.5 h-1.5 rounded-full shrink-0 translate-y-[-2px]" style={{ backgroundColor: meta.color }} title={meta.label} aria-hidden />
          )}
          <span className="flex-1 min-w-0 font-serif text-stone-200 group-hover:text-white transition-colors leading-snug">
            {post.title}
          </span>
          {reviewFlags(postStatus, 2).map((f) => (
            <span key={f.key} className={`shrink-0 inline-flex items-center ${f.color}`} title={f.label}>
              <Icon name={f.icon} size={13} aria-hidden />
              <span className="sr-only">{f.label}</span>
            </span>
          ))}
          <span className="font-mono text-xs text-stone-400 shrink-0 w-14 text-right">{minutes} min</span>
        </Link>
      </li>
    )
  }

  return (
    <>

      {/* ── Series rail ───────────────────────────────────────────── */}
      {copy.seriesRail.enabled && series.length > 0 && (
        <section className="mb-12" aria-labelledby="series-rail">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="series-rail" className="section-label">{copy.seriesRail.heading}</h2>
            <Link href={copy.seriesRail.ctaHref || '/blog/series'} className={`font-sans text-sm ${QUIET_LINK}`}>{copy.seriesRail.ctaLabel} →</Link>
          </div>
          <ul className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
            {series.map((s) => (
              <li key={s._id} className="snap-start flex-shrink-0 w-64">
                <Link
                  href={`/blog/series/${s.slug}`}
                  className={`block h-full rounded-lg border border-edge hover:border-edge-strong bg-surface-veil p-4 transition-colors ${FOCUS}`}
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
            <section className="rounded-lg border border-edge bg-surface-veil p-5" aria-labelledby="reading-strip">
              <div className="mb-3 flex items-center justify-between">
                <h2 id="reading-strip" className="section-label">{copy.readingStrip.heading}</h2>
                <Link href={copy.readingStrip.ctaHref || '/library'} className={`font-sans text-sm ${QUIET_LINK}`}>{copy.readingStrip.ctaLabel} →</Link>
              </div>
              <ul className="space-y-3">
                {currentlyReading.map((item) => (
                  <li key={item._id}>
                    <Link href={`/library#${item._id}`} className={`block rounded-sm ${FOCUS}`}>
                      <span className="flex items-baseline justify-between gap-3">
                        <span className="font-serif text-sm text-white leading-snug">{item.title}</span>
                        <span className="font-sans text-xs text-stone-400 flex-shrink-0">{mediaLabel(item.mediaType)}</span>
                      </span>
                      {item.author && <span className="font-mono text-xs text-stone-400 block">{item.author}</span>}
                      {typeof item.progressPercent === 'number' && (
                        <span className="flex items-center gap-2 mt-1.5">
                          <span className="flex-1 h-0.5 bg-surface-fill-strong rounded-full overflow-hidden" role="progressbar" aria-valuenow={item.progressPercent} aria-valuemin={0} aria-valuemax={100} aria-label={`${item.title} progress`}>
                            <span className="block h-full bg-emerald-500/70 rounded-full" style={{ width: `${item.progressPercent}%` }} />
                          </span>
                          <span className="font-mono text-xs text-stone-400">{item.progressPercent}%</span>
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {copy.notesStrip.enabled && recentNotes.length > 0 && (
            <section className="rounded-lg border border-edge bg-surface-veil p-5" aria-labelledby="notes-strip">
              <div className="mb-3 flex items-center justify-between">
                <h2 id="notes-strip" className="section-label">{copy.notesStrip.heading}</h2>
                <Link href={copy.notesStrip.ctaHref || '/garden'} className={`font-sans text-sm ${QUIET_LINK}`}>{copy.notesStrip.ctaLabel} →</Link>
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

      {/* ── Archive: search, facets, sections, river ──────────────────
          4.1 replaced four rows of toggle chips with browsable sections. 4.4 asked whether
          sections subsume filtering; the answer, recorded in OVERHAUL-PROGRESS, is PARTLY:
            - LANE filtering IS subsumed, and its chip row is gone. The sections are the
              lanes, and seeing all three at once beats toggling between them.
            - Topic, tag and status are ORTHOGONAL to lane, so sections cannot subsume them.
              They fold into the search row instead of standing as three more chip rows.
          The global Cmd-K search was not the place to fold them into: it searches every
          content type and navigates away, where this narrows the list in front of you. */}
      <div ref={archiveRef} className="mb-6 border-b border-edge pb-5 scroll-mt-24">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <h2 className="text-2xl font-serif font-bold text-white">{activeLabel || L.heading}</h2>
          <span className="font-sans text-sm text-stone-400" aria-live="polite">
            {L.postCount.replace('{n}', String(filtered.length))}
          </span>
        </div>
      </div>

      <div className="mb-10 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <label htmlFor="blog-find" className="sr-only">{L.findLabel}</label>
          <input
            id="blog-find"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={L.findPlaceholder}
            className={`flex-1 min-w-[12rem] bg-surface-veil border border-edge rounded-md px-3 py-2 font-sans text-sm text-stone-200 placeholder:text-stone-400 ${FOCUS}`}
          />
          {hasFacets && (
            <button
              ref={filtersButtonRef}
              type="button"
              onClick={() => setFacetsOpen((o) => !o)}
              aria-expanded={facetsOpen}
              aria-controls="blog-facets"
              className={chip(facetsOpen || anyFilter)}
            >
              {activeCount > 0 ? `${L.filtersLabel} (${activeCount})` : L.filtersLabel}
            </button>
          )}
          {(anyFilter || q) && (
            <button type="button" onClick={resetAll} className={`font-sans text-xs text-stone-400 hover:text-white underline underline-offset-4 rounded-sm ${FOCUS}`}>
              {L.clearLabel}
            </button>
          )}
        </div>

        {/* Collapsed by default. Four always-visible chip rows were the thing 4.1 objected
            to; one row that opens on demand is the same capability without the wall. */}
        {hasFacets && facetsOpen && (
          <div id="blog-facets" className="space-y-3 rounded-lg border border-edge bg-surface-veil p-4">
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
                    #{t.title} <span className="opacity-60 text-xs">{t.count}</span>
                  </button>
                ))}
              </div>
            )}

            {statusFacets.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap" role="group" aria-label="Filter by review status">
                <span className="font-sans text-xs text-stone-400 w-16">{L.filterLabels.status}</span>
                <button type="button" onClick={() => setParam('status', null)} aria-pressed={status === null} className={chip(status === null)}>{L.allLabel}</button>
                {statusFacets.map((f) => {
                  const on = status === f.key
                  return (
                    <button key={f.key} type="button" onClick={() => setParam('status', on ? null : f.key)} aria-pressed={on} className={`${chip(on)} inline-flex items-center gap-1.5`}>
                      <Icon name={f.icon} size={14} className={on ? undefined : f.color} aria-hidden />
                      {f.label}
                      <span className="opacity-60 text-xs">{f.count}</span>
                    </button>
                  )
                })}
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
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="py-20 text-center">
          <p className="font-sans text-sm text-stone-400 mb-3">{L.emptyState}</p>
          {(anyFilter || q) && (
            <button type="button" onClick={resetAll} className={`font-sans text-xs text-stone-400 hover:text-white underline underline-offset-4 rounded-sm ${FOCUS}`}>
              {L.clearLabel}
            </button>
          )}
        </div>
      ) : sectioned ? (
        <>
          {/* 4.5 SECONDARY. Two cards at card size, directly under the lead, so the top of
              the page carries three weights rather than one wall. */}
          {secondary.length > 0 && (
            <div className="blog-grid grid grid-cols-1 md:grid-cols-2 gap-8 mb-14">
              {secondary.map(renderCard)}
            </div>
          )}

          {/* 4.1 SECTIONS. One per lane with enough posts to be a section rather than a
              list with a heading. Each shows its newest few and links to the rest. */}
          {laneSections.map((s) => (
            <section key={s.key} className="mb-14" aria-labelledby={`lane-${s.key}`}>
              <div className="mb-5 flex items-end justify-between gap-4 border-b border-edge pb-3">
                <div className="min-w-0">
                  <h3 id={`lane-${s.key}`} className="text-xl font-serif font-bold" style={{ color: s.color }}>{s.label}</h3>
                  {s.description && <p className="font-sans text-sm text-stone-400 mt-1">{s.description}</p>}
                </div>
                <button type="button" onClick={() => setParam('lane', s.key)} className={`font-sans text-xs shrink-0 ${QUIET_LINK} rounded-sm ${FOCUS}`}>
                  {L.seeAllLabel.replace('{n}', String(s.total))}
                </button>
              </div>
              <div className="blog-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {s.posts.map(renderCard)}
              </div>
            </section>
          ))}

          {/* 4.5 RIVER. Everything not shown above, in date order, as rows rather than
              cards. */}
          {river.length > 0 && (
            <section className="mb-4" aria-labelledby="river-heading">
              <h3 id="river-heading" className="section-label mb-4 border-b border-edge pb-3">{L.riverHeading}</h3>
              <ul className="list-none m-0 p-0 divide-y divide-edge">
                {river.map(renderRiverRow)}
              </ul>
            </section>
          )}
        </>
      ) : (
        <div className="blog-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map(renderCard)}
        </div>
      )}
      {/* 4.2. After the real posts, not among them: mixing planned and published in one
          grid would make a reader check each card to see which is which. */}
      {copy.planned?.enabled && (
        <PlaceholderCards
          heading={copy.planned.heading}
          note={copy.planned.note}
          label={copy.planned.label}
          treatment={copy.planned.treatment}
          items={copy.planned.items ?? []}
          lanes={lanes}
        />
      )}

    </>
  )
}
