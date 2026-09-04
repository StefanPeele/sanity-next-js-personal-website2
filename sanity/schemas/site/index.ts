import type { DocumentDefinition, SchemaTypeDefinition } from 'sanity'
import { siteObjects } from '@/sanity/schemas/objects/site'
import navigation from '@/sanity/schemas/singletons/navigation'
import taxonomy from '@/sanity/schemas/singletons/taxonomy'
import errorPages from '@/sanity/schemas/singletons/errorPages'
// sanity/schemas/site/index.ts
// Barrel for the "Site" group: shared objects + site-wide singletons.
// Page singletons (blogPage, gardenPage, …) are appended here by their owners.

export const siteSingletons: DocumentDefinition[] = [navigation, taxonomy, errorPages]

export const siteTypes: SchemaTypeDefinition[] = [...siteObjects, ...siteSingletons]
