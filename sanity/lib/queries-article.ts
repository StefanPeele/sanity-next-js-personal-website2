import { defineQuery } from 'next-sanity'
import { wordCountField } from '@/sanity/lib/queries'
// sanity/lib/queries-article.ts
// Article-only queries that don't belong in the shared file.

/** Minimal projection for the "Ask this article" server action. */
export const articleTextQuery = defineQuery(`
  *[_type == "post" && slug.current == $slug][0] {
    title, body, tldr, excerpt
  }
`)

/**
 * Branded OG image data.
 *
 * wordCount uses THE SHARED FRAGMENT, not a local spelling. This query used to carry
 * length(string::split(pt::text(body), " ")) -- the exact expression Phase 0.1 diagnosed as
 * wrong and replaced everywhere else. pt::text() joins blocks with a blank line and
 * string::split only splits on a literal space, so every block boundary is missed and the
 * count comes in low. The note on wordCountField in queries.ts predicts the symptom exactly:
 * "17 min against 18 on the same post."
 *
 * That is what the Open Graph card said. 0.1 reconciled the index card and the article and
 * stopped there, so the social card has been a third, disagreeing number ever since -- on
 * the one surface nobody sees while logged in. Measured 2026-09-12.
 *
 * This comment is OUT HERE and not inside the template literal on purpose: a backtick in a
 * GROQ comment ends the literal the query lives in, which once dropped 27 of 40 queries from
 * typegen in silence. Writing it inside is what broke this file a minute ago.
 */
export const articleOgQuery = defineQuery(`
  *[_type == "post" && slug.current == $slug][0] {
    title, excerpt, articleType, publishedAt,
    "categories": categories[]->title,
    "mainImageUrl": mainImage.asset->url,
    ${wordCountField},
    "series": series->{ title },
    seriesOrder
  }
`)
