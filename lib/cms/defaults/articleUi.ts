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
  // 7.5 moved the reading time here and 7.6 makes it live. Three phrasings of one fact:
  // the whole length before the reader starts, then what is left and how far in they are.
  // {n} is substituted; leave it in place or the number disappears.
  toc: {
    title: 'Contents', mobileTitle: 'In this article', minutesSuffix: 'min',
    minutesLeftLabel: '{n} min left', progressLabel: '{n}% read',
  },
  readerMenu: {
    buttonLabel: 'Reading options',
    closeLabel: 'Close',
    groupLabels: { theme: 'Theme', textSize: 'Text size', width: 'Width', accessibility: 'Accessibility', spacing: 'Spacing', density: 'Density', share: 'Share and export', listen: 'Read aloud', position: 'Your place', toolbar: 'This toolbar' },
    toolbarLabels: { hide: 'Hide the toolbar', hideHint: 'It stays hidden until you bring it back from the footer.', restore: 'Reading controls' },
    themeLabels: { archive: 'Dark', slate: 'Dim', paper: 'Light', terminal: 'Green' },
    widthLabels: { narrow: 'Narrow', standard: 'Standard', wide: 'Wide' },
    a11yLabels: { dyslexia: 'Dyslexia-friendly font', highContrast: 'High contrast', reducedMotion: 'Reduce motion', ruler: 'Reading ruler', reset: 'Reset', linkUnderline: 'Always underline links', bigFocus: 'Larger focus ring', muteColour: 'Reduce colour' },
    // 5.2's four spacing scales. Three steps each; the middle column is the site default for
    // line height and the left column is the default for the other three.
    spacingLabels: { lineHeight: 'Line height', letterSpacing: 'Letter spacing', wordSpacing: 'Word spacing', paraSpacing: 'Paragraph spacing' },
    scaleSteps: { less: 'Tighter', normal: 'Default', more: 'Looser' },
    densityLabels: { comfortable: 'Comfortable', compact: 'Compact' },
    shareLabels: { copyLink: 'Copy link', copyMarkdown: 'Copy as Markdown', print: 'Print', studyDeck: 'Download study deck', share: 'Share', copied: 'Copied' },
    listenLabels: { play: 'Play', pause: 'Pause', resume: 'Resume', stop: 'Stop', unsupported: 'Read-aloud is not available in this browser.', voice: 'Voice', speed: 'Speed', systemVoice: 'System default' },
    bookmarkLabels: {
      save: 'Save my place', saved: 'Place saved', resume: 'Go to saved place', clear: 'Clear',
      // 7.6. The bar is chrome a reader can refuse; resuming is help a reader has to ask for.
      progressBar: 'Show the progress bar', resumeScroll: 'Reopen where I stopped',
    },
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
  // Phase 8. Every string a reader sees around the conversation, including the one that
  // matters most: what the email is for. An open comment box that asks for an address and
  // does not say why is asking for a reason not to comment.
  comments: {
    heading: 'Responses',
    lede: 'Corrections and disagreement are the most useful things you can leave here.',
    countLabel: '{n} responses',
    empty: 'No responses yet. If something here is wrong, incomplete, or unclear, say so.',
    formHeading: 'Leave a response',
    labelPrompt: 'What kind of response is this?',
    namePlaceholder: 'Your name',
    anonymousLabel: 'Post without my name',
    emailPlaceholder: 'Email',
    emailHint: 'Never shown, never shared. Used once to confirm it is really you.',
    bodyPlaceholder: 'What would you like to say?',
    submitLabel: 'Post response',
    submittingLabel: 'Posting…',
    replyLabel: 'Reply',
    cancelLabel: 'Cancel',
    allLabel: 'All',
    moreLabel: 'Show older responses',
    anonymousName: 'Anonymous',
    pendingNote: 'Check your inbox — one click and it is posted. This is the only time you will be asked.',
    onSidenoteLabel: 'On a margin note',
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
