import type { DocumentDefinition, SchemaTypeDefinition } from 'sanity'
import articleUi from '@/sanity/schemas/singletons/articleUi'
// sanity/schemas/articleUi/index.ts — article page + blog/knowledge page singletons.

export const articleUiSingletons: DocumentDefinition[] = [articleUi]
export const articleUiTypes: SchemaTypeDefinition[] = [...articleUiSingletons]
