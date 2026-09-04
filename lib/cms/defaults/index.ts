// lib/cms/defaults/index.ts
// Single source for every singleton's default copy. Schemas use these as initialValue;
// loaders use them as runtime fallback; the seed script publishes them.

export { DEFAULT_NAVIGATION, navHref, type NavLink, type NavigationData } from './navigation'
export { DEFAULT_TAXONOMY, TAXONOMY_KEYS, vocab, type VocabEntry, type TaxonomyData, type TaxonomyGroup } from './taxonomy'
export { DEFAULT_SETTINGS, type SettingsCopy } from './settings'
export { DEFAULT_ERROR_PAGES, type ErrorPagesCopy } from './errorPages'

import { DEFAULT_NAVIGATION } from './navigation'
import { DEFAULT_TAXONOMY } from './taxonomy'
import { DEFAULT_ERROR_PAGES } from './errorPages'

/**
 * Singletons the seed script creates verbatim (id === type).
 * Page singletons register themselves here as they are added (see registerDefault).
 */
export const SINGLETON_DEFAULTS: Record<string, Record<string, unknown>> = {
  navigation: DEFAULT_NAVIGATION,
  taxonomy: DEFAULT_TAXONOMY,
  errorPages: DEFAULT_ERROR_PAGES,
}

export function registerDefault(name: string, value: Record<string, unknown>) {
  SINGLETON_DEFAULTS[name] = value
}
