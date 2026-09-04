import type { Metadata } from 'next'
import Link from 'next/link'
// app/not-found.tsx

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: false },
}

const CORNERS = [
  'top-6 left-6 border-t border-l',
  'top-6 right-6 border-t border-r',
  'bottom-6 left-6 border-b border-l',
  'bottom-6 right-6 border-b border-r',
]

export default function NotFound() {
  return (
    <main
      id="content"
      className="relative min-h-screen bg-[#0a0a0a] text-stone-300 flex flex-col items-center justify-center px-6"
    >
      {/* Corner marks — parent is `relative` so these anchor to the page, not the body */}
      {CORNERS.map((pos) => (
        <div key={pos} aria-hidden="true" className={`absolute ${pos} w-3 h-3 border-white/10`} />
      ))}

      <div className="max-w-lg w-full text-center">
        <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-stone-400 block mb-8 border-l border-stone-600 pl-4 text-left">
          System // Error
        </span>

        <h1
          className="font-serif font-bold text-white leading-none mb-6 select-none"
          style={{ fontSize: 'clamp(96px, 18vw, 180px)' }}
        >
          4<span className="text-stone-500">0</span>4
        </h1>

        <p className="font-serif italic text-stone-400 text-xl mb-2 leading-snug">
          This intel doesn&rsquo;t exist in the archive.
        </p>
        <p className="font-mono text-[10px] text-stone-400 uppercase tracking-widest mb-12">
          The page you requested could not be located.
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/"
            className="font-mono text-[10px] uppercase tracking-[0.3em] px-5 py-3 bg-white text-black hover:bg-stone-200 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
          >
            Return home
          </Link>
          <Link
            href="/blog"
            className="font-mono text-[10px] uppercase tracking-[0.3em] px-5 py-3 border border-white/10 text-stone-300 hover:border-white/30 hover:text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
          >
            Writing
          </Link>
          <Link
            href="/projects"
            className="font-mono text-[10px] uppercase tracking-[0.3em] px-5 py-3 border border-white/10 text-stone-300 hover:border-white/30 hover:text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
          >
            Projects
          </Link>
        </div>

        <div className="mt-16 pt-8 border-t border-white/5">
          <p className="font-mono text-[9px] text-stone-400 uppercase tracking-widest">
            ERROR_CODE: 404 · STATUS: NOT_FOUND · ARCHIVE: STEFANPEELE.COM
          </p>
        </div>
      </div>
    </main>
  )
}
