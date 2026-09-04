import type { MetadataRoute } from 'next'
import { absoluteUrl, SITE } from '@/lib/site'
// app/robots.ts

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/studio', '/api', '/_next'],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: SITE.url,
  }
}
