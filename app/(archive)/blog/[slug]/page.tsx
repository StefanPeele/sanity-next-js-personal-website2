import '@/styles/article.css'
import { client } from '@/sanity/lib/client'
import { sanityFetch } from '@/sanity/lib/live'
import { postBySlugQuery, postSlugsQuery } from '@/sanity/lib/queries'
import { articleUiQuery } from '@/sanity/lib/queries-article-ui'
import type { PostBySlugQueryResult } from '@/sanity.types'
import { CustomPortableText } from '@/components/CustomPortableText'
import { JsonLd } from '@/components/JsonLd'
import { NewsletterForm } from '@/components/NewsletterForm'
import { ArticleProvider } from '@/components/article/ArticleProvider'
import { ArticleToc } from '@/components/article/ArticleToc'
import { ReadingProgressBar } from '@/components/article/ReadingProgressBar'
import { heroImageUrl } from '@/components/article/heroImage'
import { SourcesList } from '@/components/blog/SourcesList'
import { CorrectionsList } from '@/components/blog/CorrectionsList'
import { CredibilitySection } from '@/components/blog/CredibilitySection'
import { ConceptCards } from '@/components/blog/LearningBlocks'
import { BlogArticleHeader } from '@/components/blog/BlogArticleHeader'
import { TldrBlock } from '@/components/blog/TldrBlock'
import { SeriesBanner } from '@/components/blog/SeriesBanner'
import { Checkpoint } from '@/components/blog/Checkpoint'
import { BacklinksSection } from '@/components/blog/Backlinks'
import { AskArticle } from '@/components/blog/AskArticle'
import { getCopy, getSettings, getTaxonomy } from '@/lib/cms/loaders'
import { DEFAULT_ARTICLE_UI } from '@/lib/cms/defaults/articleUi'
import { SITE, absoluteUrl, articleTypeMeta } from '@/lib/site'
import { formatDate } from '@/lib/dates'
import { readingTime } from '@/lib/reading'
import { reviewerDisplay, reviewerSummary } from '@/lib/reviewers'
import { effectiveReviewStatus, lastRevisedAt, revisionState } from '@/lib/status'
import { applyGlossaryMarks } from '@/lib/glossary'
import { applyCorrectionMarks } from '@/lib/corrections'
import { articleToMarkdown, buildStudyDeck, collectQuizzes, countStudyCards } from '@/lib/anki'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { PortableTextBlock } from 'next-sanity'
import { FOCUS } from '@/lib/ui'
// app/(archive)/blog/[slug]/page.tsx
// Layout: progress bar → text header → [reading column | sticky TOC]. One TOC, one settings menu.

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
  if (!post) return { title: 'Post not found' }
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
    openGraph: { title, description, type: 'article', url, publishedTime: post.publishedAt ?? undefined, modifiedTime: post._updatedAt ?? undefined, authors: [SITE.url], tags },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const [{ data }, ui, taxonomy, settings] = await Promise.all([
    sanityFetch({ query: postBySlugQuery, params: { slug } }),
    getCopy(articleUiQuery, DEFAULT_ARTICLE_UI),
    getTaxonomy(),
    getSettings(),
  ])
  const post = data as Post | null
  if (!post) notFound()

  // Reading time comes from the query's wordCount, the same field the cards read.
  // This page used to recount locally, which is how /blog said 17 min and this page
  // said 18 for the same post. One number, one source. See wordCountField.
  // Redact on the SERVER. CredibilitySection and ArticleToc are client components, so
  // anything handed to them is serialized into the RSC payload -- an anonymous reviewer's
  // real name would be readable in view-source even though no pixel shows it.
  const reviewerDisplays = (post.reviewers ?? []).map(reviewerDisplay)
  const reviewedBy = reviewerSummary(post.reviewers ?? [])

  const wordCount = post.wordCount ?? 0
  const readTime = readingTime(wordCount)
  const publishDate = formatDate(post.publishedAt, 'long', 'Unpublished')
  // 3.7. Derived from the changelog, never _updatedAt -- a typo fix must not announce a
  // revision. `revised` in the status list is the same signal, so it is derived here too
  // and every surface below reads `reviewStatus`, not post.reviewStatus.
  // 3B: corrections are material revisions too, so the date spans both arrays, and WHICH of
  // the three words applies (corrected / clarified / updated) comes from the correction
  // kinds rather than being collapsed into one "revised".
  const revision = revisionState(
    lastRevisedAt([...(post.changelog ?? []), ...(post.corrections ?? [])]),
    (post.corrections ?? []).map((c) => c.kind ?? null),
    post.publishedAt,
  )
  const updatedDate = revision.date ? formatDate(revision.date, 'long', '') : null
  const reviewStatus = effectiveReviewStatus(post.reviewStatus, revision.flag)
  // 3.6. Titles only, for the Contents column. The full citations stay in SourcesList at
  // the bottom of the article; the column links to them by index.
  const sourceTitles = (post.sources ?? []).map((sc) => sc.title ?? 'Untitled source')
  const title = post.title ?? 'Untitled'
  const url = absoluteUrl(`/blog/${slug}`)
  const lane = articleTypeMeta(post.articleType, taxonomy.articleLanes)
  const tags = ((post.tags ?? []) as unknown as Tag[]).filter((t) => t?.title)
  const categories = (post.categories ?? []).filter((c): c is string => !!c)

  // 3B runs AFTER the glossary pass and skips spans the glossary already marked, so a
  // corrected passage containing a glossary term does not nest two buttons.
  const marked = applyCorrectionMarks(applyGlossaryMarks(post.body ?? [], post.glossary), post.corrections)
  const body = marked.blocks as unknown as PortableTextBlock[]
  const corrections = marked.corrections

  const quizzes = collectQuizzes(post.body, post.checkpoint)
  const conceptCards = (post.conceptCards ?? []).map((c) => ({ _key: c._key, front: c.front ?? '', back: c.back ?? '' })).filter((c) => c.front && c.back)
  const deckCount = countStudyCards({ conceptCards, quizzes })
  const deckTsv = deckCount ? buildStudyDeck({ title, tags: tags.map((t) => t.title), conceptCards, quizzes }) : undefined
  const deck = deckTsv ? { filename: `${slug}-study-deck.txt`, tsv: deckTsv } : undefined
  const markdown = articleToMarkdown({ title, url, excerpt: post.excerpt, tldr: post.tldr, body: post.body })

  const B = ui.blocks
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
        author: { '@type': 'Person', name: settings.siteName, url: SITE.url },
        publisher: { '@type': 'Person', name: settings.siteName, url: SITE.url },
        keywords: [...tags.map((t) => t.title), ...categories].filter(Boolean).join(', ') || undefined,
        articleSection: lane?.label ?? categories[0],
        wordCount,
        timeRequired: `PT${readTime}M`,
        inLanguage: 'en-US',
        isPartOf: post.series?.slug ? { '@type': 'CreativeWorkSeries', name: post.series.title ?? undefined, url: absoluteUrl(`/blog/series/${post.series.slug}`) } : undefined,
        position: post.seriesOrder ?? undefined,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE.url },
          { '@type': 'ListItem', position: 2, name: ui.header.backLabel, item: absoluteUrl('/blog') },
          ...(post.series?.slug ? [{ '@type': 'ListItem', position: 3, name: post.series.title ?? 'Series', item: absoluteUrl(`/blog/series/${post.series.slug}`) }] : []),
          { '@type': 'ListItem', position: post.series?.slug ? 4 : 3, name: title, item: url },
        ],
      },
    ],
  }

  const menu = { copy: ui.readerMenu, markdown, deck }

  return (
    <ArticleProvider slug={slug} title={title} totalWords={wordCount} initialTheme={post.recommendedTheme}>
      {/* D5: the theme root. It used to be the <article> element, which sits inside a
          36rem column -- so a non-default theme painted a rounded rectangle floating in
          the middle of an otherwise unthemed page. This div is min-h-screen and full
          width, and covers the header, the TOC and the reading column together. Navbar
          and Footer stay outside it on purpose: they are shared with every other archive
          route, and a saved theme must not leak off the article. */}
      <div data-article-root className="relative min-h-screen text-stone-300 selection:bg-stone-500/30 pb-32">
        <JsonLd data={jsonLd} />
        <ReadingProgressBar color={lane?.color} />

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
          reviewStatus={reviewStatus}
          updatedDate={updatedDate}
          revisionFlag={revision.flag}
          labels={ui.header}
          lanes={taxonomy.articleLanes}
        />

        <div className="relative max-w-6xl mx-auto px-6 lg:grid lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-12 mt-12 md:mt-16">
          <main id="content" className="max-w-[36rem] mx-auto w-full transition-[max-width] duration-300" data-width="standard">
            <ArticleToc copy={ui} menu={menu} variant="mobile" reviewedBy={reviewedBy} sources={sourceTitles} />

            {post.series && <SeriesBanner series={post.series} currentSlug={slug} seriesOrder={post.seriesOrder} labels={ui.seriesBanner} />}

            {(post.tldr?.length ?? 0) > 0 && <TldrBlock items={post.tldr ?? []} articleType={post.articleType} heading={B.tldrHeading} sub={B.tldrSub} />}

            {(post.prerequisites?.length ?? 0) > 0 && (
              <aside className="mb-10 p-5 rounded-xl border border-edge bg-surface-veil" aria-labelledby="prereq-heading">
                <h2 id="prereq-heading" className="section-label mb-3">{B.prerequisitesHeading}</h2>
                <ul className="space-y-2">
                  {(post.prerequisites ?? []).map((prereq) => (
                    <li key={prereq._key} className="text-sm font-sans">
                      {prereq.post?.slug ? (
                        <Link href={`/blog/${prereq.post.slug}`} className={`text-stone-200 hover:text-white underline underline-offset-4 decoration-stone-600 hover:decoration-stone-300 ${FOCUS} rounded-sm`}>{prereq.description}</Link>
                      ) : (
                        <span className="text-stone-300">{prereq.description}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </aside>
            )}

            {showCheckpoint && post.checkpoint && (
              <Checkpoint
                heading={B.checkpointHeading}
                quiz={{ question: post.checkpoint.question ?? '', explanation: post.checkpoint.explanation, options: (post.checkpoint.options ?? []).map((o) => ({ _key: o._key, text: o.text ?? '', isCorrect: !!o.isCorrect })) }}
              />
            )}

            {(post.learningObjectives?.length ?? 0) > 0 && (
              <aside className="mb-10 pl-5 border-l-2 border-stone-700" aria-labelledby="objectives-heading">
                <h2 id="objectives-heading" className="section-label mb-3">{B.objectivesHeading}</h2>
                <ol className="space-y-2 list-decimal pl-5">
                  {(post.learningObjectives ?? []).map((obj, i) => <li key={i} className="text-sm font-sans text-stone-300 leading-relaxed">{obj}</li>)}
                </ol>
              </aside>
            )}

            <article data-article className="leading-[1.7]">
              {body.length > 0 ? <CustomPortableText value={body} article /> : <p className="italic text-stone-400 text-center py-12">{B.noContent}</p>}
            </article>

            {conceptCards.length > 0 && <ConceptCards cards={conceptCards} deck={deckTsv} deckCount={deckCount} deckFilename={`${slug}-study-deck.txt`} heading={B.conceptCardsHeading} />}

            {(post.sources?.length ?? 0) > 0 && (
              <SourcesList heading={B.sourcesHeading} sources={(post.sources ?? []).map((s) => ({ ...s, title: s.title ?? 'Untitled source', url: s.url ?? undefined, author: s.author ?? undefined, type: s.type ?? undefined, description: s.description ?? undefined }))} />
            )}

            {/* 3B. Before the credibility section: a reader who has just finished the piece
                should meet what was wrong with it before the apparatus about how it was
                checked. */}
            <CorrectionsList corrections={corrections} heading={B.correctionsHeading} />

            {hasCredibility && (
              <CredibilitySection
                heading={B.credibilityHeading}
                labels={ui.credibility}
                reviewStatus={reviewStatus}
                reviewers={reviewerDisplays}
                changelog={(post.changelog ?? []).map((c) => ({ _key: c._key, date: c.date ?? '', description: c.description ?? '' }))}
                responsesFromField={(post.responsesFromField ?? []).map((r) => ({ ...r, title: r.title ?? '', url: r.url ?? '#', author: r.author ?? undefined, platform: r.platform ?? undefined, summary: r.summary ?? undefined, date: r.date ?? undefined }))}
                confidenceLevel={post.confidenceLevel ?? undefined}
                maturityIndicator={post.maturityIndicator ?? undefined}
                cognitiveLoad={post.cognitiveLoad ?? undefined}
              />
            )}

            <BacklinksSection backlinks={post.backlinks} heading={B.backlinksHeading} />

            {askEnabled && <AskArticle slug={slug} heading={B.askHeading} placeholder={B.askPlaceholder} buttonLabel={B.askButton} />}

            <div className="mt-16" data-print-hide>
              <NewsletterForm source={`article:${slug}`} copy={settings.newsletter} />
            </div>
          </main>

          <ArticleToc copy={ui} menu={menu} variant="sidebar" reviewedBy={reviewedBy} sources={sourceTitles} />
        </div>
      </div>
    </ArticleProvider>
  )
}
