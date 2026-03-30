import { sanityFetch } from '@/sanity/lib/live'
import { galleryBySlugQuery } from '@/sanity/lib/queries'
import { urlForImage } from '@/sanity/lib/utils'
import Image from 'next/image'
import { notFound } from 'next/navigation'

type Props = {
  params: Promise<{ slug: string }>
}

export default async function GalleryPage({ params }: Props) {
  const { slug } = await params
  const { data: gallery } = await sanityFetch({
    query: galleryBySlugQuery,
    params: { slug },
  })

  if (!gallery) {
    notFound()
  }

  const themeColor = gallery.category?.themeColor?.hex || '#d6d3d1'

  return (
    <div className="space-y-12 pb-20">
      {/* HEADER SECTION */}
      <header className="space-y-4">
        <div 
          className="inline-block px-3 py-1 text-[10px] font-bold tracking-[0.2em] uppercase border rounded-full"
          style={{ 
            color: themeColor, 
            borderColor: `${themeColor}33`, 
            backgroundColor: `${themeColor}10` 
          }}
        >
          {gallery.category?.title || 'Editorial'}
        </div>
        
        {/* Using font-serif here will hook into your Lora font from layout.tsx */}
        <h1 className="text-5xl md:text-8xl font-serif text-white leading-tight tracking-tight">
          {gallery.title}
        </h1>
        
        <p className="max-w-2xl text-lg text-stone-400 leading-relaxed font-sans">
          {gallery.overview}
        </p>
      </header>

      {/* TECHNICAL SPECS BAR */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-8 py-10 border-y border-white/10 text-[11px] uppercase tracking-[0.15em] font-sans">
        <div>
          <span className="block text-stone-500 mb-2">System</span>
          <span className="text-stone-200">{gallery.system || '—'}</span>
        </div>
        <div>
          <span className="block text-stone-500 mb-2">Lens</span>
          <span className="text-stone-200">{gallery.lens || '—'}</span>
        </div>
        <div>
          <span className="block text-stone-500 mb-2">Film / ISO</span>
          <span className="text-stone-200">{gallery.iso || '—'}</span>
        </div>
        <div>
          <span className="block text-stone-500 mb-2">Location</span>
          <span className="text-stone-200">{gallery.location || '—'}</span>
        </div>
      </section>

      {/* IMAGE GRID - High fidelity layout */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {gallery.images?.map((img) => (
          <div key={img._key} className="relative group overflow-hidden bg-stone-950 rounded-sm">
            <Image
              src={urlForImage(img)?.url() || ''}
              alt={img.alt || gallery.title || 'Gallery Image'}
              width={1600}
              height={1200}
              className="object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
              placeholder="blur"
              blurDataURL={img.metadata?.lqip}
            />
            {img.caption && (
               <div className="absolute bottom-6 left-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500 text-[10px] uppercase tracking-widest text-white bg-black/40 px-3 py-2 backdrop-blur-md border border-white/10">
                 {img.caption}
               </div>
            )}
          </div>
        ))}
      </section>
      
      {gallery.notes && (
        <footer className="pt-16 border-t border-white/10">
           <span className="block text-[10px] uppercase tracking-[0.3em] text-stone-500 mb-6">Field Notes</span>
           <p className="text-stone-400 font-serif italic text-xl max-w-3xl leading-loose">
             "{gallery.notes}"
           </p>
        </footer>
      )}
    </div>
  )
}