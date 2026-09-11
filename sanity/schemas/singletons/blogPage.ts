import { BookIcon } from '@sanity/icons'
import { defineField, defineType } from 'sanity'
import { DEFAULT_BLOG_PAGE } from '@/lib/cms/defaults/blogPage'
import { DEFAULT_TAXONOMY } from '@/lib/cms/defaults/taxonomy'
// sanity/schemas/singletons/blogPage.ts — the /blog index.

const str = (name: string, title = name) => defineField({ name, title, type: 'string' })
const obj = (name: string, title: string, fields: ReturnType<typeof defineField>[]) => defineField({ name, title, type: 'object', fields })

export default defineType({
  name: 'blogPage',
  title: 'Blog index',
  type: 'document',
  icon: BookIcon,
  initialValue: DEFAULT_BLOG_PAGE,
  fields: [
    defineField({ name: 'header', title: 'Header', type: 'pageHeader' }),
    obj('statsLabels', 'Stats line', [str('posts', '"posts"'), str('series', '"series"'), str('latest', '"Latest"')]),
    obj('featured', 'Featured post', [str('heading', 'Heading'), str('readLabel', 'Read link label')]),
    obj('seriesRail', 'Series rail', [str('heading', 'Heading'), defineField({ name: 'enabled', title: 'Show this section', type: 'boolean' }), str('ctaLabel', 'Link label'), str('ctaHref', 'Link path')]),
    obj('readingStrip', 'Currently reading strip', [str('heading', 'Heading'), defineField({ name: 'enabled', title: 'Show this section', type: 'boolean' }), str('ctaLabel', 'Link label'), str('ctaHref', 'Link path')]),
    obj('notesStrip', 'Recently tended strip', [str('heading', 'Heading'), defineField({ name: 'enabled', title: 'Show this section', type: 'boolean' }), str('ctaLabel', 'Link label'), str('ctaHref', 'Link path')]),
    obj('list', 'Post list', [
      str('heading', 'Heading'),
      obj('filterLabels', 'Filter labels', [str('lane', 'Type'), str('category', 'Topic'), str('tag', 'Tag'), str('sort', 'Sort'), str('status', 'Status filter')]),
      obj('sortLabels', 'Sort options', [str('newest'), str('oldest'), str('longest')]),
      str('allLabel', '"All" chip'), str('readLabel', 'Read label'), str('readAgainLabel', 'Read again label'),
      str('emptyState', 'Empty state'), str('clearLabel', 'Clear filters label'), str('postCount', 'Post count ({n})'),
      str('findLabel', 'Search field label'), str('findPlaceholder', 'Search placeholder'),
      str('filtersLabel', 'Filters button'), str('seeAllLabel', 'See all in a lane ({n})'),
      str('riverHeading', 'River heading'),
    ]),
    obj('planned', 'Planned posts (placeholders)', [
      defineField({ name: 'enabled', title: 'Show planned placeholders', type: 'boolean' }),
      str('heading', 'Heading'),
      str('note', 'Note under the heading'),
      str('label', 'Label on each card'),
      defineField({
        name: 'treatment',
        title: 'Visual treatment',
        type: 'string',
        options: { list: [{ title: 'Dark / empty', value: 'dark' }, { title: 'Glassy / translucent', value: 'glass' }], layout: 'radio' },
      }),
      defineField({
        name: 'items',
        title: 'Planned topics',
        type: 'array',
        description: 'One per planned post. The topic shows on the card, so this doubles as a visible roadmap — the point is that you can see the shape of the finished page before the content exists. Delete an entry when the post is published.',
        of: [{
          type: 'object',
          name: 'plannedPost',
          fields: [
            defineField({ name: 'topic', title: 'Intended topic', type: 'string', validation: (r) => r.required() }),
            defineField({
              name: 'lane',
              title: 'Lane',
              type: 'string',
              options: { list: DEFAULT_TAXONOMY.articleLanes.map((l) => ({ title: l.label, value: l.key })) },
            }),
          ],
          preview: { select: { title: 'topic', subtitle: 'lane' } },
        }],
      }),
    ]),
  ],
  preview: { prepare: () => ({ title: 'Blog index' }) },
})
