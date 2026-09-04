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

// Grouped desk structure so the Studio reads like the site: Site, Writing, Knowledge, Work, Photography.
export const pageStructure = (singletons: DocumentDefinition[]): StructureResolver => {
  return (S) => {
    const singletonItems = singletons.map((typeDef) =>
      S.listItem()
        .title(typeDef.title ?? typeDef.name)
        .icon(typeDef.icon)
        .child(S.editor().id(typeDef.name).schemaType(typeDef.name).documentId(typeDef.name)),
    )

    const group = (title: string, types: string[]) =>
      S.listItem()
        .title(title)
        .child(
          S.list()
            .title(title)
            .items(types.map((t) => S.documentTypeListItem(t))),
        )

    const known = new Set([
      ...singletons.map((s) => s.name),
      'post', 'series', 'glossaryTerm', 'category',
      'note', 'tag', 'mediaItem', 'learningPath',
      'project', 'experience', 'skill', 'certification', 'education', 'page',
      'gallery', 'testimonial',
    ])

    const rest = S.documentTypeListItems().filter((item) => !known.has(item.getId() ?? ''))

    return S.list()
      .title('Content')
      .items([
        ...singletonItems,
        S.divider(),
        group('Writing', ['post', 'series', 'glossaryTerm', 'category']),
        group('Knowledge', ['note', 'tag', 'mediaItem', 'learningPath']),
        group('Work', ['project', 'experience', 'skill', 'certification', 'education', 'page']),
        group('Photography', ['gallery', 'testimonial']),
        ...(rest.length ? [S.divider(), ...rest] : []),
      ])
  }
}
