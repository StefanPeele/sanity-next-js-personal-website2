// lib/cms/defaults/index.ts
// Single source for every singleton's default copy. Schemas use these as initialValue;
// loaders use them as runtime fallback; the seed script publishes them.

export { DEFAULT_NAVIGATION, navHref, type NavLink, type NavigationData } from './navigation'
export { DEFAULT_TAXONOMY, TAXONOMY_KEYS, vocab, type VocabEntry, type TaxonomyData, type TaxonomyGroup } from './taxonomy'
export { DEFAULT_SETTINGS, type SettingsCopy } from './settings'
export { DEFAULT_ERROR_PAGES, type ErrorPagesCopy } from './errorPages'
export { DEFAULT_HOME, DEFAULT_HOME_SECTIONS, type HomeSection, type HomeCopy } from './home'
export { DEFAULT_ARTICLE_UI, type ArticleUiCopy } from './articleUi'
export { DEFAULT_BLOG_PAGE, type BlogPageCopy } from './blogPage'
export { DEFAULT_KNOWLEDGE_PAGES, type KnowledgePagesCopy } from './knowledgePages'
export { DEFAULT_PERSONAL_PAGES, type PersonalPagesCopy } from './personalPages'
export { DEFAULT_SERVICES_PAGE, type ServicesPageCopy } from './servicesPage'

import { DEFAULT_NAVIGATION } from './navigation'
import { DEFAULT_SETTINGS } from './settings'
import { DEFAULT_TAXONOMY } from './taxonomy'
import { DEFAULT_ERROR_PAGES } from './errorPages'
import { DEFAULT_HOME } from './home'
import { DEFAULT_ARTICLE_UI } from './articleUi'
import { DEFAULT_BLOG_PAGE } from './blogPage'
import { DEFAULT_KNOWLEDGE_PAGES } from './knowledgePages'
import { DEFAULT_PERSONAL_PAGES } from './personalPages'
import { DEFAULT_SERVICES_PAGE } from './servicesPage'

/**
 * Singletons the seed script creates verbatim (id === type).
 * Page singletons register themselves here as they are added (see registerDefault).
 */
export const SINGLETON_DEFAULTS: Record<string, Record<string, unknown>> = {
  navigation: DEFAULT_NAVIGATION,
  taxonomy: DEFAULT_TAXONOMY,
  errorPages: DEFAULT_ERROR_PAGES,
  // `home` and `settings` already exist; the seed script patches these fields with setIfMissing.
  home: DEFAULT_HOME,
  settings: DEFAULT_SETTINGS,
  articleUi: DEFAULT_ARTICLE_UI,
  blogPage: DEFAULT_BLOG_PAGE,
  knowledgePages: DEFAULT_KNOWLEDGE_PAGES,
  personalPages: DEFAULT_PERSONAL_PAGES,
  servicesPage: DEFAULT_SERVICES_PAGE,
}

export function registerDefault(name: string, value: Record<string, unknown>) {
  SINGLETON_DEFAULTS[name] = value
}
