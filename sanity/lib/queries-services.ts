import { defineQuery } from 'next-sanity'
// sanity/lib/queries-services.ts — services page + personal pages singletons.

const header = `title, lede, metaTitle, metaDescription`
const section = `enabled, heading, lede, ctaLabel, ctaHref, emptyState`

export const servicesPageQuery = defineQuery(`
  *[_type == "servicesPage"][0]{
    header{ ${header} },
    "stats": stats[]{ _key, label, value, valueSource },
    packages{ ${section} },
    tabLabels{ portrait, event, specialty },
    njitToggle{ label, offText, idNote, savingsCopy{ portrait, event, specialty } },
    standardDelivery{ heading, "items": items[]{ _key, title, description } },
    packageCard{ startingAt, njitRate, publicLabel, deliveryLabel, idealFor, includes, includesNote, expandingSoon, expandingSoonNote, recommended, available, wip, consultLabel, inquiryLabel, addOnsHeading, addOnsLede, inquiryHeading, inquiryLede, inquiryEyebrow },
    physicalProducts{ enabled, heading, lede, "tiers": tiers[]{ _key, tier, label, description }, includedLabel, note, noteSub, chooserLabels{ core, premium, final } },
    promise{ enabled, heading, "pillars": pillars[]{ _key, label, body }, guarantee{ label, headline, subline } },
    faq{ enabled, heading, "items": items[]{ _key, question, answer } },
    testimonials{ ${section} },
    booking{ heading, intro, successTitle, successBody, namePlaceholder, emailPlaceholder, phonePlaceholder, packagePlaceholder, notSureLabel, expandingSoonSuffix, expandingSoonNote, availabilityPlaceholder, njitCheckbox, njitNote, addOnsLabel, selectedLabel, messagePlaceholder, submitLabel, sendingLabel, closeLabel, triggerLabel, packageError, genericError }
  }
`)

export const personalPagesQuery = defineQuery(`
  *[_type == "personalPages"][0]{
    projects{ header{ ${header} }, emptyState,
      card{ featuredBadge, outcomeLabel, presentLabel, noCoverLabel, techLabel },
      detail{ eyebrow, metaLabels{ timeline, client, role, tags }, sectionLabels{ problem, constraints, approach, outcome, metrics, retrospective, stack, architecture, relatedWriting, relatedNotes }, linkLabels{ code, docs, board, live }, backLabel } },
    resume{ header{ ${header} }, fallbackTagline, lastUpdatedLabel,
      sectionLabels{ experience, skills, certifications, education, currently, hardCopy },
      emptyExperience, emptySkills, levelsLegend, certStatusLabels{ earned, inProgress, planned, target },
      presentLabel, expectedLabel, downloadLabel, draftHint, contactPrompt{ label, ctaLabel },
      skillCategoryOrder, fallbackEducation{ school, degree, field, endDate, expected }, showEmail, showGithub },
    contact{ header{ ${header} }, formHeading, channelsHeading, recruiterNote, photoCta{ ${section} }, basedInLine,
      channelLabels{ email, linkedin, github, instagram, bluesky }, instagramHandle },
    now{ header{ ${header} }, blockLabels{ projects, certs, reading, notes, posts }, updatedLabel, targetLabel, nowLinkLabel, emptyState },
    uses{ header{ ${header} }, "sections": sections[]{ _key, title, "items": items[]{ _key, name, note, url } }, emptyState },
    photography{
      index{ header{ ${header} }, countLine, albumsCta, bookCta, recentHeading, recentWithCategory, browseAllLabel, filterAllLabel },
      albums{ title, subtitle, metaDescription, framesLabel, uncategorized },
      gallery{ backLabel, readoutLabels{ location, frames, camera, lens, iso }, framesLabel, notesLabel },
      loader{ label, skipLabel }
    }
  }
`)
