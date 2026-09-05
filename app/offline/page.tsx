import type { Metadata } from 'next'
import { getErrorPages } from '@/lib/cms/loaders'
// app/offline/page.tsx — served by public/sw.js when an article is requested offline and is not
// cached. Precached on service-worker install, so keep it free of client-only dependencies.

export const metadata: Metadata = {
  title: 'Offline',
  robots: { index: false, follow: false },
}

const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400'

export default async function OfflinePage() {
  const { offline } = await getErrorPages()
  return (
    <main id="content" className="relative min-h-screen bg-[#0a0a0a] text-stone-300 flex flex-col items-center justify-center px-6">
      <div className="max-w-lg w-full text-center">
        <h1 className="font-serif text-white text-4xl mb-4">{offline.title}</h1>
        <p className="font-sans text-stone-400 text-base mb-10">{offline.body}</p>
        <a href={offline.ctaHref} className={`font-sans text-sm px-5 py-3 rounded-full bg-white text-black hover:bg-stone-200 transition-colors ${FOCUS}`}>
          {offline.ctaLabel}
        </a>
      </div>
    </main>
  )
}
