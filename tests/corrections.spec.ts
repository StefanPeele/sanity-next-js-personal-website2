import { expect, test } from '@playwright/test'
import { vercelStegaCombine } from '@vercel/stega'
import { applyCorrectionMarks, numberCorrections, unanchoredCorrections } from '../lib/corrections'

// Phase 3B — the split-the-span transform that marks a corrected passage in place.
//
// These run without a browser: the transform is pure, and its failure modes are all about
// WHERE the split lands, which is far easier to assert on the block array than on pixels.

const encode = (s: string) => vercelStegaCombine(s, { origin: 'sanity.io', href: '/studio/x' })

// Typed explicitly rather than inferred: `markDefs: []` infers never[], which makes every
// later assignment a type error even though the values are correct at runtime.
type TestSpan = { _type: string; _key: string; text: string; marks: string[] }
type TestMarkDef = { _type: string; _key: string; [k: string]: unknown }
type TestBlock = { _type: string; _key: string; style: string; markDefs: TestMarkDef[]; children: TestSpan[] }

const block = (text: string, style = 'normal'): TestBlock => ({
  _type: 'block',
  _key: 'b1',
  style,
  markDefs: [],
  children: [{ _type: 'span', _key: 's1', text, marks: [] }],
})

const correction = (over: Record<string, unknown> = {}) => ({
  _key: 'k1',
  anchor: 'the MTU is 1500 bytes',
  kind: 'correction',
  was: 'the MTU is 9000 bytes',
  now: 'Standard Ethernet MTU is 1500, not 9000 — 9000 is a jumbo frame.',
  creditTo: 'A reader',
  date: '2026-09-01',
  ...over,
})

test('the anchored passage is split into its own span carrying the mark', () => {
  const blocks = [block('On this link the MTU is 1500 bytes by default.')]
  const { blocks: out, corrections } = applyCorrectionMarks(blocks, [correction()])
  const children = out[0].children
  expect(children.map((c) => c.text)).toEqual([
    'On this link ', 'the MTU is 1500 bytes', ' by default.',
  ])
  // Only the middle span carries it, and the markDef travels with the block.
  const key = out[0].markDefs.find((d) => d._type === 'correction')!._key
  expect(children[0].marks).toEqual([])
  expect(children[1].marks).toEqual([key])
  expect(children[2].marks).toEqual([])
  expect(corrections[0].anchored).toBe(true)
})

test('the markDef carries what the marker needs to render, including the credit', () => {
  const { blocks: out } = applyCorrectionMarks([block('the MTU is 1500 bytes here')], [correction()])
  const def = out[0].markDefs.find((d) => d._type === 'correction') as Record<string, unknown>
  expect(def.n).toBe(1)
  expect(def.kind).toBe('correction')
  expect(def.creditTo).toBe('A reader')
  expect(def.was).toContain('9000')
})

test('an anchor that does not match leaves the prose untouched and SAYS SO', () => {
  // The author corrected the sentence and then pasted the OLD wording into the anchor.
  // Silent failure here looks exactly like a correction that simply has no anchor.
  const blocks = [block('On this link the MTU is 1500 bytes by default.')]
  const { blocks: out, corrections } = applyCorrectionMarks(blocks, [correction({ anchor: 'the MTU is 9000 bytes' })])
  expect(out[0].children).toHaveLength(1)
  expect(out[0].markDefs).toHaveLength(0)
  expect(corrections[0].anchored).toBe(false)
  expect(unanchoredCorrections(corrections)).toHaveLength(1)
})

test('a correction with no anchor at all is not reported as a failure', () => {
  const { corrections } = applyCorrectionMarks([block('Some prose.')], [correction({ anchor: '' })])
  expect(corrections[0].anchored).toBe(false)
  // anchored:false but no anchor given — that is a deliberate foot-only correction.
  expect(unanchoredCorrections(corrections)).toHaveLength(0)
})

test('headings are never marked', () => {
  // A marker in a heading would land in the table of contents and the anchor link.
  const { blocks: out, corrections } = applyCorrectionMarks(
    [block('the MTU is 1500 bytes', 'h2')], [correction()])
  expect(out[0].children).toHaveLength(1)
  expect(corrections[0].anchored).toBe(false)
})

test('code spans are never marked', () => {
  const b = block('the MTU is 1500 bytes')
  b.children[0].marks = ['code']
  const { blocks: out } = applyCorrectionMarks([b], [correction()])
  expect(out[0].children).toHaveLength(1)
})

test('a passage already inside a link or glossary mark is skipped', () => {
  // Nesting two interactive annotations produces a button inside a button.
  const b = block('the MTU is 1500 bytes')
  b.markDefs = [{ _type: 'glossary', _key: 'g1' }]
  b.children[0].marks = ['g1']
  const { blocks: out } = applyCorrectionMarks([b], [correction()])
  expect(out[0].children).toHaveLength(1)
})

test('each correction marks its FIRST occurrence only', () => {
  const blocks = [block('the MTU is 1500 bytes, and again the MTU is 1500 bytes.')]
  const { blocks: out } = applyCorrectionMarks(blocks, [correction()])
  const marked = out[0].children.filter((c) => (c.marks ?? []).length > 0)
  expect(marked).toHaveLength(1)
  // and the tail text survives intact
  expect(out[0].children.map((c) => c.text).join('')).toBe('the MTU is 1500 bytes, and again the MTU is 1500 bytes.')
})

test('no text is lost or duplicated, whatever the split', () => {
  const text = 'Before. the MTU is 1500 bytes. Between. jumbo frames are 9000. After.'
  const { blocks: out } = applyCorrectionMarks([block(text)], [
    correction(),
    correction({ _key: 'k2', anchor: 'jumbo frames are 9000', date: '2026-09-02', kind: 'clarification' }),
  ])
  expect(out[0].children.map((c) => c.text).join('')).toBe(text)
  expect(out[0].markDefs).toHaveLength(2)
})

test('corrections are numbered oldest first, so a new one does not renumber an old one', () => {
  // A number that moves breaks any link a reader has already shared.
  const numbered = numberCorrections([
    correction({ _key: 'late', date: '2026-09-05' }),
    correction({ _key: 'early', date: '2026-08-01' }),
  ])
  expect(numbered.map((c) => [c.key, c.n])).toEqual([['early', 1], ['late', 2]])
})

test('an unknown or missing kind falls back to correction, the strongest reading', () => {
  expect(numberCorrections([correction({ kind: null })])[0].kind).toBe('correction')
  expect(numberCorrections([correction({ kind: 'nonsense' })])[0].kind).toBe('correction')
  expect(numberCorrections([correction({ kind: 'update' })])[0].kind).toBe('update')
})

test('a stega-encoded anchor still matches the clean body text', () => {
  // In draft mode the anchor comes back with zero-width characters the body copy does not
  // have, so a literal indexOf would never match and the marker would silently vanish —
  // the exact class of bug lib/stega.ts exists for.
  const blocks = [block('On this link the MTU is 1500 bytes by default.')]
  const { corrections } = applyCorrectionMarks(blocks, [correction({ anchor: encode('the MTU is 1500 bytes') })])
  expect(corrections[0].anchored).toBe(true)
})

test('blocks are returned unchanged when there is nothing to do', () => {
  const blocks = [block('Some prose.')]
  expect(applyCorrectionMarks(blocks, []).blocks).toBe(blocks)
  expect(applyCorrectionMarks(blocks, null).blocks).toBe(blocks)
})
