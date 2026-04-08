'use client'

import { studioUrl } from '@/sanity/lib/api'
import { resolveHref } from '@/sanity/lib/utils'
import { createDataAttribute, stegaClean } from 'next-sanity'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
// components/Navbar.tsx

interface NavbarProps {
  data: any
}

export function Navbar({ data }: NavbarProps) {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Lock body scroll when mobile menu is open
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
        <div className="max-w-7xl mx-auto flex items-center justify-between">

          {/* Logo */}
          <Link
            href="/"
            className="text-white font-serif text-xl tracking-tighter uppercase z-10"
          >
            S.P<span className="text-stone-600">.</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-x-8">
            {menuItems.map((menuItem: any) => {
              const href = resolveHref(menuItem?._type, menuItem?.slug)
              if (!href) return null
              const isActive = pathname === href

              return (
                <Link
                  key={menuItem._key}
                  href={href}
                  className={`font-mono text-[10px] tracking-[0.3em] uppercase transition-colors ${
                    isActive ? 'text-white' : 'text-stone-500 hover:text-stone-200'
                  }`}
                  data-sanity={dataAttribute?.(['menuItems', { _key: menuItem._key }])}
                >
                  {stegaClean(menuItem.title)}
                </Link>
              )
            })}
          </nav>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            className="md:hidden z-10 w-8 h-8 flex flex-col items-center justify-center gap-1.5 group"
          >
            <span
              className={`block h-px w-5 bg-stone-400 transition-all duration-300 origin-center ${
                mobileOpen ? 'rotate-45 translate-y-[7px]' : ''
              }`}
            />
            <span
              className={`block h-px bg-stone-400 transition-all duration-300 ${
                mobileOpen ? 'w-0 opacity-0' : 'w-4'
              }`}
            />
            <span
              className={`block h-px w-5 bg-stone-400 transition-all duration-300 origin-center ${
                mobileOpen ? '-rotate-45 -translate-y-[7px]' : ''
              }`}
            />
          </button>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-[998] bg-black/95 backdrop-blur-md flex flex-col pt-24 px-8 pb-12">
          
          {/* Nav links */}
          <nav className="flex flex-col gap-1 mb-12">
            {menuItems.map((menuItem: any, i: number) => {
              const href = resolveHref(menuItem?._type, menuItem?.slug)
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
                  {stegaClean(menuItem.title)}
                </Link>
              )
            })}
          </nav>

          {/* Footer meta */}
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