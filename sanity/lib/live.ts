import {defineLive} from 'next-sanity/live'
import {client} from './client'
import {token} from './token'

/**
 * `fetchOptions.revalidate` IS THE ONLY THING STOPPING THIS SITE GOING STALE FOR EVER.
 *
 * next-sanity's default, read from its own source (`node_modules/next-sanity/dist/live.js`):
 *
 *     const revalidate = fetchOptions?.revalidate !== undefined
 *       ? fetchOptions.revalidate
 *       : process.env.NODE_ENV === 'production' ? false : undefined
 *
 * `false` means cached with no expiry. In production, every `sanityFetch` on this site was
 * cached indefinitely, and the only thing that could ever clear it was a `revalidatePath`
 * from the Sanity webhook. Measured on the deployed site: with the webhook not arriving,
 * an edit to a published post's excerpt never reached the article page in 240 seconds of
 * polling, while the Sanity API and its CDN both served the new value immediately. The
 * article page is rendered dynamically on every request (`x-vercel-cache: MISS`), so the
 * HTML was fresh and the DATA behind it was months old -- the worst shape this can take,
 * because nothing about the page looks cached.
 *
 * Before this line, 31 of 36 prerendered routes had `initialRevalidateSeconds: false`.
 *
 * A number here also gives the STATIC routes an expiry: Next derives a route's revalidation
 * period from the lowest `revalidate` among the fetches inside it, so /blog and / stop being
 * frozen at build time as well.
 *
 * Five minutes, not five seconds: the webhook is the fast path when it works, and this is
 * the floor beneath it. It is the difference between "briefly stale" and "wrong until the
 * next deploy", and only the second one is a bug.
 *
 * Left at the library default in development, where `undefined` means no caching at all and
 * an edit in the Studio shows up on the next reload.
 */
export const {SanityLive, sanityFetch} = defineLive({
  client,
  serverToken: token,
  browserToken: token,
  fetchOptions: {
    revalidate: process.env.NODE_ENV === 'production' ? 300 : undefined,
  },
})
