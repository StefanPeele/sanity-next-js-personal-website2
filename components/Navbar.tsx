'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { SearchModal } from '@/components/SearchModal'
import { PRIMARY_NAV, SECONDARY_NAV } from '@/lib/site'
// components/Navbar.tsx
// Primary navigation is hard-coded in lib/site.ts so every section of the site
// is reachable. The `data` prop is accepted for backwards compatibility and ignored.

interface NavbarProps {
  data?: unknown
}

export function Navbar(_props: NavbarProps = {}) {
  const pathname                    = usePathname()
  const [scrolled, setScrolled]     = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    let raf = 0
    const handleScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => setScrolled(window.scrollY > 20))
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  useEffect(() => { setMobileOpen(false) }, [pathname])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mobileOpen])

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/')

  return (
    <>
      <header
        className={`print:hidden fixed top-0 left-0 right-0 z-[999] transition-all duration-500 px-6 py-4 md:px-16 ${
          scrolled || mobileOpen
            ? 'bg-black/95 backdrop-blur-md py-3 border-b border-white/5'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">

          {/* Logo */}
          <Link
            href="/"
            aria-label="Stefan Peele — home"
            className="text-white font-serif text-xl tracking-tighter uppercase z-10 flex-shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 rounded-sm"
          >
            S.P<span className="text-stone-600">.</span>
          </Link>

          {/* Desktop nav + search */}
          <div className="hidden md:flex items-center gap-x-8">
            <nav aria-label="Primary" className="flex items-center gap-x-7">
              {PRIMARY_NAV.map((item) => {
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={`font-mono text-[10px] tracking-[0.3em] uppercase transition-colors rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 ${
                      active ? 'text-white' : 'text-stone-400 hover:text-stone-100'
                    }`}
                  >
                    {item.name}
                  </Link>
                )
              })}
            </nav>
            <SearchModal />
          </div>

          {/* Mobile: search icon + hamburger */}
          <div className="md:hidden flex items-center gap-4 z-10">
            <SearchModal />
            <button
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
              className="w-10 h-10 -mr-2 flex flex-col items-center justify-center gap-1.5 rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
            >
              <span className={`block h-px w-5 bg-stone-400 transition-all duration-300 origin-center ${mobileOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
              <span className={`block h-px bg-stone-400 transition-all duration-300 ${mobileOpen ? 'w-0 opacity-0' : 'w-4'}`} />
              <span className={`block h-px w-5 bg-stone-400 transition-all duration-300 origin-center ${mobileOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          className="md:hidden fixed inset-0 z-[998] bg-black/95 backdrop-blur-md flex flex-col pt-24 px-8 pb-12 overflow-y-auto"
        >
          <nav aria-label="Primary" className="flex flex-col gap-1 mb-10">
            {PRIMARY_NAV.map((item, i) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  aria-current={active ? 'page' : undefined}
                  className={`font-serif text-4xl font-bold py-3 border-b border-white/5 transition-colors ${
                    active ? 'text-white' : 'text-stone-500 hover:text-white'
                  }`}
                  style={{ transitionDelay: `${i * 40}ms` }}
                >
                  {item.name}
                  <span className="block font-mono text-[9px] font-normal tracking-[0.25em] uppercase text-stone-600 mt-1">
                    {item.desc}
                  </span>
                </Link>
              )
            })}
          </nav>

          <nav aria-label="Secondary" className="flex flex-wrap gap-x-5 gap-y-2 mb-12">
            {SECONDARY_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="font-mono text-[10px] tracking-[0.25em] uppercase text-stone-500 hover:text-white transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="mt-auto">
            <p className="font-mono text-[9px] uppercase tracking-[0.35em] text-stone-500">
              Stefan Peele — Digital Archive
            </p>
            <p className="font-mono text-[9px] uppercase tracking-[0.35em] text-stone-600 mt-1">
              NJIT // Newark, NJ
            </p>
          </div>
        </div>
      )}
    </>
  )
}
