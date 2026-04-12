import { Navbar } from '@/components/Navbar'
import Footer from '@/components/Footer'
import { sanityFetch } from '@/sanity/lib/live'
import { settingsQuery } from '@/sanity/lib/queries'
// app/(personal)/layout.tsx

export default async function PersonalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data } = await sanityFetch({ query: settingsQuery })

  return (
    <div className="flex min-h-screen flex-col">
      {/* Cast as any — SettingsQueryResult and Navbar's Settings interface
          are structurally compatible at runtime; the mismatch is only that
          Sanity's typegen uses null for _key where our interface expects string */}
      <Navbar data={data} />
      <main className="mt-20 flex-grow">
        <div className="px-4 md:px-16 lg:px-32">
          {children}
        </div>
      </main>
      {/* Footer cast — Footer's type interface is separate and not updated here */}
      <Footer data={data as any} />
    </div>
  )
}