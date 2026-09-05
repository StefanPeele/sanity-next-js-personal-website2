import Link from 'next/link'
import type { Metadata } from 'next'
import { sanityFetch } from '@/sanity/lib/live'
import { reviewQuery } from '@/sanity/lib/queries-knowledge'
import { ReviewDeck, type ReviewCard } from '@/components/knowledge/ReviewDeck'
import { JsonLd } from '@/components/JsonLd'
import { absoluteUrl } from '@/lib/site'
import { getCopy } from '@/lib/cms/loaders'
import { knowledgePagesQuery } from '@/sanity/lib/queries-article-ui'
import { DEFAULT_KNOWLEDGE_PAGES } from '@/lib/cms/defaults/knowledgePages'
import { navHref } from '@/lib/cms/defaults/navigation'
// app/(archive)/review/page.tsx
// Spaced-repetition review over every post's concept cards and knowledge checks.

export async function generateMetadata(): Promise<Metadata> {
  const all = await getCopy(knowledgePagesQuery, DEFAULT_KNOWLEDGE_PAGES)
  const h = all.review.header
  return { title: h.metaTitle || h.title, description: h.metaDescription || h.lede }
}

export default async function ReviewPage() {
  const copy = (await getCopy(knowledgePagesQuery, DEFAULT_KNOWLEDGE_PAGES)).review
  const { data } = await sanityFetch({ query: reviewQuery, stega: false })
  const posts = data ?? []

  const cards: ReviewCard[] = []
  for (const p of posts) {
    if (!p.slug || !p.title) continue
    const post = { title: p.title, slug: p.slug }
    for (const c of p.conceptCards ?? []) {
      if (!c.front || !c.back) continue
      cards.push({ id: `${p._id}:c:${c._key}`, kind: 'concept', front: c.front, back: c.back, post })
    }
    for (const q of p.quizzes ?? []) {
      if (!q.question) continue
      const options = (q.options ?? []).filter((o) => o.text).map((o) => ({ text: o.text as string, isCorrect: Boolean(o.isCorrect) }))
      const correct = options.filter((o) => o.isCorrect).map((o) => o.text)
      const back = [q.explanation, correct.length ? `Correct: ${correct.join('; ')}` : null].filter(Boolean).join(' ')
      if (!back) continue
      cards.push({ id: `${p._id}:q:${q._key}`, kind: 'quiz', front: q.question, back, options, post })
    }
  }

  const postCount = new Set(cards.map((c) => c.post.slug)).size
  const conceptCount = cards.filter((c) => c.kind === 'concept').length
  const quizCount = cards.length - conceptCount

  return (
    <div className="relative min-h-screen text-stone-300">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Review deck',
          url: absoluteUrl('/review'),
          description: copy.header.metaDescription || copy.header.lede,
          learningResourceType: 'flashcards',
        }}
      />
      <main id="content" className="relative max-w-3xl mx-auto px-6 pt-32 pb-24">
        <header className="mb-10 border-b border-white/5 pb-10">
          <h1 className="text-5xl md:text-6xl font-serif font-bold tracking-tight text-white leading-none mb-4">{copy.header.title}</h1>
          <p className="text-stone-400 text-base leading-relaxed max-w-2xl">
            {copy.header.lede}
            {cards.length > 0 && <> {copy.countLine.replace('{concepts}', String(conceptCount)).replace('{questions}', String(quizCount)).replace('{posts}', String(postCount))}</>}
          </p>
        </header>

        <ReviewDeck cards={cards} />

<nav className="mt-16 pt-8 border-t border-white/5 flex flex-wrap gap-6" aria-label="Related sections">
          {copy.relatedNav.map((l) => (
            <Link key={navHref(l) + l.label} href={navHref(l)} className="font-sans text-sm text-stone-400 hover:text-white transition-colors">{l.label}</Link>
          ))}
        </nav>
      </main>
    </div>
  )
}
