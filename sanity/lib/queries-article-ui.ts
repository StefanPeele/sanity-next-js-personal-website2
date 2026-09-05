import { defineQuery } from 'next-sanity'
// sanity/lib/queries-article-ui.ts

const v = `_key, key, label, short, description, banner, color, dots`

export const articleUiQuery = defineQuery(`
  *[_type == "articleUi"][0]{
    header{ backLabel, readTimeLabel, sourcesLabel, cardsLabel, reviewBadges{ seekingReview, expertVerified } },
    toc{ title, mobileTitle, minutesSuffix },
    readerMenu{
      buttonLabel,
      groupLabels{ theme, textSize, width, accessibility, share, listen, position },
      themeLabels{ archive, terminal, paper, broadcast },
      widthLabels{ narrow, standard, wide },
      a11yLabels{ dyslexia, highContrast, reducedMotion, ruler, reset },
      shareLabels{ copyLink, copyMarkdown, print, studyDeck, share, copied },
      listenLabels{ play, pause, resume, stop, unsupported },
      bookmarkLabels{ save, saved, resume, clear }
    },
    blocks{
      tldrHeading, tldrSub, prerequisitesHeading, objectivesHeading, checkpointHeading, conceptCardsHeading,
      sourcesHeading, credibilityHeading, backlinksHeading, citeHeading, citeTemplate, readNextHeading,
      readNextLabels{ deeper, broader, apply }, askHeading, askPlaceholder, askButton, commentsHeading, noContent
    },
    reactionsHeading,
    "reactions": reactions[]{ ${v} },
    credibility{
      "confidence": confidence[]{ ${v} }, "maturity": maturity[]{ ${v} }, "load": load[]{ ${v} }, "reviewStatus": reviewStatus[]{ ${v} },
      reviewersHeading, responsesHeading, changelogHeading, correctionsLabel, correctionsUrl
    },
    seriesBanner{ partLabel, allPartsLabel, prevLabel, nextLabel }
  }
`)

const navLink = `_key, label, kind, url, description, icon, newTab, "path": select(kind == "reference" => "/" + reference->slug.current, path)`
const section = `enabled, heading, lede, ctaLabel, ctaHref, emptyState`
const header = `title, lede, metaTitle, metaDescription`

export const blogPageQuery = defineQuery(`
  *[_type == "blogPage"][0]{
    header{ ${header} },
    statsLabels{ posts, series, latest },
    featured{ heading, readLabel },
    directory{ enabled, topicsHeading, toolsHeading, statsHeading, totalLabel, latestLabel, seriesLabel, readLabel, noTopics },
    "referenceLinks": referenceLinks[]{ ${navLink} },
    seriesRail{ ${section} }, readingStrip{ ${section} }, notesStrip{ ${section} },
    list{ heading, filterLabels{ lane, category, tag, sort }, sortLabels{ newest, oldest, longest }, allLabel, readLabel, readAgainLabel, emptyState, clearLabel, postCount }
  }
`)

export const knowledgePagesQuery = defineQuery(`
  *[_type == "knowledgePages"][0]{
    garden{ header{ ${header} }, stats{ notes, evergreen, tags }, emptyState{ title, hint }, "relatedNav": relatedNav[]{ ${navLink} },
      note{ plantedLabel, tendedLabel, statusLabel, staleWarning, relatedNotes, relatedPosts, linksHere, citedBy, graphHeading, prevLabel, nextLabel, backLabel, openGraph } },
    library{ header{ ${header} }, stats{ total, finished, current, changedThinking, influenced }, emptyState{ title, hint }, "relatedNav": relatedNav[]{ ${navLink} }, filterLabels{ type, status, all, clear } },
    glossary{ header{ ${header} }, emptyState{ title, hint }, backLabel, termsCount },
    paths{ header{ ${header} }, emptyState{ title, hint }, hoursLabel, stepsLabel, startLabel, levelLabels{ foundations, intermediate, advanced }, "relatedNav": relatedNav[]{ ${navLink} } },
    review{ header{ ${header} }, countLine, emptyState{ title, hint }, "relatedNav": relatedNav[]{ ${navLink} } },
    series{ header{ ${header} }, emptyState{ title, hint }, backLabel, partsLabel, publishedLabel, updatedLabel, statusLabels{ inProgress, complete, paused } },
    graph{ header{ ${header} }, emptyState{ title, hint }, backLabel, legendHeading, visibleHeading, nodesLabel, edgesLabel, searchPlaceholder, helpLine, typeLabels{ post, note, tag, library, project, series },
      legendLabels{ evergreen, growing, seedling, tag, libraryCurrent, libraryFinished, libraryReference, project, series },
      linesNote, nodeListLabel, openHint, ariaSummary },
    osi{ header{ ${header} }, breadcrumbLabel, backLabel, packetJourney{ heading, lede, scenario }, quickReference{ heading, columns{ n, layer, pdu, addressing, protocols } } }
  }
`)
