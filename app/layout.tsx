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

export async function generateMetadata(): Promise<Metadata> {
  const [{data: settings}, {data: homePage}] = await Promise.all([
    sanityFetch({query: settingsQuery, stega: false}),
    sanityFetch({query: homePageQuery, stega: false}),
  ])

  const ogImage = urlForOpenGraphImage(settings?.ogImage as any)

  return {
    metadataBase: new URL('https://stefanpeele.com'),
    title: homePage?.title
      ? {
          template: `%s | ${homePage.title}`,
          default: homePage.title || 'Stefan Peele II | Digital Archive',
        }
      : 'Stefan Peele II | Digital Archive',
    description: homePage?.overview
      ? toPlainText(homePage.overview)
      : 'IT Infrastructure & Architecture Portfolio',
    openGraph: {
      images: ogImage ? [ogImage] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
    },
    alternates: {
      types: {
        'application/rss+xml': 'https://stefanpeele.com/blog/feed.xml',
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
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${lora.variable} ${inter.variable} ${ibmPlexMono.variable}`}
    >
      <body className="bg-[#0a0a0a] text-stone-300 font-sans selection:bg-white/20 antialiased">
        <a href="#content" className="skip-link">Skip to content</a>
        {children}

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
      </body>
    </html>
  )
}