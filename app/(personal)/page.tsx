import {HomePage} from '@/components/HomePage'
import {studioUrl} from '@/sanity/lib/api'
import {sanityFetch} from '@/sanity/lib/live'
import {homePageQuery, homeIntelQuery} from '@/sanity/lib/queries'
import Link from 'next/link'

export default async function IndexRoute() {
  const {data: homeData} = await sanityFetch({query: homePageQuery})
  const {data: intelData} = await sanityFetch({query: homeIntelQuery})

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