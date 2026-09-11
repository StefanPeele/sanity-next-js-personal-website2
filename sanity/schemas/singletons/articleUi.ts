import { DocumentTextIcon } from '@sanity/icons'
import { defineField, defineType } from 'sanity'
import { DEFAULT_ARTICLE_UI } from '@/lib/cms/defaults/articleUi'
// sanity/schemas/singletons/articleUi.ts — labels on every article page.

const str = (name: string, title = name) => defineField({ name, title, type: 'string' })
const obj = (name: string, title: string, fields: ReturnType<typeof defineField>[], extra: Record<string, unknown> = {}) =>
  defineField({ name, title, type: 'object', fields, ...extra })
const vocab = (name: string, title: string) =>
  defineField({ name, title, type: 'array', of: [{ type: 'vocabEntry' }], options: { sortable: false } })

export default defineType({
  name: 'articleUi',
  title: 'Article UI',
  type: 'document',
  icon: DocumentTextIcon,
  initialValue: DEFAULT_ARTICLE_UI,
  groups: [
    { name: 'blocks', title: 'Blocks', default: true },
    { name: 'header', title: 'Header & contents' },
    { name: 'menu', title: 'Reading options' },
    { name: 'credibility', title: 'Credibility' },
  ],
  fields: [
    obj('header', 'Header', [
      str('backLabel', 'Back link label'),
      str('readTimeLabel', 'Read time ({n} = minutes)'),
      str('sourcesLabel', 'Sources count ({n})'),
      str('cardsLabel', 'Key terms count ({n})'),
      obj('reviewBadges', 'Review badges', [str('seekingReview', 'Seeking review'), str('peerReviewed', 'Peer reviewed')]),
    ], { group: 'header' }),
    obj('toc', 'Contents', [str('title', 'Sidebar title'), str('mobileTitle', 'Mobile title'), str('minutesSuffix', 'Minutes suffix')], { group: 'header' }),
    obj('readerMenu', 'Reading options menu', [
      str('buttonLabel', 'Button label'), str('closeLabel', 'Close button label'),
      obj('groupLabels', 'Group labels', ['theme', 'textSize', 'width', 'accessibility', 'share', 'listen', 'position'].map((n) => str(n))),
      obj('themeLabels', 'Theme names', ['archive', 'terminal'].map((n) => str(n))),
      obj('widthLabels', 'Width names', ['narrow', 'standard', 'wide'].map((n) => str(n))),
      obj('a11yLabels', 'Accessibility toggles', ['dyslexia', 'highContrast', 'reducedMotion', 'ruler', 'reset'].map((n) => str(n))),
      obj('shareLabels', 'Share and export', ['copyLink', 'copyMarkdown', 'print', 'studyDeck', 'share', 'copied'].map((n) => str(n))),
      obj('listenLabels', 'Read aloud', ['play', 'pause', 'resume', 'stop', 'unsupported'].map((n) => str(n))),
      obj('bookmarkLabels', 'Your place', ['save', 'saved', 'resume', 'clear'].map((n) => str(n))),
    ], { group: 'menu' }),
    obj('blocks', 'Block headings and labels', [
      str('tldrHeading', 'TL;DR heading'), str('tldrSub', 'TL;DR subheading'),
      str('prerequisitesHeading', 'Prerequisites heading'), str('objectivesHeading', 'Objectives heading'),
      str('checkpointHeading', 'Checkpoint heading'), str('conceptCardsHeading', 'Key terms heading'),
      str('sourcesHeading', 'Sources heading'), str('credibilityHeading', 'Credibility heading'),
      str('backlinksHeading', 'Backlinks heading'),
      str('askHeading', 'Ask heading'), str('askPlaceholder', 'Ask placeholder'), str('askButton', 'Ask button'),
      str('noContent', 'Empty body text'),
    ], { group: 'blocks' }),
    obj('credibility', 'Credibility labels', [
      vocab('maturity', 'Maturity'), vocab('load', 'Cognitive load'),
      str('reviewersHeading', 'Reviewers heading'), str('reviewedByLabel', '"Peer reviewed by" label'), str('responsesHeading', 'Responses heading'), str('changelogHeading', 'Revision history heading'),
      str('correctionsLabel', 'Corrections link label'),
      defineField({ name: 'correctionsUrl', title: 'Corrections link URL', type: 'url' }),
    ], { group: 'credibility' }),
    obj('seriesBanner', 'Series banner', [str('partLabel', 'Part label ({n} of {m})'), str('allPartsLabel', 'All parts'), str('prevLabel', 'Previous'), str('nextLabel', 'Next')], { group: 'blocks' }),
  ],
  preview: { prepare: () => ({ title: 'Article UI' }) },
})
