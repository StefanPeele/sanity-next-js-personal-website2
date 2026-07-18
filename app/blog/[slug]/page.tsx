import { client } from '@/sanity/lib/client'
import { CustomPortableText } from '@/components/CustomPortableText'
import ImageBox from '@/components/ImageBox'
import { Navbar } from '@/components/Navbar'
import { BlogBackground } from '@/components/blog/BlogBackground'
import { SourcesList } from '@/components/blog/SourcesList'
import { ArticleFloatingToolbar } from '@/components/blog/ArticleFloatingToolbar'
import { ArticleProgressRail } from '@/components/blog/ArticleProgressRail'
import { CredibilitySection } from '@/components/blog/CredibilitySection'
import { ConceptCards } from '@/components/blog/LearningBlocks'
import { ReadingTracker } from '@/components/blog/ReadingTracker'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
// app/blog/[slug]/page.tsx

interface BlockChild { _type: string; _key: string; text?: string }
interface Block      { _type: string; _key: string; children?: BlockChild[] }

const ARTICLE_TYPE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  'perspective':       { label: 'Perspective',       icon: '🔭', color: 'text-violet-400 border-violet-500/30' },
  'concept-deep-dive': { label: 'Concept Deep Dive', icon: '⚡', color: 'text-amber-400  border-amber-500/30' },
  'field-notes':       { label: 'Field Notes',       icon: '🔧', color: 'text-emerald-400 border-emerald-500/30' },
  'transmission':      { label: 'Transmission',      icon: '📡', color: 'text-blue-400   border-blue-500/30' },
}

const postQuery = `*[_type == "post" && slug.current == $slug][0] {
  _id, title, "slug": slug.current, publishedAt,
  mainImage, "mainImageUrl": mainImage.asset->url,
  body, excerpt, "categories": categories[]->title,
  articleType, confidenceLevel, maturityIndicator, cognitiveLoad, recommendedTheme,
  learningObjectives,
  prerequisites[] {
    _key, description,
    "post": post->{ title, "slug": slug.current }
  },
  conceptCards[] { _key, front, back },
  "readNextGoDeeper":  readNextGoDeeper->{ title, "slug": slug.current, excerpt, "imageUrl": mainImage.asset->url },
  "readNextGoBroader": readNextGoBroader->{ title, "slug": slug.current, excerpt, "imageUrl": mainImage.asset->url },
  "readNextApplyThis": readNextApplyThis->{ title, "slug": slug.current, excerpt, "imageUrl": mainImage.asset->url },
  reviewStatus,
  reviewers[] { _key, name, role, organization, quote, date, linkedIn },
  changelog[]  { _key, date, description },
  responsesFromField[] { _key, title, url, author, platform, summary, date },
  sources[] { _key, title, url, author, type, description }
}`

const settingsQuery = `*[_type == "settings"][0]`
const allSlugsQuery = `*[_type == "post" && defined(slug.current)]{ "slug": slug.current }`

type Props = { params: Promise<{ slug: string }> }

function getReadingTime(blocks: Block[]): number {
  const text = blocks?.map((b) => b.children?.map((c) => c.text ?? '').join('')).join('') ?? ''
  return Math.max(1, Math.ceil(text.split(/\s+/).length / 200))
}

function countWords(blocks: Block[]): number {
  const text = blocks?.map((b) => b.children?.map((c) => c.text ?? '').join('')).join('') ?? ''
  return text.split(/\s+/).length
}

export async function generateStaticParams() {
  const slugs: { slug: string }[] = await client.fetch(allSlugsQuery)
  return slugs.map(({ slug }) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await client.fetch<any>(postQuery, { slug })
  if (!post) return { title: 'Post Not Found' }
  const title       = `${post.title} | Stefan Peele`
  const description = post.excerpt ?? 'Networking insights, CCNA labs, and deep-dives from Stefan Peele.'
  const ogImages    = post.mainImageUrl ? [{ url: post.mainImageUrl, width: 1200, height: 630, alt: post.title }] : []
  return {
    title, description,
    openGraph: { title, description, type: 'article', publishedTime: post.publishedAt, url: `https://stefanpeele.com/blog/${slug}`, images: ogImages },
    twitter: { card: 'summary_large_image', title, description, images: ogImages.map((i: any) => i.url) },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const [post, settings] = await Promise.all([
    client.fetch<any>(postQuery, { slug }),
    client.fetch<any>(settingsQuery),
  ])
  if (!post) notFound()

  const readTime    = getReadingTime(post.body ?? [])
  const wordCount   = countWords(post.body ?? [])
  const publishDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : 'Unknown Date'

  const typeConfig = post.articleType ? ARTICLE_TYPE_CONFIG[post.articleType] : null
  const hasReadNext = post.readNextGoDeeper || post.readNextGoBroader || post.readNextApplyThis

  return (
    <div className="relative min-h-screen bg-transparent text-stone-300 selection:bg-stone-500/30 pb-32">
      <BlogBackground />
      <Navbar data={settings} />
      <ArticleFloatingToolbar />
      <ArticleProgressRail totalWords={wordCount} />

      {/* ── Cinematic header ─────────────────────────────────────── */}
      <header className="relative w-full h-[65vh] md:h-[72vh] flex items-end justify-center pb-16 md:pb-24 border-b border-white/5">
        <div className="absolute inset-0 z-0">
          {post.mainImage ? (
            <ImageBox
              image={post.mainImage}
              alt={post.title}
              classesWrapper="w-full h-full object-cover grayscale opacity-25"
            />
          ) : (
            <div className="w-full h-full" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/65 to-transparent" />
        </div>

        <div className="relative z-10 w-full max-w-3xl px-6 mx-auto text-center">
          <Link href="/blog" className="text-stone-500 hover:text-white font-mono text-[10px] uppercase tracking-[0.3em] transition-colors mb-8 inline-block">
            ← Return to Archive
          </Link>

          {/* Type badge */}
          {typeConfig && (
            <div className="flex justify-center mb-5">
              <span className={`font-mono text-[9px] uppercase tracking-[0.3em] px-3 py-1.5 rounded-sm border ${typeConfig.color}`}>
                {typeConfig.icon} {typeConfig.label}
              </span>
            </div>
          )}

          {/* Categories */}
          <div className="flex gap-2 justify-center mb-5 flex-wrap">
            {post.categories?.map((cat: string) => (
              <span key={cat} className="text-stone-400 font-mono text-[9px] tracking-[0.2em] uppercase border border-stone-700 px-3 py-1 rounded-sm backdrop-blur-md bg-black/20">
                {cat}
              </span>
            ))}
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white mb-6 leading-tight tracking-tight">
            {post.title}
          </h1>

          {/* Metadata row */}
          <div className="flex items-center justify-center gap-4 font-mono text-[10px] text-stone-400 uppercase tracking-widest flex-wrap">
            <span>{publishDate}</span>
            <span className="text-stone-700">•</span>
            <span>{readTime} min read</span>
            {post.sources?.length > 0 && (
              <><span className="text-stone-700">•</span><span>{post.sources.length} source{post.sources.length !== 1 ? 's' : ''}</span></>
            )}
            {post.conceptCards?.length > 0 && (
              <><span className="text-stone-700">•</span><span>{post.conceptCards.length} concept cards</span></>
            )}
          </div>
        </div>
      </header>

      {/* ── Article body ─────────────────────────────────────────── */}
      <main className="relative max-w-3xl mx-auto px-6 mt-16 md:mt-20">

        {/* Prerequisites */}
        {post.prerequisites?.length > 0 && (
          <div className="mb-10 p-5 rounded-xl border border-white/8 bg-white/[0.02]">
            <span className="font-mono text-[9px] uppercase tracking-[0.35em] text-stone-600 block mb-3">Before this — you should understand:</span>
            <ul className="space-y-2">
              {post.prerequisites.map((prereq: any) => (
                <li key={prereq._key} className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-stone-500">→</span>
                  {prereq.post?.slug ? (
                    <Link href={`/blog/${prereq.post.slug}`} className="font-mono text-[11px] text-stone-300 hover:text-white transition-colors underline underline-offset-4 decoration-stone-700 hover:decoration-stone-400">
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
        {post.learningObjectives?.length > 0 && (
          <div className="mb-10 pl-5 border-l-2 border-stone-700">
            <span className="font-mono text-[9px] uppercase tracking-[0.35em] text-stone-600 block mb-3">After this post you'll be able to:</span>
            <ul className="space-y-2">
              {post.learningObjectives.map((obj: string, i: number) => (
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
          className="prose-custom text-base md:text-[17px] leading-[1.85]"
        >
          {post.body ? (
            <CustomPortableText value={post.body} />
          ) : (
            <p className="italic text-stone-600 text-center">No content yet.</p>
          )}
        </div>

        {/* Concept cards */}
        {post.conceptCards?.length > 0 && (
          <ConceptCards cards={post.conceptCards} />
        )}

        {/* Sources */}
        {post.sources?.length > 0 && (
          <SourcesList sources={post.sources} />
        )}

        {/* Credibility section */}
        <CredibilitySection
          reviewStatus={post.reviewStatus}
          reviewers={post.reviewers}
          changelog={post.changelog}
          responsesFromField={post.responsesFromField}
          confidenceLevel={post.confidenceLevel}
          maturityIndicator={post.maturityIndicator}
          cognitiveLoad={post.cognitiveLoad}
        />

        {/* Citation block — copy link is available in the floating toolbar */}
        <div className="mt-16 p-6 md:p-8 bg-[#111] border border-white/8 rounded-xl">
          <h3 className="font-mono text-[10px] text-stone-500 uppercase tracking-widest mb-3">Cite This Post</h3>
          <p className="font-mono text-sm text-stone-400 leading-relaxed mb-4">
            Peele, Stefan. &ldquo;{post.title}.&rdquo; <em>Stefan Peele | Digital Archive</em>, {publishDate}. stefanpeele.com/blog/{slug}
          </p>
          <p className="font-mono text-[9px] text-stone-700 uppercase tracking-widest">
            Use the toolbar → to copy the link to this post
          </p>
        </div>
      </main>

      {/* ── What to read next ─────────────────────────────────────── */}
      {hasReadNext && (
        <section className="max-w-3xl mx-auto px-6 mt-20">
          <div className="border-t border-white/5 pt-10 mb-8">
            <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-stone-500 border-l border-stone-700 pl-4">
              What to Read Next
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { post: post.readNextGoDeeper,  label: 'Go Deeper',    icon: '⬇' },
              { post: post.readNextGoBroader, label: 'Go Broader',   icon: '↔' },
              { post: post.readNextApplyThis, label: 'Apply This',   icon: '→' },
            ].filter(({ post: p }) => !!p).map(({ post: p, label, icon }) => (
              <Link key={label} href={`/blog/${p.slug}`} className="group flex flex-col gap-3 p-5 border border-white/8 rounded-xl hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                <span className="font-mono text-[8px] uppercase tracking-widest text-stone-600">{icon} {label}</span>
                <h4 className="font-serif text-sm text-stone-300 group-hover:text-white transition-colors leading-snug">
                  {p.title}
                </h4>
              </Link>
            ))}
          </div>
        </section>
      )}

      <ReadingTracker />
    </div>
  )
}