import type { Metadata } from 'next'
import Link from 'next/link'
import { getErrorPages } from '@/lib/cms/loaders'
import { navHref } from '@/lib/cms/defaults/navigation'
// app/not-found.tsx — copy from Studio → Site → Error pages.

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: false },
}

const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400'

export default async function NotFound() {
  const { notFound } = await getErrorPages()
  return (
    <main id="content" className="relative min-h-screen bg-[#0a0a0a] text-stone-300 flex flex-col items-center justify-center px-6">
      <div className="max-w-lg w-full text-center">
        <p className="font-serif font-bold text-white leading-none mb-6 select-none" style={{ fontSize: 'clamp(96px, 18vw, 180px)' }} aria-hidden="true">
          4<span className="text-stone-400">0</span>4
        </p>
        <h1 className="font-serif text-white text-3xl mb-3">{notFound.title}</h1>
        <p className="font-sans text-stone-400 text-base mb-2">{notFound.body}</p>
        <p className="font-sans text-stone-400 text-sm mb-10">{notFound.hint}</p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link href={navHref(notFound.primaryCta)} className={`font-sans text-sm px-5 py-3 rounded-full bg-white text-black hover:bg-stone-200 transition-colors ${FOCUS}`}>
            {notFound.primaryCta.label}
          </Link>
          {notFound.links.map((l) => (
            <Link key={navHref(l) + l.label} href={navHref(l)} className={`font-sans text-sm px-5 py-3 rounded-full border border-white/10 text-stone-300 hover:border-white/30 hover:text-white transition-colors ${FOCUS}`}>
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
