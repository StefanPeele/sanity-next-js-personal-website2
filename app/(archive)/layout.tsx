import { Navbar } from '@/components/Navbar'
import Footer from '@/components/Footer'
import { BlogBackground } from '@/components/blog/BlogBackground'
import { sanityFetch } from '@/sanity/lib/live'
import { settingsQuery } from '@/sanity/lib/queries'
// app/(archive)/layout.tsx
// Shared shell for the knowledge side of the site: /blog, /garden, /library.
// Pages control their own <main> and top padding so full-bleed article heroes still work.

export default async function ArchiveLayout({ children }: { children: React.ReactNode }) {
  const { data: settings } = await sanityFetch({ query: settingsQuery, stega: false })

  return (
    <div className="relative flex min-h-screen flex-col bg-transparent text-stone-300">
      <BlogBackground />
      <Navbar />
      <div className="relative flex-1">{children}</div>
      <Footer data={settings} />
    </div>
  )
}
