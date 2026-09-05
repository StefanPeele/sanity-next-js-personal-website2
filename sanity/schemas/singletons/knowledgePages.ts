import { BulbOutlineIcon } from '@sanity/icons'
import { defineField, defineType } from 'sanity'
import { DEFAULT_KNOWLEDGE_PAGES } from '@/lib/cms/defaults/knowledgePages'
import { navLinksField } from '@/sanity/schemas/objects/site'
// sanity/schemas/singletons/knowledgePages.ts — garden, library, glossary, paths, review, series, graph.

const str = (name: string, title = name) => defineField({ name, title, type: 'string' })
const obj = (name: string, title: string, fields: ReturnType<typeof defineField>[], extra: Record<string, unknown> = {}) =>
  defineField({ name, title, type: 'object', fields, ...extra })
const header = defineField({ name: 'header', title: 'Header', type: 'pageHeader' })
const empty = obj('emptyState', 'Empty state', [str('title', 'Title'), str('hint', 'Hint')])

export default defineType({
  name: 'knowledgePages',
  title: 'Knowledge pages',
  type: 'document',
  icon: BulbOutlineIcon,
  initialValue: DEFAULT_KNOWLEDGE_PAGES,
  groups: [
    { name: 'garden', title: 'Garden', default: true },
    { name: 'library', title: 'Library' },
    { name: 'glossary', title: 'Glossary' },
    { name: 'paths', title: 'Paths' },
    { name: 'review', title: 'Review' },
    { name: 'series', title: 'Series' },
    { name: 'graph', title: 'Graph' },
  ],
  fields: [
    obj('garden', 'Garden', [
      header,
      obj('stats', 'Stat labels', [str('notes'), str('evergreen'), str('tags')]),
      empty,
      navLinksField('relatedNav', 'Related links'),
      obj('note', 'Note page labels', ['plantedLabel', 'tendedLabel', 'statusLabel', 'staleWarning', 'relatedNotes', 'relatedPosts', 'linksHere', 'citedBy', 'graphHeading', 'prevLabel', 'nextLabel', 'backLabel', 'openGraph'].map((n) => str(n))),
    ], { group: 'garden' }),
    obj('library', 'Library', [
      header,
      obj('stats', 'Stat labels', [str('total'), str('finished'), str('current'), str('changedThinking'), str('influenced')]),
      empty,
      navLinksField('relatedNav', 'Related links'),
      obj('filterLabels', 'Filter labels', [str('type'), str('status'), str('all'), str('clear')]),
    ], { group: 'library' }),
    obj('glossary', 'Glossary', [header, empty, str('backLabel', 'Back link'), str('termsCount', 'Terms count ({n})')], { group: 'glossary' }),
    obj('paths', 'Learning paths', [
      header, empty, str('hoursLabel', 'Hours ({n})'), str('stepsLabel', 'Steps ({n})'), str('startLabel', 'Start button'),
      obj('levelLabels', 'Level names', [str('foundations'), str('intermediate'), str('advanced')]),
      navLinksField('relatedNav', 'Related links'),
    ], { group: 'paths' }),
    obj('review', 'Review deck', [header, str('countLine', 'Count line ({concepts} {questions} {posts})'), empty, navLinksField('relatedNav', 'Related links')], { group: 'review' }),
    obj('series', 'Series', [
      header, empty, str('backLabel', 'Back link'), str('partsLabel', 'Parts ({n})'), str('publishedLabel', 'Published ({published} {total})'), str('updatedLabel', 'Updated'),
      obj('statusLabels', 'Status names', [str('inProgress'), str('complete'), str('paused')]),
    ], { group: 'series' }),
    obj('graph', 'Knowledge graph', [
      header, empty, str('backLabel', 'Back link'), str('legendHeading'), str('visibleHeading'), str('nodesLabel'), str('edgesLabel'), str('searchPlaceholder'), str('helpLine'),
      obj('typeLabels', 'Node type names', [str('post'), str('note'), str('tag'), str('library'), str('project'), str('series')]),
    ], { group: 'graph' }),
  ],
  preview: { prepare: () => ({ title: 'Knowledge pages' }) },
})
