import { client } from '@/sanity/lib/client'
import { CustomPortableText } from '@/components/CustomPortableText'
import ImageBox from '@/components/ImageBox'
import { Navbar } from '@/components/Navbar'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ArticleClientTools } from './ArticleClientTools'
import { ReadingTracker } from '@/components/blog/ReadingTracker'
// app/blog/[slug]/page.tsx

// ── Queries ───────────────────────────────────────────────────────────
const postQuery = `*[_type == "post" && slug.current == $slug][0] {
  _id,
  title,
  "slug": slug.current,
  publishedAt,
  mainImage,
  "mainImageUrl": mainImage.asset->url,
  body,
  excerpt,
  "categories": categories[]->title
}`

// Fetch posts in the same categories, excluding the current post
const relatedQuery = `*[
  _type == "post" &&
  slug.current != $slug &&
  count((categories[]->title)[@ in $categories]) > 0
] | order(publishedAt desc)[0..2] {
  _id,
  title,
  "slug": slug.current,
  publishedAt,
  "imageUrl": mainImage.asset->url,
  "categories": categories[]->title
}`

const settingsQuery  = `*[_type == "settings"][0]`
const allSlugsQuery  = `*[_type == "post" && defined(slug.current)]{ "slug": slug.current }`

// ── Types ─────────────────────────────────────────────────────────────
type Props = { params: Promise<{ slug: string }> }

interface RelatedPost {
  _id: string
  title: string
  slug: string
  publishedAt: string
  imageUrl?: string
  categories?: string[]
}

// ── Helpers ───────────────────────────────────────────────────────────
function getReadingTime(blocks: any[]): number {
  const text =
    blocks
      ?.map((b) => b.children?.map((c: { text?: string }) => c.text ?? '').join(''))
      .join('') ?? ''
  return Math.max(1, Math.ceil(text.split(/\s+/).length / 200))
}

// ── Static params — prebakes every post at build time ─────────────────
export async function generateStaticParams() {
  const slugs: { slug: string }[] = await client.fetch(allSlugsQuery)
  return slugs.map(({ slug }) => ({ slug }))
}

// ── Dynamic SEO metadata ──────────────────────────────────────────────
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await client.fetch(postQuery, { slug })

  if (!post) return { title: 'Post Not Found' }

  const title       = `${post.title} | Stefan Peele`
  const description = post.excerpt ?? 'Networking insights, CCNA labs, and deep-dives from Stefan Peele.'
  const ogImages    = post.mainImageUrl
    ? [{ url: post.mainImageUrl, width: 1200, height: 630, alt: post.title }]
    : []

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: post.publishedAt,
      url: `https://stefanpeele.com/blog/${slug}`,
      images: ogImages,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImages.map((i) => i.url),
    },
  }
}

// ── Page ──────────────────────────────────────────────────────────────
export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params

  const [post, settings] = await Promise.all([
    client.fetch(postQuery, { slug }),
    client.fetch(settingsQuery),
  ])

  if (!post) notFound()

  // Fetch related posts only if we have categories to match against
  const relatedPosts: RelatedPost[] = post.categories?.length
    ? await client.fetch(relatedQuery, { slug, categories: post.categories })
    : []

  const readTime    = getReadingTime(post.body ?? [])
  const publishDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric',
      })
    : 'Unknown Date'

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-stone-300 selection:bg-stone-500/30 font-sans pb-32">

      <Navbar data={settings} />

      {/* ── Cinematic header ─────────────────────────────────────── */}
      <header className="relative w-full h-[60vh] md:h-[70vh] flex items-end justify-center pb-16 md:pb-24 border-b border-white/5">
        <div className="absolute inset-0 z-0">
          {post.mainImage ? (
            <ImageBox
              image={post.mainImage}
              alt={post.title}
              classesWrapper="w-full h-full object-cover grayscale opacity-30"
            />
          ) : (
            <div className="w-full h-full bg-[#0a0a0a]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />
        </div>

        <div className="relative z-10 w-full max-w-3xl px-6 mx-auto text-center">
          <Link
            href="/blog"
            className="text-stone-500 hover:text-white font-mono text-[10px] uppercase tracking-[0.3em] transition-colors mb-8 inline-block"
          >
            ← Return to Archive
          </Link>

          <div className="flex gap-2 justify-center mb-6 flex-wrap">
            {post.categories?.map((cat: string) => (
              <span
                key={cat}
                className="text-stone-400 font-mono text-[9px] tracking-[0.2em] uppercase border border-stone-800 px-3 py-1 rounded-sm backdrop-blur-md bg-black/20"
              >
                {cat}
              </span>
            ))}
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white mb-6 leading-tight tracking-tight">
            {post.title}
          </h1>

          <div className="flex items-center justify-center gap-4 font-mono text-[10px] text-stone-500 uppercase tracking-widest">
            <span>{publishDate}</span>
            <span>•</span>
            <span>{readTime} min read</span>
          </div>
        </div>
      </header>

      {/* ── Article body ─────────────────────────────────────────── */}
      <main className="relative max-w-3xl mx-auto px-6 mt-16 md:mt-24">
        <div className="prose prose-invert prose-lg md:prose-xl max-w-none text-stone-400
          prose-headings:font-serif prose-headings:text-white
          prose-a:text-white hover:prose-a:text-stone-300 prose-a:decoration-stone-600 prose-a:underline-offset-4
          prose-strong:text-stone-200 prose-img:rounded-xl prose-img:border prose-img:border-white/5
          prose-blockquote:border-l-stone-600 prose-blockquote:text-stone-500 prose-blockquote:font-serif prose-blockquote:italic">
          {post.body ? (
            <CustomPortableText value={post.body} />
          ) : (
            <p className="italic text-stone-600 text-center">
              No classified data provided yet.
            </p>
          )}
        </div>

        <ArticleClientTools
          title={post.title}
          author="Stefan Peele"
          date={publishDate}
          slug={post.slug}
        />
      </main>

      {/* ── Related posts ─────────────────────────────────────────── */}
      {relatedPosts.length > 0 && (
        <section className="max-w-3xl mx-auto px-6 mt-20">
          <div className="border-t border-white/5 pt-10 mb-8">
            <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-stone-500 border-l border-stone-700 pl-4">
              Continue Reading
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {relatedPosts.map((related) => (
              <Link
                key={related._id}
                href={`/blog/${related.slug}`}
                className="group flex flex-col gap-3"
              >
                <div className="aspect-[4/3] w-full overflow-hidden rounded-lg border border-white/5 relative">
                  <div className="absolute inset-0 z-10 bg-black/20 group-hover:bg-transparent transition-all duration-500" />
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                    style={{
                      backgroundImage: `url(${related.imageUrl || '/fabshots2026051.jpg'})`,
                      filter: 'grayscale(60%)',
                    }}
                  />
                </div>

                <div>
                  <div className="flex gap-2 mb-2 flex-wrap">
                    {related.categories?.slice(0, 1).map((cat) => (
                      <span
                        key={cat}
                        className="font-mono text-[8px] tracking-[0.2em] uppercase border border-stone-800 text-stone-500 px-2 py-0.5 rounded-sm"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                  <h3 className="font-serif text-base text-stone-300 group-hover:text-white transition-colors leading-snug mb-2">
                    {related.title}
                  </h3>
                  <span className="font-mono text-[9px] text-stone-700 uppercase tracking-widest group-hover:text-stone-400 transition-colors">
                    Read →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <ReadingTracker />
    </div>
  )
}