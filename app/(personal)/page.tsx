import {HomePage} from '@/components/HomePage'
import {studioUrl} from '@/sanity/lib/api'
import {sanityFetch} from '@/sanity/lib/live'
import {homePageQuery} from '@/sanity/lib/queries'
import Link from 'next/link'
import { groq } from 'next-sanity'

// NEW: This queries your Sanity database for the single featured post, and your 3 most recent non-featured posts.
const commandCenterQuery = groq`{
  "featuredPost": *[_type == "post" && isFeatured == true] | order(publishedAt desc)[0] {
    title,
    slug,
    publishedAt,
    excerpt,
    mainImage,
    "categories": categories[]->title
  },
  "recentPosts": *[_type == "post" && isFeatured != true] | order(publishedAt desc)[0...3] {
    title,
    slug,
    publishedAt,
    excerpt,
    "categories": categories[]->title
  }
}`

export default async function IndexRoute() {
  const {data: homeData} = await sanityFetch({query: homePageQuery})
  const {data: intelData} = await sanityFetch({query: commandCenterQuery})

  if (!homeData) {
    return (
      <div className="text-center font-mono text-stone-500 mt-32">
        Archive empty.{' '}
        <Link href={`${studioUrl}/structure/home`} className="text-white underline">
          Initialize Database
        </Link>
      </div>
    )
  }

  // We are now passing BOTH the standard home data AND the new blog data to your component!
  return <HomePage data={homeData} intelData={intelData} />
}