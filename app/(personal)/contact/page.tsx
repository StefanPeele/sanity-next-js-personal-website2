// app/(personal)/contact/page.tsx
import { JsonLd } from '@/components/JsonLd'
import { ContactForm } from '@/components/portfolio/ContactForm'
import { SITE, absoluteUrl } from '@/lib/site'
import { sanityFetch } from '@/sanity/lib/live'
import { settingsQuery } from '@/sanity/lib/queries'
import { FaBluesky } from 'react-icons/fa6'
import { FaGithub, FaInstagram, FaLinkedin } from 'react-icons/fa'
import { Mail } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Contact',
  description: `Get in touch with ${SITE.name} — network engineering and infrastructure internships, collaborations, and photography inquiries.`,
  alternates: { canonical: absoluteUrl('/contact') },
}

const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400'

export default async function ContactPage() {
  const { data: settings } = await sanityFetch({ query: settingsQuery })
  const email = settings?.email || SITE.email
  const openTo = settings?.openTo?.trim()

  const strip = (u: string) => u.replace(/^https?:\/\/(www\.)?/, '')
  const github = settings?.github || SITE.handles.github
  const channels: { name: string; href: string; label: string; icon: React.ReactNode }[] = [
    { name: 'Email', href: `mailto:${email}`, label: email, icon: <Mail size={16} aria-hidden /> },
    { name: 'GitHub', href: github, label: strip(github), icon: <FaGithub size={16} aria-hidden /> },
    { name: 'Instagram', href: settings?.instagram || SITE.handles.instagram, label: '@stefs.lens', icon: <FaInstagram size={16} aria-hidden /> },
  ]
  if (settings?.linkedin) channels.splice(1, 0, { name: 'LinkedIn', href: settings.linkedin, label: strip(settings.linkedin), icon: <FaLinkedin size={16} aria-hidden /> })
  if (settings?.bluesky) channels.push({ name: 'Bluesky', href: settings.bluesky, label: strip(settings.bluesky), icon: <FaBluesky size={16} aria-hidden /> })

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: `Contact ${SITE.name}`,
    url: absoluteUrl('/contact'),
    mainEntity: {
      '@type': 'Person',
      name: SITE.name,
      email: `mailto:${email}`,
      url: SITE.url,
      sameAs: channels.filter((c) => c.name !== 'Email').map((c) => c.href),
    },
  }

  return (
    <div className="w-full min-h-screen text-stone-300 pb-24">
      <JsonLd data={jsonLd} />
      <div className="max-w-5xl mx-auto pt-24">
        <header className="border-b border-white/5 pb-12 mb-12">
          <span className="text-stone-400 font-mono text-[10px] tracking-[0.4em] uppercase border-l border-stone-700 pl-4 mb-4 block">Directory / Contact</span>
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-white tracking-tight">Let's talk.</h1>
          {openTo ? (
            <p className="mt-6 inline-flex items-center gap-3 rounded-full border border-emerald-500/30 bg-emerald-950/30 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-300">
              <span className="inline-flex rounded-full h-2 w-2 bg-emerald-400" aria-hidden="true" />
              {openTo}
            </p>
          ) : (
            <p className="mt-6 text-stone-400 text-sm max-w-xl">
              Network and infrastructure roles, security work, and collaborations on anything with a switch, a SAN or a PowerShell prompt in it.
            </p>
          )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <section className="lg:col-span-7" aria-labelledby="form-heading">
            <h2 id="form-heading" className="font-mono text-[10px] tracking-[0.4em] uppercase text-stone-400 mb-6 font-sans">Send a message</h2>
            <div className="relative">
              <ContactForm fallbackEmail={email} />
            </div>
            <p className="mt-6 text-stone-400 text-xs leading-relaxed">
              Recruiters: my <Link href="/resume" className={`text-stone-200 underline underline-offset-4 hover:text-white ${FOCUS} rounded-sm`}>resume</Link> is up to date and printable, and every project on the site is written as a case study with the outcome first.
            </p>
          </section>

          <aside className="lg:col-span-5 space-y-10">
            <section aria-labelledby="channels-heading">
              <h2 id="channels-heading" className="font-mono text-[10px] tracking-[0.4em] uppercase text-stone-400 mb-6 font-sans">Direct channels</h2>
              <ul className="space-y-2 list-none m-0 p-0">
                {channels.map((c) => (
                  <li key={c.name}>
                    <a
                      href={c.href}
                      target={c.href.startsWith('mailto:') ? undefined : '_blank'}
                      rel={c.href.startsWith('mailto:') ? undefined : 'noopener noreferrer me'}
                      className={`flex items-center gap-4 rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3 hover:border-white/30 transition-colors ${FOCUS}`}
                    >
                      <span className="text-stone-400">{c.icon}</span>
                      <span className="flex flex-col min-w-0">
                        <span className="font-mono text-[9px] uppercase tracking-widest text-stone-400">{c.name}</span>
                        <span className="text-sm text-stone-200 truncate">{c.label}</span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-xl border border-amber-500/20 bg-amber-950/10 p-6" aria-labelledby="photo-heading">
              <h2 id="photo-heading" className="font-mono text-[10px] tracking-[0.4em] uppercase text-amber-400 mb-3 font-sans">Booking a photo session?</h2>
              <p className="text-stone-300 text-sm leading-relaxed mb-4">
                Portraits, graduation, events and headshot days have their own inquiry form with packages and pricing.
              </p>
              <Link href="/services#inquiry" className={`inline-block bg-amber-500 text-black font-mono text-[10px] uppercase tracking-[0.2em] font-bold px-5 py-3 rounded-lg hover:bg-amber-400 transition-colors ${FOCUS}`}>
                Photography inquiry →
              </Link>
            </section>

            <p className="font-mono text-[9px] uppercase tracking-widest text-stone-400">
              Based in {SITE.location.city}, {SITE.location.region} · {SITE.school}
            </p>
          </aside>
        </div>
      </div>
    </div>
  )
}
