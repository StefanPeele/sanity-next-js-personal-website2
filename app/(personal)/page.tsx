import Link from 'next/link'
import { HomePage } from '@/components/HomePage'
import { getSiteChrome, getTaxonomy } from '@/lib/cms/loaders'
import { studioUrl } from '@/sanity/lib/api'
import { sanityFetch } from '@/sanity/lib/live'
import { homeIntelQuery, homePageQuery } from '@/sanity/lib/queries'

export default async function IndexRoute() {
  const [{ data: homeData }, { data: intel }, { settings, navigation }, taxonomy] = await Promise.all([
    sanityFetch({ query: homePageQuery }),
    sanityFetch({ query: homeIntelQuery }),
    getSiteChrome(),
    getTaxonomy(),
  ])

  if (!homeData) {
    return (
      <div className="text-center font-sans text-stone-400 mt-32">
        The Home document has not been created yet.{' '}
        <Link href={`${studioUrl}/structure/home`} className="text-white underline">Open the Studio</Link>
      </div>
    )
  }

  return <HomePage data={homeData} intel={intel} settings={settings} nav={navigation} taxonomy={taxonomy} />
}
