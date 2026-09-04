import { defineField, defineType } from 'sanity'
// sanity/schemas/documents/post.ts

export default defineType({
  name: 'post',
  title: 'Blog Post',
  type: 'document',

  // ── Studio tabs — keeps the writing interface clean ───────────
  groups: [
    { name: 'content',      title: '✍ Content',      default: true },
    { name: 'presentation', title: '🎨 Presentation' },
    { name: 'learning',     title: '🧠 Learning' },
    { name: 'credibility',  title: '✅ Credibility' },
    { name: 'community',    title: '💬 Community' },
  ],

  // New posts start with the archive defaults and an empty TL;DR so the writer
  // sees the summary block right away. Works with Studio initial value templates too.
  initialValue: {
    isFeatured: false,
    articleType: 'concept-deep-dive',
    recommendedTheme: 'archive',
    confidenceLevel: 'confident',
    maturityIndicator: 'fresh',
    cognitiveLoad: 'technical',
    reviewStatus: 'self-reviewed',
    tldr: [],
  },

  // Document-level checks: a concept deep dive without any self-assessment tooling is a warning.
  validation: (rule) =>
    rule.custom((doc) => {
      const d = doc as { articleType?: string; priorKnowledgeCheck?: { question?: string }; conceptCards?: unknown[] } | undefined
      if (d?.articleType === 'concept-deep-dive' && !d.priorKnowledgeCheck?.question && !(d.conceptCards?.length)) {
        return 'Concept Deep Dives work best with a prior-knowledge checkpoint or concept cards (Learning tab). Add at least one.'
      }
      return true
    }).warning(),

  fields: [

    // ══════════════════════════════════════════════════════════════
    // CONTENT TAB
    // ══════════════════════════════════════════════════════════════

    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'content',
      description: 'The headline. Make it specific and honest — "Why OSPF Replaced RIP" beats "Understanding Routing Protocols."',
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'slug',
      title: 'Slug URL',
      type: 'slug',
      group: 'content',
      description: 'The URL path. Click Generate, then check it reads cleanly.',
      options: { source: 'title', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'isFeatured',
      title: 'Feature this post?',
      type: 'boolean',
      group: 'content',
      description: 'Pin this as the hero article at the top of the blog index. Only one post should be featured at a time.',
      initialValue: false,
    }),

    defineField({
      name: 'categories',
      title: 'Categories',
      type: 'array',
      group: 'content',
      description: 'Assign to one primary category. Multiple categories are fine if genuinely applicable — do not keyword-stuff.',
      of: [{ type: 'reference', to: { type: 'category' } }],
    }),

    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      group: 'content',
      description: 'Shared tag library (same tags as garden notes). Tags connect posts and notes in the knowledge graph.',
      of: [{ type: 'reference', to: [{ type: 'tag' }] }],
      validation: (rule) => rule.max(8),
    }),

    defineField({
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
      group: 'content',
    }),

    defineField({
      name: 'mainImage',
      title: 'Cover Image',
      type: 'image',
      group: 'content',
      description: 'Used in the parallax hero header and OG cards. High-contrast images work best — dark environments, strong subject.',
      options: { hotspot: true },
    }),

    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      group: 'content',
      rows: 3,
      description: 'Two to three sentences. The hook. Appears on the blog index and in OG previews. Write it last.',
    }),

    defineField({
      name: 'tldr',
      title: 'TL;DR',
      type: 'array',
      group: 'content',
      description: 'Two to four bullets. What a busy engineer needs to know if they read nothing else. Rendered above the article body.',
      of: [{ type: 'string' }],
      validation: (rule) => rule.max(5),
    }),

    defineField({
      name: 'body',
      title: 'Article Content',
      type: 'array',
      group: 'content',
      description: 'The article body. Use Section Breaks to divide major acts. Use Sidenotes to annotate without interrupting. Use Failure Notes and What I Got Wrong blocks to be honest.',
      of: [
        {
          type: 'block',
          marks: {
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Link',
                fields: [
                  defineField({ name: 'href', type: 'url', title: 'URL' }),
                ],
              },
              {
                name: 'sidenote',
                type: 'object',
                title: '📎 Sidenote / Definition',
                icon: () => '📎',
                fields: [
                  defineField({
                    name: 'note',
                    type: 'text',
                    title: 'Note, definition, or fact',
                    rows: 3,
                    description: 'Appears in the margin on desktop, expands inline on mobile. Use for definitions, context, or facts that support but would interrupt the sentence.',
                    validation: (rule) => rule.required(),
                  }),
                ],
              },
            ],
          },
        },
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({ name: 'alt', type: 'string', title: 'Alt text', validation: (r) => r.required() }),
            defineField({ name: 'caption', type: 'string', title: 'Caption' }),
            defineField({ name: 'keepColor', type: 'boolean', title: 'Keep original colour (diagrams, screenshots)', initialValue: true }),
          ],
        },
        { type: 'code' },
        // Interactive components
        { type: 'knowledgeQuiz' },
        { type: 'layerExplorer' },
        { type: 'packetAnimator' },
        { type: 'wiresharkCallout' },
        // Editorial blocks
        { type: 'sectionBreak' },
        { type: 'failureNote' },
        // New learning blocks
        { type: 'whatIGotWrong' },
        { type: 'whatEngineersUse' },
        { type: 'theProblemSolved' },
        { type: 'conceptStressTest' },
      ],
    }),

    defineField({
      name: 'sources',
      title: 'Sources & References',
      type: 'array',
      group: 'content',
      description: 'Cite every factual claim. RFCs, research papers, documentation, and industry articles all count. Renders as a numbered footnote section at the bottom of the post.',
      of: [
        {
          type: 'object',
          name: 'source',
          fields: [
            defineField({ name: 'title', title: 'Title', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'url', title: 'URL', type: 'url' }),
            defineField({ name: 'author', title: 'Author / Organization', type: 'string' }),
            defineField({
              name: 'type',
              title: 'Source Type',
              type: 'string',
              options: {
                list: [
                  { title: 'Article', value: 'article' },
                  { title: 'RFC / Standard', value: 'rfc' },
                  { title: 'Research Paper', value: 'paper' },
                  { title: 'White Paper / Industry Paper', value: 'whitepaper' },
                  { title: 'Book', value: 'book' },
                  { title: 'Documentation', value: 'documentation' },
                  { title: 'Video', value: 'video' },
                  { title: 'Podcast', value: 'podcast' },
                  { title: 'Other', value: 'other' },
                ],
              },
              initialValue: 'article',
            }),
            defineField({ name: 'description', title: 'Brief Description (optional)', type: 'string', description: 'One line on why this source matters.' }),
          ],
          preview: {
            select: { title: 'title', author: 'author', type: 'type' },
            prepare({ title, author, type }) {
              const icons: Record<string, string> = { article: '📰', rfc: '📋', paper: '📄', whitepaper: '📑', book: '📚', documentation: '📖', video: '🎥', podcast: '🎙', other: '🔗' }
              return { title: `${icons[type] ?? '🔗'} ${title}`, subtitle: author ?? '' }
            },
          },
        },
      ],
    }),

    // ══════════════════════════════════════════════════════════════
    // PRESENTATION TAB
    // ══════════════════════════════════════════════════════════════

    defineField({
      name: 'articleType',
      title: 'Article Type',
      type: 'string',
      group: 'presentation',
      description: `
        PERSPECTIVE — Industry-level thinking. No lab screenshots. No configs. These posts establish who you are beyond the technical work. Rarest and highest-leverage.
        CONCEPT DEEP DIVE — Protocol and concept breakdowns with interactive components. Written for people who want to actually understand something, not just pass a test.
        FIELD NOTES — Hands-on lab documentation. Always cite what failed, not just what worked. That's what makes lab posts worth reading.
        TRANSMISSION — Guest perspectives, interviews, or content from industry professionals you've connected with.
      `,
      options: {
        list: [
          { title: '🔭 Perspective', value: 'perspective' },
          { title: '⚡ Concept Deep Dive', value: 'concept-deep-dive' },
          { title: '🔧 Field Notes', value: 'field-notes' },
          { title: '📡 Transmission', value: 'transmission' },
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required().error('Article type is required — it determines how the post is displayed and marketed.'),
    }),

    defineField({
      name: 'series',
      title: 'Part of a series',
      type: 'reference',
      group: 'presentation',
      to: [{ type: 'series' }],
      description: 'Optional. Shows a "Part N of M" banner with previous and next links.',
    }),
    defineField({
      name: 'seriesOrder',
      title: 'Position in series',
      type: 'number',
      group: 'presentation',
      description: '1 for the first part. Required when a series is set.',
      validation: (rule) => [
        rule.min(1).integer(),
        rule.custom((value, context) => {
          const doc = context.document as { series?: { _ref?: string } } | undefined
          if (doc?.series?._ref && (value === undefined || value === null)) {
            return 'Set the position in the series so the "Part N of M" banner and prev/next links are correct.'
          }
          return true
        }),
      ],
    }),

    defineField({
      name: 'recommendedTheme',
      title: 'Recommended Reading Theme',
      type: 'string',
      group: 'presentation',
      description: 'The theme this post was written and optimized for. Readers will see a prompt to switch. Archive = dark default. Terminal = phosphor green for lab content. Paper = warm cream for long reads. Broadcast = high contrast white for industry commentary.',
      options: {
        list: [
          { title: '🌑 Archive (default dark)', value: 'archive' },
          { title: '💚 Terminal (phosphor green)', value: 'terminal' },
          { title: '📄 Paper (warm cream)', value: 'paper' },
          { title: '📰 Broadcast (high contrast white)', value: 'broadcast' },
        ],
        layout: 'radio',
      },
      initialValue: 'archive',
    }),

    defineField({
      name: 'confidenceLevel',
      title: 'Confidence Level',
      type: 'string',
      group: 'presentation',
      description: `
        How certain are you in what you've written? This tells readers how much weight to give the content — and signals intellectual honesty.
        SPECULATIVE — thinking out loud, may be wrong, worth writing anyway.
        WORKING THEORY — has logic behind it, haven't fully tested it.
        CONFIDENT — you understand this well enough to teach it.
        VERIFIED — you've confirmed this in a lab or real environment.
        PEER REVIEWED — an industry professional has confirmed the accuracy.
      `,
      options: {
        list: [
          { title: '🌫 Speculative — thinking out loud', value: 'speculative' },
          { title: '🔄 Working Theory — not fully tested', value: 'working-theory' },
          { title: '✓ Confident — understand this well', value: 'confident' },
          { title: '🔬 Verified — confirmed in lab/production', value: 'verified' },
          { title: '⭐ Peer Reviewed — expert confirmed', value: 'peer-reviewed' },
        ],
        layout: 'radio',
      },
      initialValue: 'confident',
    }),

    defineField({
      name: 'maturityIndicator',
      title: 'Post Maturity',
      type: 'string',
      group: 'presentation',
      description: 'How long have you held this understanding? Fresh = just written. Tested = applied this in a lab since writing. Production-proven = used this in a real environment and it held up.',
      options: {
        list: [
          { title: '🌱 Fresh — ideas still settling', value: 'fresh' },
          { title: '🧪 Tested — applied in lab since writing', value: 'tested' },
          { title: '🏭 Production-proven — real environment confirmed', value: 'production-proven' },
        ],
        layout: 'radio',
      },
      initialValue: 'fresh',
    }),

    defineField({
      name: 'cognitiveLoad',
      title: 'Cognitive Load',
      type: 'string',
      group: 'presentation',
      description: 'What kind of attention does this post require? Helps readers decide when to read it — commute vs. terminal open at a desk.',
      options: {
        list: [
          { title: '☕ Light — readable anywhere', value: 'light' },
          { title: '🖥 Technical — benefits from a terminal nearby', value: 'technical' },
          { title: '🧠 Dense — requires full focus', value: 'dense' },
          { title: '📚 Reference — dip in and out', value: 'reference' },
        ],
        layout: 'radio',
      },
      initialValue: 'technical',
    }),

    // ══════════════════════════════════════════════════════════════
    // LEARNING TAB
    // ══════════════════════════════════════════════════════════════

    defineField({
      name: 'learningObjectives',
      title: 'Learning Objectives',
      type: 'array',
      group: 'learning',
      description: `Three to five bullets starting with action verbs. Example: "Configure OSPF on a Cisco router" or "Explain why BGP replaced EGP." Appears at the top of the article. Write these AFTER the article so they're accurate.`,
      of: [{ type: 'string' }],
    }),

    defineField({
      name: 'prerequisites',
      title: 'Prerequisites',
      type: 'array',
      group: 'learning',
      description: 'What should readers already understand before this post? Link to other posts or notes that cover each prerequisite. Appears before the article body with clickable links.',
      of: [
        {
          type: 'object',
          name: 'prerequisite',
          fields: [
            defineField({
              name: 'description',
              title: 'What they should know',
              type: 'string',
              description: 'e.g. "How IP addressing and subnetting works"',
              validation: (r) => r.required(),
            }),
            defineField({
              name: 'post',
              title: 'Link to post (optional)',
              type: 'reference',
              to: [{ type: 'post' }],
            }),
          ],
          preview: {
            select: { title: 'description' },
            prepare({ title }) { return { title: `→ ${title}` } },
          },
        },
      ],
    }),

    defineField({
      name: 'priorKnowledgeCheck',
      title: 'Prior knowledge checkpoint',
      type: 'knowledgeQuiz',
      group: 'learning',
      description: 'Optional short quiz shown collapsed at the top of Concept Deep Dives so readers can self-assess before reading.',
    }),

    defineField({
      name: 'conceptCards',
      title: 'Concept Cards',
      type: 'array',
      group: 'learning',
      description: 'Five to eight key terms from this post. Front = the term. Back = your explanation in plain language. These render as flippable cards at the end of the article — a summary and study aid.',
      of: [
        {
          type: 'object',
          name: 'conceptCard',
          fields: [
            defineField({ name: 'front', title: 'Term (front)', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'back', title: 'Explanation (back)', type: 'text', rows: 3, description: 'Plain language. One to three sentences. Write it so a smart person with no networking background could understand it.', validation: (r) => r.required() }),
          ],
          preview: {
            select: { title: 'front', subtitle: 'back' },
          },
        },
      ],
    }),

    defineField({
      name: 'readNextGoDeeper',
      title: 'Read Next — Go Deeper',
      type: 'reference',
      group: 'learning',
      to: [{ type: 'post' }],
      description: 'A more advanced post on the same concept. Link this when you have a follow-up that takes the idea further.',
    }),

    defineField({
      name: 'readNextGoBroader',
      title: 'Read Next — Go Broader',
      type: 'reference',
      group: 'learning',
      to: [{ type: 'post' }],
      description: 'A connected concept the reader should understand next. Cross-domain links are valuable here.',
    }),

    defineField({
      name: 'readNextApplyThis',
      title: 'Read Next — Apply This',
      type: 'reference',
      group: 'learning',
      to: [{ type: 'post' }],
      description: 'A lab post or Field Notes entry where you used this concept in practice. This is the bridge from understanding to doing.',
    }),

    // ══════════════════════════════════════════════════════════════
    // CREDIBILITY TAB
    // ══════════════════════════════════════════════════════════════

    defineField({
      name: 'reviewStatus',
      title: 'Review Status',
      type: 'string',
      group: 'credibility',
      description: `
        SELF REVIEWED — default. You wrote and edited it yourself.
        SEEKING REVIEW — published but want expert eyes. Shows an amber "Seeking peer review" tag — this is an invitation and signals intellectual honesty.
        COMMUNITY REVIEWED — one or more people have read and responded. Add their names in the Reviewers field below.
        EXPERT VERIFIED — an industry professional has confirmed the technical accuracy. This is the strongest signal. A working engineer vouching for your content matters to hiring managers more than any certification badge.
      `,
      options: {
        list: [
          { title: '✏️ Self-reviewed', value: 'self-reviewed' },
          { title: '🔍 Seeking peer review', value: 'seeking-review' },
          { title: '👥 Community reviewed', value: 'community-reviewed' },
          { title: '⭐ Expert verified', value: 'expert-verified' },
        ],
        layout: 'radio',
      },
      initialValue: 'self-reviewed',
    }),

    defineField({
      name: 'reviewers',
      title: 'Reviewers',
      type: 'array',
      group: 'credibility',
      description: 'Add anyone who has reviewed this post. For Expert Verified posts, include their direct quote about the technical accuracy — this renders prominently near the title and is one of the most powerful credibility signals on your site.',
      of: [
        {
          type: 'object',
          name: 'reviewer',
          fields: [
            defineField({ name: 'name', title: 'Full Name', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'role', title: 'Role / Title', type: 'string', description: 'e.g. "Junior Network Admin" or "Senior Infrastructure Engineer"' }),
            defineField({ name: 'organization', title: 'Organization', type: 'string', description: 'e.g. "QuickCopper MSP" or "ShowFab"' }),
            defineField({ name: 'quote', title: 'Review Quote', type: 'text', rows: 3, description: 'Their direct words about this post\'s accuracy. Keep it specific — "The STP section is accurate and the failure scenario matches what I\'ve seen in production." is far stronger than "Good post."' }),
            defineField({ name: 'date', title: 'Review Date', type: 'date' }),
            defineField({ name: 'linkedIn', title: 'LinkedIn URL (optional)', type: 'url' }),
          ],
          preview: {
            select: { title: 'name', subtitle: 'role' },
            prepare({ title, subtitle }) { return { title, subtitle } },
          },
        },
      ],
    }),

    defineField({
      name: 'changelog',
      title: 'Changelog',
      type: 'array',
      group: 'credibility',
      description: 'Log every meaningful update to this post. Renders at the bottom as a collapsible revision history. "Updated June 2026 — corrected OSPF cost calculation, added section on ECMP." This signals you care about accuracy over ego.',
      of: [
        {
          type: 'object',
          name: 'changelogEntry',
          fields: [
            defineField({ name: 'date', title: 'Date', type: 'date', validation: (r) => r.required() }),
            defineField({ name: 'description', title: 'What changed', type: 'string', description: 'Be specific. What was wrong, what you added, what you corrected.', validation: (r) => r.required() }),
          ],
          preview: {
            select: { title: 'date', subtitle: 'description' },
          },
        },
      ],
    }),

    // ══════════════════════════════════════════════════════════════
    // COMMUNITY TAB
    // ══════════════════════════════════════════════════════════════

    defineField({
      name: 'responsesFromField',
      title: 'Responses from the Field',
      type: 'array',
      group: 'community',
      description: 'When someone publishes a meaningful response to this post — a LinkedIn article, a blog post, a tweet thread — add it here. You control the curation. Renders at the bottom as "Responses from the field." Keeps signal-to-noise high while making the conversation visible.',
      of: [
        {
          type: 'object',
          name: 'fieldResponse',
          fields: [
            defineField({ name: 'title', title: 'Title of response', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'url', title: 'URL', type: 'url', validation: (r) => r.required() }),
            defineField({ name: 'author', title: 'Author', type: 'string' }),
            defineField({ name: 'platform', title: 'Platform', type: 'string', description: 'e.g. LinkedIn, Twitter, personal blog, Reddit' }),
            defineField({ name: 'summary', title: 'One-line summary', type: 'string', description: 'What they said in one sentence. Your curation, not a quote.' }),
            defineField({ name: 'date', title: 'Date', type: 'date' }),
          ],
          preview: {
            select: { title: 'title', subtitle: 'author' },
          },
        },
      ],
    }),

  ],

  preview: {
    select: { title: 'title', articleType: 'articleType', reviewStatus: 'reviewStatus', media: 'mainImage' },
    prepare({ title, articleType, reviewStatus, media }) {
      const typeIcons: Record<string, string> = {
        'perspective': '🔭',
        'concept-deep-dive': '⚡',
        'field-notes': '🔧',
        'transmission': '📡',
      }
      const statusIcons: Record<string, string> = {
        'expert-verified': '⭐',
        'seeking-review': '🔍',
        'peer-reviewed': '✅',
      }
      const icon = typeIcons[articleType] ?? '📝'
      const status = statusIcons[reviewStatus] ?? ''
      return {
        title: `${icon} ${title}`,
        subtitle: status ? `${status} ${reviewStatus}` : articleType,
        media,
      }
    },
  },
})