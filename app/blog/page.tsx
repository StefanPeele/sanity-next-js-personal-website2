import { client } from '@/sanity/lib/client'
import Link from 'next/link'

// 1. Fetch all posts and order them by newest first
const postsQuery = `*[_type == "post"] | order(publishedAt desc) {
  _id,
  title,
  "slug": slug.current,
  publishedAt,
  excerpt
}`

export default async function BlogPage() {
  const posts = await client.fetch(postsQuery)

  return (
    <main className="container mx-auto px-5 py-20">
      <h1 className="text-4xl md:text-5xl font-bold mb-12 text-center">The Blog</h1>

      {/* The Grid Layout */}
      <div className="max-w-4xl mx-auto grid gap-8 md:grid-cols-2">
        {posts.map((post: any) => (
          /* The Link wraps the whole card so it's clickable! */
          <Link href={`/blog/${post.slug}`} key={post._id} className="block group">
            <div className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition duration-200 h-full flex flex-col">
              
              <h2 className="text-2xl font-bold mb-2 group-hover:text-blue-600 transition">
                {post.title}
              </h2>
              
              {post.publishedAt && (
                <p className="text-sm text-gray-500 mb-4">
                  {new Date(post.publishedAt).toLocaleDateString()}
                </p>
              )}
              
              <p className="text-gray-600 flex-grow">
                {post.excerpt || "Read more about this topic..."}
              </p>
              
              <div className="mt-6 font-semibold text-black flex items-center gap-2">
                Read Article <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>

            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}