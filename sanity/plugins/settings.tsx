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
  blogPage: 'Blog index', knowledgePages: 'Knowledge pages', personalPages: 'Pages', servicesPage: 'Services page',
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
      ['Blog', ['post', 'series', 'glossaryTerm']],
      ['Knowledge', ['note', 'tag', 'mediaItem']],
      ['Work', ['project', 'experience', 'skill', 'certification', 'education', 'page']],
      ['Photography', ['gallery', 'category', 'testimonial']],
      ['Services', ['servicePackage', 'serviceAddOn']],
      ['Audience', ['subscriber']],
    ]
    /* ── Phase 8.7. Moderation is a different job from writing ──────────────────
       It happens at a different time, usually in a hurry, and the question is always the
       same one: is there anything I have to look at. So the list opens ON that question
       rather than on every comment ever written, and the three views below are ordered by
       how urgent they are rather than alphabetically.

       "Needs attention" is `pending` — everything a first-time address has written and not
       yet confirmed. Measured at 1,000 and 5,000 comments, an ordered slice like this is
       FLAT at ~170ms, so this stays fast however large the archive grows. (It is also
       usually empty: a confirmed address publishes immediately.) */
    const comments = S.listItem()
      .title('Comments')
      .icon(byName.get('comment')?.icon)
      .child(
        S.list()
          .title('Comments')
          .items([
            S.listItem()
              .title('Needs attention')
              .child(
                S.documentList()
                  .title('Awaiting confirmation')
                  .filter('_type == "comment" && status == "pending"')
                  .defaultOrdering([{ field: 'createdAt', direction: 'desc' }])
                  .apiVersion('2025-02-27'),
              ),
            S.listItem()
              .title('Published')
              .child(
                S.documentList()
                  .title('Published')
                  .filter('_type == "comment" && status == "published"')
                  .defaultOrdering([{ field: 'publishedAt', direction: 'desc' }])
                  .apiVersion('2025-02-27'),
              ),
            S.listItem()
              .title('Removed and withdrawn')
              .child(
                S.documentList()
                  .title('Removed and withdrawn')
                  // Both, together, because the useful question here is "what is not on the
                  // site and why", and the two answers to that are next to each other.
                  .filter('_type == "comment" && status in ["removed", "withdrawn", "spam"]')
                  .defaultOrdering([{ field: 'createdAt', direction: 'desc' }])
                  .apiVersion('2025-02-27'),
              ),
            S.divider(),
            S.documentTypeListItem('comment').title('Every comment'),
            S.documentTypeListItem('blocklist').title('Blocked commenters'),
            // Machine-written. It is here so a spam wave is VISIBLE rather than so it can be
            // curated; ordering by count puts whoever is hammering the form at the top.
            S.documentTypeListItem('rateBucket').title('Rate buckets'),
          ]),
      )

    const registered = new Set(S.documentTypeListItems().map((i) => i.getId()))
    const known = new Set([
      ...singletons.map((s) => s.name),
      ...groups.flatMap(([, t]) => t),
      'comment', 'blocklist', 'rateBucket',
    ])
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
        // Beside the other groups rather than under Blog: opening a post to find out whether
        // anything needs moderating is the wrong shape for a job done in a hurry.
        ...(registered.has('comment') ? [comments] : []),
        ...(rest.length ? [S.divider(), ...rest] : []),
      ])
  }
}
