'use server'

import { client } from '@/sanity/lib/client'
import { searchIndexQuery } from '@/sanity/lib/queries'
import { rateLimit, getClientIp } from '@/lib/security'
import type { SearchIndexQueryResult } from '@/sanity.types'
// app/actions/search.ts
// Unified site search over posts, notes, projects, library and glossary.
// The index is fetched once and cached in module memory for five minutes;
// ranking is done here (title matches first, then body text). 30 req/min per IP.

export type SearchType = 'post' | 'note' | 'project' | 'library' | 'glossary'

export interface SearchResult {
  _id: string
  type: SearchType
  title: string
  href: string
  excerpt?: string
  meta?: string
  score: number
}

export interface SearchGroup {
  type: SearchType
  label: string
  results: SearchResult[]
}

export interface SearchResponse {
  groups: SearchGroup[]
  total: number
  error?: 'rate-limited' | 'unavailable'
}

const GROUP_LABELS: Record<SearchType, string> = {
  post: 'Posts',
  note: 'Garden notes',
  project: 'Projects',
  library: 'Library',
  glossary: 'Glossary',
}
const GROUP_ORDER: SearchType[] = ['post', 'note', 'glossary', 'project', 'library']

interface IndexEntry {
  _id: string
  type: SearchType
  title: string
  href: string
  excerpt?: string
  meta?: string
  titleLc: string
  textLc: string
}

const TTL = 5 * 60 * 1000
let cache: { at: number; entries: IndexEntry[] } | null = null
let inflight: Promise<IndexEntry[]> | null = null

function clip(s: string | null | undefined, n = 160) {
  if (!s) return undefined
  const t = s.replace(/\s+/g, ' ').trim()
  return t.length > n ? t.slice(0, n).trimEnd() + '…' : t
}

function buildIndex(data: SearchIndexQueryResult): IndexEntry[] {
  const out: IndexEntry[] = []
  for (const p of data.posts) {
    if (!p.slug || !p.title) continue
    out.push({
      _id: p._id, type: 'post', title: p.title, href: `/blog/${p.slug}`,
      excerpt: clip(p.excerpt) ?? clip(p.text),
      meta: [p.articleType?.replace(/-/g, ' '), ...(p.categories ?? [])].filter(Boolean).join(' · '),
      titleLc: p.title.toLowerCase(),
      textLc: [p.excerpt, p.text, ...(p.categories ?? [])].filter(Boolean).join(' ').toLowerCase(),
    })
  }
  for (const n of data.notes) {
    if (!n.slug || !n.title) continue
    out.push({
      _id: n._id, type: 'note', title: n.title, href: `/garden/${n.slug}`,
      excerpt: clip(n.text), meta: n.status ?? undefined,
      titleLc: n.title.toLowerCase(), textLc: (n.text ?? '').toLowerCase(),
    })
  }
  for (const p of data.projects) {
    if (!p.slug || !p.title) continue
    out.push({
      _id: p._id, type: 'project', title: p.title, href: `/projects/${p.slug}`,
      excerpt: clip(p.excerpt), meta: (p.techStack ?? []).slice(0, 3).join(' · '),
      titleLc: p.title.toLowerCase(), textLc: [p.excerpt, ...(p.techStack ?? [])].join(' ').toLowerCase(),
    })
  }
  for (const l of data.library) {
    if (!l.title) continue
    out.push({
      _id: l._id, type: 'library', title: l.title, href: `/library#${l._id}`,
      excerpt: clip(l.oneSentenceTake), meta: [l.mediaType?.replace(/-/g, ' '), l.author].filter(Boolean).join(' · '),
      titleLc: l.title.toLowerCase(), textLc: [l.author, l.oneSentenceTake].filter(Boolean).join(' ').toLowerCase(),
    })
  }
  for (const g of data.glossary) {
    if (!g.slug || !g.term) continue
    out.push({
      _id: g._id, type: 'glossary', title: g.term, href: `/glossary#${g.slug}`,
      excerpt: clip(g.definition), meta: 'term',
      titleLc: g.term.toLowerCase(), textLc: (g.definition ?? '').toLowerCase(),
    })
  }
  return out
}

async function getIndex(): Promise<IndexEntry[]> {
  const now = Date.now()
  if (cache && now - cache.at < TTL) return cache.entries
  if (inflight) return inflight
  inflight = client
    .fetch(searchIndexQuery, {}, { stega: false })
    .then((data) => {
      const entries = buildIndex(data)
      cache = { at: Date.now(), entries }
      return entries
    })
    .finally(() => { inflight = null })
  return inflight
}

function score(e: IndexEntry, terms: string[], phrase: string): number {
  let s = 0
  if (e.titleLc === phrase) s += 100
  else if (e.titleLc.startsWith(phrase)) s += 60
  else if (e.titleLc.includes(phrase)) s += 40
  for (const t of terms) {
    if (e.titleLc.includes(t)) s += 15
    else if (e.textLc.includes(t)) s += 4
    else return 0 // every term must match somewhere
  }
  return s
}

export async function searchSite(query: string): Promise<SearchResponse> {
  const phrase = (query ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
  if (phrase.length < 2) return { groups: [], total: 0 }

  const ip = await getClientIp()
  const limit = rateLimit(`search:${ip}`, 30, 60_000)
  if (!limit.ok) return { groups: [], total: 0, error: 'rate-limited' }

  let entries: IndexEntry[]
  try {
    entries = await getIndex()
  } catch {
    return { groups: [], total: 0, error: 'unavailable' }
  }

  const terms = phrase.split(' ').filter(Boolean)
  const scored: SearchResult[] = []
  for (const e of entries) {
    const s = score(e, terms, phrase)
    if (s > 0) scored.push({ _id: e._id, type: e.type, title: e.title, href: e.href, excerpt: e.excerpt, meta: e.meta, score: s })
  }
  scored.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))

  const groups: SearchGroup[] = GROUP_ORDER
    .map((type) => ({ type, label: GROUP_LABELS[type], results: scored.filter((r) => r.type === type).slice(0, 5) }))
    .filter((g) => g.results.length > 0)
    // Group with the best single hit first.
    .sort((a, b) => (b.results[0]?.score ?? 0) - (a.results[0]?.score ?? 0))

  return { groups, total: scored.length }
}

/** Backwards-compatible helper: posts only, flat list. */
export async function searchPosts(query: string): Promise<SearchResult[]> {
  const res = await searchSite(query)
  return res.groups.find((g) => g.type === 'post')?.results ?? []
}
