import {defineQuery} from 'next-sanity'

export const homePageQuery = defineQuery(`
  *[_type == "home"][0]{
    _id,
    _type,
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
        coverImage,
        overview,
        "slug": slug.current,
        tags,
        title,
        techStack,
        githubUrl,
        liveUrl
      }
    },
    title,
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
    coverImage,
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
    menuItems[]{
      _key,
      ...@->{
        _type,
        "slug": slug.current,
        title
      }
    },
    ogImage,
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
    coverImage,
    overview,
    tags,
    techStack,
    duration
  }
`)