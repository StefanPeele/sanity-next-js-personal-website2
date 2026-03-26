import '@/styles/index.css'
import {CustomPortableText} from '@/components/CustomPortableText'
import {Navbar} from '@/components/Navbar'
import IntroTemplate from '@/intro-template'
import {sanityFetch, SanityLive} from '@/sanity/lib/live'
import {homePageQuery, settingsQuery} from '@/sanity/lib/queries'
import {urlForOpenGraphImage} from '@/sanity/lib/utils'
import {SpeedInsights} from '@vercel/speed-insights/next'
import type {Metadata, Viewport} from 'next'
import {toPlainText, type PortableTextBlock} from 'next-sanity'
import {VisualEditing} from 'next-sanity/visual-editing'
import {draftMode} from 'next/headers'
import {Suspense} from 'react'
import {Toaster} from 'sonner'
import {handleError} from './client-functions'
import {DraftModeToast} from './DraftModeToast'

export async function generateMetadata(): Promise<Metadata> {
  const [{data: settings}, {data: homePage}] = await Promise.all([
    sanityFetch({query: settingsQuery, stega: false}),
    sanityFetch({query: homePageQuery, stega: false}),
  ])

  // @ts-ignore the image type sometimes fails
  const ogImage = urlForOpenGraphImage(settings?.ogImage)
  return {
    title: homePage?.title
      ? {
          template: `%s | ${homePage.title}`,
          default: homePage.title || 'Personal website',
        }
      : undefined,
    description: homePage?.overview ? toPlainText(homePage.overview) : undefined,
    openGraph: {
      images: ogImage ? [ogImage] : [],
    },
  }
}

export const viewport: Viewport = {
  // Changed from harsh #000 to our new warm Stone-50 hex code
  themeColor: '#fafaf9',
}

export default async function IndexRoute({children}: {children: React.ReactNode}) {
  const {data} = await sanityFetch({query: settingsQuery})
  return (
    <>
      {/* NEW: Swapped bg-white text-black for bg-stone-100 text-stone-800 */}
<div className="flex min-h-screen flex-col bg-[#F5F2EB] text-stone-800">
          <Navbar data={data} />
        <div className="mt-20 flex-grow px-4 md:px-16 lg:px-32">{children}</div>
        
        {/* NEW: Updated the footer background to match */}
<footer className="bottom-0 w-full bg-[#F5F2EB] py-12 text-center md:py-20">
            {data?.footer && (
            <CustomPortableText
              id={data._id}
              type={data._type}
              path={['footer']}
              paragraphClasses="text-md md:text-xl text-stone-600"
              value={data.footer as unknown as PortableTextBlock[]}
            />
          )}
        </footer>
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
                // Simulate a delay to show the loading state
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