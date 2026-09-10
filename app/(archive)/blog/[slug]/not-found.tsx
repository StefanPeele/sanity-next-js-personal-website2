import Link from 'next/link'
import { buttonClass } from '@/lib/ui'
// app/blog/[slug]/not-found.tsx
// Shown when a valid /blog/[slug] URL returns no Sanity document

export default function PostNotFound() {
  return (
    <div className="min-h-screen bg-surface text-stone-300 flex flex-col items-center justify-center px-6">

      <div className="max-w-lg w-full text-center">

        <span className="meta-label text-stone-400 block mb-8 border-l border-stone-700 pl-4 text-left">
          Archive // Post Not Found
        </span>

        <div
          className="font-serif font-bold text-white leading-none mb-6 select-none"
          style={{ fontSize: 'clamp(96px, 18vw, 180px)' }}
        >
          4<span className="text-stone-400">0</span>4
        </div>

        <p className="font-serif italic text-stone-400 text-xl mb-2 leading-snug">
          This report hasn't been filed yet.
        </p>
        <p className="meta-label text-stone-400 mb-12">
          The post you're looking for may have moved or been unpublished.
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/blog"
            className={`meta-label ${buttonClass({ variant: 'primary', size: 'lg' })}`}
          >
            Browse the Archive
          </Link>
          <Link
            href="/"
            className={`meta-label ${buttonClass({ size: 'lg' })}`}
          >
            Home
          </Link>
        </div>

        <div className="mt-16 pt-8 border-t border-edge-faint">
          <p className="meta-label text-stone-400">
            ERROR_CODE: 404 · STATUS: POST_NOT_FOUND · ARCHIVE: STEFANPEELE.COM
          </p>
        </div>

      </div>
    </div>
  )
}