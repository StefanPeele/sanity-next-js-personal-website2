'use client'

import { studioUrl } from '@/sanity/lib/api'
import { resolveHref } from '@/sanity/lib/utils'
import { createDataAttribute, stegaClean } from 'next-sanity'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { SearchModal } from '@/components/SearchModal'
// components/Navbar.tsx

// Matches Sanity's SettingsQueryResult shape — _key and slug can be null
// from the generated types, so we accept null and guard at render time
interface MenuItem {
  _key: string | null
  _type: string
  slug: string | null
  title: string | null
}

interface NavbarProps {
  data: {
    _id?: string | null
    _type?: string | null
    menuItems?: MenuItem[] | null
  } | null
}

export function Navbar({ data }: NavbarProps) {
  const pathname                    = usePathname()
  const [scrolled, setScrolled]     = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => { setMobileOpen(false) }, [pathname])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const dataAttribute =
    data?._id && data?._type
      ? createDataAttribute({
          baseUrl: studioUrl,
          id: data._id,
          type: data._type,
        })
      : null

  const menuItems = data?.menuItems ?? []

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
            className="text-white font-serif text-xl tracking-tighter uppercase z-10 flex-shrink-0"
          >
            S.P<span className="text-stone-600">.</span>
          </Link>

          {/* Desktop nav + search */}
          <div className="hidden md:flex items-center gap-x-8">
            <nav className="flex items-center gap-x-8">
              {menuItems.map((menuItem) => {
                // Guard against null _key or slug from Sanity typegen
                if (!menuItem._key || !menuItem._type) return null
                const href = resolveHref(menuItem._type, menuItem.slug ?? '')
                if (!href) return null
                const isActive = pathname === href

                return (
                  <Link
                    key={menuItem._key}
                    href={href}
                    className={`font-mono text-[10px] tracking-[0.3em] uppercase transition-colors ${
                      isActive ? 'text-white' : 'text-stone-500 hover:text-stone-200'
                    }`}
                    data-sanity={dataAttribute?.([
                      'menuItems',
                      { _key: menuItem._key },
                    ])}
                  >
                    {stegaClean(menuItem.title ?? '')}
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
              className="w-8 h-8 flex flex-col items-center justify-center gap-1.5"
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
        <div className="md:hidden fixed inset-0 z-[998] bg-black/95 backdrop-blur-md flex flex-col pt-24 px-8 pb-12">
          <nav className="flex flex-col gap-1 mb-12">
            {menuItems.map((menuItem, i) => {
              if (!menuItem._key || !menuItem._type) return null
              const href = resolveHref(menuItem._type, menuItem.slug ?? '')
              if (!href) return null
              const isActive = pathname === href

              return (
                <Link
                  key={menuItem._key}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={`font-serif text-4xl font-bold py-3 border-b border-white/5 transition-colors ${
                    isActive ? 'text-white' : 'text-stone-600 hover:text-white'
                  }`}
                  style={{ transitionDelay: `${i * 40}ms` }}
                >
                  {stegaClean(menuItem.title ?? '')}
                </Link>
              )
            })}
          </nav>

          <div className="mt-auto">
            <p className="font-mono text-[9px] uppercase tracking-[0.35em] text-stone-700">
              Stefan Peele — Digital Archive
            </p>
            <p className="font-mono text-[9px] uppercase tracking-[0.35em] text-stone-800 mt-1">
              NJIT // Newark, NJ
            </p>
          </div>
        </div>
      )}
    </>
  )
}