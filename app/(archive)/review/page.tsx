import Link from 'next/link'
import type { Metadata } from 'next'
import { sanityFetch } from '@/sanity/lib/live'
import { reviewQuery } from '@/sanity/lib/queries-knowledge'
import { ReviewDeck, type ReviewCard } from '@/components/knowledge/ReviewDeck'
import { JsonLd } from '@/components/JsonLd'
import { absoluteUrl } from '@/lib/site'
// app/(archive)/review/page.tsx
// Spaced-repetition review over every post's concept cards and knowledge checks.

export const metadata: Metadata = {
  title: 'Review',
  description: 'Spaced-repetition review of the concept cards and knowledge checks from every post. Progress stays in your browser.',
  alternates: { canonical: '/review' },
}

export default async function ReviewPage() {
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
          description: metadata.description,
          learningResourceType: 'flashcards',
        }}
      />
      <main id="content" className="relative max-w-3xl mx-auto px-6 pt-32 pb-24">
        <header className="mb-10 border-b border-white/5 pb-10">
          <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-stone-500 block mb-4 border-l border-stone-700 pl-4">
            Editorial // Review
          </span>
          <h1 className="text-5xl md:text-6xl font-serif font-bold tracking-tight text-white leading-none mb-4">
            Review<span className="text-stone-600">.</span>
          </h1>
          <p className="text-stone-400 text-base leading-relaxed max-w-2xl">
            Every post ends with concept cards and knowledge checks. This deck pulls all of them together and
            schedules them with spaced repetition — grade a card and it comes back right before you would forget it.
            {cards.length > 0 && (
              <>
                {' '}Right now: {conceptCount} concept{conceptCount === 1 ? '' : 's'} and {quizCount} question{quizCount === 1 ? '' : 's'} from {postCount} post{postCount === 1 ? '' : 's'}.
              </>
            )}
          </p>
        </header>

        <ReviewDeck cards={cards} />

        <nav className="mt-16 pt-8 border-t border-white/5 flex flex-wrap gap-6" aria-label="Related sections">
          <Link href="/blog" className="font-mono text-[10px] uppercase tracking-[0.3em] text-stone-500 hover:text-white transition-colors">← Back to Editorial</Link>
          <Link href="/paths" className="font-mono text-[10px] uppercase tracking-[0.3em] text-stone-500 hover:text-white transition-colors">Learning Paths →</Link>
          <Link href="/glossary" className="font-mono text-[10px] uppercase tracking-[0.3em] text-stone-500 hover:text-white transition-colors">Glossary →</Link>
        </nav>
      </main>
    </div>
  )
}
