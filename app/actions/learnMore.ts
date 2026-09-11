'use server'

import Anthropic from '@anthropic-ai/sdk'
import { getClientIp, rateLimit } from '@/lib/security'
// app/actions/learnMore.ts
// Phase 6.5's "Learn more": further reading on the term a sidenote annotates.
//
// TITLES AND AUTHORS, NEVER HYPERLINKS. A model asked for "links on the term" produces URLs
// that do not exist, and verifying one means fetching it — which the CSP forbids from the
// browser and which this site should not be doing from the server either. So it returns
// things to look up, and the reader does the looking up. That is the difference between a
// suggestion and a fabricated citation, on a blog whose subject is not making claims it
// cannot support.
//
// GENERATED ON DEMAND, NEVER STORED. Unlike 5.6's summaries this is a reader's action, not a
// property of the post, so it needs no field and no webhook — and storing it is how
// machine-generated text ends up somewhere it can later be mistaken for authored text.
//
// Haiku, not Opus: naming five well-known works on a term is the cheapest capable model's
// job. `ask.ts` uses Opus because answering an arbitrary question from a long article is not.

export type LearnMoreResult =
  | { ok: true; items: { title: string; author: string; why: string }[] }
  | { ok: false; error: string }

const MODEL = 'claude-haiku-4-5-20251001'
const MAX_TERM = 120
const MAX_CONTEXT = 600

const SYSTEM_PROMPT = `You suggest further reading on a technical term for a reader of a network-engineering blog.

Return between three and five entries. For each: the TITLE of a real, well-known work (a book, an RFC, a standard, a paper, or a piece of documentation), its AUTHOR or issuing body, and one short sentence on why it is worth reading for this term.

Never invent a title. If you are not confident a work exists and is well known, leave it out and return fewer entries. Prefer primary sources — the RFC over an article about the RFC.

NEVER return a URL, a link, or a domain name. The reader will look these up by title. A URL you are not certain of is worse than no URL.

Reply with nothing but a JSON array of objects with keys "title", "author" and "why". No prose, no markdown fence.`

export async function learnMore(term: string, context: string): Promise<LearnMoreResult> {
  if (!process.env.ANTHROPIC_API_KEY) return { ok: false, error: 'Further reading is not enabled right now.' }

  const t = (term ?? '').trim()
  if (!t) return { ok: false, error: 'No term to look up.' }
  if (t.length > MAX_TERM) return { ok: false, error: 'That term is too long to look up.' }

  const ip = await getClientIp()
  const limit = rateLimit(`learnmore:${ip}`, 12, 10 * 60 * 1000)
  if (!limit.ok) {
    return { ok: false, error: `Too many lookups for now — try again in ${Math.ceil(limit.retryAfterSeconds / 60)} min.` }
  }

  const anthropic = new Anthropic()
  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 700,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `Term: ${t}\n\nHow the article uses it: ${(context ?? '').slice(0, MAX_CONTEXT)}`,
      }],
    })

    if (response.stop_reason === 'refusal') return { ok: false, error: 'No suggestions for that one.' }

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text).join('').trim()

    // The model is asked for bare JSON, but a fenced block is the common failure and is
    // cheap to survive. Anything else is treated as no result rather than shown raw.
    const json = text.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
    let parsed: unknown
    try { parsed = JSON.parse(json) } catch { return { ok: false, error: 'No suggestions came back.' } }
    if (!Array.isArray(parsed)) return { ok: false, error: 'No suggestions came back.' }

    const items = parsed
      .filter((i): i is Record<string, unknown> => !!i && typeof i === 'object')
      .map((i) => ({
        title: String(i.title ?? '').trim(),
        author: String(i.author ?? '').trim(),
        why: String(i.why ?? '').trim(),
      }))
      // Belt and braces: strip anything that slipped a URL through despite the instruction.
      .filter((i) => i.title && !/https?:\/\/|www\./i.test(`${i.title} ${i.author} ${i.why}`))
      .slice(0, 5)

    if (!items.length) return { ok: false, error: 'No suggestions came back.' }
    return { ok: true, items }
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) return { ok: false, error: 'The lookup service is busy — try again in a minute.' }
    if (error instanceof Anthropic.APIError) return { ok: false, error: 'Could not fetch suggestions right now.' }
    return { ok: false, error: 'Could not fetch suggestions right now.' }
  }
}
