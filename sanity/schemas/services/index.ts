import type { DocumentDefinition, SchemaTypeDefinition } from 'sanity'
import servicesPage from '@/sanity/schemas/singletons/servicesPage'
import personalPages from '@/sanity/schemas/singletons/personalPages'
// sanity/schemas/services/index.ts — services page + personal page singletons.

export const servicesSingletons: DocumentDefinition[] = [personalPages, servicesPage]
export const servicesDocuments: SchemaTypeDefinition[] = []
export const servicesTypes: SchemaTypeDefinition[] = [...servicesSingletons, ...servicesDocuments]
