import {defineQuery} from 'next-sanity'

export const homePageQuery = defineQuery(`
  *[_type == "home"][0]{
    _id,
    _type,
    title,
    profileImage {
      ...,
      "url": asset->url,
      "alt": asset->altText,
      "metadata": asset->metadata
    },
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
        coverImage {
          ...,
          "url": asset->url,
          "alt": asset->altText
        },
        overview,
        "slug": slug.current,
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
    coverImage {
      ...,
      "url": asset->url,
      "alt": asset->altText
    },
    description,
    duration,
    overview,
    site,
    "slug": slug.current,
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
    footerHeadline,
    menuItems[]{
      _key,
      ...@->{
        _type,
        "slug": slug.current,
        title
      }
    },
    ogImage {
      ...,
      "url": asset->url
    },
  }
`)

export const slugsByTypeQuery = defineQuery(`
  *[_type == $type && defined(slug.current)]{"slug": slug.current}
`)

// --- NEW QUERY: Fetches all projects for your new Projects Index Page ---
export const projectsQuery = defineQuery(`
  *[_type == "project"] | order(duration.end desc) {
    _id,
    title,
    "slug": slug.current,
    coverImage {
      ...,
      "url": asset->url,
      "alt": asset->altText
    },
    overview,
    tags,
    techStack,
    duration
  }
`)
// ... existing queries ...

export const galleriesQuery = defineQuery(`
  *[_type == "gallery"] | order(_createdAt desc) {
    _id,
    title,
    "slug": slug.current,
    mainImage { ..., "metadata": asset->metadata },
    category->{ title, "slug": slug.current, themeColor }
  }
`)

export const galleryBySlugQuery = defineQuery(`
  *[_type == "gallery" && slug.current == $slug][0] {
    _id,
    title,
    "slug": slug.current,
    mainImage { ..., "metadata": asset->metadata },
    images[] { 
      ..., 
      "metadata": asset->metadata 
    },
    overview,
    category->{ title, "slug": slug.current, themeColor },
    system,
    lens,
    iso,
    location,
    notes
  }
`)