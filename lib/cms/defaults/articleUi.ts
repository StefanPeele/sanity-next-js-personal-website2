// lib/cms/defaults/articleUi.ts — every label on an article page.
import type { VocabEntry } from './taxonomy'

export const DEFAULT_ARTICLE_UI = {
  header: {
    backLabel: 'Writing',
    readTimeLabel: '{n} min read',
    sourcesLabel: '{n} sources',
    cardsLabel: '{n} key terms',
    reviewBadges: { seekingReview: 'Seeking review', expertVerified: 'Expert verified' },
  },
  toc: { title: 'Contents', mobileTitle: 'In this article', minutesSuffix: 'min' },
  readerMenu: {
    buttonLabel: 'Reading options',
    closeLabel: 'Close',
    groupLabels: { theme: 'Theme', textSize: 'Text size', width: 'Width', accessibility: 'Accessibility', share: 'Share and export', listen: 'Read aloud', position: 'Your place' },
    themeLabels: { archive: 'Dark', terminal: 'Green' },
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
    credibilityHeading: 'How this was checked',
    backlinksHeading: 'Referenced by',
    citeHeading: 'Cite this post',
    citeTemplate: 'Peele, Stefan. "{title}." {site}, {date}. {url}',
    readNextHeading: 'Read next',
    readNextLabels: { deeper: 'Go deeper', broader: 'Go broader', apply: 'Apply this' },
    askHeading: 'Ask this article',
    askPlaceholder: 'Ask a question about this post',
    askButton: 'Ask',
    commentsHeading: 'Comments',
    noContent: 'No content yet.',
  },
  reactionsHeading: 'Was this useful?',
  reactions: [
    { key: 'helped', label: 'This helped me' },
    { key: 'clear', label: 'Clearly explained' },
    { key: 'more', label: 'Want more like this' },
  ] as VocabEntry[],
  credibility: {
    confidence: [
      { key: 'speculative', label: 'Speculative' },
      { key: 'working-theory', label: 'Working theory' },
      { key: 'confident', label: 'Confident' },
      { key: 'verified', label: 'Verified' },
      { key: 'peer-reviewed', label: 'Peer reviewed' },
    ] as VocabEntry[],
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
    reviewStatus: [
      { key: 'seeking-review', label: 'Seeking peer review' },
      { key: 'community-reviewed', label: 'Community reviewed' },
      { key: 'expert-verified', label: 'Expert verified' },
    ] as VocabEntry[],
    reviewersHeading: 'Reviewed by',
    responsesHeading: 'Responses from the field',
    changelogHeading: 'Revision history',
    correctionsLabel: 'Found an error? Suggest a correction',
    correctionsUrl: 'https://github.com/StefanPeele/sanity-next-js-personal-website2/issues/new?title=Correction+request&body=Post+URL%3A+%0A%0AError+found%3A+%0A%0ASuggested+correction%3A+',
  },
  seriesBanner: { partLabel: 'Part {n} of {m}', allPartsLabel: 'All parts', prevLabel: 'Previous', nextLabel: 'Next' },
}

export type ArticleUiCopy = typeof DEFAULT_ARTICLE_UI
