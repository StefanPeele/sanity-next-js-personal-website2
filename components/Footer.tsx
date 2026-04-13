'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Mail, ArrowUpRight, BookOpen } from 'lucide-react'
import { FaGithub, FaLinkedin, FaTrello } from 'react-icons/fa'
// components/Footer.tsx

export default function Footer({ data }: { data: any }) {
  const currentYear = new Date().getFullYear()

  const socialLinks = [
    {
      name: 'Email',
      href: `mailto:${data?.email || 'swp9@njit.edu'}`,
      icon: <Mail size={14} />,
      label: 'Direct Line',
    },
    {
      name: 'GitHub',
      href: data?.github || 'https://github.com/StefanPeele',
      icon: <FaGithub size={14} />,
      label: 'Source Code',
    },
    {
      name: 'Gitbook',
      href: 'https://stefs-documentation.gitbook.io/stefs-documentation-docs/',      icon: <BookOpen size={14} />,
      label: 'Knowledge Base',
    },
    {
      name: 'Trello',
      href: data?.trello || '#',
      icon: <FaTrello size={14} />,
      label: 'Project Tracking',
    },
    {
      name: 'LinkedIn',
      href: data?.linkedin || '#',
      icon: <FaLinkedin size={14} />,
      label: 'Network',
    },
  ]

  const siteMap = [
    { name: 'Projects',    href: '/projects' },
    { name: 'Photography', href: '/photography' },
    { name: 'Services',    href: '/services' },
    { name: 'Editorial',   href: '/blog' },
    { name: 'Resume',      href: '/resume' },
  ]

  return (
    <footer className="w-full bg-[#0a0a0a] border-t border-white/5 pt-24 pb-12 px-6 md:px-12 lg:px-20">
      <div className="max-w-7xl mx-auto">

        {/* ── CTA ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-24">
          <div className="space-y-6">
            <span className="text-stone-600 font-mono text-[10px] tracking-[0.4em] uppercase">
              Transmission
            </span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-stone-50 text-4xl md:text-6xl font-serif font-bold leading-tight"
            >
              {data?.footerHeadlinePrefix || data?.footerHeadlineHighlight ? (
                <>
                  {data.footerHeadlinePrefix}{' '}
                  <span className="text-stone-500 italic text-3xl md:text-5xl font-light">
                    {data.footerHeadlineHighlight}
                  </span>{' '}
                  <br />
                  {data.footerHeadlineSuffix}
                </>
              ) : (
                <>
                  Let's build{' '}
                  <span className="text-stone-500 italic text-3xl md:text-5xl font-light">
                    something lasting
                  </span>
                  <br />
                  together.
                </>
              )}
            </motion.h2>
          </div>

          <div className="flex flex-col justify-end items-start lg:items-end">
            <Link
              href={`mailto:${data?.email || 'swp9@njit.edu'}`}
              className="group flex items-center gap-4 text-white font-mono text-xs tracking-widest uppercase border border-white/10 px-8 py-4 rounded-full hover:bg-white hover:text-black transition-all duration-500"
            >
              Initiate Contact{' '}
              <ArrowUpRight
                size={16}
                className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"
              />
            </Link>
          </div>
        </div>

        {/* ── Links ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 pb-16 border-b border-white/5">

          {/* Directory */}
          <div className="space-y-6">
            <h4 className="text-stone-500 font-mono text-[9px] tracking-[0.3em] uppercase">
              Directory
            </h4>
            <ul className="space-y-3">
              {siteMap.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-stone-300 hover:text-white font-serif text-lg transition-colors inline-block group"
                  >
                    <span className="relative">
                      {link.name}
                      <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-white transition-all group-hover:w-full" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Network & Tracking */}
          <div className="space-y-6 lg:col-span-2">
            <h4 className="text-stone-500 font-mono text-[9px] tracking-[0.3em] uppercase">
              Network & Tracking
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {socialLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center gap-4 p-4 bg-[#111]/40 border border-white/5 rounded-xl hover:border-white/20 hover:bg-[#111] transition-all"
                >
                  <div className="text-stone-500 group-hover:text-white transition-colors flex-shrink-0">
                    {link.icon}
                  </div>
                  <div>
                    <span className="block text-stone-200 text-sm font-serif">
                      {link.name}
                    </span>
                    <span className="block text-stone-600 font-mono text-[8px] uppercase tracking-tighter">
                      {link.label}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* System Specs */}
          <div className="space-y-6">
            <h4 className="text-stone-500 font-mono text-[9px] tracking-[0.3em] uppercase">
              System Specs
            </h4>
            <div className="text-[10px] font-mono text-stone-500 leading-loose">
              <p className="flex justify-between border-b border-white/5 pb-1 mb-1">
                <span className="text-stone-700">BUILD:</span>
                <span>v2.0.26_STABLE</span>
              </p>
              <p className="flex justify-between border-b border-white/5 pb-1 mb-1">
                <span className="text-stone-700">LOC:</span>
                <span>40.7128° N, 74.0060° W</span>
              </p>
              <p className="flex justify-between border-b border-white/5 pb-1 mb-1">
                <span className="text-stone-700">STATUS:</span>
                <span className="text-green-900 animate-pulse">● OPERATIONAL</span>
              </p>
              <p className="mt-4 text-stone-600 italic">
                © {currentYear} STEFAN PEELE ARCHIVE
              </p>
            </div>
          </div>
        </div>

        {/* ── Big name ─────────────────────────────────────────────── */}
        <div className="pt-12 overflow-hidden pointer-events-none">
          <h1 className="text-[15vw] font-serif font-bold text-white/[0.02] leading-none select-none whitespace-nowrap">
            STEFAN PEELE — STEFAN PEELE
          </h1>
        </div>
      </div>
    </footer>
  )
}