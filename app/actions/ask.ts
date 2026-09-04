'use server'

import Anthropic from '@anthropic-ai/sdk'
import { client } from '@/sanity/lib/client'
import { articleTextQuery } from '@/sanity/lib/queries-article'
import { portableTextToPlain } from '@/lib/reading'
import { getClientIp, rateLimit } from '@/lib/security'
// app/actions/ask.ts
// "Ask this article": answers a reader's question using only the article text.
// Enabled only when ANTHROPIC_API_KEY is set (the component is not rendered otherwise).
// Rate limited to 10 questions per 10 minutes per IP.

export type AskResult =
  | { ok: true; answer: string }
  | { ok: false; error: string; retryAfterSeconds?: number }

const MAX_QUESTION = 500
const MAX_ARTICLE_CHARS = 40_000
const MODEL = 'claude-opus-5'

const SYSTEM_PROMPT = `You answer questions about one article written by Stefan Peele, a network engineering student and associate intern. Answer only from the article text provided. If the article does not cover the question, say plainly that it isn't covered in this article and do not guess or bring in outside knowledge. Keep answers short and concrete — a few sentences, or a brief list if the article gives several points. Quote or paraphrase the article where helpful. Write in plain prose without markdown headings.`

export async function askArticle(slug: string, question: string): Promise<AskResult> {
  if (!process.env.ANTHROPIC_API_KEY) return { ok: false, error: 'Questions are not enabled right now.' }

  const q = (question ?? '').trim()
  if (!q) return { ok: false, error: 'Type a question first.' }
  if (q.length > MAX_QUESTION) return { ok: false, error: `Keep questions under ${MAX_QUESTION} characters.` }
  if (typeof slug !== 'string' || !/^[a-z0-9-]+$/i.test(slug)) return { ok: false, error: 'Unknown article.' }

  const ip = await getClientIp()
  const limit = rateLimit(`ask:${ip}`, 10, 10 * 60 * 1000)
  if (!limit.ok) {
    return { ok: false, error: `Too many questions for now — try again in ${Math.ceil(limit.retryAfterSeconds / 60)} min.`, retryAfterSeconds: limit.retryAfterSeconds }
  }

  const post = await client.fetch(articleTextQuery, { slug }, { stega: false })
  if (!post?.body) return { ok: false, error: 'Unknown article.' }

  const parts = [
    `Title: ${post.title ?? ''}`,
    post.excerpt ? `Summary: ${post.excerpt}` : '',
    post.tldr?.length ? `TL;DR:\n${post.tldr.map((t) => `- ${t}`).join('\n')}` : '',
    portableTextToPlain(post.body),
  ].filter(Boolean)
  let article = parts.join('\n\n')
  if (article.length > MAX_ARTICLE_CHARS) article = article.slice(0, MAX_ARTICLE_CHARS) + '\n\n[Article truncated for length.]'

  const anthropic = new Anthropic()
  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      output_config: { effort: 'low' },
      system: [
        { type: 'text', text: SYSTEM_PROMPT },
        // The article is the stable prefix: cache it so repeat questions on the same post are cheap.
        { type: 'text', text: `<article>\n${article}\n</article>`, cache_control: { type: 'ephemeral' } },
      ],
      messages: [{ role: 'user', content: q }],
    })

    if (response.stop_reason === 'refusal') {
      return { ok: false, error: "I can't answer that one here." }
    }
    const answer = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim()
    if (!answer) return { ok: false, error: 'No answer came back. Try rephrasing.' }
    return { ok: true, answer }
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) return { ok: false, error: 'The answer service is busy — try again in a minute.' }
    if (error instanceof Anthropic.AuthenticationError) return { ok: false, error: 'Questions are not configured correctly.' }
    if (error instanceof Anthropic.APIError) return { ok: false, error: 'Could not get an answer right now.' }
    return { ok: false, error: 'Could not get an answer right now.' }
  }
}
