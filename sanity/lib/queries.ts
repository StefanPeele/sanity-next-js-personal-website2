import { defineQuery } from 'next-sanity'

// --- SHARED FRAGMENTS ---
const imageFields = `
  ...,
  "url": asset->url,
  "alt": coalesce(asset->altText, "Image"),
  "metadata": asset->metadata { lqip, dimensions }
`

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
        liveUrl
      }
    }
  }
`)

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

export const projectBySlugQuery = defineQuery(`
  *[_type == "project" && slug.current == $slug][0] {
    _id,
    _type,
    client,
    coverImage { ${imageFields} },
    description,
    duration,
    overview,
    site,
    "slug": coalesce(slug.current, ""),
    tags,
    title,
    techStack,
    githubUrl,
    liveUrl,
    boardUrl,
    architecture
  }
`)

export const settingsQuery = defineQuery(`
  *[_type == "settings"][0]{
    _id,
    _type,
    footer,
    email,
    github,
    linkedin,
    trello,
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

export const slugsByTypeQuery = defineQuery(`
  *[_type == $type && defined(slug.current)]{"slug": slug.current}
`)

export const projectsQuery = defineQuery(`
  *[_type == "project"] | order(duration.end desc) {
    _id,
    title,
    "slug": coalesce(slug.current, ""),
    coverImage { ${imageFields} },
    overview,
    tags,
    techStack,
    duration
  }
`)

// --- PHOTOGRAPHY QUERIES ---

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
      title,
      alt,
      caption,
      aperture,
      shutter,
      iso,
      lensOverride,
      systemOverride
    }, []),
    description,
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

// NEW: Used for the filter bar on the photography page
export const categoriesQuery = defineQuery(`
  *[_type == "category" && count(*[_type == "gallery" && references(^._id)]) > 0] {
    _id,
    title,
    "slug": slug.current,
    themeColor
  }
`)