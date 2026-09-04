// components/article/heroImage.ts
// Plain module (no 'use client') so both the server page and the client hero can use it.

/** Sanity CDN hero URL: 1600px wide, auto format, q75. */
export function heroImageUrl(url: string): string {
  return `${url}${url.includes('?') ? '&' : '?'}w=1600&auto=format&q=75`
}
