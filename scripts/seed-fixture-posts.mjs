// scripts/seed-fixture-posts.mjs
//
// Creates two DRAFT-ONLY fixture posts that exercise every field and block type the article
// page can render. They exist to be rendered and captured, not read.
//
//   node scripts/seed-fixture-posts.mjs            # dry run
//   node scripts/seed-fixture-posts.mjs --apply
//   node scripts/seed-fixture-posts.mjs --delete
//
// WHY THIS IS SAFE. Both documents are created with a `drafts.` id and NO published
// counterpart. sanity/lib/client.ts sets `perspective: 'published'` explicitly, so every
// read path on the site -- sitemap, feeds, generateStaticParams, and sanityFetch outside
// draft mode -- cannot see them. They are reachable only through Presentation or the
// draft-mode route. Verified before writing this: a published-perspective query for these
// slugs returns nothing.
//
// WHY IT EXISTS. Phases 3.1 and 3.2 shipped correct-in-theory and unrendered: no published
// post sets any status or reviewer, so the verifier could only return UNVERIFIABLE. The
// same gap already covered h4, blockquote, figure and most learning blocks, which have
// never rendered for any published post.
import fs from 'node:fs'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]))
const { NEXT_PUBLIC_SANITY_PROJECT_ID: P, NEXT_PUBLIC_SANITY_DATASET: D, SANITY_API_WRITE_TOKEN: T } = env
const API = `https://${P}.api.sanity.io/v2025-02-27`

const MODE = process.argv.includes('--delete') ? 'delete' : process.argv.includes('--apply') ? 'apply' : 'dry'
const IMAGE = 'image-02474e79aa8486f7aa4e1113c22c3f7bc9c372fd-3094x2063-jpg'

let k = 0
const key = () => `fx${(k++).toString(36)}`
const span = (text, marks = []) => ({ _type: 'span', _key: key(), text, marks })
const block = (style, children, markDefs = []) => ({ _type: 'block', _key: key(), style, markDefs, children })
const para = (text) => block('normal', [span(text)])
// Lists. Added after an independent verifier reported the 7.2 measure claim UNVERIFIABLE
// for lists: the document that exists to carry EVERY block type carried no body <ul> or
// <ol> at all, and the only list elements on the page were the table of contents, the
// sources and the corrections -- chrome, not prose. A fixture with a hole in it is worse
// than no fixture, because the hole is invisible until something depends on it.
const listItem = (text, kind) => ({ ...block('normal', [span(text)]), listItem: kind, level: 1 })
const bullets = (...items) => items.map((t) => listItem(t, 'bullet'))
const numbers = (...items) => items.map((t) => listItem(t, 'number'))

// ── Fixture A — the kitchen sink ────────────────────────────────────────────
const sidenoteKey = 'sn-latency'

const bodyA = [
  block('h1', [span('An H1 in the body, which now renders as an H2')]),
  para('This paragraph exists so the H1 above has something beneath it. Phase 3 changed the body "Heading 1" style to render as an <h2> so it stops competing with the article title; this fixture is how that stays visible.'),

  block('h2', [span('Heading two, the normal section level')]),
  para('Ordinary body copy at the article measure. It should sit at 19px with a 1.70 line-height, and the measure should be whatever Phase 7 eventually decides -- measured at 56 characters when this fixture was written.'),

  {
    ...block('normal', [
      span('Some sentences carry a '),
      span('sidenote', [sidenoteKey]),
      span(' that belongs in the margin on desktop and expands inline on mobile.'),
    ]),
    markDefs: [{ _type: 'sidenote', _key: sidenoteKey, note: 'This is the sidenote. On a wide screen it sits in the margin; below lg it collapses behind its marker. Tufte CSS runs the margin column at 0.50x the measure and the note at 0.79x the body size.' }],
  },

  // 6.3's two edge cases, in the fixture rather than in a paragraph of prose about them.
  // TWO ADJACENT ANCHORS, one line apart, so the push-down rule has something to push.
  {
    ...block('normal', [
      span('Two anchors in one sentence: the '),
      span('first note', ['sn-a']),
      span(' and, a few words later, the '),
      span('second note', ['sn-b']),
      span(' — close enough that their notes would overlap if nothing moved them.'),
    ]),
    markDefs: [
      { _type: 'sidenote', _key: 'sn-a', note: 'The first of two adjacent notes. It is placed at its own anchor.' },
      { _type: 'sidenote', _key: 'sn-b', note: 'The second. It cannot sit at its anchor without landing on top of the note above, so it is pushed down to just below it.' },
    ],
  },

  // A LONG note, past the 12-line clamp, so the truncation and its "more" affordance render.
  {
    ...block('normal', [
      span('And one '),
      span('deliberately long note', ['sn-long']),
      span(' to exercise the clamp.'),
    ]),
    markDefs: [
      { _type: 'sidenote', _key: 'sn-long', note: 'A note long enough to exceed the margin clamp. The margin column is narrow by design — roughly half the prose measure, which is what Tufte CSS uses — so a note of any length will run past the twelve lines the clamp allows. The rule is that it truncates and offers to open the full text in a centred window, rather than growing a scroll region inside the margin. A second scrollable area on a page is a thing readers do not find, and a margin note that scrolls independently of the prose beside it is worse than one that is simply cut off with a way to read the rest. This paragraph exists only to be longer than twelve lines at the rendered size, and it is.' },
    ],
  },

  // 3B. Three anchorable passages, one per correction kind, plus one anchor that will NOT
  // match so the "passage not found" path is exercised on a real render.
  para('The standard Ethernet MTU is 1500 bytes on this link. Spanning tree converges in about 30 seconds with the default timers, and the switch fabric is rated for 176 Gbps.'),

  // An inline LINK. The kitchen sink claims to exercise every block type and never had one,
  // so nothing could verify the article-link treatment or 5.2's "always underline links".
  {
    ...block('normal', [
      span('Body copy with '),
      span('an inline link', ['lk-1']),
      span(' in the middle of it, so the ink-bleed underline and the accessibility override can both be measured.'),
    ]),
    markDefs: [{ _type: 'link', _key: 'lk-1', href: 'https://www.rfc-editor.org/rfc/rfc826' }],
  },

  // 6.2. A sentence whose term matches the draft glossary entry below, so the unified
  // annotation can be measured. Deliberately NOT inside a correction anchor: glossary marks
  // are applied first and correction marks skip spans that already carry one, so a term
  // sitting inside an anchor would silently stop that correction from marking.
  para('Traffic that has nowhere else to go floods the whole broadcast domain, which is the behaviour this fixture uses to exercise glossary-derived sidenotes.'),

  block('h3', [span('Heading three')]),
  para('A third level, for subsections inside a section.'),

  block('h4', [span('Heading four, which has never rendered for a published post')]),
  para('h4 is in the renderer and in the Studio styles, and no published article has ever used it. That is precisely the class of thing this fixture is for.'),

  block('h5', [span('Heading five, which had no renderer at all until Phase 3')]),
  para('h5 rendered as a bare tag with no id, no anchor and no TOC entry. One published post is written entirely in h5 and had a completely empty Contents column because of it.'),

  block('h6', [span('Heading six, same story')]),
  para('The Studio offers H1 to H6; the pipeline handled three of them.'),

  block('blockquote', [span('A blockquote. Also never rendered for a published post. It should read as a quotation without a left border, in stone-200 rather than stone-400.')]),

  block('h2', [span('Lists, which this fixture did not have')]),
  para('Both list styles, each long enough that an item wraps, so the measure can be checked on a list and not only on a paragraph.'),
  ...bullets(
    'A bulleted item short enough to sit on one line.',
    'A second item, written long enough that it has to wrap onto a second line at every breakpoint, because a list that never wraps cannot show whether it is on the prose measure or on some wider column that happens to look similar at a glance.',
    'A third, for rhythm.',
  ),
  para('And the numbered variant, which uses a different renderer.'),
  ...numbers(
    'Step one.',
    'Step two, again long enough to wrap: the numbered list is a separate component from the bulleted one and the two have drifted apart before.',
    'Step three.',
  ),

  block('h2', [span('A figure, a code block and a section break')]),

  { _type: 'image', _key: key(), asset: { _type: 'reference', _ref: IMAGE }, alt: 'Fixture image with a caption, used to check figure spacing and the caption treatment.', caption: 'A figure caption. Figures are spaced at 4rem and have never rendered for a published post.', keepColor: true },

  { _type: 'code', _key: key(), language: 'bash', code: 'ip -br addr show\nip route get 1.1.1.1\nss -tulpn | head\n\n# a long line, to check that the code block scrolls horizontally rather than wrapping or overflowing its container\ntcpdump -ni any "tcp port 443 and (tcp[tcpflags] & (tcp-syn|tcp-ack)) != 0" -c 20' },

  { _type: 'sectionBreak', _key: key(), title: 'Part two', teaser: 'A section break with a title and a teaser. The subtle variant is a 96px centred rule.', style: 'subtle' },

  block('h2', [span('The learning blocks')]),
  para('Every block below is registered in the schema and renders for no published post.'),

  { _type: 'failureNote', _key: key(), label: 'failed', content: 'The GNS3 lab would not pass traffic between two routers. The interfaces were up, the addresses were right, and the fault was a mask mismatch that made each side believe the other was on a different subnet.' },

  { _type: 'whatIGotWrong', _key: key(), misconception: 'I thought a switch had to learn a MAC address before it would forward to it.', correction: 'It floods unknown unicast out of every port in the VLAN except the ingress port, then learns from the reply.', whyItMatters: 'If you expect a drop, you go looking for the wrong fault -- and flooding is exactly what makes an unfamiliar failure look like a working link.' },

  { _type: 'whatEngineersUse', _key: key(), scenario: 'Confirming which interface a route will actually use before changing anything.', environment: 'Any Linux host', toolsInvolved: 'ip route get, mtr, tcpdump' },

  { _type: 'theProblemSolved', _key: key(), context: 'Spanning Tree exists because Ethernet has no hop count. A loop in a bridged network does not decay -- it amplifies until the segment is unusable.', externalLink: 'https://en.wikipedia.org/wiki/Spanning_Tree_Protocol', year: '1985' },

  { _type: 'conceptStressTest', _key: key(), prompt: 'A host can ping its default gateway but nothing beyond it. Name two causes that are not the gateway being down.', answer: 'The gateway has no route onward, or it has one and no return path exists. Both look identical from the host.', hint: 'Think about which direction the missing information is in.' },

  { _type: 'knowledgeQuiz', _key: key(), isGated: false, question: 'Which layer does a MAC address belong to?', options: [
    { _type: 'option', _key: key(), text: 'Layer 2 — Data link', isCorrect: true, explanation: 'Correct. MAC addressing is how a frame is delivered inside one broadcast domain.' },
    { _type: 'option', _key: key(), text: 'Layer 3 — Network', isCorrect: false, explanation: 'Layer 3 is where IP lives. It is routed between networks; a MAC address never leaves its segment.' },
    { _type: 'option', _key: key(), text: 'Layer 1 — Physical', isCorrect: false, explanation: 'Layer 1 carries bits and has no addressing at all.' },
  ] },

  { _type: 'layerExplorer', _key: key(), title: 'The OSI layers, with two overridden', overrides: [
    { _type: 'override', _key: key(), layerNumber: 2, protocols: 'Ethernet, ARP, STP', description: 'Frames inside one broadcast domain.', realWorld: 'A switch reading a destination MAC and forwarding out one port.' },
    { _type: 'override', _key: key(), layerNumber: 3, protocols: 'IP, ICMP, OSPF', description: 'Packets between networks.', realWorld: 'A router choosing a next hop from its table.' },
  ] },

  { _type: 'packetAnimator', _key: key(), scenario: 'A TCP handshake across one router', steps: [
    { _type: 'step', _key: key(), label: 'SYN', description: 'The client offers a sequence number and its options.', layer: 4 },
    { _type: 'step', _key: key(), label: 'SYN-ACK', description: 'The server acknowledges and offers its own.', layer: 4 },
    { _type: 'step', _key: key(), label: 'ACK', description: 'The client acknowledges. The connection is established.', layer: 4 },
  ] },

  { _type: 'wiresharkCallout', _key: key(), image: { _type: 'image', asset: { _type: 'reference', _ref: IMAGE } }, caption: 'A capture with numbered callouts over it.', callouts: [
    { _type: 'callout', _key: key(), number: 1, rowDescription: 'The first callout, pinned to a row.' },
    { _type: 'callout', _key: key(), number: 2, rowDescription: 'The second, to check that two badges stack without colliding.' },
  ] },

  block('h2', [span('A long paragraph, to check the measure')]),
  para('Typographic measure is the one thing on this page that a screenshot settles faster than an argument. This paragraph is deliberately long so that a capture at 1440, 768 and 390 shows how many characters land on a line at each width, which is the number Phase 7 has to decide on. Measured with real characters over real lines rather than a font metric, the article currently runs at 56 characters, against Tufte CSS at 77 and a classical optimum of 60 to 75.'),
]

const bodyB = [
  para('A short post with a short title and no cover image. It exists so the long-title fixture has something to be compared against, and so the header renders at least once without an image behind it.'),
  block('h2', [span('One heading')]),
  para('That is all.'),
]

const FIXTURES = [
  {
    _id: 'drafts.fixture-kitchen-sink',
    _type: 'post',
    title: 'A deliberately long fixture title that will wrap across two or three lines at every breakpoint, so the header measure can be seen',
    slug: { _type: 'slug', current: 'fixture-kitchen-sink' },
    excerpt: 'A draft-only fixture exercising every field and block type the article page can render. Not for reading.',
    // Predates the changelog below ON PURPOSE. `Updated` only renders when the revision is
    // strictly after publication -- materialRevision() in lib/status.ts -- so a fixture
    // published today with an August changelog would silently stop exercising 3.7.
    publishedAt: '2026-08-01',
    articleType: 'concept-deep-dive',
    categories: ['Network & Infrastructure'],
    mainImage: { _type: 'image', asset: { _type: 'reference', _ref: IMAGE }, alt: 'Fixture cover image.' },
    tldr: ['Every block type on one page.', 'Two statuses at once.', 'A named reviewer and an anonymous one.'],
    // Every status axis, with TWO review flags applied at once.
    confidenceLevel: 'working-theory',
    maturityIndicator: 'tested',
    cognitiveLoad: 'dense',
    // All FOUR selectable values. 'revised' is not listed because it is derived from the
    // changelog below (3.7), so this post renders all five -- which is what makes it the
    // degradation case for 3.4's "do not stack five glows" and the only place the
    // open-to-comment and revised marks can be seen rendered at all.
    reviewStatus: ['peer-reviewed', 'fact-checked', 'seeking-review', 'open-to-comment'],
    reviewers: [
      { _type: 'reviewer', _key: 'rev-named', name: 'Dana Okafor', role: 'Senior Network Engineer', organization: 'Fixture Networks', quote: 'The spanning tree section matches what I see in production, and the failure case is the one people actually hit.', date: '2026-08-14', linkedIn: 'https://www.linkedin.com/in/example-fixture', anonymous: false },
      { _type: 'reviewer', _key: 'rev-anon', name: 'Should Never Render', role: 'Infrastructure Engineer', organization: 'Should Never Render Ltd', linkedIn: 'https://www.linkedin.com/in/should-never-render', quote: 'The layer 2 explanation is accurate.', date: '2026-08-20', anonymous: true },
    ],
    corrections: [
      { _type: 'correction', _key: 'co1', kind: 'correction', date: '2026-08-22',
        anchor: 'The standard Ethernet MTU is 1500 bytes',
        was: 'The standard Ethernet MTU is 9000 bytes',
        now: '1500 is the standard MTU; 9000 is a jumbo frame and is not the default anywhere.',
        creditTo: 'A reader who noticed', creditUrl: 'https://example.com/reader' },
      { _type: 'correction', _key: 'co2', kind: 'clarification', date: '2026-08-28',
        anchor: 'Spanning tree converges in about 30 seconds',
        was: 'Spanning tree converges in 30 seconds',
        now: 'That is classic STP with default timers. RSTP converges in under a second, which the original wording did not make clear.',
        creditTo: 'Another reader' },
      { _type: 'correction', _key: 'co3', kind: 'update', date: '2026-09-01',
        anchor: 'the switch fabric is rated for 176 Gbps',
        was: 'the switch fabric is rated for 88 Gbps',
        now: 'The lab switch was replaced in September; the figure is for the new one.' },
      // Deliberately broken anchor: the passage was edited after the correction was
      // written. This must render at the foot WITH a "passage not found" note, never
      // silently vanish.
      { _type: 'correction', _key: 'co4', kind: 'correction', date: '2026-09-01',
        anchor: 'a passage that no longer exists in this post',
        was: 'Something that used to be here.',
        now: 'Kept so the unanchored path is visible on a real render.',
        creditTo: 'The fixture' },
    ],
    changelog: [
      { _type: 'changelogEntry', _key: 'cl1', date: '2026-08-22', description: 'Corrected the unknown-unicast description after review.' },
      { _type: 'changelogEntry', _key: 'cl2', date: '2026-09-01', description: 'Added the packet walkthrough.' },
    ],
    responsesFromField: [
      { _type: 'response', _key: 'rf1', title: 'A response from the field', url: 'https://example.com/response', author: 'A reader', platform: 'Email', summary: 'Pointed out that the mask mismatch is more common than the cable fault.', date: '2026-08-30' },
    ],
    sources: [
      { _type: 'source', _key: 'src1', title: 'RFC 826 — An Ethernet Address Resolution Protocol', url: 'https://www.rfc-editor.org/rfc/rfc826', author: 'D. Plummer', type: 'rfc', description: 'The original ARP specification.' },
      { _type: 'source', _key: 'src2', title: 'Spanning Tree Protocol', url: 'https://en.wikipedia.org/wiki/Spanning_Tree_Protocol', type: 'reference' },
    ],
    learningObjectives: ['See every block type render at once.', 'See two review flags on one post.', 'See an anonymous reviewer redacted.'],
    body: bodyA,
  },
  {
    _id: 'drafts.fixture-minimal',
    _type: 'post',
    title: 'Short fixture',
    slug: { _type: 'slug', current: 'fixture-minimal' },
    excerpt: 'A short draft fixture with no cover image.',
    publishedAt: '2026-09-11',
    articleType: 'lab-notes',
    confidenceLevel: 'speculative',
    reviewStatus: ['seeking-review'],
    body: bodyB,
  },
]

async function query(q, perspective = 'published') {
  const u = `${API}/data/query/${D}?query=${encodeURIComponent(q)}&perspective=${perspective}`
  const r = await fetch(u, { headers: { Authorization: `Bearer ${T}` } })
  const j = await r.json()
  if (j.error) throw new Error(JSON.stringify(j.error))
  return j.result
}

async function mutate(mutations) {
  const r = await fetch(`${API}/data/mutate/${D}?returnIds=true`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${T}` },
    body: JSON.stringify({ mutations }),
  })
  const j = await r.json()
  if (j.error) throw new Error(JSON.stringify(j.error))
  return j
}

// A draft-only glossary entry, for the same reason the posts are drafts: a published one
// would appear on the live /glossary route. In draft mode it is matched by
// applyGlossaryMarks exactly as a real one would be.
const GLOSSARY_FIXTURE = {
  _id: 'drafts.fixture-glossary-broadcast-domain',
  _type: 'glossaryTerm',
  term: 'broadcast domain',
  slug: { _type: 'slug', current: 'fixture-broadcast-domain' },
  definition: 'The set of devices a broadcast frame reaches. One VLAN is one broadcast domain; a router bounds it, a switch does not.',
}

// The glossary entry is deleted with the posts, or --delete leaves an orphan behind.
const ids = [...FIXTURES, GLOSSARY_FIXTURE].map((f) => f._id)

if (MODE === 'delete') {
  const res = await mutate(ids.map((id) => ({ delete: { id } })))
  console.log('deleted:', JSON.stringify(res.results ?? res))
  process.exit(0)
}

// Safety gate: nothing published may share these slugs, and no published doc may share the id.
const slugs = FIXTURES.map((f) => f.slug.current)
const clash = await query(`*[_type == "post" && slug.current in ${JSON.stringify(slugs)}]{_id}`)
if (clash.length) {
  console.error('REFUSING: a PUBLISHED post already uses a fixture slug:', JSON.stringify(clash))
  process.exit(1)
}

console.log(`${MODE === 'apply' ? 'CREATING' : 'WOULD CREATE'} ${FIXTURES.length} draft-only fixtures:`)
for (const f of FIXTURES) {
  const blocks = f.body.length
  const types = [...new Set(f.body.map((b) => (b._type === 'block' ? `block:${b.style}` : b._type)))]
  console.log(`  ${f._id}`)
  console.log(`    slug=${f.slug.current}  blocks=${blocks}`)
  console.log(`    types: ${types.join(', ')}`)
}

if (MODE !== 'apply') {
  console.log('\nDRY RUN. Re-run with --apply.')
  process.exit(0)
}

const res = await mutate([...FIXTURES, GLOSSARY_FIXTURE].map((doc) => ({ createOrReplace: doc })))
console.log('\nwrote:', JSON.stringify(res.results?.map((r) => r.id) ?? res))

// Prove the safety claim rather than asserting it.
const leaked = await query(`*[_type == "post" && slug.current in ${JSON.stringify(slugs)}]{_id, title}`, 'published')
console.log(`published-perspective query for the fixture slugs returned ${leaked.length} documents (must be 0)`)
const draftsVisible = await query(`*[_id in ${JSON.stringify(ids)}]{_id}`, 'raw')
console.log(`raw-perspective query returned ${draftsVisible.length} (expected ${ids.length})`)
if (leaked.length) { console.error('LEAK: fixtures are visible at the published perspective'); process.exit(1) }
