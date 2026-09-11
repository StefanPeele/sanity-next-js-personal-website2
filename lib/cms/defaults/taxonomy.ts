// lib/cms/defaults/taxonomy.ts — labels for fixed machine keys.
// Keys never change (queries, graph, OG image branch on them). Labels, short codes,
// colours and descriptions are editable in Studio → Site → Taxonomy.

export type VocabEntry = {
  key: string
  label: string
  short?: string
  description?: string
  color?: string
  /** Extra text used by some vocabularies (note status banner, etc.). */
  banner?: string
  /** Used by skill levels (1–4). */
  dots?: number
}

export const DEFAULT_TAXONOMY = {
  articleLanes: [
    { key: 'perspective',       label: 'Perspective',       short: 'Perspective', color: '#a78bfa', description: 'Opinion and analysis on where the field is going.' },
    { key: 'concept-deep-dive', label: 'Deep dive',         short: 'Deep dive',   color: '#fbbf24', description: 'One idea, explained until it clicks.' },
    // 4.3. Was `field-notes` / "Field notes", which sounds generated. "Lab Notes" over the
    // brief's alternate "Notebook Notes": it is shorter, it says where the work happened
    // rather than where it was written down, and "Notebook Notes" repeats itself. It also
    // matches what the posts actually are -- the home lab series.
    { key: 'lab-notes',         label: 'Lab Notes',         short: 'Lab Notes',   color: '#34d399', description: 'What actually happened in the lab or on the job.' },
    // `transmission` ("Update") is GONE. 4.3 lists the taxonomy as exactly Perspective,
    // Deep dive and Lab Notes plus whatever is added in Studio, and zero posts used it --
    // measured against the dataset, published and drafts, before removing it. It also
    // collided with 3B's `updated` revision word, so two different things read "Update".
  ] as VocabEntry[],
  noteStatuses: [
    { key: 'seedling',  label: 'Seedling',  short: 'Raw idea, possibly wrong',          color: '#78716c', banner: 'This is an early-stage thought. It may be incomplete or wrong.' },
    { key: 'growing',   label: 'Growing',   short: 'Being developed, partly verified',   color: '#34d399', banner: 'This note is being actively developed. It has structure and is partly verified against real experience.' },
    { key: 'evergreen', label: 'Evergreen', short: 'Stable and reliable',                color: '#4ade80', banner: 'This note is stable and reliable enough to link to or recommend.' },
  ] as VocabEntry[],
  noteOrigins: [
    { key: 'original',     label: 'Original thought' },
    { key: 'lab',          label: 'Lab observation' },
    { key: 'reading',      label: 'Reading' },
    { key: 'conversation', label: 'Conversation' },
    { key: 'course',       label: 'Course material' },
  ] as VocabEntry[],
  mediaTypes: [
    { key: 'book',           label: 'Book' },
    { key: 'article',        label: 'Article' },
    { key: 'whitepaper',     label: 'White paper' },
    { key: 'industry-paper', label: 'Industry paper' },
    { key: 'rfc',            label: 'RFC' },
    { key: 'research-paper', label: 'Paper' },
    { key: 'podcast',        label: 'Podcast' },
    { key: 'newsletter',     label: 'Newsletter' },
    { key: 'video',          label: 'Video' },
    { key: 'documentation',  label: 'Docs' },
  ] as VocabEntry[],
  libraryStatuses: [
    { key: 'current',      label: 'Currently reading' },
    { key: 'reference',    label: 'Reference shelf', description: 'Never finished on purpose. Opened whenever a real problem needs the authoritative answer.' },
    { key: 'finished',     label: 'Finished' },
    { key: 'want-to-read', label: 'On deck' },
    { key: 'abandoned',    label: 'Abandoned' },
  ] as VocabEntry[],
  skillLevels: [
    { key: 'learning',   label: 'Learning',          dots: 1 },
    { key: 'working',    label: 'Working knowledge', dots: 2 },
    { key: 'proficient', label: 'Proficient',        dots: 3 },
    { key: 'deep',       label: 'Deep',              dots: 4 },
  ] as VocabEntry[],
  packageCategories: [
    { key: 'portrait',  label: 'Portrait' },
    { key: 'event',     label: 'Event' },
    { key: 'specialty', label: 'Specialty' },
  ] as VocabEntry[],
}

export type TaxonomyData = typeof DEFAULT_TAXONOMY
export type TaxonomyGroup = keyof TaxonomyData

export function vocab(entries: VocabEntry[] | undefined, key?: string | null): VocabEntry | null {
  if (!key || !entries) return null
  return entries.find((e) => e.key === key) ?? null
}

/** The keys each vocabulary must contain, in order. Enforced by Studio validation. */
export const TAXONOMY_KEYS: Record<TaxonomyGroup, string[]> = Object.fromEntries(
  Object.entries(DEFAULT_TAXONOMY).map(([g, entries]) => [g, (entries as VocabEntry[]).map((e) => e.key)]),
) as Record<TaxonomyGroup, string[]>
