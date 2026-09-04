import { TagIcon } from '@sanity/icons'
import { defineField, defineType } from 'sanity'
import { DEFAULT_TAXONOMY, TAXONOMY_KEYS, type TaxonomyGroup } from '@/lib/cms/defaults/taxonomy'
// sanity/schemas/singletons/taxonomy.ts
// Labels for fixed keys. The key set is enforced; only labels/colours/descriptions change.

const GROUPS: { name: TaxonomyGroup; title: string; description: string }[] = [
  { name: 'articleLanes', title: 'Article types', description: 'The four kinds of post. Shown as badges and filters.' },
  { name: 'noteStatuses', title: 'Garden note statuses', description: 'Seedling, growing, evergreen. Banner text is shown on note pages.' },
  { name: 'noteOrigins', title: 'Note origins', description: 'Where a note came from.' },
  { name: 'mediaTypes', title: 'Library media types', description: '' },
  { name: 'libraryStatuses', title: 'Library shelves', description: 'Shelf headings on the library page.' },
  { name: 'skillLevels', title: 'Skill levels', description: 'Resume skill levels and how many dots they show.' },
  { name: 'packageCategories', title: 'Service package categories', description: '' },
]

export default defineType({
  name: 'taxonomy',
  title: 'Taxonomy',
  type: 'document',
  icon: TagIcon,
  initialValue: DEFAULT_TAXONOMY,
  fields: GROUPS.map((g) =>
    defineField({
      name: g.name,
      title: g.title,
      description: g.description || undefined,
      type: 'array',
      of: [{ type: 'vocabEntry' }],
      options: { sortable: false },
      validation: (rule) =>
        rule.custom((value) => {
          const keys = ((value as { key?: string }[] | undefined) ?? []).map((v) => v.key)
          const expected = TAXONOMY_KEYS[g.name]
          const missing = expected.filter((k) => !keys.includes(k))
          const extra = keys.filter((k) => !expected.includes(k ?? ''))
          if (missing.length) return `Missing: ${missing.join(', ')}. Keys are fixed by the site code.`
          if (extra.length) return `Unknown: ${extra.join(', ')}. Keys are fixed by the site code.`
          return true
        }),
    }),
  ),
  preview: { prepare: () => ({ title: 'Taxonomy' }) },
})
