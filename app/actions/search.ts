'use server'

import { client } from '@/sanity/lib/client'
// app/actions/search.ts

export interface SearchResult {
  _id: string
  title: string
  slug: string
  excerpt?: string
  publishedAt: string
  categories?: string[]
}

const searchQuery = `
  *[_type == "post" && (
    title match $term ||
    excerpt match $term ||
    pt::text(body) match $term
  )] | order(publishedAt desc) [0..7] {
    _id,
    title,
    "slug": slug.current,
    excerpt,
    publishedAt,
    "categories": categories[]->title
  }
`

export async function searchPosts(query: string): Promise<SearchResult[]> {
  if (!query || query.trim().length < 2) return []
  const sanitized = query.trim().replace(/[^a-zA-Z0-9\s]/g, '') + '*'
  try {
    const params: Record<string, unknown> = { term: sanitized }
    return await client.fetch<SearchResult[]>(searchQuery, params)
  } catch {
    return []
  }
}