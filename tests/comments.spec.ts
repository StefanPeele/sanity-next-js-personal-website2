import { expect, test } from '@playwright/test'
import fs from 'node:fs'
import { COMMENT_LABELS, COMMENT_STATUSES, REMOVAL_TEXT, commentAuthor, isRemoved } from '../lib/comments'

// Phase 8. The contract that matters is not how a comment looks — it is what never leaves
// the server. A comment system stores an email address for every person who writes one, and
// this project has already shipped the other version of this once: reviewer names were
// readable in view-source while no pixel showed them.
//
// docs/audit/measure-comments.mjs proves it end to end against a real browser and a real
// document. These are the parts that can run ANYWHERE, including CI with no write token,
// because the likeliest regression is not a rendering bug — it is somebody adding one field
// to a projection.

const QUERIES = fs.readFileSync('sanity/lib/queries.ts', 'utf8')

/** The comment queries, extracted by name so the assertion cannot drift onto another query. */
function queryBody(name: string): string {
  const head = `export const ${name} = defineQuery(\``
  const i = QUERIES.indexOf(head)
  expect(i, `${name} not found in sanity/lib/queries.ts`).toBeGreaterThan(-1)
  const end = QUERIES.indexOf('`)', i + head.length)
  return QUERIES.slice(i + head.length, end)
}

// commentFields is a shared fragment, so a leak could be added there rather than in a query.
function fragmentBody(name: string): string {
  const head = `const ${name} = \``
  const i = QUERIES.indexOf(head)
  expect(i, `${name} fragment not found`).toBeGreaterThan(-1)
  return QUERIES.slice(i + head.length, QUERIES.indexOf('`', i + head.length))
}

test('no comment query selects the email, the token or the IP hash', () => {
  const surfaces = [
    ['commentFields fragment', fragmentBody('commentFields')],
    ['commentsForPostQuery', queryBody('commentsForPostQuery')],
    ['commentsNeedingAttentionQuery', queryBody('commentsNeedingAttentionQuery')],
  ] as const

  for (const [name, body] of surfaces) {
    // Word-boundary-ish: `email` must not appear as a projected field. A substring test is
    // used rather than a regex with escapes, because a backslash written through a shell
    // heredoc into this project has arrived mangled twice.
    for (const forbidden of ['email', 'token', 'ipHash']) {
      expect(body.includes(forbidden), `${name} projects "${forbidden}" — that reaches the browser`).toBe(false)
    }
  }
})

test('the moderation query is bounded, because an unbounded one is a 2MB response', () => {
  // Measured in docs/audit/PHASE-8-COMMENTS.md: every comment, unpaginated, is 1,009ms and
  // 2,173KB at 5,000. The moderation view is flat at ~170ms only because it slices.
  const body = queryBody('commentsNeedingAttentionQuery')
  expect(body).toContain('[0...')
})

test('the article thread is paginated', () => {
  const body = queryBody('commentsForPostQuery')
  expect(body).toContain('[$from...$to]')
})

test('pending comments are never in a read query', () => {
  // A pending comment is unverified text from a stranger. It must not render anywhere on the
  // site before someone has clicked a link in their own inbox.
  expect(queryBody('commentsForPostQuery')).toContain('status != "pending"')
})

test('commentAuthor never returns a name an anonymous commenter typed', () => {
  expect(commentAuthor({ anonymous: true, authorName: 'Real Name' })).toBe('Anonymous')
  expect(commentAuthor({ anonymous: true, authorName: null })).toBe('Anonymous')
  // The name survives when it was not withheld.
  expect(commentAuthor({ anonymous: false, authorName: 'Dana Okafor' })).toBe('Dana Okafor')
  // An empty or whitespace name is not a name.
  expect(commentAuthor({ anonymous: false, authorName: '   ' })).toBe('Anonymous')
  expect(commentAuthor({ anonymous: false, authorName: null })).toBe('Anonymous')
})

test('removal states are distinguishable, which is the whole point of 8.5', () => {
  expect(isRemoved('removed')).toBe(true)
  expect(isRemoved('withdrawn')).toBe(true)
  expect(isRemoved('spam')).toBe(true)
  expect(isRemoved('published')).toBe(false)
  expect(isRemoved(null)).toBe(false)

  // Different words, and neither of them the brief's "Deleted by Author" — which reads as
  // either the post's author or the comment's, the two parties the label exists to separate.
  expect(REMOVAL_TEXT.removed).not.toBe(REMOVAL_TEXT.withdrawn)
  expect(REMOVAL_TEXT.removed).not.toContain('Author')
  expect(REMOVAL_TEXT.withdrawn).not.toContain('Author')
  // Every removed status has wording. A status with none renders a blank row.
  for (const s of COMMENT_STATUSES.filter((x) => isRemoved(x.value))) {
    expect(REMOVAL_TEXT[s.value], `${s.value} has no removal wording`).toBeTruthy()
  }
})

test('five labels, each with its own icon, so colour is never the only cue', () => {
  expect(COMMENT_LABELS).toHaveLength(5)
  expect(COMMENT_LABELS.map((l) => l.value)).toContain('praise')
  // 3.3's rule applies here too: a greyscale reader must still tell them apart.
  const icons = new Set(COMMENT_LABELS.map((l) => l.icon))
  expect(icons.size, 'two labels share an icon').toBe(COMMENT_LABELS.length)
})

test('the schema offers exactly the labels and statuses the code knows about', () => {
  // The fifth copy of a table is the one that drifts. The schema imports lib/comments, so
  // this asserts the import is still how it gets them rather than a hand-written list.
  const schema = fs.readFileSync('sanity/schemas/documents/comment.ts', 'utf8')
  expect(schema).toContain("from '@/lib/comments'")
  expect(schema).toContain('COMMENT_LABELS.map')
  expect(schema).toContain('COMMENT_STATUSES.map')
})
