import { expect, test } from '@playwright/test'
import { vercelStegaCombine } from '@vercel/stega'
import { toFeedItems } from '../lib/feedItems'
import { effectiveReviewStatus, lastRevisedAt, materialRevision, revisionState } from '../lib/status'

// The feed tier of 3.3, and the last-updated rule of 3.7.
//
// Why these are unit tests and not browser tests: the only posts carrying a status are
// draft-only fixtures, and the feed routes use the plain client pinned to the PUBLISHED
// perspective -- correctly, because an RSS reader is not in Sanity's Presentation tool and
// must never see drafts. An independent verifier reached exactly this wall and refused to
// publish a status-bearing post to the live production dataset just to observe the feed,
// which was the right call. So the transform is tested directly with status-bearing input
// instead. What this does NOT cover is the one line where loadFeedItems hands the query
// result to toFeedItems.
//
// Input is shaped like a FeedQueryResult row, including the stega encoding that draft-mode
// strings carry, so a naive lookup would fail here the way it failed on the live page.

const encode = (s: string) => vercelStegaCombine(s, { origin: 'sanity.io', href: '/studio/x' })

type Row = Parameters<typeof toFeedItems>[0]

const post = (over: Record<string, unknown> = {}) => ({
  _id: 'p1',
  title: 'A post',
  slug: 'a-post',
  publishedAt: '2026-08-01T00:00:00Z',
  _updatedAt: '2026-09-09T00:00:00Z',
  excerpt: 'The excerpt.',
  body: null,
  articleType: null,
  reviewStatus: null,
  lastRevised: null,
  categories: null,
  imageUrl: null,
  ...over,
}) as unknown as NonNullable<Row>[number]

test('a statusless post carries no prefix — the negative control', () => {
  const [item] = toFeedItems([post()] as Row)
  expect(item.status).toBeNull()
  expect(item.summary).toBe('The excerpt.')
  expect(item.summary).not.toContain('[')
})

test('the status is prefixed into the summary as plain text', () => {
  const [item] = toFeedItems([post({ reviewStatus: ['peer-reviewed', 'fact-checked'] })] as Row)
  expect(item.status).toBe('Peer reviewed · Fact checked')
  expect(item.summary).toBe('[Peer reviewed · Fact checked] The excerpt.')
})

test('stega-encoded status values still resolve in the feed', () => {
  // If enumKeys were removed, this row would produce status === null and the assertion
  // below would fail — which is the whole point of encoding the input.
  const encoded = ['peer-reviewed', 'fact-checked'].map(encode)
  const [item] = toFeedItems([post({ reviewStatus: encoded })] as Row)
  expect(item.status).toBe('Peer reviewed · Fact checked')
})

test('the render order is strongest claim first, not the order the author typed', () => {
  const [item] = toFeedItems([post({ reviewStatus: ['open-to-comment', 'peer-reviewed', 'seeking-review'] })] as Row)
  expect(item.status).toBe('Peer reviewed · Seeking peer review · Open to comment')
})

test('the feed shows ALL statuses, unlike the card, which shows two', () => {
  const all = ['peer-reviewed', 'fact-checked', 'seeking-review', 'open-to-comment']
  const [item] = toFeedItems([post({ reviewStatus: all })] as Row)
  expect(item.status?.split(' · ')).toHaveLength(4)
})

// ── 3.7: last updated ────────────────────────────────────────────────────────

test('lastRevisedAt takes the newest changelog date, whatever order they are in', () => {
  expect(lastRevisedAt([{ date: '2026-08-22' }, { date: '2026-09-01' }, { date: '2026-01-05' }])).toBe('2026-09-01')
  expect(lastRevisedAt([{ date: '2026-09-01' }, { date: '2026-08-22' }])).toBe('2026-09-01')
})

test('lastRevisedAt ignores entries that are not a real date', () => {
  expect(lastRevisedAt([])).toBeNull()
  expect(lastRevisedAt(null)).toBeNull()
  expect(lastRevisedAt([{ date: null }, { date: '' }, { date: 'soon' }])).toBeNull()
  // A datetime rather than a date must still work — the field is `date`, but a value
  // pasted from elsewhere can carry a time.
  expect(lastRevisedAt([{ date: '2026-09-01T14:00:00Z' }])).toBe('2026-09-01')
})

test('the revision flag is derived, never from the author checking a box', () => {
  expect(effectiveReviewStatus(['peer-reviewed'], 'updated')).toEqual(['peer-reviewed', 'updated'])
  expect(effectiveReviewStatus(['peer-reviewed'], null)).toEqual(['peer-reviewed'])
  // Old data with a hand-set value from the derived tier loses the badge. That is the
  // intended trade: there is no record of what changed, so there is no claim to make.
  expect(effectiveReviewStatus(['peer-reviewed', 'corrected'], null)).toEqual(['peer-reviewed'])
  // And the legacy collapsed value 3B replaced is dropped too, not passed through to
  // callers that have no entry for it.
  expect(effectiveReviewStatus(['peer-reviewed', 'revised'], null)).toEqual(['peer-reviewed'])
  expect(effectiveReviewStatus(['peer-reviewed', 'expert-verified'], null)).toEqual(['peer-reviewed'])
  // And it is not duplicated when both are present.
  expect(effectiveReviewStatus(['corrected'], 'corrected')).toEqual(['corrected'])
})

// ── 3B: three words, not one ─────────────────────────────────────────────────

test('a changelog with no corrections is an update, not a correction', () => {
  expect(revisionState('2026-09-01', null, '2026-08-01')).toEqual({ date: '2026-09-01', flag: 'updated' })
  expect(revisionState('2026-09-01', [], '2026-08-01')).toEqual({ date: '2026-09-01', flag: 'updated' })
})

test('anything wrong outranks everything else — one flag, by severity', () => {
  // The whole point of splitting `revised` into three: a dozen harmless updates must not
  // bury the one thing that was actually wrong.
  expect(revisionState('2026-09-01', ['update', 'update', 'correction'], '2026-08-01').flag).toBe('corrected')
  expect(revisionState('2026-09-01', ['update', 'clarification'], '2026-08-01').flag).toBe('clarified')
  expect(revisionState('2026-09-01', ['correction', 'clarification'], '2026-08-01').flag).toBe('corrected')
})

test('no material revision means no flag at all', () => {
  expect(revisionState(null, ['correction'], '2026-08-01')).toEqual({ date: null, flag: null })
  // Backdated: the guard still applies, corrections included.
  expect(revisionState('2026-07-01', ['correction'], '2026-08-01')).toEqual({ date: null, flag: null })
})

test('stega-encoded correction kinds still resolve', () => {
  expect(revisionState('2026-09-01', [encode('correction')], '2026-08-01').flag).toBe('corrected')
})

test('a feed item is only marked modified when it was materially revised', () => {
  const unrevised = toFeedItems([post()] as Row)[0]
  expect(unrevised.updatedAt).toBe('2026-09-09T00:00:00Z') // falls back to _updatedAt
  const revised = toFeedItems([post({ publishedAt: '2026-08-01T00:00:00Z', lastRevised: '2026-09-01' })] as Row)[0]
  expect(revised.updatedAt).toBe('2026-09-01')
  // and the derived flag reaches the feed's status text
  expect(revised.status).toBe('Updated')
  const corrected = toFeedItems([post({ publishedAt: '2026-08-01T00:00:00Z', lastRevised: '2026-09-01', correctionKinds: ['correction'] })] as Row)[0]
  expect(corrected.status).toBe('Corrected')
})

// ── The material-revision guard ───────────────────────────────────────────────
// Found by the draft fixture, not by reasoning: its changelog predated its publishedAt and
// the header rendered "September 11, 2026 · Updated September 1, 2026" — an update older
// than the publication it updates.

test('a revision before publication is not a revision', () => {
  expect(materialRevision('2026-09-01', '2026-09-11')).toBeNull()
  expect(materialRevision('2026-09-11', '2026-09-11')).toBeNull() // same day is publishing
  expect(materialRevision('2026-09-12', '2026-09-11')).toBe('2026-09-12')
})

test('the guard tolerates datetimes and missing dates', () => {
  expect(materialRevision('2026-09-12T09:00:00Z', '2026-08-01T00:00:00Z')).toBe('2026-09-12')
  expect(materialRevision(null, '2026-08-01')).toBeNull()
  expect(materialRevision('nonsense', '2026-08-01')).toBeNull()
  // An unpublished draft has nothing to be later than, so the revision still shows.
  expect(materialRevision('2026-09-12', null)).toBe('2026-09-12')
})

test('the feed applies the same guard as the page', () => {
  // Backdated changelog: no Revised badge, and date_modified falls back to _updatedAt.
  const back = toFeedItems([post({ publishedAt: '2026-09-11T00:00:00Z', lastRevised: '2026-09-01' })] as Row)[0]
  expect(back.status).toBeNull()
  expect(back.updatedAt).toBe('2026-09-09T00:00:00Z')
  // Genuine revision: badge and date both follow.
  const real = toFeedItems([post({ publishedAt: '2026-08-01T00:00:00Z', lastRevised: '2026-09-01' })] as Row)[0]
  expect(real.status).toBe('Updated')
  expect(real.updatedAt).toBe('2026-09-01')
})
