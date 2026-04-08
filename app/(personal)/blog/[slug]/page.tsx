import { client } from '@/sanity/lib/client'
import { CustomPortableText } from '@/components/CustomPortableText'
import ImageBox from '@/components/ImageBox'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArticleClientTools } from './ArticleClientTools'
//blog/[slug]/page.tsx
// Updated Query to grab categories
const postQuery = `*[_type == "post" && slug.current == $slug][0] {
  _id,
  title,
  "slug": slug.current,
  publishedAt,
  mainImage,
  body,
  "categories": categories[]->title
}`

// Helper to calculate accurate reading time from the rich text body
const getReadingTime = (blocks: any[]) => {
  const text = blocks?.map(b => b.children?.map((c: any) => c.text).join('')).join('') || '';
  const words = text.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

type Props = {
  params: Promise<{slug: string}>
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = await client.fetch(postQuery, { slug })

  if (!post) notFound()

  const readTime = getReadingTime(post.body || [])
  const publishDate = post.publishedAt 
    ? new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) 
    : 'Unknown Date'

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-stone-300 selection:bg-stone-500/30 font-sans pb-32">
      
      {/* Cinematic Header */}
      <header className="relative w-full h-[60vh] md:h-[70vh] flex items-end justify-center pb-16 md:pb-24 border-b border-white/5">
        <div className="absolute inset-0 z-0">
           {post.mainImage ? (
              <ImageBox image={post.mainImage as any} alt={post.title} classesWrapper="w-full h-full object-cover grayscale opacity-30" />
           ) : (
              <div className="w-full h-full bg-[#0a0a0a]" />
           )}
           {/* Fade into the dark background */}
           <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />
        </div>

        <div className="relative z-10 w-full max-w-3xl px-6 mx-auto text-center">
          <Link href="/blog" className="text-stone-500 hover:text-white font-mono text-[10px] uppercase tracking-[0.3em] transition-colors mb-8 inline-block">
            ← Return to Archive
          </Link>
          
          <div className="flex gap-2 justify-center mb-6 flex-wrap">
              {post.categories?.map((cat: string) => (
                <span key={cat} className="text-stone-400 font-mono text-[9px] tracking-[0.2em] uppercase border border-stone-800 px-3 py-1 rounded-sm backdrop-blur-md bg-black/20">
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
            <span>{readTime} MIN READ</span>
          </div>
        </div>
      </header>

      <main className="relative max-w-3xl mx-auto px-6 mt-16 md:mt-24">
        {/* Dark Mode Article Body Formatting */}
        <div className="prose prose-invert prose-lg md:prose-xl max-w-none text-stone-400 
          prose-headings:font-serif prose-headings:text-white 
          prose-a:text-white hover:prose-a:text-stone-300 prose-a:decoration-stone-600 prose-a:underline-offset-4
          prose-strong:text-stone-200 prose-img:rounded-xl prose-img:border prose-img:border-white/5
          prose-blockquote:border-l-stone-600 prose-blockquote:text-stone-500 prose-blockquote:font-serif prose-blockquote:italic">
          
          {post.body ? (
            <CustomPortableText value={post.body as any} />
          ) : (
            <p className="italic text-stone-600 text-center">No classified data provided yet.</p>
          )}
        </div>

        {/* Client Tools: Progress Bar, Citation Generator, Copy Link */}
        <ArticleClientTools 
          title={post.title} 
          author="Stefan Peele" 
          date={publishDate} 
          slug={post.slug} 
        />
      </main>
    </div>
  )
}