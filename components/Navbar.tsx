'use client'

import { studioUrl } from '@/sanity/lib/api'
import { resolveHref } from '@/sanity/lib/utils'
import { createDataAttribute, stegaClean } from 'next-sanity'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

interface NavbarProps {
  data: any // Keeping it simple to avoid type conflicts
}

export function Navbar({ data }: NavbarProps) {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const dataAttribute = data?._id && data?._type
    ? createDataAttribute({
        baseUrl: studioUrl,
        id: data._id,
        type: data._type,
      })
    : null

  return (
    <header
      // CHANGED: Added print:hidden and bumped z-50 to z-[999]
      className={`print:hidden fixed top-0 left-0 right-0 z-[999] transition-all duration-500 px-6 py-4 md:px-16 ${
        scrolled 
          ? 'bg-black/90 backdrop-blur-md py-3 border-b border-white/5' 
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* LOGO */}
        <Link href="/" className="text-white font-serif text-xl tracking-tighter uppercase">
          S.P<span className="text-stone-600">.</span>
        </Link>

        {/* NAVIGATION */}
        <nav className="flex items-center gap-x-8">
          {data?.menuItems?.map((menuItem: any) => {
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
                data-sanity={dataAttribute?.([
                  'menuItems',
                  { _key: menuItem._key },
                ])}
              >
                {stegaClean(menuItem.title)}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}