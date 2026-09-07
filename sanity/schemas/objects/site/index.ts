import { defineField, defineType, type FieldDefinition } from 'sanity'
import { ICON_NAMES } from '@/lib/cms/icons'
// sanity/schemas/objects/site/index.ts
// Shared object types used by every "Site" singleton (copy, navigation, sections).

/** A string field constrained to the lucide icon names the site can render. */
export const iconField = (name = 'icon', title = 'Icon') =>
  defineField({
    name,
    title,
    type: 'string',
    options: { list: ICON_NAMES.map((n) => ({ title: n, value: n })) },
  })

export const navLink = defineType({
  name: 'navLink',
  title: 'Link',
  type: 'object',
  fields: [
    defineField({ name: 'label', title: 'Label', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'kind',
      title: 'Link type',
      type: 'string',
      options: {
        list: [
          { title: 'Page on this site', value: 'internal' },
          { title: 'External URL', value: 'external' },
          { title: 'Document (post, project…)', value: 'reference' },
        ],
        layout: 'radio',
      },
      initialValue: 'internal',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'path',
      title: 'Path',
      type: 'string',
      description: 'Starts with /, e.g. /projects',
      hidden: ({ parent }) => parent?.kind !== 'internal',
      validation: (r) =>
        r.custom((v, ctx) => {
          const parent = ctx.parent as { kind?: string } | undefined
          if (parent?.kind !== 'internal') return true
          return typeof v === 'string' && v.startsWith('/') ? true : 'Path must start with /'
        }),
    }),
    defineField({
      name: 'url',
      title: 'URL',
      type: 'url',
      hidden: ({ parent }) => parent?.kind !== 'external',
    }),
    defineField({
      name: 'reference',
      title: 'Document',
      type: 'reference',
      to: [{ type: 'page' }, { type: 'post' }, { type: 'project' }, { type: 'series' }, { type: 'gallery' }],
      hidden: ({ parent }) => parent?.kind !== 'reference',
    }),
    defineField({ name: 'description', title: 'Short description', type: 'string' }),
    iconField(),
    defineField({ name: 'newTab', title: 'Open in new tab', type: 'boolean', initialValue: false }),
  ],
  preview: {
    select: { title: 'label', kind: 'kind', path: 'path', url: 'url' },
    prepare({ title, kind, path, url }) {
      return { title, subtitle: kind === 'external' ? url : kind === 'reference' ? 'document' : path }
    },
  },
})

export const pageHeader = defineType({
  name: 'pageHeader',
  title: 'Page header',
  type: 'object',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string' }),
    defineField({ name: 'lede', title: 'Intro', type: 'text', rows: 3 }),
    defineField({ name: 'metaTitle', title: 'SEO title', type: 'string', description: 'Browser tab and search result title. Falls back to Title.' }),
    defineField({ name: 'metaDescription', title: 'SEO description', type: 'text', rows: 2, validation: (r) => r.max(160) }),
  ],
})

export const sectionCopy = defineType({
  name: 'sectionCopy',
  title: 'Section',
  type: 'object',
  fields: [
    defineField({ name: 'enabled', title: 'Show this section', type: 'boolean', initialValue: true }),
    defineField({ name: 'heading', title: 'Heading', type: 'string' }),
    defineField({ name: 'lede', title: 'Intro', type: 'text', rows: 2 }),
    defineField({ name: 'ctaLabel', title: 'Link label', type: 'string' }),
    defineField({ name: 'ctaHref', title: 'Link path', type: 'string' }),
    defineField({ name: 'emptyState', title: 'Empty state text', type: 'string' }),
  ],
  preview: {
    select: { title: 'heading', enabled: 'enabled' },
    prepare({ title, enabled }) {
      return { title: title ?? 'Section', subtitle: enabled === false ? 'Hidden' : 'Shown' }
    },
  },
})

export const labelValue = defineType({
  name: 'labelValue',
  title: 'Label and value',
  type: 'object',
  fields: [
    defineField({ name: 'label', title: 'Label', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'value', title: 'Value', type: 'string' }),
    defineField({
      name: 'valueSource',
      title: 'Value comes from',
      type: 'string',
      options: {
        list: [
          { title: 'The text above', value: 'static' },
          { title: 'Lowest NJIT package price', value: 'lowestNjit' },
          { title: 'Portrait starting price', value: 'portraitFrom' },
        ],
      },
      initialValue: 'static',
    }),
  ],
  preview: { select: { title: 'label', subtitle: 'value' } },
})

export const faqItem = defineType({
  name: 'faqItem',
  title: 'FAQ item',
  type: 'object',
  fields: [
    defineField({ name: 'question', title: 'Question', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'answer', title: 'Answer', type: 'text', rows: 4, validation: (r) => r.required() }),
  ],
  preview: { select: { title: 'question' } },
})

export const usesItem = defineType({
  name: 'usesItem',
  title: 'Item',
  type: 'object',
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'note', title: 'Note', type: 'text', rows: 2 }),
    defineField({ name: 'url', title: 'Link', type: 'url' }),
  ],
  preview: { select: { title: 'name', subtitle: 'note' } },
})

export const usesSection = defineType({
  name: 'usesSection',
  title: 'Section',
  type: 'object',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'items', title: 'Items', type: 'array', of: [{ type: 'usesItem' }] }),
  ],
  preview: {
    select: { title: 'title', items: 'items' },
    prepare({ title, items }) {
      return { title, subtitle: `${(items as unknown[] | undefined)?.length ?? 0} items` }
    },
  },
})

export const vocabEntry = defineType({
  name: 'vocabEntry',
  title: 'Term',
  type: 'object',
  fields: [
    defineField({ name: 'key', title: 'Key', type: 'string', readOnly: true, description: 'Fixed. Used by code.' }),
    defineField({ name: 'label', title: 'Label', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'short', title: 'Short label', type: 'string' }),
    defineField({ name: 'description', title: 'Description', type: 'string' }),
    defineField({ name: 'banner', title: 'Banner text', type: 'text', rows: 2, description: 'Shown on pages of this kind, where applicable.' }),
    defineField({ name: 'color', title: 'Colour (hex)', type: 'string', validation: (r) => r.regex(/^#([0-9a-f]{3}){1,2}$/i).warning('Use a hex colour like #fbbf24') }),
    defineField({ name: 'dots', title: 'Dots (skill levels)', type: 'number', validation: (r) => r.min(0).max(4) }),
  ],
  preview: { select: { title: 'label', subtitle: 'key' } },
})

export const siteObjects = [navLink, pageHeader, sectionCopy, labelValue, faqItem, usesItem, usesSection, vocabEntry]

/** Convenience: an array-of-navLink field. */
export const navLinksField = (name: string, title: string, description?: string): FieldDefinition =>
  defineField({ name, title, description, type: 'array', of: [{ type: 'navLink' }] })
