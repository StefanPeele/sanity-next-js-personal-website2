import { Navbar } from '@/components/Navbar'
import Footer from '@/components/Footer'
import { BlogBackground } from '@/components/blog/BlogBackground'
import { TaxonomyProvider } from '@/components/TaxonomyProvider'
import { getSiteChrome, getTaxonomy } from '@/lib/cms/loaders'
// app/(archive)/layout.tsx
// Shared shell for /blog, /garden, /library, /glossary, /paths, /review.
// Pages control their own <main> and top padding so full-bleed article heroes still work.

export default async function ArchiveLayout({ children }: { children: React.ReactNode }) {
  const [{ settings, navigation }, taxonomy] = await Promise.all([getSiteChrome(), getTaxonomy()])

  return (
    <TaxonomyProvider value={taxonomy}>
      <div className="relative flex min-h-screen flex-col bg-transparent text-stone-300">
        <BlogBackground />
        <Navbar nav={navigation} />
        <div className="relative flex-1">{children}</div>
        <Footer settings={settings} nav={navigation} />
      </div>
    </TaxonomyProvider>
  )
}
