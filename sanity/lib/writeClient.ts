import 'server-only'
import { apiVersion, dataset, projectId } from '@/sanity/lib/api'
import { createClient } from 'next-sanity'
// sanity/lib/writeClient.ts
// Mutating client for server actions / route handlers (newsletter). No CDN, no stega.
// Returns null when SANITY_API_WRITE_TOKEN is missing so callers can fail gracefully.

export function getWriteClient() {
  const token = process.env.SANITY_API_WRITE_TOKEN
  if (!token) return null
  return createClient({
    projectId,
    dataset,
    apiVersion,
    token,
    useCdn: false,
    perspective: 'published',
    stega: false,
  })
}
