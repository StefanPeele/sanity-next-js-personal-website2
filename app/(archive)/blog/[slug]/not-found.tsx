import Link from 'next/link'
// app/blog/[slug]/not-found.tsx
// Shown when a valid /blog/[slug] URL returns no Sanity document

export default function PostNotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-stone-300 flex flex-col items-center justify-center px-6">

      <div className="max-w-lg w-full text-center">

        <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-stone-600 block mb-8 border-l border-stone-800 pl-4 text-left">
          Archive // Post Not Found
        </span>

        <div
          className="font-serif font-bold text-white leading-none mb-6 select-none"
          style={{ fontSize: 'clamp(96px, 18vw, 180px)' }}
        >
          4<span className="text-stone-700">0</span>4
        </div>

        <p className="font-serif italic text-stone-500 text-xl mb-2 leading-snug">
          This report hasn't been filed yet.
        </p>
        <p className="font-mono text-[10px] text-stone-700 uppercase tracking-widest mb-12">
          The post you're looking for may have moved or been unpublished.
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/blog"
            className="font-mono text-[10px] uppercase tracking-[0.3em] px-5 py-3 bg-white text-black hover:bg-stone-200 transition-colors"
          >
            Browse the Archive
          </Link>
          <Link
            href="/"
            className="font-mono text-[10px] uppercase tracking-[0.3em] px-5 py-3 border border-white/10 text-stone-500 hover:border-white/30 hover:text-white transition-colors"
          >
            Home
          </Link>
        </div>

        <div className="mt-16 pt-8 border-t border-white/5">
          <p className="font-mono text-[9px] text-stone-800 uppercase tracking-widest">
            ERROR_CODE: 404 · STATUS: POST_NOT_FOUND · ARCHIVE: STEFANPEELE.COM
          </p>
        </div>

      </div>
    </div>
  )
}