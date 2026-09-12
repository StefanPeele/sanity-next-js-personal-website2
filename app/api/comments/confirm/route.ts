import { NextResponse, type NextRequest } from 'next/server'
import { revalidatePath } from 'next/cache'
import { absoluteUrl } from '@/lib/site'
import { getWriteClient } from '@/sanity/lib/writeClient'
// app/api/comments/confirm/route.ts — Phase 8.1.
//
// The other half of the double opt-in. Same shape as /api/subscribe/confirm: look the token
// up, flip the status, redirect somewhere that explains what happened.
//
// It redirects to the comment's own anchor on the article rather than to a confirmation
// page, because the thing the person wants to see is their comment in the conversation.

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')?.trim()
  const client = getWriteClient()

  const fail = (reason: string) => NextResponse.redirect(absoluteUrl(`/blog?comment=${reason}`))
  if (!token || token.length > 128 || !client) return fail('invalid')

  try {
    const doc = await client.fetch<{ _id: string; status: string; slug: string | null } | null, { t: string }>(
      `*[_type == "comment" && token == $t][0]{ _id, status, "slug": post->slug.current }`,
      { t: token },
    )
    if (!doc) return fail('invalid')

    // Already confirmed: land them on it anyway. A second click on the same link in an email
    // is a normal thing to do and should not read as an error.
    if (doc.status === 'pending') {
      await client
        .patch(doc._id)
        // The token is spent here. It is single-purpose by design, so leaving it live would
        // mean a link in an inbox that can un-delete a withdrawn comment later.
        .set({ status: 'published', publishedAt: new Date().toISOString() })
        .unset(['token'])
        .commit()

      // WITHOUT THIS THE COMMENT NEVER APPEARS. Measured: the page is dynamic, the query is
      // correct and the document is published, and the article still rendered an empty
      // thread -- because Next's fetch cache was holding the result from before the comment
      // existed. Deleting .next/cache/fetch-cache made it appear immediately, which is what
      // identified it. Confirming a comment is exactly the moment the page stops being true.
      if (doc.slug) revalidatePath(`/blog/${doc.slug}`)
    } else if (doc.status !== 'published') {
      // Removed, withdrawn or marked spam. The link must not resurrect it.
      return fail('unavailable')
    }

    const anchor = `#comment-${doc._id.replace(/^drafts\./, '')}`
    return NextResponse.redirect(doc.slug ? absoluteUrl(`/blog/${doc.slug}${anchor}`) : absoluteUrl('/blog?comment=1'))
  } catch (err) {
    console.error('[comments/confirm] failed', err)
    return fail('error')
  }
}
