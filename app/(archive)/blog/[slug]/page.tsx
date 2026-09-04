import '@/styles/article.css'
import { client } from '@/sanity/lib/client'
import { sanityFetch } from '@/sanity/lib/live'
import { postBySlugQuery, postSlugsQuery } from '@/sanity/lib/queries'
import type { PostBySlugQueryResult } from '@/sanity.types'
import { CustomPortableText } from '@/components/CustomPortableText'
import { JsonLd } from '@/components/JsonLd'
import { NewsletterForm } from '@/components/NewsletterForm'
import { ArticleProvider } from '@/components/article/ArticleProvider'
import { SourcesList } from '@/components/blog/SourcesList'
import { ArticleFloatingToolbar } from '@/components/blog/ArticleFloatingToolbar'
import { ArticleProgressRail } from '@/components/blog/ArticleProgressRail'
import { CredibilitySection } from '@/components/blog/CredibilitySection'
import { ConceptCards } from '@/components/blog/LearningBlocks'
import { BlogArticleHeader } from '@/components/blog/BlogArticleHeader'
import { heroImageUrl } from '@/components/article/heroImage'
import { MobileTOC } from '@/components/blog/MobileTOC'
import { SwipeNavigation } from '@/components/blog/SwipeNavigation'
import { ReadingRuler } from '@/components/blog/ReadingRuler'
import { ArticleEffects } from '@/components/blog/ArticleEffects'
import { ResumePill } from '@/components/blog/ResumePill'
import { ThemePrompt } from '@/components/blog/ThemePrompt'
import { TldrBlock } from '@/components/blog/TldrBlock'
import { SeriesBanner } from '@/components/blog/SeriesBanner'
import { Checkpoint } from '@/components/blog/Checkpoint'
import { BacklinksSection } from '@/components/blog/Backlinks'
import { AskArticle } from '@/components/blog/AskArticle'
import { Comments } from '@/components/blog/Comments'
import { Reactions } from '@/components/blog/Reactions'
import { SITE, absoluteUrl, articleTypeMeta } from '@/lib/site'
import { formatDate } from '@/lib/dates'
import { countWords, portableTextToPlain, readingTime } from '@/lib/reading'
import { applyGlossaryMarks } from '@/lib/glossary'
import { articleToMarkdown, buildStudyDeck, collectQuizzes, countStudyCards } from '@/lib/anki'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { PortableTextBlock } from 'next-sanity'
// app/(archive)/blog/[slug]/page.tsx

type Props = { params: Promise<{ slug: string }> }
type Post = NonNullable<PostBySlugQueryResult>
type Tag = { _id?: string; title: string | null; slug: string | null }

export async function generateStaticParams() {
  const slugs = await client.fetch(postSlugsQuery)
  return slugs.filter((s) => s.slug).map(({ slug }) => ({ slug: slug! }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const { data: post } = await sanityFetch({ query: postBySlugQuery, params: { slug }, stega: false })
  if (!post) return { title: 'Post Not Found' }
  const title = post.title ?? 'Untitled'
  const description = post.excerpt ?? SITE.description
  const url = absoluteUrl(`/blog/${slug}`)
  const tags = ((post.tags ?? []) as unknown as Tag[]).map((t) => t?.title).filter((t): t is string => !!t)
  const categories = (post.categories ?? []).filter((c): c is string => !!c)
  return {
    title,
    description,
    keywords: [...tags, ...categories],
    alternates: { canonical: url },
    openGraph: {
      title, description, type: 'article', url,
      publishedTime: post.publishedAt ?? undefined,
      modifiedTime: post._updatedAt ?? undefined,
      authors: [SITE.url],
      tags,
    },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const { data } = await sanityFetch({ query: postBySlugQuery, params: { slug } })
  const post = data as Post | null
  if (!post) notFound()

  const plain = portableTextToPlain(post.body)
  const wordCount = countWords(plain)
  const readTime = readingTime(wordCount)
  const publishDate = formatDate(post.publishedAt, 'long', 'Unpublished')
  const title = post.title ?? 'Untitled'
  const url = absoluteUrl(`/blog/${slug}`)
  const lane = articleTypeMeta(post.articleType)
  const tags = ((post.tags ?? []) as unknown as Tag[]).filter((t) => t?.title)
  const categories = (post.categories ?? []).filter((c): c is string => !!c)

  // Body with glossary hover-card marks applied (first prose occurrence per term).
  const body = applyGlossaryMarks(post.body ?? [], post.glossary) as unknown as PortableTextBlock[]

  // Study deck + Markdown export, computed once on the server.
  const quizzes = collectQuizzes(post.body, post.checkpoint)
  const conceptCards = (post.conceptCards ?? []).map((c) => ({ _key: c._key, front: c.front ?? '', back: c.back ?? '' })).filter((c) => c.front && c.back)
  const deckCount = countStudyCards({ conceptCards, quizzes })
  const deck = deckCount ? buildStudyDeck({ title, tags: tags.map((t) => t.title), conceptCards, quizzes }) : undefined
  const markdown = articleToMarkdown({ title, url, excerpt: post.excerpt, tldr: post.tldr, body: post.body })

  const readNext = [
    { post: post.readNextGoDeeper, label: 'Go Deeper', icon: '⬇' },
    { post: post.readNextGoBroader, label: 'Go Broader', icon: '↔' },
    { post: post.readNextApplyThis, label: 'Apply This', icon: '→' },
  ].filter((r) => r.post?.slug)
  const nextPost = post.readNextGoDeeper?.slug
    ? { title: post.readNextGoDeeper.title ?? '', slug: post.readNextGoDeeper.slug }
    : post.readNextGoBroader?.slug
    ? { title: post.readNextGoBroader.title ?? '', slug: post.readNextGoBroader.slug }
    : null

  const askEnabled = !!process.env.ANTHROPIC_API_KEY
  const showCheckpoint = post.articleType === 'concept-deep-dive' && !!post.checkpoint?.question && (post.checkpoint.options?.length ?? 0) > 1
  const hasCredibility = (post.reviewers?.length ?? 0) > 0 || (post.changelog?.length ?? 0) > 0 || (post.responsesFromField?.length ?? 0) > 0 || !!post.confidenceLevel || !!post.maturityIndicator

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BlogPosting',
        '@id': `${url}#article`,
        mainEntityOfPage: url,
        headline: title,
        description: post.excerpt ?? undefined,
        image: post.mainImageUrl ? [heroImageUrl(post.mainImageUrl)] : undefined,
        datePublished: post.publishedAt ?? undefined,
        dateModified: post._updatedAt ?? post.publishedAt ?? undefined,
        author: { '@type': 'Person', name: SITE.name, url: SITE.url },
        publisher: { '@type': 'Person', name: SITE.name, url: SITE.url },
        keywords: [...tags.map((t) => t.title), ...categories].filter(Boolean).join(', ') || undefined,
        articleSection: lane?.label ?? categories[0],
        wordCount,
        timeRequired: `PT${readTime}M`,
        inLanguage: 'en-US',
        isPartOf: post.series?.slug
          ? { '@type': 'CreativeWorkSeries', name: post.series.title ?? undefined, url: absoluteUrl(`/blog/series/${post.series.slug}`) }
          : undefined,
        position: post.seriesOrder ?? undefined,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE.url },
          { '@type': 'ListItem', position: 2, name: 'Writing', item: absoluteUrl('/blog') },
          ...(post.series?.slug
            ? [{ '@type': 'ListItem', position: 3, name: post.series.title ?? 'Series', item: absoluteUrl(`/blog/series/${post.series.slug}`) }]
            : []),
          { '@type': 'ListItem', position: post.series?.slug ? 4 : 3, name: title, item: url },
        ],
      },
    ],
  }

  return (
    <ArticleProvider slug={slug} title={title} totalWords={wordCount}>
      <div className="relative min-h-screen text-stone-300 selection:bg-stone-500/30 pb-32">
        <JsonLd data={jsonLd} />

        <ArticleFloatingToolbar markdown={markdown} />
        <ArticleProgressRail />
        <ResumePill />
        <ThemePrompt recommendedTheme={post.recommendedTheme} />

        <BlogArticleHeader
          title={title}
          publishDate={publishDate}
          readTime={readTime}
          categories={categories}
          articleType={post.articleType}
          mainImageUrl={post.mainImageUrl}
          mainImageAlt={post.mainImageAlt}
          lqip={post.lqip}
          sourceCount={post.sources?.length ?? 0}
          conceptCardCount={conceptCards.length}
          reviewStatus={post.reviewStatus}
        />

        <div className="relative max-w-5xl mx-auto px-6">
          {/* Reading column. The toolbar changes max-width through data-width. */}
          <main id="content" className="max-w-3xl mx-auto mt-16 md:mt-20 transition-[max-width] duration-300" data-width="standard">

            {post.series && (
              <SeriesBanner series={post.series} currentSlug={slug} seriesOrder={post.seriesOrder} />
            )}

            {(post.tldr?.length ?? 0) > 0 && (
              <TldrBlock items={post.tldr ?? []} articleType={post.articleType} />
            )}

            {(post.prerequisites?.length ?? 0) > 0 && (
              <aside className="mb-10 p-5 rounded-xl border border-white/[0.08] bg-white/[0.02]" aria-labelledby="prereq-heading">
                <h2 id="prereq-heading" className="font-mono text-[9px] uppercase tracking-[0.35em] text-stone-500 mb-3">
                  Before this — you should understand:
                </h2>
                <ul className="space-y-2">
                  {(post.prerequisites ?? []).map((prereq) => (
                    <li key={prereq._key} className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-stone-500" aria-hidden="true">→</span>
                      {prereq.post?.slug ? (
                        <Link
                          href={`/blog/${prereq.post.slug}`}
                          className="font-mono text-[11px] text-stone-300 hover:text-white transition-colors underline underline-offset-4 decoration-stone-700 hover:decoration-stone-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 rounded-sm"
                        >
                          {prereq.description}
                        </Link>
                      ) : (
                        <span className="font-mono text-[11px] text-stone-400">{prereq.description}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </aside>
            )}

            {showCheckpoint && post.checkpoint && (
              <Checkpoint
                quiz={{
                  question: post.checkpoint.question ?? '',
                  explanation: post.checkpoint.explanation,
                  options: (post.checkpoint.options ?? []).map((o) => ({ _key: o._key, text: o.text ?? '', isCorrect: !!o.isCorrect })),
                }}
              />
            )}

            {(post.learningObjectives?.length ?? 0) > 0 && (
              <aside className="mb-10 pl-5 border-l-2 border-stone-700" aria-labelledby="objectives-heading">
                <h2 id="objectives-heading" className="font-mono text-[9px] uppercase tracking-[0.35em] text-stone-500 mb-3">
                  After this post you&rsquo;ll be able to:
                </h2>
                <ol className="space-y-2">
                  {(post.learningObjectives ?? []).map((obj, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="font-mono text-[10px] text-stone-500 flex-shrink-0 mt-0.5">{i + 1}.</span>
                      <span className="font-mono text-[11px] text-stone-300 leading-relaxed">{obj}</span>
                    </li>
                  ))}
                </ol>
              </aside>
            )}

            {/* Article body */}
            <article data-article className="leading-[1.85]">
              {body.length > 0 ? (
                <CustomPortableText value={body} article />
              ) : (
                <p className="italic text-stone-400 text-center py-12">No content yet.</p>
              )}
            </article>

            {conceptCards.length > 0 && (
              <ConceptCards cards={conceptCards} deck={deck} deckCount={deckCount} deckFilename={`${slug}-study-deck.txt`} />
            )}

            {(post.sources?.length ?? 0) > 0 && (
              <SourcesList sources={(post.sources ?? []).map((s) => ({ ...s, title: s.title ?? 'Untitled source', url: s.url ?? undefined, author: s.author ?? undefined, type: s.type ?? undefined, description: s.description ?? undefined }))} />
            )}

            {hasCredibility && (
              <CredibilitySection
                reviewStatus={post.reviewStatus ?? undefined}
                reviewers={(post.reviewers ?? []).map((r) => ({ ...r, name: r.name ?? 'Reviewer', role: r.role ?? undefined, organization: r.organization ?? undefined, quote: r.quote ?? undefined, date: r.date ?? undefined, linkedIn: r.linkedIn ?? undefined }))}
                changelog={(post.changelog ?? []).map((c) => ({ _key: c._key, date: c.date ?? '', description: c.description ?? '' }))}
                responsesFromField={(post.responsesFromField ?? []).map((r) => ({ ...r, title: r.title ?? '', url: r.url ?? '#', author: r.author ?? undefined, platform: r.platform ?? undefined, summary: r.summary ?? undefined, date: r.date ?? undefined }))}
                confidenceLevel={post.confidenceLevel ?? undefined}
                maturityIndicator={post.maturityIndicator ?? undefined}
                cognitiveLoad={post.cognitiveLoad ?? undefined}
              />
            )}

            <BacklinksSection backlinks={post.backlinks} />

            {askEnabled && <AskArticle slug={slug} />}

            <Reactions slug={slug} />

            {/* Citation */}
            <div className="mt-16 p-6 md:p-8 bg-[#111] border border-white/[0.08] rounded-xl">
              <h2 className="font-mono text-[10px] text-stone-400 uppercase tracking-widest mb-3">Cite this post</h2>
              <p className="font-mono text-sm text-stone-300 leading-relaxed">
                Peele, Stefan. &ldquo;{title}.&rdquo; <em>{SITE.title}</em>, {publishDate}. {url.replace(/^https?:\/\//, '')}
              </p>
            </div>

            <Comments term={slug} />

            <div className="mt-16" data-print-hide>
              <NewsletterForm source={`article:${slug}`} />
            </div>
          </main>

          {readNext.length > 0 && (
            <section className="max-w-3xl mx-auto mt-20" aria-labelledby="read-next-heading">
              <div className="border-t border-white/5 pt-10 mb-6">
                <h2 id="read-next-heading" className="font-mono text-[10px] tracking-[0.4em] uppercase text-stone-400 border-l border-stone-700 pl-4">
                  What to Read Next
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {readNext.map(({ post: p, label, icon }) => (
                  <Link
                    key={label}
                    href={`/blog/${p!.slug}`}
                    className="group flex flex-col gap-3 p-5 border border-white/[0.08] rounded-xl hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.04] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
                  >
                    <span className="font-mono text-[9px] uppercase tracking-widest text-stone-500">
                      {icon} {label}
                    </span>
                    <span className="font-serif text-sm text-stone-300 group-hover:text-white transition-colors leading-snug">
                      {p!.title}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <div className="max-w-3xl mx-auto mt-8">
            <SwipeNavigation nextPost={nextPost} />
          </div>
        </div>

        <ArticleEffects />
        <MobileTOC />
        <ReadingRuler />
      </div>
    </ArticleProvider>
  )
}
