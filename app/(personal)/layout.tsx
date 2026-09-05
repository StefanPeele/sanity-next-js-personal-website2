// app/(personal)/layout.tsx
import { Navbar } from '@/components/Navbar'
import Footer from '@/components/Footer'
import { TaxonomyProvider } from '@/components/TaxonomyProvider'
import { getSiteChrome, getTaxonomy } from '@/lib/cms/loaders'

export default async function PersonalLayout({ children }: { children: React.ReactNode }) {
  const [{ settings, navigation }, taxonomy] = await Promise.all([getSiteChrome(), getTaxonomy()])

  return (
    <TaxonomyProvider value={taxonomy}>
      <div className="flex min-h-screen flex-col">
        <Navbar nav={navigation} />
        <main id="content" className="mt-20 flex-grow">
          <div className="px-4 md:px-16 lg:px-32">{children}</div>
        </main>
        <Footer settings={settings} nav={navigation} />
      </div>
    </TaxonomyProvider>
  )
}
