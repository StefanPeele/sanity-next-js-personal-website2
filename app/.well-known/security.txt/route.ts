import { absoluteUrl, SITE } from '@/lib/site'
// app/.well-known/security.txt/route.ts — RFC 9116 security contact.

export const dynamic = 'force-static'

export function GET() {
  const expires = new Date()
  expires.setUTCFullYear(expires.getUTCFullYear() + 1)
  const body = [
    `Contact: mailto:${SITE.email}`,
    `Expires: ${expires.toISOString()}`,
    'Preferred-Languages: en',
    `Canonical: ${absoluteUrl('/.well-known/security.txt')}`,
    `Policy: ${absoluteUrl('/contact')}`,
    '',
  ].join('\n')
  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
