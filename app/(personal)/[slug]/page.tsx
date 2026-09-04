import {CustomPortableText} from '@/components/CustomPortableText'
import {Header} from '@/components/Header'
import {client} from '@/sanity/lib/client'
import {sanityFetch} from '@/sanity/lib/live'
import {pagesBySlugQuery, slugsByTypeQuery} from '@/sanity/lib/queries'
import type {Metadata, ResolvingMetadata} from 'next'
import {toPlainText, type PortableTextBlock} from 'next-sanity'
import {draftMode} from 'next/headers'
import {notFound} from 'next/navigation'
import {isReservedSlug} from '@/lib/site'

type Props = {
  params: Promise<{slug: string}>
}

export async function generateMetadata({params}: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const {slug} = await params
  if (isReservedSlug(slug)) return {}
  const {data: page} = await sanityFetch({query: pagesBySlugQuery, params: {slug}, stega: false})
  return {
    title: page?.title,
    description: page?.overview ? toPlainText(page.overview) : (await parent).description,
  }
}

export async function generateStaticParams() {
  const data = await client.fetch(slugsByTypeQuery, {type: 'page'})
  return data
    .filter((d) => !!d.slug && !isReservedSlug(d.slug))
    .map((d) => ({slug: d.slug as string}))
}

export default async function PageSlugRoute({params}: Props) {
  const {slug} = await params
  // Never let a generic page document shadow a real route such as /blog or /resume.
  if (isReservedSlug(slug)) notFound()
  const {data} = await sanityFetch({query: pagesBySlugQuery, params: {slug}})

  // In draft mode we may be about to create a page on this slug; never 404 there.
  if (!data?._id && !(await draftMode()).isEnabled) {
    notFound()
  }

  const {body, overview, title} = data ?? {}

  return (
    <div className="w-full min-h-screen text-stone-300 pb-24">
      <div className="max-w-4xl mx-auto pt-24 space-y-12">
        <div className="border-b border-white/5 pb-8">
          <Header
            id={data?._id || null}
            type={data?._type || null}
            path={['overview']}
            title={title || (data?._id ? 'Untitled' : 'Page not found')}
            description={overview as PortableTextBlock[] | null | undefined}
          />
        </div>

        {body && (
          <div className="max-w-3xl">
            <CustomPortableText
              id={data?._id || null}
              type={data?._type || null}
              path={['body']}
              paragraphClasses="font-serif text-stone-300 text-lg md:text-xl leading-relaxed mb-6"
              value={body as unknown as PortableTextBlock[]}
            />
          </div>
        )}
      </div>
    </div>
  )
}
