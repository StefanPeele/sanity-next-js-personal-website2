// components/garden/types.ts
// Hand-written shapes for garden data. Typegen collapses `[defined(_id)]`-filtered
// projections to `Array<null>`, so the reference fields are typed here instead.

import type { NoteStatus } from './status'

export interface GardenTag {
  _id: string
  title: string | null
  slug: string | null
  category?: string | null
  count?: number
}

export interface NoteRef {
  _id: string
  title: string | null
  slug: string | null
  status?: NoteStatus | null
}

export interface PostRef {
  _id: string
  title: string | null
  slug: string | null
  articleType?: string | null
}

export interface GardenNote {
  _id: string
  _createdAt: string
  title: string | null
  slug: string | null
  status: NoteStatus | null
  origin?: string | null
  lastTended: string
  tags: GardenTag[] | null
  relatedNotes: NoteRef[] | null
  relatedPosts: PostRef[] | null
  backlinks: NoteRef[]
  citedBy: PostRef[]
}

/** What the garden index hands the client component: body already rendered on the server. */
export interface GardenNoteView extends GardenNote {
  rendered: React.ReactNode
  plain: string
}
