import { Analytics as VercelAnalytics } from '@vercel/analytics/next'
// components/Analytics.tsx
// Vercel Web Analytics (cookieless, no PII). Rendered once in the root layout next to
// SpeedInsights. Skipped in development so local sessions do not pollute the dashboard.
// Privacy alternative (Plausible/Umami) is documented in README.md.

export function Analytics() {
  if (process.env.NODE_ENV !== 'production') return null
  return <VercelAnalytics />
}
