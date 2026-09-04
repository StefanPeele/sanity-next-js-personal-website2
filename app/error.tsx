'use client'

import Link from 'next/link'
import { useEffect } from 'react'
// app/error.tsx — route segment error boundary (root layout still renders).

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[app/error]', error)
  }, [error])

  return (
    <main id="content" className="relative min-h-screen bg-[#0a0a0a] text-stone-300 flex flex-col items-center justify-center px-6">
      <div className="max-w-lg w-full text-center">
        <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-stone-400 block mb-8 border-l border-stone-600 pl-4 text-left">
          System // Fault
        </span>
        <h1 className="font-serif font-bold text-white leading-none mb-6 text-6xl md:text-8xl">
          Something broke.
        </h1>
        <p className="font-serif italic text-stone-400 text-xl mb-2 leading-snug">
          The page hit an error while rendering.
        </p>
        <p className="font-mono text-[10px] text-stone-400 uppercase tracking-widest mb-12">
          {error.digest ? `Reference ${error.digest}` : 'No reference id'}
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <button
            type="button"
            onClick={reset}
            className="font-mono text-[10px] uppercase tracking-[0.3em] px-5 py-3 bg-white text-black hover:bg-stone-200 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
          >
            Try again
          </button>
          <Link
            href="/"
            className="font-mono text-[10px] uppercase tracking-[0.3em] px-5 py-3 border border-white/10 text-stone-300 hover:border-white/30 hover:text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
          >
            Home
          </Link>
        </div>
      </div>
    </main>
  )
}
