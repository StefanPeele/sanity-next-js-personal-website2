import type { DocumentDefinition, SchemaTypeDefinition } from 'sanity'
// sanity/schemas/services/index.ts — barrel owned by the portfolio/services engineer.
// Add `servicesPage`, `servicePackage`, `serviceAddOn`, and the personal page singletons here.

export const servicesSingletons: DocumentDefinition[] = []
export const servicesDocuments: SchemaTypeDefinition[] = []
export const servicesTypes: SchemaTypeDefinition[] = [...servicesSingletons, ...servicesDocuments]
