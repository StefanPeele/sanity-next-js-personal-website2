import '@/styles/index.css'
import { SanityLive } from '@/sanity/lib/live'
import { SpeedInsights } from '@vercel/speed-insights/next'
import type { Metadata, Viewport } from 'next'
import { VisualEditing } from 'next-sanity/visual-editing'
import { draftMode } from 'next/headers'
import { Toaster } from 'sonner'
import { handleError } from './(personal)/client-functions'
import { DraftModeToast } from './(personal)/DraftModeToast'
import { sanityFetch } from '@/sanity/lib/live'
import { homePageQuery, settingsQuery } from '@/sanity/lib/queries'
import { urlForOpenGraphImage } from '@/sanity/lib/utils'
import { toPlainText } from 'next-sanity'
import { Inter, Lora, IBM_Plex_Mono } from 'next/font/google'
import { Analytics } from '@/components/Analytics'
import { JsonLd } from '@/components/JsonLd'
import { MotionProvider } from '@/components/MotionProvider'
import { absoluteUrl, SITE } from '@/lib/site'
// app/layout.tsx — root layout, HTML shell + providers only

// Lora replaces PT Serif — open and readable at small sizes, designed for screens
// italic is used heavily throughout the site (taglines, blockquotes, sidenotes)
const lora = Lora({
  subsets: ['latin'],
  variable: '--font-serif', // maps to Tailwind font-serif class
  display: 'swap',
  style: ['normal', 'italic'],
  weight: ['400', '500', '600', '700'],
})

// Inter — UI labels, navigation, mono detail text
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans', // maps to Tailwind font-sans class
  display: 'swap',
  weight: ['400', '500', '600'],
})

// IBM Plex Mono — code blocks, terminal-style UI, monospace labels
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-mono', // maps to Tailwind font-mono class
  display: 'swap',
  weight: ['400', '500', '600'],
})

const WEBMENTION_ENABLED = process.env.NEXT_PUBLIC_WEBMENTION_ENABLED === 'true'

export async function generateMetadata(): Promise<Metadata> {
  const [{ data: settings }, { data: homePage }] = await Promise.all([
    sanityFetch({ query: settingsQuery, stega: false }),
    sanityFetch({ query: homePageQuery, stega: false }),
  ])

  const ogImage = urlForOpenGraphImage(settings?.ogImage as any)
  const siteTitle = homePage?.title || SITE.title
  const description = homePage?.overview ? toPlainText(homePage.overview) : SITE.description

  return {
    metadataBase: new URL(SITE.url),
    title: {
      template: `%s | ${siteTitle}`,
      default: siteTitle,
    },
    description,
    applicationName: SITE.name,
    authors: [{ name: SITE.name, url: SITE.url }],
    creator: SITE.name,
    publisher: SITE.name,
    category: 'technology',
    keywords: ['network engineering', 'infrastructure', 'NJIT', 'photography', 'Newark NJ', 'Stefan Peele'],
    formatDetection: { email: false, address: false, telephone: false },
    openGraph: {
      type: 'website',
      siteName: siteTitle,
      locale: 'en_US',
      url: SITE.url,
      title: siteTitle,
      description,
      images: ogImage ? [ogImage] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: siteTitle,
      description,
    },
    alternates: {
      canonical: SITE.url,
      types: {
        'application/rss+xml': [{ url: absoluteUrl('/blog/feed.xml'), title: `${SITE.name} — Writing (RSS)` }],
        'application/feed+json': [{ url: absoluteUrl('/blog/feed.json'), title: `${SITE.name} — Writing (JSON Feed)` }],
      },
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  }
}

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  colorScheme: 'dark',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: settings } = await sanityFetch({ query: settingsQuery, stega: false })

  const sameAs = [
    settings?.github || SITE.handles.github,
    settings?.linkedin,
    settings?.instagram || SITE.handles.instagram,
    settings?.bluesky,
    settings?.gitbook || SITE.handles.gitbook,
  ].filter((v): v is string => Boolean(v))

  const personId = `${SITE.url}/#person`
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Person',
      '@id': personId,
      name: SITE.name,
      alternateName: SITE.legalName,
      url: SITE.url,
      email: `mailto:${settings?.email || SITE.email}`,
      jobTitle: 'Network Engineer Associate (Intern)',
      alumniOf: { '@type': 'CollegeOrUniversity', name: SITE.school },
      affiliation: { '@type': 'CollegeOrUniversity', name: SITE.school },
      address: {
        '@type': 'PostalAddress',
        addressLocality: SITE.location.city,
        addressRegion: SITE.location.region,
        addressCountry: 'US',
      },
      knowsAbout: ['Network engineering', 'IT infrastructure', 'Photography'],
      sameAs,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${SITE.url}/#website`,
      url: SITE.url,
      name: SITE.title,
      description: SITE.description,
      inLanguage: 'en-US',
      publisher: { '@id': personId },
      // No SearchAction: /blog does not read a ?q= or ?search= param. Add one here once it does.
    },
  ]

  return (
    <html
      lang="en"
      className={`${lora.variable} ${inter.variable} ${ibmPlexMono.variable}`}
    >
      <head>
        {WEBMENTION_ENABLED && (
          <>
            <link rel="webmention" href="https://webmention.io/stefanpeele.com/webmention" />
            <link rel="pingback" href="https://webmention.io/stefanpeele.com/xmlrpc" />
          </>
        )}
        <link rel="author" href="/humans.txt" />
      </head>
      <body className="bg-[#0a0a0a] text-stone-300 font-sans selection:bg-white/20 antialiased">
        <a href="#content" className="skip-link">Skip to content</a>
        <MotionProvider>{children}</MotionProvider>
        <JsonLd data={jsonLd} />

        <Toaster />
        <SanityLive onError={handleError} />

        {(await draftMode()).isEnabled && (
          <>
            <DraftModeToast
              action={async () => {
                'use server'
                await Promise.allSettled([
                  (await draftMode()).disable(),
                  new Promise((resolve) => setTimeout(resolve, 1000)),
                ])
              }}
            />
            <VisualEditing />
          </>
        )}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
}
