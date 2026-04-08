import { client } from '@/sanity/lib/client'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
// this is Blog/page.tsx
// Updated Query: Grabs settings, image URLs, categories, and separates the featured post
const blogDataQuery = `{
  "settings": *[_type == "settings"][0],
  "featuredPost": *[_type == "post" && isFeatured == true] | order(publishedAt desc)[0] {
    _id,
    title,
    "slug": slug.current,
    publishedAt,
    excerpt,
    "imageUrl": mainImage.asset->url,
    "categories": categories[]->title
  },
  "posts": *[_type == "post" && (isFeatured != true || !defined(isFeatured))] | order(publishedAt desc) {
    _id,
    title,
    "slug": slug.current,
    publishedAt,
    excerpt,
    "imageUrl": mainImage.asset->url,
    "categories": categories[]->title
  }
}`

// Helper function to estimate reading time
const getReadingTime = (text: string) => {
  const words = text ? text.split(/\s+/).length : 0;
  // Multiplying excerpt by 5 as a rough guess for the full body if we only fetch excerpt here.
  // We will do exact math on the actual slug page.
  const time = Math.ceil((words * 5) / 200); 
  return time < 1 ? 1 : time;
}

export default async function BlogPage() {
  const { settings, featuredPost, posts } = await client.fetch(blogDataQuery)

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-stone-300 selection:bg-stone-500/30">
      <Navbar data={settings} />

      <main className="max-w-7xl mx-auto px-6 pt-32 pb-24">
        
        {/* HEADER */}
        <header className="mb-16 border-b border-white/5 pb-8 flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
            <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-stone-500 block mb-4 border-l border-stone-700 pl-4">
              Intelligence // Archive
            </span>
            <h1 className="text-5xl md:text-7xl font-serif font-bold tracking-tight text-white leading-none">
              Editorial<span className="text-stone-600">.</span>
            </h1>
          </div>
          <div className="font-mono text-[9px] uppercase tracking-widest text-stone-500 text-right">
            Total Intel Modules: {(posts?.length || 0) + (featuredPost ? 1 : 0)} <br/>
            Status: Secure Connection
          </div>
        </header>

        {/* HERO FEATURED POST */}
        {featuredPost && (
          <Link href={`/blog/${featuredPost.slug}`} className="block group mb-24 relative overflow-hidden rounded-lg border border-white/5">
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent transition-opacity duration-500 group-hover:opacity-90" />
            
            {/* Background Image */}
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105"
              style={{ backgroundImage: `url(${featuredPost.imageUrl || '/fabshots2026051.jpg'})`, filter: 'grayscale(80%)' }}
            />

            <div className="relative z-20 pt-96 pb-12 px-8 md:px-16 flex flex-col justify-end h-full">
              <div className="flex gap-3 mb-4">
                <span className="bg-white text-black font-mono text-[9px] tracking-[0.2em] uppercase px-3 py-1 rounded-sm">
                  Featured Intel
                </span>
                {featuredPost.categories?.map((cat: string) => (
                  <span key={cat} className="border border-stone-700 text-stone-400 font-mono text-[9px] tracking-[0.2em] uppercase px-3 py-1 rounded-sm backdrop-blur-md">
                    {cat}
                  </span>
                ))}
              </div>

              <h2 className="text-4xl md:text-6xl font-serif font-bold text-white mb-4 group-hover:text-stone-300 transition-colors">
                {featuredPost.title}
              </h2>
              
              <p className="text-stone-400 font-sans md:text-lg max-w-2xl mb-6 line-clamp-2">
                {featuredPost.excerpt}
              </p>

              <div className="flex items-center gap-4 font-mono text-[10px] text-stone-500 uppercase tracking-widest">
                <span>{new Date(featuredPost.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                <span>•</span>
                <span>{getReadingTime(featuredPost.excerpt)} MIN READ</span>
              </div>
            </div>
          </Link>
        )}

        {/* STANDARD POSTS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts?.map((post: any) => (
            <Link href={`/blog/${post.slug}`} key={post._id} className="group flex flex-col space-y-4">
              <div className="aspect-[4/3] w-full overflow-hidden rounded-lg border border-white/5 relative">
                <div className="absolute inset-0 z-10 bg-black/20 group-hover:bg-transparent transition-all duration-500" />
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{ backgroundImage: `url(${post.imageUrl || '/fabshots2026051.jpg'})`, filter: 'grayscale(50%)' }}
                />
              </div>

              <div className="flex flex-col flex-grow">
                <div className="flex gap-2 mb-3 flex-wrap">
                  {post.categories?.slice(0, 2).map((cat: string) => (
                    <span key={cat} className="text-stone-500 font-mono text-[8px] tracking-[0.2em] uppercase border border-stone-800 px-2 py-1 rounded-sm">
                      {cat}
                    </span>
                  ))}
                </div>
                
                <h3 className="text-2xl font-serif text-white group-hover:text-stone-300 transition-colors mb-2">
                  {post.title}
                </h3>
                
                <p className="text-stone-500 text-sm line-clamp-2 mb-4 flex-grow">
                  {post.excerpt}
                </p>

                <div className="flex items-center justify-between font-mono text-[9px] text-stone-600 uppercase tracking-widest border-t border-white/5 pt-4">
                  <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                  <span className="group-hover:text-white transition-colors">Read →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

      </main>
    </div>
  )
}