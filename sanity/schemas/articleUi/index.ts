import type { DocumentDefinition, SchemaTypeDefinition } from 'sanity'
// sanity/schemas/articleUi/index.ts — barrel owned by the article engineer.
// Add `articleUi` and blog/knowledge page singletons here.

export const articleUiSingletons: DocumentDefinition[] = []
export const articleUiTypes: SchemaTypeDefinition[] = [...articleUiSingletons]
