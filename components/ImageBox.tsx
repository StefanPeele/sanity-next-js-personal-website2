// components/ImageBox.tsx
// Sanity image inside a sized wrapper. The wrapper (via classesWrapper) defines
// the box — aspect ratio or explicit size — and the image fills it with
// object-cover positioned on the Sanity hotspot. No hard crop is requested from
// the CDN: fit('max') keeps the original ratio and never upscales.

import { urlForImage } from '@/sanity/lib/utils'
import Image from 'next/image'
import type { Image as SanityImage } from 'sanity'

export interface ImageBoxImage {
  asset?: unknown
  hotspot?: { x?: number; y?: number } | null
  crop?: unknown
  metadata?: { lqip?: string | null } | null
  [key: string]: unknown
}

interface ImageBoxProps {
  image?: ImageBoxImage | null
  alt?: string
  /** Largest width the CDN should return. */
  width?: number
  /** Responsive sizes hint — set per call site. */
  sizes?: string
  /** Legacy alias for `sizes`. */
  size?: string
  classesWrapper?: string
  imageClassName?: string
  priority?: boolean
  'data-sanity'?: string
}

export default function ImageBox({
  image,
  alt = '',
  width = 1600,
  sizes,
  size,
  classesWrapper = '',
  imageClassName = '',
  priority = false,
  ...props
}: ImageBoxProps) {
  const imageUrl = image ? urlForImage(image as SanityImage)?.width(width).fit('max').url() : undefined
  const lqip = image?.metadata?.lqip ?? undefined
  const hotspot = image?.hotspot
  const objectPosition =
    hotspot && typeof hotspot.x === 'number' && typeof hotspot.y === 'number'
      ? `${Math.round(hotspot.x * 100)}% ${Math.round(hotspot.y * 100)}%`
      : '50% 50%'

  return (
    <div className={`relative w-full overflow-hidden rounded-[3px] bg-stone-900 ${classesWrapper}`} data-sanity={props['data-sanity']}>
      {imageUrl && (
        <Image
          className={`object-cover ${imageClassName}`}
          style={{ objectPosition }}
          alt={alt}
          fill
          sizes={sizes ?? size ?? '100vw'}
          src={imageUrl}
          priority={priority}
          placeholder={lqip ? 'blur' : 'empty'}
          blurDataURL={lqip}
        />
      )}
    </div>
  )
}
