import Link from 'next/link'
import { ArrowUpRight, BookOpen, Mail, Rss } from 'lucide-react'
import { FaGithub, FaInstagram, FaLinkedin, FaTrello } from 'react-icons/fa'
import { FaBluesky } from 'react-icons/fa6'
import type { SettingsQueryResult } from '@/sanity.types'
import { NewsletterForm } from '@/components/NewsletterForm'
import { PRIMARY_NAV, SECONDARY_NAV, SITE } from '@/lib/site'
// components/Footer.tsx — server component. Real telemetry from Vercel env vars,
// IndieWeb h-card, rel="me" social links, newsletter form.

// Captured once per build (module scope of a server component).
const BUILD_TIME = new Date().toISOString()
const COMMIT  = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'local'
const BRANCH  = process.env.VERCEL_GIT_COMMIT_REF || 'local'
const REGION  = process.env.VERCEL_REGION || (process.env.VERCEL_DEPLOYMENT_ID ? 'vercel' : 'dev')
const DEPLOYED = Boolean(process.env.VERCEL_DEPLOYMENT_ID)

type Settings = Partial<NonNullable<SettingsQueryResult>> | null | undefined

type NetworkLink = {
  name: string
  href: string
  label: string
  icon: React.ReactNode
  me?: boolean
  email?: boolean
}

function buildNetwork(data: Settings): NetworkLink[] {
  const email = data?.email || SITE.email
  const list: Array<NetworkLink | null> = [
    { name: 'Email',     href: `mailto:${email}`,                          label: 'Direct line',       icon: <Mail size={14} aria-hidden />, email: true },
    data?.github || SITE.handles.github
      ? { name: 'GitHub', href: data?.github || SITE.handles.github,        label: 'Source code',       icon: <FaGithub size={14} aria-hidden />, me: true }
      : null,
    data?.linkedin
      ? { name: 'LinkedIn', href: data.linkedin,                            label: 'Professional',      icon: <FaLinkedin size={14} aria-hidden />, me: true }
      : null,
    data?.gitbook || SITE.handles.gitbook
      ? { name: 'GitBook', href: data?.gitbook || SITE.handles.gitbook,     label: 'Knowledge base',    icon: <BookOpen size={14} aria-hidden />, me: true }
      : null,
    data?.instagram || SITE.handles.instagram
      ? { name: 'Instagram', href: data?.instagram || SITE.handles.instagram, label: 'Photography',    icon: <FaInstagram size={14} aria-hidden />, me: true }
      : null,
    data?.bluesky
      ? { name: 'Bluesky', href: data.bluesky,                              label: 'Short signals',     icon: <FaBluesky size={14} aria-hidden />, me: true }
      : null,
    data?.trello
      ? { name: 'Trello', href: data.trello,                                label: 'Project tracking',  icon: <FaTrello size={14} aria-hidden /> }
      : null,
    { name: 'RSS',       href: '/blog/feed.xml',                            label: 'Subscribe anywhere', icon: <Rss size={14} aria-hidden /> },
  ]
  return list.filter((l): l is NetworkLink => l !== null)
}

const DIRECTORY = [...PRIMARY_NAV, ...SECONDARY_NAV]

export default function Footer({ data }: { data?: Settings }) {
  const currentYear = new Date().getFullYear()
  const network = buildNetwork(data)
  const email = data?.email || SITE.email

  const headline =
    data?.footerHeadlinePrefix || data?.footerHeadlineHighlight
      ? { prefix: data.footerHeadlinePrefix ?? '', highlight: data.footerHeadlineHighlight ?? '', suffix: data.footerHeadlineSuffix ?? '' }
      : { prefix: "Let's build", highlight: 'something lasting', suffix: 'together.' }

  return (
    <footer className="print:hidden h-card w-full bg-[#0a0a0a] border-t border-white/5 pt-24 pb-12 px-6 md:px-12 lg:px-20">
      <div className="max-w-7xl mx-auto">

        {/* ── CTA ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-24">
          <div className="space-y-6">
            <span className="text-stone-400 font-mono text-[10px] tracking-[0.4em] uppercase">
              Transmission
            </span>
            <h2 className="motion-safe:animate-fade-up text-stone-50 text-4xl md:text-6xl font-serif font-bold leading-tight">
              {headline.prefix}{' '}
              <span className="text-stone-400 italic text-3xl md:text-5xl font-light">
                {headline.highlight}
              </span>{' '}
              <br />
              {headline.suffix}
            </h2>
            <a
              href={`mailto:${email}`}
              className="group inline-flex items-center gap-4 text-white font-mono text-xs tracking-widest uppercase border border-white/10 px-8 py-4 rounded-full hover:bg-white hover:text-black transition-all duration-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
            >
              Initiate contact{' '}
              <ArrowUpRight
                size={16}
                aria-hidden
                className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"
              />
            </a>
          </div>

          <div className="flex flex-col justify-end">
            <NewsletterForm source="footer" />
          </div>
        </div>

        {/* ── Links ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 pb-16 border-b border-white/5">

          {/* Directory */}
          <nav aria-labelledby="footer-directory" className="space-y-6">
            <h3 id="footer-directory" className="text-stone-400 font-mono text-[10px] tracking-[0.3em] uppercase">
              Directory
            </h3>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-3 lg:grid-cols-1">
              {DIRECTORY.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-stone-300 hover:text-white font-serif text-lg transition-colors inline-block group rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
                  >
                    <span className="relative">
                      {link.name}
                      <span className="absolute bottom-0 left-0 w-0 h-px bg-white transition-all group-hover:w-full" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Network */}
          <div className="space-y-6 lg:col-span-2">
            <h3 className="text-stone-400 font-mono text-[10px] tracking-[0.3em] uppercase">
              Network
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {network.map((link) => {
                const external = link.href.startsWith('http')
                return (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      target={external ? '_blank' : undefined}
                      rel={[external ? 'noopener noreferrer' : null, link.me ? 'me' : null].filter(Boolean).join(' ') || undefined}
                      className={`group flex items-center gap-4 p-4 bg-[#111]/40 border border-white/5 rounded-xl hover:border-white/20 hover:bg-[#111] transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 ${
                        link.email ? 'u-email' : link.me ? 'u-url' : ''
                      }`}
                    >
                      <span className="text-stone-400 group-hover:text-white transition-colors shrink-0">
                        {link.icon}
                      </span>
                      <span>
                        <span className="block text-stone-200 text-sm font-serif">{link.name}</span>
                        <span className="block text-stone-400 font-mono text-[10px] uppercase tracking-wide">
                          {link.label}
                        </span>
                      </span>
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Telemetry */}
          <div className="space-y-6">
            <h3 className="text-stone-400 font-mono text-[10px] tracking-[0.3em] uppercase">
              Telemetry
            </h3>
            <dl className="text-[11px] font-mono text-stone-300 leading-loose">
              <div className="flex justify-between gap-4 border-b border-white/5 pb-1 mb-1">
                <dt className="text-stone-400">Build</dt>
                <dd title={BUILD_TIME}>{COMMIT}{BRANCH !== 'local' ? ` · ${BRANCH}` : ''}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-white/5 pb-1 mb-1">
                <dt className="text-stone-400">Deployed</dt>
                <dd>
                  <time dateTime={BUILD_TIME}>{BUILD_TIME.slice(0, 16).replace('T', ' ')}Z</time>
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-white/5 pb-1 mb-1">
                <dt className="text-stone-400">Region</dt>
                <dd>{DEPLOYED ? REGION : 'local'}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-white/5 pb-1 mb-1">
                <dt className="text-stone-400">Location</dt>
                <dd className="p-locality text-right">
                  {SITE.location.city}, {SITE.location.region}
                  <span className="block text-stone-400">
                    {Math.abs(SITE.location.lat).toFixed(2)}° N, {Math.abs(SITE.location.lng).toFixed(2)}° W
                  </span>
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-white/5 pb-1 mb-1">
                <dt className="text-stone-400">Status</dt>
                <dd>
                  {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- route handler, not a page */}
                  <a
                    href="/api/health"
                    className="text-emerald-400 hover:text-emerald-300 rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
                  >
                    ● Operational
                  </a>
                </dd>
              </div>
            </dl>
            <p className="text-stone-400 font-mono text-[10px] italic">
              © {currentYear}{' '}
              <a href={SITE.url} className="p-name u-url text-stone-300 hover:text-white" rel="me">
                {SITE.name}
              </a>
              . <span className="p-note">Network engineer associate and photographer in Newark, NJ.</span>
            </p>
          </div>
        </div>

        {/* ── Big name (decorative) ───────────────────────────────── */}
        <div className="pt-12 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="text-[15vw] font-serif font-bold text-white/[0.02] leading-none select-none whitespace-nowrap">
            STEFAN PEELE — STEFAN PEELE
          </div>
        </div>
      </div>
    </footer>
  )
}
