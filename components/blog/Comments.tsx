'use client'

import { useEffect, useRef } from 'react'
// components/blog/Comments.tsx
// Giscus (GitHub Discussions) comments. Renders nothing unless all three public
// env vars are set — Giscus needs a public repo with Discussions enabled and the
// giscus app installed:
//   NEXT_PUBLIC_GISCUS_REPO          e.g. "StefanPeele/sanity-next-js-personal-website2"
//   NEXT_PUBLIC_GISCUS_REPO_ID       from https://giscus.app
//   NEXT_PUBLIC_GISCUS_CATEGORY_ID   from https://giscus.app

const REPO = process.env.NEXT_PUBLIC_GISCUS_REPO
const REPO_ID = process.env.NEXT_PUBLIC_GISCUS_REPO_ID
const CATEGORY_ID = process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID

export const commentsEnabled = !!(REPO && REPO_ID && CATEGORY_ID)

export function Comments({ term }: { term: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!commentsEnabled || !ref.current || ref.current.childElementCount > 0) return
    const s = document.createElement('script')
    s.src = 'https://giscus.app/client.js'
    s.async = true
    s.crossOrigin = 'anonymous'
    s.setAttribute('data-repo', REPO!)
    s.setAttribute('data-repo-id', REPO_ID!)
    s.setAttribute('data-category-id', CATEGORY_ID!)
    s.setAttribute('data-mapping', 'specific')
    s.setAttribute('data-term', term)
    s.setAttribute('data-strict', '1')
    s.setAttribute('data-reactions-enabled', '0')
    s.setAttribute('data-emit-metadata', '0')
    s.setAttribute('data-input-position', 'top')
    s.setAttribute('data-theme', 'transparent_dark')
    s.setAttribute('data-lang', 'en')
    s.setAttribute('data-loading', 'lazy')
    ref.current.appendChild(s)
  }, [term])

  if (!commentsEnabled) return null

  return (
    <section className="mt-16 pt-10 border-t border-white/[0.08]" aria-labelledby="comments-heading" data-print-hide>
      <h2 id="comments-heading" className="font-mono text-[10px] uppercase tracking-[0.4em] text-stone-400 border-l-2 border-stone-600 pl-4 mb-6">
        Discussion
      </h2>
      <p className="font-mono text-[10px] text-stone-500 mb-4">Comments are GitHub Discussions — sign in with GitHub to post.</p>
      <div ref={ref} className="giscus" />
    </section>
  )
}
