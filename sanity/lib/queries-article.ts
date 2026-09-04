import { defineQuery } from 'next-sanity'
// sanity/lib/queries-article.ts
// Article-only queries that don't belong in the shared file.

/** Minimal projection for the "Ask this article" server action. */
export const articleTextQuery = defineQuery(`
  *[_type == "post" && slug.current == $slug][0] {
    title, body, tldr, excerpt
  }
`)

/** Branded OG image data. */
export const articleOgQuery = defineQuery(`
  *[_type == "post" && slug.current == $slug][0] {
    title, excerpt, articleType, publishedAt,
    "categories": categories[]->title,
    "mainImageUrl": mainImage.asset->url,
    "wordCount": length(pt::text(body)),
    "series": series->{ title },
    seriesOrder
  }
`)
