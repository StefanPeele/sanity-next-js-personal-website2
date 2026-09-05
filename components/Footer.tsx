import Link from 'next/link'
import { ArrowUpRight, BookOpen, Mail, Rss } from 'lucide-react'
import { FaGithub, FaInstagram, FaLinkedin, FaTrello } from 'react-icons/fa'
import { FaBluesky } from 'react-icons/fa6'
import { NewsletterForm } from '@/components/NewsletterForm'
import { DEFAULT_NAVIGATION, navHref, type NavigationData } from '@/lib/cms/defaults/navigation'
import type { SiteSettings } from '@/lib/cms/loaders'
import { SITE } from '@/lib/site'
// components/Footer.tsx — server component. Copy from Studio → Site → Identity & SEO → Footer.
// Keeps the IndieWeb h-card and rel="me" links. No telemetry, no watermark.

const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400'

type NetworkLink = { name: string; href: string; icon: React.ReactNode; me?: boolean; email?: boolean }

function buildNetwork(s: SiteSettings): NetworkLink[] {
  const L = s.footer.networkLabels
  const email = s.email || SITE.email
  const list: Array<NetworkLink | null> = [
    { name: L.email, href: `mailto:${email}`, icon: <Mail size={14} aria-hidden />, email: true },
    s.github ? { name: L.github, href: s.github, icon: <FaGithub size={14} aria-hidden />, me: true } : null,
    s.linkedin ? { name: L.linkedin, href: s.linkedin, icon: <FaLinkedin size={14} aria-hidden />, me: true } : null,
    s.gitbook ? { name: L.gitbook, href: s.gitbook, icon: <BookOpen size={14} aria-hidden />, me: true } : null,
    s.instagram ? { name: L.instagram, href: s.instagram, icon: <FaInstagram size={14} aria-hidden />, me: true } : null,
    s.bluesky ? { name: L.bluesky, href: s.bluesky, icon: <FaBluesky size={14} aria-hidden />, me: true } : null,
    s.trello ? { name: L.trello, href: s.trello, icon: <FaTrello size={14} aria-hidden /> } : null,
    { name: L.rss, href: '/blog/feed.xml', icon: <Rss size={14} aria-hidden /> },
  ]
  return list.filter((l): l is NetworkLink => l !== null)
}

export default function Footer({ settings, nav = DEFAULT_NAVIGATION }: { settings: SiteSettings; nav?: NavigationData }) {
  const year = new Date().getFullYear()
  const network = buildNetwork(settings)
  const email = settings.email || SITE.email
  const directory = [...(nav.primary ?? []), ...(nav.secondary ?? [])]

  const headline =
    settings.footerHeadlinePrefix || settings.footerHeadlineHighlight
      ? { prefix: settings.footerHeadlinePrefix ?? '', highlight: settings.footerHeadlineHighlight ?? '', suffix: settings.footerHeadlineSuffix ?? '' }
      : { prefix: "Let's build", highlight: 'something lasting', suffix: 'together.' }

  return (
    <footer className="print:hidden h-card w-full bg-[#0a0a0a] border-t border-white/5 pt-20 pb-12 px-6 md:px-12 lg:px-20">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-20">
          <div className="space-y-6">
            <h2 className="motion-safe:animate-fade-up text-stone-50 text-4xl md:text-6xl font-serif font-bold leading-tight">
              {headline.prefix}{' '}
              <span className="text-stone-400 italic text-3xl md:text-5xl font-light">{headline.highlight}</span>{' '}
              <br />
              {headline.suffix}
            </h2>
            <a href={`mailto:${email}`} className={`group inline-flex items-center gap-3 text-white font-sans text-sm border border-white/10 px-6 py-3 rounded-full hover:bg-white hover:text-black transition-all duration-500 ${FOCUS}`}>
              {settings.footer.ctaLabel}
              <ArrowUpRight size={16} aria-hidden className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </a>
          </div>
          <div className="flex flex-col justify-end">
            <NewsletterForm source="footer" copy={settings.newsletter} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 pb-12 border-b border-white/5">
          <nav aria-labelledby="footer-directory" className="space-y-5">
            <h3 id="footer-directory" className="section-label">{settings.footer.directoryHeading}</h3>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-3 lg:grid-cols-1">
              {directory.map((link) => (
                <li key={navHref(link) + link.label}>
                  <Link href={navHref(link)} className={`text-stone-300 hover:text-white font-sans text-base transition-colors rounded-sm ${FOCUS}`}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="space-y-5 lg:col-span-2">
            <h3 className="section-label">{settings.footer.networkHeading}</h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {network.map((link) => {
                const external = link.href.startsWith('http')
                return (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      target={external ? '_blank' : undefined}
                      rel={[external ? 'noopener noreferrer' : null, link.me ? 'me' : null].filter(Boolean).join(' ') || undefined}
                      className={`group flex items-center gap-4 p-4 bg-[#111]/40 border border-white/5 rounded-xl hover:border-white/20 hover:bg-[#111] transition-all ${FOCUS} ${link.email ? 'u-email' : link.me ? 'u-url' : ''}`}
                    >
                      <span className="text-stone-400 group-hover:text-white transition-colors shrink-0">{link.icon}</span>
                      <span className="text-stone-200 text-sm font-sans">{link.name}</span>
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>

        <p className="pt-8 text-stone-400 font-sans text-sm">
          © {year}{' '}
          <a href={SITE.url} className="p-name u-url text-stone-200 underline underline-offset-4 decoration-stone-600 hover:text-white hover:decoration-white" rel="me">{settings.siteName}</a>.{' '}
          <span className="p-note">{settings.footer.copyrightNote}</span>
          <span className="p-locality sr-only">{settings.location.city}, {settings.location.region}</span>
        </p>
      </div>
    </footer>
  )
}
