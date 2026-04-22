import TrackerDashboard from './TrackerDashboard'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tracker — Stefan Peele',
  robots: { index: false, follow: false }, // keep it off search engines
}

export default function TrackerPage() {
  return (
    <>
      <link
        rel="preconnect"
        href="https://fonts.googleapis.com"
      />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&display=swap"
        rel="stylesheet"
      />
      <TrackerDashboard />
    </>
  )
}
