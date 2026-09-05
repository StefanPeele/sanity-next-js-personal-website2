'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useErrorCopy } from '@/components/ErrorCopyProvider'
// app/error.tsx — route segment error boundary. Copy from Studio via ErrorCopyProvider.

const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400'

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const copy = useErrorCopy()
  useEffect(() => { console.error('[app/error]', error) }, [error])

  return (
    <main id="content" className="relative min-h-screen bg-[#0a0a0a] text-stone-300 flex flex-col items-center justify-center px-6">
      <div className="max-w-lg w-full text-center">
        <h1 className="font-serif font-bold text-white leading-tight mb-4 text-4xl md:text-6xl">{copy.title}</h1>
        <p className="font-sans text-stone-400 text-base mb-2">{copy.body}</p>
        {error.digest && <p className="font-sans text-stone-500 text-sm mb-10">{copy.referenceLabel} {error.digest}</p>}
        <div className="flex items-center justify-center gap-3 flex-wrap mt-6">
          <button type="button" onClick={reset} className={`font-sans text-sm px-5 py-3 rounded-full bg-white text-black hover:bg-stone-200 transition-colors ${FOCUS}`}>{copy.retryLabel}</button>
          <Link href="/" className={`font-sans text-sm px-5 py-3 rounded-full border border-white/10 text-stone-300 hover:border-white/30 hover:text-white transition-colors ${FOCUS}`}>{copy.homeLabel}</Link>
        </div>
      </div>
    </main>
  )
}
