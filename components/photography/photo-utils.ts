// components/photography/photo-utils.ts
// Shared shaping of Sanity gallery images into the flat GalleryPhoto the
// CinematicGallery renders. Server-safe, no React.

import type { GalleryPhoto } from '@/components/CinematicGallery'
import type { GalleriesQueryResult, GalleryBySlugQueryResult } from '@/sanity.types'

/** Subset of Sanity's asset->metadata.exif we read. Typegen sees it as `null`. */
export interface SanityExif {
  FNumber?: number
  ExposureTime?: number
  ISO?: number
  FocalLength?: number
  LensModel?: string
  LensMake?: string
  Make?: string
  Model?: string
  DateTimeOriginal?: string
}

type GalleryImage = NonNullable<GalleriesQueryResult[number]['images']>[number] & { exif?: SanityExif | null }
type GalleryLike = Pick<
  NonNullable<GalleryBySlugQueryResult>,
  '_id' | 'title' | 'category' | 'location' | 'system' | 'lens'
> & { iso?: string | null; notes?: string | null; images?: GalleryImage[] | never[] | null }

export function formatShutter(seconds?: number): string | null {
  if (!seconds || seconds <= 0) return null
  if (seconds >= 1) return `${Number(seconds.toFixed(1))}s`
  return `1/${Math.round(1 / seconds)}`
}

export function formatAperture(f?: number): string | null {
  return f && f > 0 ? `f/${Number(f.toFixed(1))}` : null
}

export function formatFocal(mm?: number): string | null {
  return mm && mm > 0 ? `${Math.round(mm)}mm` : null
}

/**
 * EXIF from the asset first, manual per-image fields second, gallery defaults last.
 * Fields with no data stay null and are omitted from the readout.
 */
export function toGalleryPhoto(gallery: GalleryLike, img: GalleryImage): GalleryPhoto | null {
  const imageUrl = img.imageUrl
  if (!imageUrl) return null
  const exif = (img.exif ?? null) as SanityExif | null
  const cameraFromExif = exif?.Model ? [exif.Make, exif.Model].filter(Boolean).join(' ').replace(/^(\w+) \1/i, '$1') : null

  return {
    _id: `${gallery._id}:${img._key || imageUrl}`,
    title: img.title ?? gallery.title ?? 'Untitled',
    alt: img.alt ?? img.caption ?? img.title ?? gallery.title ?? 'Photograph',
    imageUrl,
    lqip: img.lqip ?? null,
    caption: img.caption ?? null,
    category: gallery.category?.title ?? 'Archive',
    location: gallery.location ?? null,
    system: cameraFromExif ?? img.systemOverride ?? gallery.system ?? null,
    lens: exif?.LensModel ?? img.lensOverride ?? gallery.lens ?? null,
    aperture: formatAperture(exif?.FNumber) ?? img.aperture ?? null,
    shutter: formatShutter(exif?.ExposureTime) ?? img.shutter ?? null,
    iso: exif?.ISO ? String(exif.ISO) : img.iso ?? gallery.iso ?? null,
    focalLength: formatFocal(exif?.FocalLength),
    notes: gallery.notes ?? null,
  }
}

export function galleryPhotos(gallery: GalleryLike): GalleryPhoto[] {
  return ((gallery.images ?? []) as GalleryImage[])
    .map((img) => toGalleryPhoto(gallery, img))
    .filter((p): p is GalleryPhoto => p !== null)
}
