import { defineQuery } from 'next-sanity'
// sanity/lib/queries.ts
// Every GROQ query the site uses. Wrapped in defineQuery so `sanity typegen`
// produces result types and every page can use sanityFetch (live preview + tags).

// ── Shared fragments ────────────────────────────────────────────────
const imageFields = `
  ...,
  "url": asset->url,
  "alt": coalesce(alt, asset->altText, "Image"),
  "metadata": asset->metadata { lqip, dimensions }
`

// The ONE reading-time input. Every surface that shows "N min read" — card, hero,
// article, series total — reads this field; nothing recomputes it locally.
//
// It mirrors lib/reading.ts exactly, and must keep doing so: per block, concatenate
// the children's text and split on spaces. Verified equal to
// countWords(portableTextToPlain(body)) for every post in both perspectives
// (765 / 3908 / 414). tests/smoke.spec.ts asserts card and article agree.
//
// Do NOT "simplify" this to length(string::split(pt::text(body), " ")). That was the
// previous spelling and it undercounts, because pt::text() joins blocks with "\n\n"
// and string::split only splits on the literal space -- so every block boundary is
// missed. It read 3840 where the article read 3908, which is 17 min against 18 on
// the same post. A newline-aware variant overshoots for the mirror-image reason.
const wordCountField = `
  "wordCount": coalesce(math::sum(body[_type == "block" && defined(children)]{
    "w": length(string::split(array::join(children[].text, ""), " "))
  }.w), 0)`

const postCardFields = `
  _id,
  title,
  "slug": slug.current,
  publishedAt,
  excerpt,
  "imageUrl": mainImage.asset->url,
  "lqip": mainImage.asset->metadata.lqip,
  "categories": categories[]->title,
  "tags": tags[]->{ _id, title, "slug": slug.current },
  articleType,
  ${wordCountField},
  "series": series->{ title, "slug": slug.current }
`

// ── Site ─────────────────────────────────────────────────────────────

export const settingsQuery = defineQuery(`
  *[_type == "settings"][0]{
    _id,
    _type,
    footer,
    email,
    github,
    linkedin,
    trello,
    instagram,
    bluesky,
    gitbook,
    calendlyUrl,
    openTo,
    footerHeadlinePrefix,
    footerHeadlineHighlight,
    footerHeadlineSuffix,
    archiveTitle,
    archiveSubtitle,
    menuItems[]{
      _key,
      ...@->{
        _type,
        "slug": coalesce(slug.current, ""),
        title
      }
    },
    ogImage { ${imageFields} },
  }
`)

export const homePageQuery = defineQuery(`
  *[_type == "home"][0]{
    _id,
    _type,
    title,
    profileImage { ${imageFields} },
    overview,
    currently,
    location,
    manifesto,
    aspirations,
    expertisePillars[]{
      title,
      description
    },
    showcaseProjects[]{
      _key,
      ...@->{
        _id,
        _type,
        coverImage { ${imageFields} },
        overview,
        "slug": coalesce(slug.current, ""),
        tags,
        title,
        techStack,
        githubUrl,
        liveUrl,
        outcome,
        role
      }
    },
    "sections": sections[]{
      _key, _type, enabled, showNav, currentlyLabel, locationLabel, footnote, ctaLabel, heading,
      fallbackManifesto, fallbackBio, imagePlaceholder, limit, featuredBadge, recentHeading, readLabel
    }
  }
`)

export const homeIntelQuery = defineQuery(`{
  "featuredPost": *[_type == "post" && isFeatured == true] | order(publishedAt desc)[0] { ${postCardFields} },
  // Same fix as blogIndexQuery: fetch one extra and drop the featured one in the component.
  "recentPosts": *[_type == "post"] | order(publishedAt desc)[0...4] { ${postCardFields} },
  "currentlyReading": *[_type == "mediaItem" && status == "current"] | order(startedAt desc)[0...3] {
    _id, title, author, mediaType, progressPercent, "coverUrl": coverImage.asset->url
  },
  "recentNotes": *[_type == "note"] | order(coalesce(lastTended, _updatedAt) desc)[0...3] {
    _id, title, "slug": slug.current, status, "lastTended": coalesce(lastTended, _updatedAt)
  }
}`)

export const slugsByTypeQuery = defineQuery(`
  *[_type == $type && defined(slug.current)]{"slug": slug.current}
`)

export const sitemapQuery = defineQuery(`{
  "posts": *[_type == "post" && defined(slug.current)]{ "slug": slug.current, "updated": coalesce(_updatedAt, publishedAt) },
  "projects": *[_type == "project" && defined(slug.current)]{ "slug": slug.current, "updated": _updatedAt },
  "galleries": *[_type == "gallery" && defined(slug.current)]{ "slug": slug.current, "updated": _updatedAt },
  "pages": *[_type == "page" && defined(slug.current)]{ "slug": slug.current, "updated": _updatedAt },
  "notes": *[_type == "note" && defined(slug.current)]{ "slug": slug.current, "updated": coalesce(lastTended, _updatedAt) },
  "series": *[_type == "series" && defined(slug.current)]{ "slug": slug.current, "updated": _updatedAt },
  "glossary": *[_type == "glossaryTerm" && defined(slug.current)]{ "slug": slug.current, "updated": _updatedAt }
}`)

// ── Pages ────────────────────────────────────────────────────────────

export const pagesBySlugQuery = defineQuery(`
  *[_type == "page" && slug.current == $slug][0] {
    _id,
    _type,
    title,
    "slug": slug.current,
    overview,
    body[]{
      ...,
      _type == "skillReference" => {
        "skill": @->{
          title,
          category,
          description
        }
      }
    },
    "resumeUrl": resumeFile.asset->url
  }
`)

// ── Projects ─────────────────────────────────────────────────────────

export const projectsQuery = defineQuery(`
  *[_type == "project"] | order(coalesce(duration.end, duration.start, _createdAt) desc) {
    _id,
    title,
    "slug": coalesce(slug.current, ""),
    coverImage { ${imageFields} },
    overview,
    tags,
    techStack,
    duration,
    githubUrl,
    liveUrl,
    role,
    outcome,
    featured
  }
`)

export const projectBySlugQuery = defineQuery(`
  *[_type == "project" && slug.current == $slug][0] {
    _id,
    _type,
    _updatedAt,
    client,
    coverImage { ${imageFields} },
    description,
    duration,
    overview,
    "slug": coalesce(slug.current, ""),
    tags,
    title,
    techStack,
    githubUrl,
    liveUrl,
    boardUrl,
    docsUrl,
    architecture[]{ ${imageFields}, caption },
    role,
    problem,
    constraints,
    approach,
    outcome,
    metrics[]{ _key, label, value, note },
    retrospective,
    "relatedPosts": relatedPosts[]->{ title, "slug": slug.current, articleType }[defined(slug)],
    "relatedNotes": relatedNotes[]->{ title, "slug": slug.current, status }[defined(slug)]
  }
`)

// ── Resume ───────────────────────────────────────────────────────────

export const resumeQuery = defineQuery(`{
  "experiences": *[_type == "experience"] | order(coalesce(startDate, _createdAt) desc) {
    _id, role, company, duration, startDate, endDate, current, location, description, highlights, techStack
  },
  "skills": *[_type == "skill"] | order(category asc, title asc) { _id, title, category, description, level },
  "certifications": *[_type == "certification"] | order(status asc, coalesce(earnedAt, targetDate) desc) {
    _id, title, issuer, status, earnedAt, targetDate, credentialUrl, progressPercent
  },
  "education": *[_type == "education"] | order(coalesce(endDate, startDate) desc) {
    _id, school, degree, field, startDate, endDate, expected, details
  },
  "page": *[_type == "page" && slug.current == "resume"][0] {
    _updatedAt,
    activeDirective,
    "resumeUrl": resumeFile.asset->url
  },
  "home": *[_type == "home"][0]{ title, currently, location }
}`)

// ── Photography ──────────────────────────────────────────────────────

export const galleriesQuery = defineQuery(`
  *[_type == "gallery"] | order(_createdAt desc) {
    _id,
    "title": coalesce(title, "Untitled Volume"),
    "slug": coalesce(slug.current, ""),
    mainImage {
      ...,
      asset->{ url, metadata { lqip } }
    },
    category->{
      "title": coalesce(title, "Uncategorized"),
      "slug": coalesce(slug.current, ""),
      themeColor
    },
    system,
    lens,
    location,
    "images": coalesce(images[] {
      ...,
      "imageUrl": asset->url,
      "lqip": asset->metadata.lqip,
      "exif": asset->metadata.exif,
      title,
      alt,
      caption,
      aperture,
      shutter,
      iso,
      lensOverride,
      systemOverride
    }, [])
  }
`)

export const galleryBySlugQuery = defineQuery(`
  *[_type == "gallery" && slug.current == $slug][0] {
    _id,
    "title": coalesce(title, "Untitled Volume"),
    "slug": coalesce(slug.current, ""),
    mainImage {
      ...,
      asset->{ url, metadata { lqip } }
    },
    "images": coalesce(images[] {
      ...,
      "imageUrl": asset->url,
      "lqip": asset->metadata.lqip,
      "exif": asset->metadata.exif,
      title,
      alt,
      caption,
      aperture,
      shutter,
      iso,
      lensOverride,
      systemOverride
    }, []),
    overview,
    category->{
      "title": coalesce(title, "Uncategorized"),
      "slug": coalesce(slug.current, ""),
      themeColor
    },
    system,
    lens,
    iso,
    location,
    notes
  }
`)

export const categoriesQuery = defineQuery(`
  *[_type == "category" && count(*[_type == "gallery" && references(^._id)]) > 0] {
    _id,
    title,
    "slug": slug.current,
    themeColor
  }
`)

export const testimonialsQuery = defineQuery(`
  *[_type == "testimonial" && consent == true] | order(date desc) {
    _id, name, role, quote, date, service, "photoUrl": photo.asset->url
  }
`)

// ── Blog ─────────────────────────────────────────────────────────────

export const blogIndexQuery = defineQuery(`{
  "featuredPost": *[_type == "post" && isFeatured == true] | order(publishedAt desc)[0] { ${postCardFields} },
  // Every post, ordered. The page removes whichever one it actually featured. Filtering
  // isFeatured != true here hid any post flagged featured but not selected as THE featured one.
  "posts": *[_type == "post"] | order(publishedAt desc) { ${postCardFields} },
  "series": *[_type == "series"] | order(title asc) {
    _id, title, "slug": slug.current, description, "count": count(*[_type == "post" && references(^._id)])
  },
  "currentlyReading": *[_type == "mediaItem" && status == "current"] | order(startedAt desc)[0...3] {
    _id, title, author, mediaType, progressPercent, url
  },
  "recentNotes": *[_type == "note"] | order(coalesce(lastTended, _updatedAt) desc)[0...4] {
    _id, title, "slug": slug.current, status
  }
}`)

export const postSlugsQuery = defineQuery(`
  *[_type == "post" && defined(slug.current)]{ "slug": slug.current }
`)

export const postBySlugQuery = defineQuery(`
  *[_type == "post" && slug.current == $slug][0] {
    _id, _updatedAt, title, "slug": slug.current, publishedAt,
    "mainImageUrl": mainImage.asset->url,
    "mainImageAlt": coalesce(mainImage.alt, mainImage.asset->altText),
    "lqip": mainImage.asset->metadata.lqip,
    body, excerpt, tldr,
    ${wordCountField},
    "categories": categories[]->title,
    "tags": tags[]->{ _id, title, "slug": slug.current }[defined(_id)],
    articleType, confidenceLevel, maturityIndicator, cognitiveLoad, recommendedTheme,
    reviewStatus,
    learningObjectives,
    "prerequisites": prerequisites[] {
      _key, description,
      "post": post->{ title, "slug": slug.current }
    },
    "checkpoint": priorKnowledgeCheck,
    conceptCards[] { _key, front, back },
    "readNextGoDeeper":  readNextGoDeeper->{ title, "slug": slug.current, excerpt, articleType },
    "readNextGoBroader": readNextGoBroader->{ title, "slug": slug.current, excerpt, articleType },
    "readNextApplyThis": readNextApplyThis->{ title, "slug": slug.current, excerpt, articleType },
    "series": series->{
      _id, title, "slug": slug.current, description,
      "posts": *[_type == "post" && references(^._id) && defined(slug.current)] | order(seriesOrder asc, publishedAt asc) {
        _id, title, "slug": slug.current, seriesOrder
      }
    },
    seriesOrder,
    reviewers[] { _key, name, role, organization, quote, date, linkedIn },
    changelog[]  { _key, date, description },
    responsesFromField[] { _key, title, url, author, platform, summary, date },
    sources[] { _key, title, url, author, type, description },
    "glossary": *[_type == "glossaryTerm" && defined(slug.current)] { _id, term, "slug": slug.current, definition, aliases },
    "backlinks": {
      "notes": *[_type == "note" && references(^._id)] { _id, title, "slug": slug.current, status },
      "posts": *[_type == "post" && references(^._id) && _id != ^._id] { _id, title, "slug": slug.current, articleType },
      "library": *[_type == "mediaItem" && references(^._id)] { _id, title, mediaType, author },
      "projects": *[_type == "project" && references(^._id)] { _id, title, "slug": slug.current }
    }
  }
`)

export const searchIndexQuery = defineQuery(`{
  "posts": *[_type == "post" && defined(slug.current)] {
    _id, title, "slug": slug.current, excerpt, publishedAt, articleType,
    "categories": categories[]->title, "text": pt::text(body)
  },
  "notes": *[_type == "note" && defined(slug.current)] {
    _id, title, "slug": slug.current, status, "text": pt::text(body)
  },
  "projects": *[_type == "project" && defined(slug.current)] {
    _id, title, "slug": slug.current, "excerpt": pt::text(overview), techStack
  },
  "library": *[_type == "mediaItem"] { _id, title, author, mediaType, oneSentenceTake, url },
  "glossary": *[_type == "glossaryTerm" && defined(slug.current)] { _id, term, "slug": slug.current, definition }
}`)

export const feedQuery = defineQuery(`
  *[_type == "post" && defined(slug.current) && defined(publishedAt)] | order(publishedAt desc)[0...50] {
    _id, title, "slug": slug.current, publishedAt, _updatedAt, excerpt, body, articleType,
    "categories": categories[]->title,
    "imageUrl": mainImage.asset->url
  }
`)

// ── Series ───────────────────────────────────────────────────────────

export const seriesBySlugQuery = defineQuery(`
  *[_type == "series" && slug.current == $slug][0] {
    _id, title, "slug": slug.current, description, status,
    "posts": *[_type == "post" && references(^._id) && defined(slug.current)] | order(seriesOrder asc, publishedAt asc) { ${postCardFields}, seriesOrder }
  }
`)

export const allSeriesQuery = defineQuery(`
  *[_type == "series"] | order(title asc) {
    _id, title, "slug": slug.current, description, status,
    "posts": *[_type == "post" && references(^._id) && defined(slug.current)] | order(seriesOrder asc, publishedAt asc) { _id, title, "slug": slug.current, seriesOrder, publishedAt }
  }
`)

// ── Glossary ─────────────────────────────────────────────────────────

export const glossaryQuery = defineQuery(`
  *[_type == "glossaryTerm"] | order(term asc) {
    _id, term, "slug": slug.current, definition, longDefinition, aliases, category,
    "relatedPosts": relatedPosts[]->{ title, "slug": slug.current }[defined(slug)],
    "relatedNotes": relatedNotes[]->{ title, "slug": slug.current }[defined(slug)]
  }
`)

// ── Garden ───────────────────────────────────────────────────────────

const noteFields = `
  _id,
  _createdAt,
  title,
  "slug": slug.current,
  status,
  body,
  origin,
  "lastTended": coalesce(lastTended, _updatedAt),
  "tags": tags[]->{ _id, title, "slug": slug.current, category }[defined(_id)],
  "relatedNotes": relatedNotes[]->{ _id, title, "slug": slug.current, status }[defined(_id)],
  "relatedPosts": relatedPosts[]->{ _id, title, "slug": slug.current, articleType }[defined(_id)],
  "backlinks": *[_type == "note" && references(^._id) && _id != ^._id] { _id, title, "slug": slug.current, status },
  "citedBy": *[_type == "post" && references(^._id)] { _id, title, "slug": slug.current }
`

export const gardenQuery = defineQuery(`{
  "notes": *[_type == "note" && defined(slug.current)] | order(coalesce(lastTended, _updatedAt) desc) { ${noteFields} },
  "tags": *[_type == "tag"] | order(title asc) {
    _id, title, "slug": slug.current, category,
    "count": count(*[_type == "note" && references(^._id)])
  }
}`)

export const noteBySlugQuery = defineQuery(`
  *[_type == "note" && slug.current == $slug][0] { ${noteFields} }
`)

export const noteSlugsQuery = defineQuery(`
  *[_type == "note" && defined(slug.current)]{ "slug": slug.current }
`)

// ── Library ──────────────────────────────────────────────────────────

export const libraryQuery = defineQuery(`
  *[_type == "mediaItem"] | order(coalesce(finishedAt, startedAt, _createdAt) desc) {
    _id, title, author, mediaType, status, url,
    "coverUrl": coverImage.asset->url,
    startedAt, finishedAt, progressPercent, category,
    oneSentenceTake, rating, keyIdea, quote, abandonedReason,
    highlights,
    "influencedPosts": influencedPosts[]->{ title, "slug": slug.current }[defined(slug)],
    "influencedNotes": influencedNotes[]->{ title, "slug": slug.current }[defined(slug)]
  }
`)

// ── Graph ────────────────────────────────────────────────────────────

export const graphQuery = defineQuery(`{
  "posts": *[_type == "post" && defined(slug.current)] {
    _id, title, "slug": slug.current, articleType, excerpt,
    "prerequisiteIds": prerequisites[].post->_id,
    "readDeeperId":    readNextGoDeeper->_id,
    "readBroaderId":   readNextGoBroader->_id,
    "readApplyId":     readNextApplyThis->_id,
    "tagIds":          tags[]->_id,
    "seriesId":        series->_id
  },
  "notes": *[_type == "note" && defined(slug.current)] {
    _id, title, "slug": slug.current, status,
    "relatedNoteIds": relatedNotes[]->_id,
    "relatedPostIds": relatedPosts[]->_id,
    "tagIds":         tags[]->_id
  },
  "tags": *[_type == "tag"] {
    _id, title, "slug": slug.current, category
  },
  "library": *[_type == "mediaItem" && status in ["finished", "current", "reference"]] {
    _id, title, mediaType, status,
    "influencedPostIds": influencedPosts[]->_id,
    "influencedNoteIds": influencedNotes[]->_id
  },
  "projects": *[_type == "project" && defined(slug.current)] {
    _id, title, "slug": slug.current,
    "relatedPostIds": relatedPosts[]->_id,
    "relatedNoteIds": relatedNotes[]->_id
  },
  "series": *[_type == "series"] { _id, title, "slug": slug.current }
}`)

// ── Now page ─────────────────────────────────────────────────────────

export const nowQuery = defineQuery(`{
  "home": *[_type == "home"][0]{ currently, location, _updatedAt },
  "reading": *[_type == "mediaItem" && status == "current"] | order(startedAt desc) {
    _id, title, author, mediaType, progressPercent, url, "coverUrl": coverImage.asset->url
  },
  "recentNotes": *[_type == "note"] | order(coalesce(lastTended, _updatedAt) desc)[0...5] {
    _id, title, "slug": slug.current, status, "lastTended": coalesce(lastTended, _updatedAt)
  },
  "recentPosts": *[_type == "post" && defined(publishedAt)] | order(publishedAt desc)[0...3] { ${postCardFields} },
  "activeProjects": *[_type == "project" && !defined(duration.end)] | order(_updatedAt desc)[0...4] {
    _id, title, "slug": slug.current, overview
  },
  "certifications": *[_type == "certification" && status == "in-progress"] { _id, title, issuer, progressPercent, targetDate }
}`)
