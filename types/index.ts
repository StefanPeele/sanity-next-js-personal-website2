import type { PortableTextBlock } from 'next-sanity'
import type { Image } from 'sanity'

// ... existing MilestoneItem and ShowcaseProject interfaces ...

export interface Category {
  title?: string
  slug?: string
  themeColor?: {
    hex: string
  }
}

export interface Gallery {
  _id: string
  title?: string
  slug?: string
  mainImage?: Image & { alt?: string; metadata?: { lqip: string } }
  images?: Array<Image & { _key: string; alt?: string; caption?: string; metadata?: { lqip: string } }>
  overview?: string
  category?: Category
  // Technical Profile
  system?: string
  lens?: string
  iso?: string
  location?: string
  notes?: string
}