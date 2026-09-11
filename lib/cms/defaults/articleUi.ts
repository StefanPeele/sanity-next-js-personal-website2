// lib/cms/defaults/articleUi.ts — every label on an article page.
import type { VocabEntry } from './taxonomy'

export const DEFAULT_ARTICLE_UI = {
  header: {
    backLabel: 'Blog',
    readTimeLabel: '{n} min read',
    sourcesLabel: '{n} sources',
    // 3.7 + 3B. Shown only when the post was materially revised -- never on every Studio
    // save, see revisionState() in lib/status.ts. THREE verbs, because journalism separates
    // updating for errors from updating for events and "Updated" hides which one happened.
    revisedLabels: {
      corrected: 'Corrected {date}',
      clarified: 'Clarified {date}',
      updated: 'Updated {date}',
    },
    cardsLabel: '{n} key terms',
    reviewBadges: { seekingReview: 'Seeking review', peerReviewed: 'Peer reviewed' },
  },
  toc: { title: 'Contents', mobileTitle: 'In this article', minutesSuffix: 'min' },
  readerMenu: {
    buttonLabel: 'Reading options',
    closeLabel: 'Close',
    groupLabels: { theme: 'Theme', textSize: 'Text size', width: 'Width', accessibility: 'Accessibility', share: 'Share and export', listen: 'Read aloud', position: 'Your place', toolbar: 'This toolbar' },
    toolbarLabels: { hide: 'Hide the toolbar', hideHint: 'It stays hidden until you bring it back from the footer.', restore: 'Reading controls' },
    themeLabels: { archive: 'Dark', slate: 'Dim', paper: 'Light', terminal: 'Green' },
    widthLabels: { narrow: 'Narrow', standard: 'Standard', wide: 'Wide' },
    a11yLabels: { dyslexia: 'Dyslexia-friendly font', highContrast: 'High contrast', reducedMotion: 'Reduce motion', ruler: 'Reading ruler', reset: 'Reset' },
    shareLabels: { copyLink: 'Copy link', copyMarkdown: 'Copy as Markdown', print: 'Print', studyDeck: 'Download study deck', share: 'Share', copied: 'Copied' },
    listenLabels: { play: 'Play', pause: 'Pause', resume: 'Resume', stop: 'Stop', unsupported: 'Read-aloud is not available in this browser.' },
    bookmarkLabels: { save: 'Save my place', saved: 'Place saved', resume: 'Go to saved place', clear: 'Clear' },
  },
  blocks: {
    tldrHeading: 'TL;DR',
    tldrSub: 'If you read nothing else',
    prerequisitesHeading: 'Before you start',
    objectivesHeading: 'After this post you will be able to',
    checkpointHeading: 'Check what you already know',
    conceptCardsHeading: 'Key terms',
    sourcesHeading: 'Sources',
    correctionsHeading: 'Corrections',
    credibilityHeading: 'How this was checked',
    backlinksHeading: 'Referenced by',
    askHeading: 'Ask this article',
    askPlaceholder: 'Ask a question about this post',
    askButton: 'Ask',
    noContent: 'No content yet.',
  },
  credibility: {
    maturity: [
      { key: 'fresh', label: 'Fresh' },
      { key: 'tested', label: 'Lab tested' },
      { key: 'production-proven', label: 'Production proven' },
    ] as VocabEntry[],
    load: [
      { key: 'light', label: 'Light read' },
      { key: 'technical', label: 'Technical' },
      { key: 'dense', label: 'Dense' },
      { key: 'reference', label: 'Reference' },
    ] as VocabEntry[],
    reviewersHeading: 'Reviewed by',
    reviewedByLabel: 'Peer reviewed by',
    responsesHeading: 'Responses from the field',
    changelogHeading: 'Revision history',
    correctionsLabel: 'Found an error? Suggest a correction',
    correctionsUrl: 'mailto:swp9@njit.edu?subject=Correction%20request',
  },
  seriesBanner: { partLabel: 'Part {n} of {m}', allPartsLabel: 'All parts', prevLabel: 'Previous', nextLabel: 'Next' },
}

export type ArticleUiCopy = typeof DEFAULT_ARTICLE_UI
