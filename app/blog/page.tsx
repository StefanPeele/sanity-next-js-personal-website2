import { client } from '@/sanity/lib/client'
import Link from 'next/link'

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
      <h1 className="text-4xl md:text-5xl font-bold mb-12 text-center text-stone-800 font-serif">The Blog</h1>

      <div className="max-w-4xl mx-auto grid gap-8 md:grid-cols-2">
        {posts.map((post: any) => (
          <Link href={`/blog/${post.slug}`} key={post._id} className="block group">
            {/* UPGRADED CARD: Clean white, soft round corners, floating shadow effect */}
            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col border border-stone-100">
              
              {/* UPGRADED TITLE: Uses Lora font and turns Soft Navy on hover */}
              <h2 className="text-2xl font-bold mb-3 text-stone-800 group-hover:text-[#4A5D6E] transition-colors font-serif">
                {post.title}
              </h2>
              
              {post.publishedAt && (
                <p className="text-stone-400 mb-4 font-sans uppercase tracking-wider text-xs font-bold">
                  {new Date(post.publishedAt).toLocaleDateString()}
                </p>
              )}
              
              <p className="text-stone-600 flex-grow font-sans leading-relaxed">
                {post.excerpt || "Read more about this topic..."}
              </p>
              
              {/* UPGRADED LINK: Soft Navy accent color */}
              <div className="mt-8 font-bold text-[#4A5D6E] flex items-center gap-2 font-sans">
                Read Article <span className="group-hover:translate-x-2 transition-transform duration-300">→</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}