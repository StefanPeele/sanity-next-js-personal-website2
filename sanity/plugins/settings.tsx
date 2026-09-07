/**
 * Singleton handling + Studio desk structure.
 */

import {definePlugin, type DocumentDefinition} from 'sanity'
import {type StructureResolver} from 'sanity/structure'

export const singletonPlugin = definePlugin<string[]>((types) => ({
  name: 'singletonPlugin',
  document: {
    // Hide singletons (such as Home) from the global "new document" menu
    newDocumentOptions: (prev, {creationContext}) => {
      if (creationContext.type === 'global') {
        return prev.filter((templateItem) => !types.includes(templateItem.templateId))
      }
      return prev
    },
    // Remove the "duplicate" action on singletons
    actions: (prev, {schemaType}) => {
      if (types.includes(schemaType)) {
        return prev.filter(({action}) => action !== 'duplicate')
      }
      return prev
    },
  },
}))

// Desk structure. Singletons are grouped under "Site"; documents by area.
const SITE_ORDER = [
  'settings', 'navigation', 'home',
  'blogPage', 'knowledgePages', 'personalPages', 'servicesPage',
  'articleUi', 'taxonomy', 'errorPages',
]
const SITE_TITLES: Record<string, string> = {
  settings: 'Identity & SEO', navigation: 'Navigation', home: 'Home',
  blogPage: 'Writing index', knowledgePages: 'Knowledge pages', personalPages: 'Pages', servicesPage: 'Services page',
  articleUi: 'Article UI', taxonomy: 'Taxonomy', errorPages: 'Error pages',
}

export const pageStructure = (singletons: DocumentDefinition[]): StructureResolver => {
  return (S) => {
    const byName = new Map(singletons.map((s) => [s.name, s]))
    const ordered = [
      ...SITE_ORDER.filter((n) => byName.has(n)).map((n) => byName.get(n)!),
      ...singletons.filter((s) => !SITE_ORDER.includes(s.name)),
    ]
    const singletonItems = ordered.map((typeDef) =>
      S.listItem()
        .title(SITE_TITLES[typeDef.name] ?? typeDef.title ?? typeDef.name)
        .icon(typeDef.icon)
        .child(S.editor().id(typeDef.name).schemaType(typeDef.name).documentId(typeDef.name)),
    )

    const group = (title: string, types: string[], icon?: DocumentDefinition['icon']) =>
      S.listItem()
        .title(title)
        .icon(icon)
        .child(S.list().title(title).items(types.map((t) => S.documentTypeListItem(t))))

    const groups: [string, string[]][] = [
      ['Writing', ['post', 'series', 'glossaryTerm']],
      ['Knowledge', ['note', 'tag', 'mediaItem']],
      ['Work', ['project', 'experience', 'skill', 'certification', 'education', 'page']],
      ['Photography', ['gallery', 'category', 'testimonial']],
      ['Services', ['servicePackage', 'serviceAddOn']],
      ['Audience', ['subscriber']],
    ]
    const registered = new Set(S.documentTypeListItems().map((i) => i.getId()))
    const known = new Set([...singletons.map((s) => s.name), ...groups.flatMap(([, t]) => t)])
    const rest = S.documentTypeListItems().filter((item) => !known.has(item.getId() ?? ''))

    return S.list()
      .title('Content')
      .items([
        S.listItem().title('Site').child(S.list().title('Site').items(singletonItems)),
        S.divider(),
        ...groups
          .map(([title, types]) => [title, types.filter((t) => registered.has(t))] as [string, string[]])
          .filter(([, types]) => types.length > 0)
          .map(([title, types]) => group(title, types)),
        ...(rest.length ? [S.divider(), ...rest] : []),
      ])
  }
}
