import { UserIcon } from '@sanity/icons'
import { defineField, defineType } from 'sanity'
import { DEFAULT_PERSONAL_PAGES } from '@/lib/cms/defaults/personalPages'
// sanity/schemas/singletons/personalPages.ts — projects, resume, contact, now, uses, photography copy.

const str = (name: string, title = name) => defineField({ name, title, type: 'string' })
const text = (name: string, title = name) => defineField({ name, title, type: 'text', rows: 3 })
const obj = (name: string, title: string, fields: ReturnType<typeof defineField>[], extra: Record<string, unknown> = {}) =>
  defineField({ name, title, type: 'object', fields, ...extra })
const header = defineField({ name: 'header', title: 'Header', type: 'pageHeader' })
const strs = (names: string[]) => names.map((n) => str(n))

export default defineType({
  name: 'personalPages',
  title: 'Pages',
  type: 'document',
  icon: UserIcon,
  initialValue: DEFAULT_PERSONAL_PAGES,
  groups: [
    { name: 'projects', title: 'Projects', default: true },
    { name: 'resume', title: 'Resume' },
    { name: 'contact', title: 'Contact' },
    { name: 'now', title: 'Now' },
    { name: 'uses', title: 'Uses' },
    { name: 'photography', title: 'Photography' },
  ],
  fields: [
    obj('projects', 'Projects', [
      header, str('emptyState', 'Empty state'),
      obj('card', 'Card labels', strs(['featuredBadge', 'outcomeLabel', 'presentLabel', 'noCoverLabel', 'techLabel'])),
      obj('detail', 'Case study page', [
        str('eyebrow', 'Small label above the title'),
        obj('metaLabels', 'Meta labels', strs(['timeline', 'client', 'role', 'tags'])),
        obj('sectionLabels', 'Section labels', strs(['problem', 'constraints', 'approach', 'outcome', 'metrics', 'retrospective', 'stack', 'architecture', 'relatedWriting', 'relatedNotes'])),
        obj('linkLabels', 'Link labels', strs(['code', 'docs', 'board', 'live'])),
        str('backLabel', 'Back link'),
      ]),
    ], { group: 'projects' }),
    obj('resume', 'Resume', [
      header, str('fallbackTagline', 'Tagline when Home has no "currently"'), str('lastUpdatedLabel', 'Last updated label'),
      obj('sectionLabels', 'Section labels', strs(['experience', 'skills', 'certifications', 'education', 'currently', 'hardCopy'])),
      str('emptyExperience', 'No experience text'), str('emptySkills', 'No skills text'), str('levelsLegend', 'Skill dots legend'),
      obj('certStatusLabels', 'Certification status labels', strs(['earned', 'inProgress', 'planned', 'target'])),
      str('presentLabel', '"Present"'), str('expectedLabel', '"Expected"'), str('downloadLabel', 'Download button'), str('draftHint', 'Draft-mode hint'),
      obj('contactPrompt', 'Contact prompt', [str('label'), str('ctaLabel')]),
      defineField({ name: 'skillCategoryOrder', title: 'Skill category order', type: 'array', of: [{ type: 'string' }] }),
      obj('fallbackEducation', 'Fallback education (when no Education documents exist)', [str('school'), str('degree'), str('field'), defineField({ name: 'endDate', title: 'End date', type: 'date' }), defineField({ name: 'expected', title: 'Expected', type: 'boolean' })]),
      defineField({ name: 'showEmail', title: 'Show email', type: 'boolean' }),
      defineField({ name: 'showGithub', title: 'Show GitHub', type: 'boolean' }),
    ], { group: 'resume' }),
    obj('contact', 'Contact', [
      header, str('formHeading', 'Form heading'), str('channelsHeading', 'Channels heading'), text('recruiterNote', 'Note under the form'),
      defineField({ name: 'photoCta', title: 'Photography call-out', type: 'sectionCopy' }),
      str('basedInLine', 'Based-in line ({city} {region} {school})'),
      obj('channelLabels', 'Channel labels', strs(['email', 'linkedin', 'github', 'instagram', 'bluesky'])),
      str('instagramHandle', 'Instagram handle'),
    ], { group: 'contact' }),
    obj('now', 'Now', [
      header, obj('blockLabels', 'Block labels', strs(['projects', 'certs', 'reading', 'notes', 'posts'])),
      str('updatedLabel', '"Updated"'), str('targetLabel', '"Target"'), str('nowLinkLabel', 'Now-page link text'), str('emptyState', 'Empty state'),
    ], { group: 'now' }),
    obj('uses', 'Uses', [
      header,
      defineField({ name: 'sections', title: 'Sections', type: 'array', of: [{ type: 'usesSection' }] }),
      str('emptyState', 'Empty state'),
    ], { group: 'uses' }),
    obj('photography', 'Photography', [
      obj('index', 'Photography index', [header, ...strs(['countLine', 'albumsCta', 'bookCta', 'recentHeading', 'recentWithCategory', 'browseAllLabel', 'filterAllLabel'])]),
      obj('albums', 'Albums page', [str('title'), str('subtitle'), text('metaDescription', 'SEO description'), str('framesLabel', 'Photos count ({n})'), str('uncategorized', 'Label when no category')]),
      obj('gallery', 'Album page', [str('backLabel', 'Back link'), obj('readoutLabels', 'Readout labels', strs(['location', 'frames', 'camera', 'lens', 'iso'])), str('framesLabel', 'Photos count ({n})'), str('notesLabel', 'Notes label')]),
      obj('loader', 'Loading overlay', [str('label'), str('skipLabel')]),
    ], { group: 'photography' }),
  ],
  preview: { prepare: () => ({ title: 'Pages' }) },
})
