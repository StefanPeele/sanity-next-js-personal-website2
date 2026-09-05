import type { DocumentDefinition, SchemaTypeDefinition } from 'sanity'
import articleUi from '@/sanity/schemas/singletons/articleUi'
import blogPage from '@/sanity/schemas/singletons/blogPage'
import knowledgePages from '@/sanity/schemas/singletons/knowledgePages'
// sanity/schemas/articleUi/index.ts — article page + blog/knowledge page singletons.

export const articleUiSingletons: DocumentDefinition[] = [articleUi, blogPage, knowledgePages]
export const articleUiTypes: SchemaTypeDefinition[] = [...articleUiSingletons]
