import { NextConfig } from 'next'

// Content-Security-Policy in REPORT-ONLY mode: violations are logged to the browser
// console (and to CSP_REPORT_URI if set) but nothing is blocked. To enforce, rename the
// header key to 'Content-Security-Policy' once the console is clean. See README.md.
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
  // Next.js inline runtime + Vercel analytics/insights + giscus comments. Sanity Studio
  // (/studio) needs eval; keep 'unsafe-eval' until the studio moves to its own origin.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com https://vercel.live https://giscus.app https://core.sanity-cdn.com",
  // Tailwind/inline style attributes + Google Fonts (Lexend is loaded at runtime for dyslexia mode).
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://giscus.app",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://cdn.sanity.io https://*.sanity.io https://avatars.githubusercontent.com https://images.unsplash.com https://vercel.com https://vercel.live",
  "media-src 'self' https://cdn.sanity.io",
  "connect-src 'self' https://*.sanity.io wss://*.sanity.io https://*.api.sanity.io https://vitals.vercel-insights.com https://va.vercel-scripts.com https://vercel.live wss://ws-us3.pusher.com https://giscus.app https://api.github.com",
  "frame-src 'self' https://giscus.app https://vercel.live https://*.sanity.io https://calendly.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  ...(process.env.CSP_REPORT_URI ? [`report-uri ${process.env.CSP_REPORT_URI}`] : []),
].join('; ')

const config: NextConfig = {
  reactCompiler: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [{ hostname: 'cdn.sanity.io' }],
    formats: ['image/avif', 'image/webp'],
    // Sanity asset URLs are content-addressed, so cached derivatives never go stale.
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  typescript: {
    // Type errors block every build, including production.
    ignoreBuildErrors: false,
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  env: {
    // Matches the behavior of `sanity dev` which sets styled-components to use the fastest way of inserting CSS rules in both dev and production.
    SC_DISABLE_SPEEDY: 'false',
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Content-Security-Policy-Report-Only', value: CSP },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        source: '/blog/feed.:ext(xml|json)',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex' }],
      },
    ]
  },
}

export default config
