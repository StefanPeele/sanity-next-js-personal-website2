// components/article/heroImage.ts
// Plain module (no 'use client') so both the server page and the client hero can use it.

import type { Image } from 'sanity'
import { urlForImage } from '@/sanity/lib/utils'

/** Sanity CDN hero URL: 1600px wide, auto format, q75. Uncropped; see heroCropUrl. */
export function heroImageUrl(url: string): string {
  return `${url}${url.includes('?') ? '&' : '?'}w=1600&auto=format&q=75`
}

/**
 * 7.3 option F. The hero is 21:9 across the FULL reading column.
 *
 * Two things it fixes. The hero used to sit at the 52rem `wide` tier, which is a width
 * nothing else on the article shares — the reading column, the figures and the code blocks
 * are all on the full tier at 964px — so it now joins them, 132px wider (+16%). And it
 * shortens the fold at every breakpoint, which is the thing 7.3 was actually asked to fix:
 * measured, the first line of prose moves up 26px at 1440, **72px at 768** and 34px at 390.
 * 390 is the number the brief cares most about and the only place nothing else can help,
 * because the column is viewport-bound there and only the crop can move it.
 *
 * THE CROP IS SANITY'S, NOT CSS's. `object-fit: cover` crops around the geometric centre,
 * which is why a face or a rack of equipment drifts out of frame at one breakpoint and not
 * another. Passing the raw image object to @sanity/image-url lets it read the editor's
 * HOTSPOT and compute the rect, so the subject stays in frame because a person said where
 * the subject is. It also means the bytes that cross the wire are the bytes shown, rather
 * than a 16:9 image with a third of it hidden behind a container.
 *
 * Falls back to a centre crop when a post has no hotspot set, which is every published post
 * today.
 */
export const HERO_WIDTH = 1600
export const HERO_HEIGHT = Math.round((HERO_WIDTH * 9) / 21) // 686

/**
 * Typed loosely on purpose. Sanity typegen emits `asset: SanityImageAssetReference | null`
 * for this projection, while the `Image` type in the toolkit wants `Reference | undefined`,
 * so the two disagree only about how they spell "absent". `urlForImage` already guards on
 * `source?.asset?._ref` and returns undefined without one, which is the real check.
 */
type HeroImageSource = { asset?: unknown; hotspot?: unknown; crop?: unknown } | null | undefined

export function heroCropUrl(image: HeroImageSource): string | undefined {
  return urlForImage(image as Image | null | undefined)
    ?.width(HERO_WIDTH)
    .height(HERO_HEIGHT)
    .fit('crop')
    .auto('format')
    .quality(75)
    .url()
}
