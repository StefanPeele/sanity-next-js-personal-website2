// app/(personal)/layout.tsx
import { Navbar } from '@/components/Navbar'
import Footer from '@/components/Footer'
import { sanityFetch } from '@/sanity/lib/live'
import { settingsQuery } from '@/sanity/lib/queries'

export default async function PersonalLayout({ children }: { children: React.ReactNode }) {
  const { data } = await sanityFetch({ query: settingsQuery })

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main id="content" className="mt-20 flex-grow">
        <div className="px-4 md:px-16 lg:px-32">{children}</div>
      </main>
      <Footer data={data} />
    </div>
  )
}
