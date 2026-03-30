import '@/styles/index.css'
import {CustomPortableText} from '@/components/CustomPortableText'
import {Navbar} from '@/components/Navbar'
import Footer from '@/components/Footer' 
import IntroTemplate from '@/intro-template'
import {sanityFetch, SanityLive} from '@/sanity/lib/live'
import {homePageQuery, settingsQuery} from '@/sanity/lib/queries'
import {urlForOpenGraphImage} from '@/sanity/lib/utils'
import {SpeedInsights} from '@vercel_speed-insights/next'
import type {Metadata, Viewport} from 'next'
import {toPlainText, type PortableTextBlock} from 'next-sanity'
import {VisualEditing} from 'next-sanity/visual-editing'
import {draftMode} from 'next/headers'
import {Suspense} from 'react'
import {Toaster} from 'sonner'
import {handleError} from './client-functions'
import {DraftModeToast} from './DraftModeToast'

import { Inter, Lora } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-lora',
  display: 'swap',
})

export async function generateMetadata(): Promise<Metadata> {
  const [{data: settings}, {data: homePage}] = await Promise.all([
    sanityFetch({query: settingsQuery, stega: false}),
    sanityFetch({query: homePageQuery, stega: false}),
  ])

  const ogImage = urlForOpenGraphImage(settings?.ogImage)
  return {
    title: homePage?.title
      ? {
          template: `%s | ${homePage.title}`,
          default: homePage.title || 'Stefan Peele II | Digital Archive',
        }
      : 'Stefan Peele II | Digital Archive',
    description: homePage?.overview ? toPlainText(homePage.overview) : 'IT Infrastructure & Architecture Portfolio',
    openGraph: {
      images: ogImage ? [ogImage] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
    }
  }
}

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
}

export default async function IndexRoute({children}: {children: React.ReactNode}) {
  // Fetch global settings (menu, socials, footer info)
  const {data} = await sanityFetch({query: settingsQuery})
  
  return (
    <>
      <div className={`flex min-h-screen flex-col bg-[#0a0a0a] text-stone-300 ${inter.variable} ${lora.variable} font-sans selection:bg-white/20`}>
        <Navbar data={data} />
        
        {/* Main Content Wrapper */}
        <div className="mt-20 flex-grow">
            {/* Horizontal padding strictly for page content */}
            <div className="px-4 md:px-16 lg:px-32">
                {children}
            </div>
        </div>
        
        {/* Pass the Sanity data to the Footer component */}
        <Footer data={data} />

        <Suspense>
          <IntroTemplate />
        </Suspense>
      </div>

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
    </>
  )
}