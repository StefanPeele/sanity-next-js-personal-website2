import { client } from '@/sanity/lib/client'
import { sanityFetch } from '@/sanity/lib/live'
import { postBySlugQuery, postSlugsQuery } from '@/sanity/lib/queries'
import { CustomPortableText } from '@/components/CustomPortableText'
import { SourcesList } from '@/components/blog/SourcesList'
import { ArticleFloatingToolbar } from '@/components/blog/ArticleFloatingToolbar'
import { ArticleProgressRail } from '@/components/blog/ArticleProgressRail'
import { CredibilitySection } from '@/components/blog/CredibilitySection'
import { ConceptCards } from '@/components/blog/LearningBlocks'
import { ReadingTracker } from '@/components/blog/ReadingTracker'
import { BlogArticleHeader } from '@/components/blog/BlogArticleHeader'
import { MobileTOC } from '@/components/blog/MobileTOC'
import { SwipeNavigation } from '@/components/blog/SwipeNavigation'
import { ReadingRuler } from '@/components/blog/ReadingRuler'
import { ArticleEffects } from '@/components/blog/ArticleEffects'
import { ARTICLE_THEME_CSS } from '@/lib/articleThemeStyles'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
// app/(archive)/blog/[slug]/page.tsx

interface BlockChild { _type: string; _key: string; text?: string }
interface Block      { _type: string; _key: string; children?: BlockChild[] }


type Props = { params: Promise<{ slug: string }> }

function getReadingTime(blocks: Block[]): number {
  const text = blocks?.map((b) => b.children?.map((c) => c.text ?? '').join('')).join('') ?? ''
  return Math.max(1, Math.ceil(text.split(/\s+/).length / 200))
}

function countWords(blocks: Block[]): number {
  const text = blocks?.map((b) => b.children?.map((c) => c.text ?? '').join('')).join('') ?? ''
  return text.split(/\s+/).filter(Boolean).length
}

export async function generateStaticParams() {
  const slugs = await client.fetch(postSlugsQuery)
  return slugs.map(({ slug }) => ({ slug: slug! }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const { data: post } = await sanityFetch({ query: postBySlugQuery, params: { slug }, stega: false })
  if (!post) return { title: 'Post Not Found' }
  const title       = `${post.title} | Stefan Peele`
  const description = post.excerpt ?? 'Networking insights, CCNA labs, and deep-dives from Stefan Peele.'
  const ogImages    = post.mainImageUrl ? [{ url: post.mainImageUrl, width: 1200, height: 630, alt: post.title ?? "" }] : []
  return {
    title, description,
    openGraph: { title, description, type: 'article', publishedTime: post.publishedAt ?? undefined, url: `https://stefanpeele.com/blog/${slug}`, images: ogImages },
    twitter: { card: 'summary_large_image', title, description, images: ogImages.map((i: any) => i.url) },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const { data } = await sanityFetch({ query: postBySlugQuery, params: { slug } })
  const post = data as any
  if (!post) notFound()

  const readTime  = getReadingTime(post.body ?? [])
  const wordCount = countWords(post.body ?? [])
  const publishDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric',
      })
    : 'Unknown Date'

  const hasReadNext = post.readNextGoDeeper || post.readNextGoBroader || post.readNextApplyThis

  return (
    <div className="relative min-h-screen text-stone-300 selection:bg-stone-500/30 pb-32">

      {/* Full article theme system — all 4 themes + micro-interactions + accessibility */}
      <style dangerouslySetInnerHTML={{ __html: ARTICLE_THEME_CSS + `
        /* Dropcap on first paragraph */
        [data-article] > p:first-of-type::first-letter,
        [data-article] > div > p:first-of-type::first-letter {
          font-family: var(--font-serif), Georgia, serif;
          font-size: 4.2em;
          font-weight: 700;
          float: left;
          line-height: 0.8;
          margin-right: 0.08em;
          margin-top: 0.05em;
          color: #ffffff;
        }
      `}} />

      <ArticleFloatingToolbar />
      <ArticleProgressRail totalWords={wordCount} />

      {/* ── Cinematic parallax header ──────────────────────────── */}
      <BlogArticleHeader
        title={post.title}
        publishDate={publishDate}
        readTime={readTime}
        categories={post.categories ?? []}
        articleType={post.articleType}
        mainImageUrl={post.mainImageUrl}
        lqip={post.lqip}
        sourceCount={post.sources?.length ?? 0}
        conceptCardCount={post.conceptCards?.length ?? 0}
        reviewStatus={post.reviewStatus}
      />

      {/* ── Asymmetric article layout ──────────────────────────── */}
      {/* Max-width container is wider than the reading column.
          The reading column sits center-left, leaving right margin
          for the floating toolbar to inhabit naturally. */}
      <div className="relative max-w-5xl mx-auto px-6">

        {/* Reading column — constrained to comfortable width */}
        <main id="content" className="max-w-3xl mx-auto mt-16 md:mt-20">

          {/* Prerequisites */}
          {(post.prerequisites ?? []).length > 0 && (
            <div className="mb-10 p-5 rounded-xl border border-white/[0.08] bg-white/[0.02]">
              <span className="font-mono text-[9px] uppercase tracking-[0.35em] text-stone-600 block mb-3">
                Before this — you should understand:
              </span>
              <ul className="space-y-2">
                {(post.prerequisites ?? []).map((prereq: any) => (
                  <li key={prereq._key} className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-stone-500">→</span>
                    {prereq.post?.slug ? (
                      <Link
                        href={`/blog/${prereq.post.slug}`}
                        className="font-mono text-[11px] text-stone-300 hover:text-white transition-colors underline underline-offset-4 decoration-stone-700 hover:decoration-stone-400"
                      >
                        {prereq.description}
                      </Link>
                    ) : (
                      <span className="font-mono text-[11px] text-stone-400">{prereq.description}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Learning objectives */}
          {(post.learningObjectives ?? []).length > 0 && (
            <div className="mb-10 pl-5 border-l-2 border-stone-700">
              <span className="font-mono text-[9px] uppercase tracking-[0.35em] text-stone-600 block mb-3">
                After this post you'll be able to:
              </span>
              <ul className="space-y-2">
                {(post.learningObjectives ?? []).map((obj: string, i: number) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="font-mono text-[10px] text-stone-600 flex-shrink-0 mt-0.5">{i + 1}.</span>
                    <span className="font-mono text-[11px] text-stone-300 leading-relaxed">{obj}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Article body */}
          <div
            data-article
            className="max-w-3xl leading-[1.85] text-base md:text-[17px]"
          >
            {post.body ? (
              <CustomPortableText value={post.body} />
            ) : (
              <p className="italic text-stone-600 text-center py-12">No content yet.</p>
            )}
          </div>

          {/* Concept cards */}
          {(post.conceptCards ?? []).length > 0 && (
            <ConceptCards cards={post.conceptCards ?? []} />
          )}

          {/* Sources */}
          {(post.sources ?? []).length > 0 && (
            <SourcesList sources={post.sources ?? []} />
          )}

          {/* Credibility section */}
          <CredibilitySection
            reviewStatus={post.reviewStatus}
            reviewers={post.reviewers ?? []}
            changelog={post.changelog ?? []}
            responsesFromField={post.responsesFromField ?? []}
            confidenceLevel={post.confidenceLevel}
            maturityIndicator={post.maturityIndicator}
            cognitiveLoad={post.cognitiveLoad}
          />

          {/* Citation block */}
          <div className="mt-16 p-6 md:p-8 bg-[#111] border border-white/[0.08] rounded-xl">
            <h3 className="font-mono text-[10px] text-stone-500 uppercase tracking-widest mb-3">
              Cite This Post
            </h3>
            <p className="font-mono text-sm text-stone-400 leading-relaxed mb-3">
              Peele, Stefan. &ldquo;{post.title}.&rdquo; <em>Stefan Peele | Digital Archive</em>, {publishDate}. stefanpeele.com/blog/{slug}
            </p>
            <p className="font-mono text-[9px] text-stone-700 uppercase tracking-widest">
              Use the toolbar → to copy the link to this post
            </p>
          </div>
        </main>

        {/* ── What to read next ──────────────────────────────────── */}
        {hasReadNext && (
          <section className="max-w-3xl mx-auto mt-20">
            <div className="border-t border-white/5 pt-10 mb-6">
              <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-stone-500 border-l border-stone-700 pl-4">
                What to Read Next
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { post: post.readNextGoDeeper,  label: 'Go Deeper',  icon: '⬇' },
                { post: post.readNextGoBroader, label: 'Go Broader', icon: '↔' },
                { post: post.readNextApplyThis, label: 'Apply This', icon: '→' },
              ].filter(({ post: p }) => !!p).map(({ post: p, label, icon }) => (
                <Link
                  key={label}
                  href={`/blog/${p.slug}`}
                  className="group flex flex-col gap-3 p-5 border border-white/[0.08] rounded-xl hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.04] transition-all"
                >
                  <span className="font-mono text-[8px] uppercase tracking-widest text-stone-600">
                    {icon} {label}
                  </span>
                  <h4 className="font-serif text-sm text-stone-300 group-hover:text-white transition-colors leading-snug">
                    {p.title}
                  </h4>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Swipe between posts — mobile only */}
        <div className="max-w-3xl mx-auto mt-8">
          <SwipeNavigation
            nextPost={post.readNextGoDeeper ?? post.readNextGoBroader ?? null}
          />
        </div>
      </div>

      <ArticleEffects />
      <MobileTOC />
      <ReadingRuler />
      <ReadingTracker />
    </div>
  )
}