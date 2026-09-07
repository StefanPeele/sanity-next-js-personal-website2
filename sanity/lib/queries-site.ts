import { defineQuery } from 'next-sanity'
// sanity/lib/queries-site.ts — site chrome, navigation, taxonomy, error pages.

const navLinkFields = `
  _key, label, kind, url, description, icon, newTab,
  "path": select(
    kind == "reference" => select(
      reference->_type == "post" => "/blog/" + reference->slug.current,
      reference->_type == "project" => "/projects/" + reference->slug.current,
      reference->_type == "series" => "/blog/series/" + reference->slug.current,
      reference->_type == "gallery" => "/photography/" + reference->slug.current,
      "/" + reference->slug.current
    ),
    path
  )
`

export const navigationQuery = defineQuery(`
  *[_type == "navigation"][0]{
    logoText,
    drawerFooterLine,
    "primary": primary[]{ ${navLinkFields} },
    "secondary": secondary[]{ ${navLinkFields} },
    "searchQuickLinks": searchQuickLinks[]{ ${navLinkFields} }
  }
`)

export const siteSettingsCopyQuery = defineQuery(`
  *[_type == "settings"][0]{
    siteName, legalName, tagline, description, keywords, jobTitle, knowsAbout,
    location{ city, region }, school, bookingEmail, openTo,
    email, github, linkedin, trello, instagram, bluesky, gitbook, calendlyUrl,
    footer{ ctaLabel, directoryHeading, networkHeading, copyrightNote,
      networkLabels{ email, github, linkedin, gitbook, instagram, bluesky, trello, rss } },
    newsletter{ heading, blurb, placeholder, buttonLabel, successMessage, hint },
    footerHeadlinePrefix, footerHeadlineHighlight, footerHeadlineSuffix,
    ogImage{ ..., "url": asset->url }
  }
`)

const vocabFields = `_key, key, label, short, description, banner, color, dots`

export const taxonomyQuery = defineQuery(`
  *[_type == "taxonomy"][0]{
    "articleLanes": articleLanes[]{ ${vocabFields} },
    "noteStatuses": noteStatuses[]{ ${vocabFields} },
    "noteOrigins": noteOrigins[]{ ${vocabFields} },
    "mediaTypes": mediaTypes[]{ ${vocabFields} },
    "libraryStatuses": libraryStatuses[]{ ${vocabFields} },
    "skillLevels": skillLevels[]{ ${vocabFields} },
    "packageCategories": packageCategories[]{ ${vocabFields} }
  }
`)

export const errorPagesQuery = defineQuery(`
  *[_type == "errorPages"][0]{
    notFound{ title, body, hint, primaryCta{ ${navLinkFields} }, "links": links[]{ ${navLinkFields} } },
    error{ title, body, retryLabel, homeLabel, referenceLabel },
    offline{ title, body, ctaLabel, ctaHref }
  }
`)
