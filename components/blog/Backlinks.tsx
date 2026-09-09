import Link from 'next/link'
import { FOCUS } from '@/lib/ui'
// components/blog/Backlinks.tsx
// "Referenced by" — every note, post, library item and project that links to this article.

interface Backlinks {
  notes: Array<{ _id: string; title: string | null; slug: string | null; status?: string | null }>
  posts: Array<{ _id: string; title: string | null; slug: string | null; articleType?: string | null }>
  library: Array<{ _id: string; title: string | null; mediaType?: string | null; author?: string | null }>
  projects: Array<{ _id: string; title: string | null; slug: string | null }>
}

export function BacklinksSection({ backlinks, heading = 'Referenced by' }: { backlinks: Backlinks | null | undefined; heading?: string }) {
  if (!backlinks) return null
  const notes = backlinks.notes.filter((n) => n.slug)
  const posts = backlinks.posts.filter((p) => p.slug)
  const library = backlinks.library
  const projects = backlinks.projects.filter((p) => p.slug)
  const total = notes.length + posts.length + library.length + projects.length
  if (!total) return null

  const linkClass = `font-serif text-sm text-stone-300 hover:text-white transition-colors underline decoration-stone-700 underline-offset-4 hover:decoration-white ${FOCUS} rounded-sm`
  const label = 'font-sans text-xs text-stone-400 w-16 flex-shrink-0 pt-1'

  return (
    <section className="mt-16 pt-10 border-t border-white/[0.08]" aria-labelledby="backlinks-heading">
      <div className="flex items-center gap-4 mb-6">
        <h2 id="backlinks-heading" className="section-label">{heading}</h2>
        <span className="font-sans text-xs text-stone-400">{total} link{total !== 1 ? 's' : ''}</span>
      </div>
      <ul className="space-y-3">
        {notes.map((n) => (
          <li key={n._id} className="flex items-start gap-3">
            <span className={label}>Note</span>
            <Link href={`/garden/${n.slug}`} className={linkClass}>{n.title}</Link>
            {n.status && <span className="font-mono text-[9px] text-stone-400 pt-1">{n.status}</span>}
          </li>
        ))}
        {posts.map((p) => (
          <li key={p._id} className="flex items-start gap-3">
            <span className={label}>Post</span>
            <Link href={`/blog/${p.slug}`} className={linkClass}>{p.title}</Link>
          </li>
        ))}
        {projects.map((p) => (
          <li key={p._id} className="flex items-start gap-3">
            <span className={label}>Project</span>
            <Link href={`/projects/${p.slug}`} className={linkClass}>{p.title}</Link>
          </li>
        ))}
        {library.map((m) => (
          <li key={m._id} className="flex items-start gap-3">
            <span className={label}>Library</span>
            <Link href="/library" className={linkClass}>{m.title}</Link>
            {m.author && <span className="font-mono text-[9px] text-stone-400 pt-1">{m.author}</span>}
          </li>
        ))}
      </ul>
    </section>
  )
}
