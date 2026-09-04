import { defineQuery } from 'next-sanity'
// sanity/lib/queries-knowledge.ts
// Extra queries for the knowledge system (garden, review, studio garden tool).
// Everything else lives in sanity/lib/queries.ts.

/** Every note title + slug, newest-tended first — resolves [[wiki links]] and prev/next. */
export const noteTitlesQuery = defineQuery(`
  *[_type == "note" && defined(slug.current)] | order(coalesce(lastTended, _updatedAt) desc) {
    _id, title, "slug": slug.current, status, "lastTended": coalesce(lastTended, _updatedAt)
  }
`)

/** Concept cards and knowledge-check questions from every post, for /review. */
export const reviewQuery = defineQuery(`
  *[_type == "post" && defined(slug.current)] | order(publishedAt desc) {
    _id,
    title,
    "slug": slug.current,
    articleType,
    conceptCards[]{ _key, front, back },
    "quizzes": body[_type == "knowledgeQuiz"]{ _key, question, explanation, options[]{ _key, text, isCorrect } }
  }
`)

/** Garden health numbers for the Studio tool. */
export const gardenHealthQuery = defineQuery(`{
  "seedlings": count(*[_type == "note" && status == "seedling"]),
  "growing": count(*[_type == "note" && status == "growing"]),
  "evergreen": count(*[_type == "note" && status == "evergreen"]),
  "untended": *[_type == "note" && coalesce(lastTended, _updatedAt) < $cutoff] | order(coalesce(lastTended, _updatedAt) asc) {
    _id, title, status, "lastTended": coalesce(lastTended, _updatedAt)
  },
  "postsWithoutTags": *[_type == "post" && count(tags) == 0] | order(publishedAt desc) { _id, title },
  "orphanNotes": *[_type == "note" && count(relatedNotes) == 0 && count(relatedPosts) == 0 && count(*[_type in ["note","post"] && references(^._id)]) == 0] { _id, title, status },
  "unusedTags": *[_type == "tag" && count(*[_type in ["note","post"] && references(^._id)]) == 0] { _id, title }
}`)
