import { client } from '@/sanity/lib/client'
import { CustomPortableText } from '@/components/CustomPortableText'
import ImageBox from '@/components/ImageBox'
import { notFound } from 'next/navigation'
import Link from 'next/link'

// 1. The GROQ Query: Fetch ONE post where the slug matches the URL
const postQuery = `*[_type == "post" && slug.current == $slug][0] {
  _id,
  title,
  publishedAt,
  mainImage,
  body
}`

type Props = {
  params: Promise<{slug: string}>
}

export default async function BlogPostPage({ params }: Props) {
  // 2. Grab the dynamic slug from the URL
  const { slug } = await params

  // 3. Fetch the specific post from Sanity
  const post = await client.fetch(postQuery, { slug })

  // 4. If someone types a bad URL, show a 404 page
  if (!post) {
    notFound()
  }

  // 5. Render the Article
  return (
    <main className="container mx-auto px-5 py-20 max-w-3xl">
      {/* Back Button */}
      <Link href="/blog" className="text-gray-500 hover:text-black font-semibold transition mb-10 inline-block">
        ← Back to Blog
      </Link>

      <article className="space-y-10">
        {/* Article Header */}
        <header className="space-y-4 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">{post.title}</h1>
          {post.publishedAt && (
            <p className="text-gray-500 font-medium">
              {new Date(post.publishedAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          )}
        </header>

        {/* Cover Image (using your template's custom component) */}
        {post.mainImage && (
          <div className="rounded-xl overflow-hidden shadow-lg border border-gray-100">
            <ImageBox
              image={post.mainImage as any}
              alt={`Cover image for ${post.title}`}
              classesWrapper="relative aspect-[16/9]"
            />
          </div>
        )}

        {/* Article Body (using your template's custom Rich Text component) */}
        <div className="prose prose-lg md:prose-xl max-w-none text-gray-700">
          {post.body ? (
            <CustomPortableText value={post.body as any} />
          ) : (
            <p className="italic text-gray-400 text-center">No content provided yet.</p>
          )}
        </div>
      </article>
    </main>
  )
}