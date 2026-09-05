import { WarningOutlineIcon } from '@sanity/icons'
import { defineField, defineType } from 'sanity'
import { DEFAULT_ERROR_PAGES } from '@/lib/cms/defaults/errorPages'
import { navLinksField } from '@/sanity/schemas/objects/site'
// sanity/schemas/singletons/errorPages.ts

export default defineType({
  name: 'errorPages',
  title: 'Error pages',
  type: 'document',
  icon: WarningOutlineIcon,
  initialValue: DEFAULT_ERROR_PAGES,
  fields: [
    defineField({
      name: 'notFound',
      title: 'Page not found (404)',
      type: 'object',
      fields: [
        defineField({ name: 'title', title: 'Title', type: 'string' }),
        defineField({ name: 'body', title: 'Body', type: 'text', rows: 2 }),
        defineField({ name: 'hint', title: 'Hint', type: 'string' }),
        defineField({ name: 'primaryCta', title: 'Main button', type: 'navLink' }),
        navLinksField('links', 'Other links'),
      ],
    }),
    defineField({
      name: 'error',
      title: 'Something went wrong',
      type: 'object',
      fields: [
        defineField({ name: 'title', title: 'Title', type: 'string' }),
        defineField({ name: 'body', title: 'Body', type: 'text', rows: 2 }),
        defineField({ name: 'retryLabel', title: 'Retry button', type: 'string' }),
        defineField({ name: 'homeLabel', title: 'Home link', type: 'string' }),
        defineField({ name: 'referenceLabel', title: 'Reference label', type: 'string' }),
      ],
    }),
    defineField({
      name: 'offline',
      title: 'Offline page',
      description: 'Shown by the service worker when an article is opened without a connection and is not cached yet.',
      type: 'object',
      fields: [
        defineField({ name: 'title', title: 'Title', type: 'string' }),
        defineField({ name: 'body', title: 'Body', type: 'text', rows: 2 }),
        defineField({ name: 'ctaLabel', title: 'Button label', type: 'string' }),
        defineField({ name: 'ctaHref', title: 'Button link', type: 'string' }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: 'Error pages' }) },
})
