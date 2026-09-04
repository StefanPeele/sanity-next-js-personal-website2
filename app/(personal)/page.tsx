import {HomePage} from '@/components/HomePage'
import {studioUrl} from '@/sanity/lib/api'
import {sanityFetch} from '@/sanity/lib/live'
import {homeIntelQuery, homePageQuery, settingsQuery} from '@/sanity/lib/queries'
import Link from 'next/link'

export default async function IndexRoute() {
  const [{data: homeData}, {data: intelData}, {data: settings}] = await Promise.all([
    sanityFetch({query: homePageQuery}),
    sanityFetch({query: homeIntelQuery}),
    sanityFetch({query: settingsQuery}),
  ])

  if (!homeData) {
    return (
      <div className="text-center font-mono text-stone-400 mt-32">
        The Home document has not been created yet.{' '}
        <Link href={`${studioUrl}/structure/home`} className="text-white underline">
          Open the Studio
        </Link>
      </div>
    )
  }

  return <HomePage data={homeData} intelData={intelData} settings={settings} />
}
