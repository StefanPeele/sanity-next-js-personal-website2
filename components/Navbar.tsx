'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { SearchModal } from '@/components/SearchModal'
import { DEFAULT_NAVIGATION, navHref, type NavigationData } from '@/lib/cms/defaults/navigation'
import { FOCUS } from '@/lib/ui'
// components/Navbar.tsx — navigation comes from Studio → Site → Navigation (with code defaults).

export function Navbar({ nav = DEFAULT_NAVIGATION }: { nav?: NavigationData }) {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
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

  // Close the drawer on navigation (state adjusted during render, per React docs).
  const [drawerPath, setDrawerPath] = useState(pathname)
  if (drawerPath !== pathname) {
    setDrawerPath(pathname)
    setMobileOpen(false)
  }

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

  const primary = nav.primary ?? []
  const secondary = nav.secondary ?? []

  return (
    <>
      <header
        className={`print:hidden fixed top-0 left-0 right-0 z-[999] transition-all duration-500 px-6 py-4 md:px-16 ${
          scrolled || mobileOpen ? 'bg-black/95 backdrop-blur-md py-3 border-b border-white/5' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
          <Link href="/" aria-label="Home" className={`text-white font-serif text-xl tracking-tight z-10 flex-shrink-0 rounded-sm ${FOCUS}`}>
            {nav.logoText || 'S.P.'}
          </Link>

          <div className="hidden md:flex items-center gap-x-8">
            <nav aria-label="Primary" className="flex items-center gap-x-7">
              {primary.map((item) => {
                const href = navHref(item)
                const active = isActive(href)
                return (
                  <Link
                    key={href + item.label}
                    href={href}
                    target={item.newTab ? '_blank' : undefined}
                    rel={item.newTab ? 'noopener noreferrer' : undefined}
                    aria-current={active ? 'page' : undefined}
                    className={`inline-flex items-center min-h-[24px] py-1 font-sans text-sm transition-colors rounded-sm ${FOCUS} ${active ? 'text-white' : 'text-stone-400 hover:text-stone-100'}`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>
            <SearchModal quickLinks={nav.searchQuickLinks} />
          </div>

          <div className="md:hidden flex items-center gap-4 z-10">
            <SearchModal quickLinks={nav.searchQuickLinks} />
            <button
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
              className={`w-10 h-10 -mr-2 flex flex-col items-center justify-center gap-1.5 rounded-sm ${FOCUS}`}
            >
              <span className={`block h-px w-5 bg-stone-400 transition-all duration-300 origin-center ${mobileOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
              <span className={`block h-px bg-stone-400 transition-all duration-300 ${mobileOpen ? 'w-0 opacity-0' : 'w-4'}`} />
              <span className={`block h-px w-5 bg-stone-400 transition-all duration-300 origin-center ${mobileOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div id="mobile-menu" role="dialog" aria-modal="true" aria-label="Site menu" className="md:hidden fixed inset-0 z-[998] bg-black/95 backdrop-blur-md flex flex-col pt-24 px-8 pb-12 overflow-y-auto">
          <nav aria-label="Primary" className="flex flex-col gap-1 mb-10">
            {primary.map((item) => {
              const href = navHref(item)
              const active = isActive(href)
              return (
                <Link key={href + item.label} href={href} onClick={() => setMobileOpen(false)} aria-current={active ? 'page' : undefined}
                  className={`font-serif text-4xl font-bold py-3 border-b border-white/5 transition-colors ${active ? 'text-white' : 'text-stone-400 hover:text-white'}`}>
                  {item.label}
                  {item.description && <span className="block font-sans text-sm font-normal text-stone-400 mt-1">{item.description}</span>}
                </Link>
              )
            })}
          </nav>
          {secondary.length > 0 && (
            <nav aria-label="Secondary" className="flex flex-wrap gap-x-5 gap-y-2 mb-12">
              {secondary.map((item) => (
                <Link key={navHref(item) + item.label} href={navHref(item)} onClick={() => setMobileOpen(false)} className="font-sans text-sm text-stone-400 hover:text-white transition-colors">
                  {item.label}
                </Link>
              ))}
            </nav>
          )}
          {nav.drawerFooterLine && <p className="mt-auto font-sans text-sm text-stone-400">{nav.drawerFooterLine}</p>}
        </div>
      )}
    </>
  )
}
