import { defineField, defineType } from 'sanity'
// sanity/schemas/objects/home-sections.ts
// One object type per homepage block. `home.sections` is an ordered array of these.

const enabled = defineField({ name: 'enabled', title: 'Show this section', type: 'boolean', initialValue: true })
const heading = defineField({ name: 'heading', title: 'Heading', type: 'string' })
const ctaLabel = defineField({ name: 'ctaLabel', title: 'Link label', type: 'string' })

const preview = (title: string) => ({
  select: { enabled: 'enabled', heading: 'heading' },
  prepare({ enabled, heading }: { enabled?: boolean; heading?: string }) {
    return { title: heading || title, subtitle: `${title}${enabled === false ? ' · hidden' : ''}` }
  },
})

export const homeHero = defineType({
  name: 'homeHero', title: 'Hero', type: 'object',
  fields: [
    enabled,
    defineField({ name: 'showNav', title: 'Show the big section list', type: 'boolean', initialValue: true }),
    defineField({ name: 'currentlyLabel', title: '"Currently" label', type: 'string' }),
    defineField({ name: 'locationLabel', title: '"Location" label', type: 'string' }),
    defineField({ name: 'footnote', title: 'Footnote (right side)', type: 'string', description: 'Leave empty to hide.' }),
  ],
  preview: preview('Hero'),
})

export const homeOpenTo = defineType({
  name: 'homeOpenTo', title: 'Open-to status', type: 'object',
  description: 'Shows the "open to" line from Identity & SEO with a contact link.',
  fields: [enabled, ctaLabel],
  preview: preview('Open-to status'),
})

export const homeAbout = defineType({
  name: 'homeAbout', title: 'About', type: 'object',
  fields: [
    enabled, heading,
    defineField({ name: 'fallbackManifesto', title: 'Manifesto fallback', type: 'text', rows: 2, description: 'Used when the Home document has no manifesto.' }),
    defineField({ name: 'fallbackBio', title: 'Bio fallback', type: 'text', rows: 5, description: 'Used when the Home document has no aspirations text.' }),
    defineField({ name: 'imagePlaceholder', title: 'Missing image text', type: 'string' }),
  ],
  preview: preview('About'),
})

export const homeShowcase = defineType({
  name: 'homeShowcase', title: 'Selected work', type: 'object',
  fields: [enabled, heading, ctaLabel, defineField({ name: 'limit', title: 'Max projects', type: 'number', validation: (r) => r.min(1).max(3) })],
  preview: preview('Selected work'),
})

export const homeWriting = defineType({
  name: 'homeWriting', title: 'Latest writing', type: 'object',
  fields: [
    enabled, heading,
    defineField({ name: 'featuredBadge', title: 'Featured badge', type: 'string' }),
    defineField({ name: 'recentHeading', title: 'Recent posts heading', type: 'string' }),
    defineField({ name: 'readLabel', title: 'Read link label', type: 'string' }),
    defineField({ name: 'limit', title: 'Max recent posts', type: 'number', validation: (r) => r.min(1).max(6) }),
  ],
  preview: preview('Latest writing'),
})

export const homeReading = defineType({
  name: 'homeReading', title: 'Currently reading', type: 'object',
  fields: [enabled, heading, ctaLabel],
  preview: preview('Currently reading'),
})

export const homeNotes = defineType({
  name: 'homeNotes', title: 'Recently tended notes', type: 'object',
  fields: [enabled, heading, ctaLabel],
  preview: preview('Recently tended'),
})

export const homeSectionTypes = [homeHero, homeOpenTo, homeAbout, homeShowcase, homeWriting, homeReading, homeNotes]
export const HOME_SECTION_NAMES = homeSectionTypes.map((t) => t.name)
