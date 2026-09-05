import { BookIcon } from '@sanity/icons'
import { defineField, defineType } from 'sanity'
import { DEFAULT_BLOG_PAGE } from '@/lib/cms/defaults/blogPage'
import { navLinksField } from '@/sanity/schemas/objects/site'
// sanity/schemas/singletons/blogPage.ts — the /blog index.

const str = (name: string, title = name) => defineField({ name, title, type: 'string' })
const obj = (name: string, title: string, fields: ReturnType<typeof defineField>[]) => defineField({ name, title, type: 'object', fields })

export default defineType({
  name: 'blogPage',
  title: 'Writing index',
  type: 'document',
  icon: BookIcon,
  initialValue: DEFAULT_BLOG_PAGE,
  fields: [
    defineField({ name: 'header', title: 'Header', type: 'pageHeader' }),
    obj('statsLabels', 'Stats line', [str('posts', '"posts"'), str('series', '"series"'), str('latest', '"Latest"')]),
    obj('featured', 'Featured post', [str('heading', 'Heading'), str('readLabel', 'Read link label')]),
    obj('directory', 'Directory panel', [
      defineField({ name: 'enabled', title: 'Show the directory panel', type: 'boolean', initialValue: true }),
      str('topicsHeading', 'Topics heading'), str('toolsHeading', 'Explore heading'), str('statsHeading', 'Stats heading'),
      str('totalLabel', 'Posts label'), str('latestLabel', 'Latest label'), str('seriesLabel', 'Series label'), str('readLabel', 'Read label'), str('noTopics', 'No topics text'),
    ]),
    navLinksField('referenceLinks', 'Explore links', 'Shown in the directory panel. Pick an icon on each.'),
    defineField({ name: 'seriesRail', title: 'Series rail', type: 'sectionCopy' }),
    defineField({ name: 'readingStrip', title: 'Currently reading strip', type: 'sectionCopy' }),
    defineField({ name: 'notesStrip', title: 'Recently tended strip', type: 'sectionCopy' }),
    obj('list', 'Post list', [
      str('heading', 'Heading'),
      obj('filterLabels', 'Filter labels', [str('lane', 'Type'), str('category', 'Topic'), str('tag', 'Tag'), str('sort', 'Sort')]),
      obj('sortLabels', 'Sort options', [str('newest'), str('oldest'), str('longest')]),
      str('allLabel', '"All" chip'), str('readLabel', 'Read label'), str('readAgainLabel', 'Read again label'),
      str('emptyState', 'Empty state'), str('clearLabel', 'Clear filters label'), str('postCount', 'Post count ({n})'),
    ]),
  ],
  preview: { prepare: () => ({ title: 'Writing index' }) },
})
