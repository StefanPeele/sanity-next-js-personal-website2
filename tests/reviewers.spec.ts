import { expect, test } from '@playwright/test'
import { reviewerDisplay, reviewerSummary, withArticle } from '../lib/reviewers'

// Anonymity is a promise to a real person, so it gets a real test. The failure mode is not
// "looks wrong" -- it is a name reaching the page or the RSC payload.
const NAMED = { _key: 'a', name: 'Jane Doe', role: 'Senior Network Engineer', organization: 'QuickCopper MSP', linkedIn: 'https://linkedin.com/in/janedoe', quote: 'The STP section is accurate.', date: '2026-05-01' }
const ANON = { ...NAMED, _key: 'b', anonymous: true }

test('a named reviewer renders everything', () => {
  const r = reviewerDisplay(NAMED)
  expect(r.label).toBe('Jane Doe')
  expect(r.initial).toBe('J')
  expect(r.role).toBe('Senior Network Engineer')
  expect(r.organization).toBe('QuickCopper MSP')
  expect(r.linkedIn).toBe('https://linkedin.com/in/janedoe')
  expect(r.anonymous).toBe(false)
})

test('an anonymous reviewer leaks nothing identifying', () => {
  const r = reviewerDisplay(ANON)
  // The four channels that identify a person, each suppressed.
  expect(r.label).toBe('a Senior Network Engineer')
  expect(r.initial).toBeNull()          // a single letter narrows a search
  expect(r.organization).toBeNull()     // small employer + job title identifies
  expect(r.linkedIn).toBeNull()         // a LinkedIn URL *is* the name
  expect(r.role).toBeNull()             // already inside `label`
  // And the name must not survive anywhere in the serialized object.
  expect(JSON.stringify(r)).not.toContain('Jane')
  expect(JSON.stringify(r)).not.toContain('QuickCopper')
  expect(JSON.stringify(r)).not.toContain('linkedin')
  // The quote is the reviewer's own words about the post and is not identifying.
  expect(r.quote).toBe('The STP section is accurate.')
})

test('an anonymous reviewer with no role still says something useful', () => {
  expect(reviewerDisplay({ _key: 'c', anonymous: true }).label).toBe('a professional in the field')
})

test('the article agrees with the role', () => {
  expect(withArticle('network engineer')).toBe('a network engineer')
  expect(withArticle('infrastructure engineer')).toBe('an infrastructure engineer')
})

test('the summary joins mixed reviewers without leaking', () => {
  expect(reviewerSummary([NAMED])).toBe('Jane Doe')
  expect(reviewerSummary([NAMED, ANON])).toBe('Jane Doe and a Senior Network Engineer')
  expect(reviewerSummary([])).toBeNull()
  const three = reviewerSummary([NAMED, ANON, { _key: 'd', name: 'Sam Roe' }])
  expect(three).toBe('Jane Doe, a Senior Network Engineer and Sam Roe')
})
