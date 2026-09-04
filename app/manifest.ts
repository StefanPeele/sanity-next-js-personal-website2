import type { MetadataRoute } from 'next'
import { SITE } from '@/lib/site'
// app/manifest.ts — served at /manifest.webmanifest and linked automatically by Next.

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.title,
    short_name: SITE.name,
    description: SITE.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a0a',
    theme_color: '#0a0a0a',
    lang: 'en',
    icons: [
      { src: '/icon.png', sizes: 'any', type: 'image/png', purpose: 'any' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png', purpose: 'any' },
    ],
  }
}
