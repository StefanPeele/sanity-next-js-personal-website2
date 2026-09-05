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
