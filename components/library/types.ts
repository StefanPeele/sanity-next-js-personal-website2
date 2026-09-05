import type { LibraryQueryResult } from '@/sanity.types'
// components/library/types.ts
import type { IconName } from '@/lib/cms/icons'
// Typegen collapses `[defined(slug)]` projections to Array<null>; retype those here.

type Raw = LibraryQueryResult[number]

export interface LibraryLink { title: string | null; slug: string | null }

export type LibraryItem = Omit<Raw, 'influencedPosts' | 'influencedNotes'> & {
  influencedPosts: LibraryLink[] | null
  influencedNotes: LibraryLink[] | null
}

export type LibraryStatus = NonNullable<Raw['status']>
export type MediaType = NonNullable<Raw['mediaType']>

/** lucide icon names (lib/cms/icons) per media type. */
export const MEDIA_ICONS: Record<string, IconName> = {
  book: 'book', article: 'newspaper', whitepaper: 'file-text', 'industry-paper': 'factory',
  rfc: 'clipboard-list', 'research-paper': 'file-text', podcast: 'mic', newsletter: 'mail',
  video: 'video', documentation: 'book-open',
}
export const MEDIA_ICON_FALLBACK: IconName = 'book-open'

export const MEDIA_LABELS: Record<string, string> = {
  book: 'Book', article: 'Article', whitepaper: 'White paper', 'industry-paper': 'Industry paper',
  rfc: 'RFC / Standard', 'research-paper': 'Research paper', podcast: 'Podcast', newsletter: 'Newsletter',
  video: 'Video / Course', documentation: 'Documentation',
}

export const STATUS_LABELS: Record<LibraryStatus, string> = {
  current: 'Reading now',
  finished: 'Finished',
  reference: 'Reference',
  'want-to-read': 'On deck',
  abandoned: 'Abandoned',
}

export const RATING_CONFIG: Record<string, { label: string; color: string }> = {
  'changed-thinking': { label: 'Changed how I think', color: 'text-emerald-400' },
  'worth-it':         { label: 'Worth the time',       color: 'text-stone-300' },
  'fine':             { label: 'Fine',                  color: 'text-stone-400' },
  'not-for-me':       { label: 'Not for me',            color: 'text-stone-500' },
  'abandoned':        { label: 'Abandoned',             color: 'text-red-400/80' },
}
