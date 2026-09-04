import { NextResponse, type NextRequest } from 'next/server'
import { absoluteUrl } from '@/lib/site'
import { getWriteClient } from '@/sanity/lib/writeClient'
// app/api/subscribe/confirm/route.ts — double opt-in landing. Marks the subscriber
// confirmed and redirects to /blog?subscribed=1 (or ?subscribed=invalid).

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')?.trim()
  const client = getWriteClient()

  if (!token || token.length > 128 || !client) {
    return NextResponse.redirect(absoluteUrl('/blog?subscribed=invalid'))
  }

  try {
    const doc = await client.fetch<{ _id: string; status: string } | null, { t: string }>(
      `*[_type == "subscriber" && token == $t][0]{ _id, status }`,
      { t: token },
    )
    if (!doc) return NextResponse.redirect(absoluteUrl('/blog?subscribed=invalid'))

    if (doc.status !== 'confirmed') {
      await client
        .patch(doc._id)
        .set({ status: 'confirmed', confirmedAt: new Date().toISOString(), unsubscribedAt: null })
        .commit()
    }
    return NextResponse.redirect(absoluteUrl('/blog?subscribed=1'))
  } catch (err) {
    console.error('[subscribe/confirm] failed', err)
    return NextResponse.redirect(absoluteUrl('/blog?subscribed=error'))
  }
}
