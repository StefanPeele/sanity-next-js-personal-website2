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
import { getCopy } from '@/lib/cms/loaders'
import { personalPagesQuery } from '@/sanity/lib/queries-services'
import { DEFAULT_PERSONAL_PAGES } from '@/lib/cms/defaults/personalPages'
import { getSettings } from '@/lib/cms/loaders'

export async function generateMetadata(): Promise<Metadata> {
  const h = (await getCopy(personalPagesQuery, DEFAULT_PERSONAL_PAGES)).contact.header
  return { title: h.metaTitle || h.title, description: h.metaDescription || h.lede }
}

const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400'

export default async function ContactPage() {
  const [{ data: settings }, copy, site] = await Promise.all([sanityFetch({ query: settingsQuery }), getCopy(personalPagesQuery, DEFAULT_PERSONAL_PAGES).then((c) => c.contact), getSettings()])
  const email = settings?.email || SITE.email
  const openTo = settings?.openTo?.trim()

  const strip = (u: string) => u.replace(/^https?:\/\/(www\.)?/, '')
  const github = settings?.github || SITE.handles.github
  const channels: { name: string; href: string; label: string; icon: React.ReactNode }[] = [
    { name: copy.channelLabels.email, href: `mailto:${email}`, label: email, icon: <Mail size={16} aria-hidden /> },
    { name: copy.channelLabels.github, href: github, label: strip(github), icon: <FaGithub size={16} aria-hidden /> },
    { name: copy.channelLabels.instagram, href: settings?.instagram || SITE.handles.instagram, label: copy.instagramHandle, icon: <FaInstagram size={16} aria-hidden /> },
  ]
  if (settings?.linkedin) channels.splice(1, 0, { name: copy.channelLabels.linkedin, href: settings.linkedin, label: strip(settings.linkedin), icon: <FaLinkedin size={16} aria-hidden /> })
  if (settings?.bluesky) channels.push({ name: copy.channelLabels.bluesky, href: settings.bluesky, label: strip(settings.bluesky), icon: <FaBluesky size={16} aria-hidden /> })

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
      sameAs: channels.filter((c) => !c.href.startsWith('mailto:')).map((c) => c.href),
    },
  }

  return (
    <div className="w-full min-h-screen text-stone-300 pb-24">
      <JsonLd data={jsonLd} />
      <div className="max-w-5xl mx-auto pt-24">
        <header className="border-b border-white/5 pb-12 mb-12">
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-white tracking-tight">{copy.header.title}</h1>
          {openTo ? (
            <p className="mt-6 inline-flex items-center gap-3 rounded-full border border-emerald-500/30 bg-emerald-950/30 px-4 py-2 font-sans text-sm text-emerald-200">
              <span className="inline-flex rounded-full h-2 w-2 bg-emerald-400" aria-hidden="true" />
              {openTo}
            </p>
          ) : (
            <p className="mt-6 text-stone-400 text-base max-w-xl">{copy.header.lede}</p>
          )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <section className="lg:col-span-7" aria-labelledby="form-heading">
            <h2 id="form-heading" className="section-label mb-6">{copy.formHeading}</h2>
            <div className="relative">
              <ContactForm fallbackEmail={email} />
            </div>
            <p className="mt-6 text-stone-400 text-sm leading-relaxed">{copy.recruiterNote} <Link href="/resume" className={`text-stone-200 underline underline-offset-4 hover:text-white ${FOCUS} rounded-sm`}>Resume</Link></p>
          </section>

          <aside className="lg:col-span-5 space-y-10">
            <section aria-labelledby="channels-heading">
              <h2 id="channels-heading" className="section-label mb-6">{copy.channelsHeading}</h2>
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
                        <span className="font-sans text-xs text-stone-400">{c.name}</span>
                        <span className="text-sm text-stone-200 truncate">{c.label}</span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>

            {copy.photoCta.enabled && (
              <section className="rounded-xl border border-amber-500/20 bg-amber-950/10 p-6" aria-labelledby="photo-heading">
                <h2 id="photo-heading" className="font-serif text-lg text-amber-300 mb-3">{copy.photoCta.heading}</h2>
                <p className="text-stone-300 text-sm leading-relaxed mb-4">{copy.photoCta.lede}</p>
                <Link href={copy.photoCta.ctaHref || '/services#inquiry'} className={`inline-block bg-amber-500 text-black font-sans text-sm font-semibold px-5 py-3 rounded-lg hover:bg-amber-400 transition-colors ${FOCUS}`}>
                  {copy.photoCta.ctaLabel} →
                </Link>
              </section>
            )}

            <p className="font-sans text-sm text-stone-400">
              {copy.basedInLine.replace('{city}', site.location.city).replace('{region}', site.location.region).replace('{school}', site.school)}
            </p>
          </aside>
        </div>
      </div>
    </div>
  )
}
