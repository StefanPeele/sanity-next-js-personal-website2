// components/garden/status.ts
import type { IconName } from '@/lib/cms/icons'
// Garden note status configuration shared by server and client components.
// Colours: seedling stone, growing emerald, evergreen green (matches KnowledgeGraph.tsx).

export type NoteStatus = 'seedling' | 'growing' | 'evergreen'

export const NOTE_STATUS: Record<
  NoteStatus,
  {
    /** lucide icon name (lib/cms/icons). */
    icon: IconName
    label: string
    /** Text + border + background classes for badges. */
    badge: string
    /** Small dot class. */
    dot: string
    /** Hex used by charts and the graph. */
    hex: string
    short: string
    banner: string
  }
> = {
  seedling: {
    icon: 'sprout',
    label: 'Seedling',
    badge: 'text-stone-400 border-stone-600/40 bg-stone-900/40',
    dot: 'bg-stone-500',
    hex: '#78716c',
    short: 'Raw idea, possibly wrong',
    banner: 'This is an early-stage thought — treat it accordingly. It may be incomplete or wrong.',
  },
  growing: {
    icon: 'leaf',
    label: 'Growing',
    badge: 'text-emerald-400 border-emerald-600/40 bg-emerald-950/20',
    dot: 'bg-emerald-500',
    hex: '#4ade80',
    short: 'Being developed, partially verified',
    banner: 'This note is being actively developed. It has structure and is partially verified against real experience.',
  },
  evergreen: {
    icon: 'tree-pine',
    label: 'Evergreen',
    badge: 'text-green-400 border-green-600/40 bg-green-950/20',
    dot: 'bg-green-400',
    hex: '#22c55e',
    short: 'Stable and reliably linkable',
    banner: 'This note is stable. It is reliable enough to link to from a post or recommend to someone learning the topic.',
  },
}

export const NOTE_STATUS_ORDER: NoteStatus[] = ['seedling', 'growing', 'evergreen']

export function noteStatus(status?: string | null) {
  return NOTE_STATUS[(status as NoteStatus) ?? 'seedling'] ?? NOTE_STATUS.seedling
}

export const ORIGIN_LABELS: Record<string, string> = {
  original:     'Original thought',
  lab:          'Lab observation',
  reading:      'Reading',
  conversation: 'Conversation',
  course:       'Course material',
}
