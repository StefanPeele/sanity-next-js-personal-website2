// app/(personal)/now/page.tsx
import { CurrentlyReading } from '@/components/knowledge/CurrentlyReading'
import { RecentlyTended } from '@/components/knowledge/RecentlyTended'
import { formatDate } from '@/lib/dates'
import { SITE, articleTypeMeta } from '@/lib/site'
import { sanityFetch } from '@/sanity/lib/live'
import { nowQuery } from '@/sanity/lib/queries'
import type { Metadata } from 'next'
import Link from 'next/link'
import { toPlainText } from 'next-sanity'
import { getCopy } from '@/lib/cms/loaders'
import { personalPagesQuery } from '@/sanity/lib/queries-services'
import { DEFAULT_PERSONAL_PAGES } from '@/lib/cms/defaults/personalPages'
import { FOCUS } from '@/lib/ui'

export async function generateMetadata(): Promise<Metadata> {
  const h = (await getCopy(personalPagesQuery, DEFAULT_PERSONAL_PAGES)).now.header
  return { title: h.metaTitle || h.title, description: h.metaDescription || h.lede }
}

function Block({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="py-10 border-t border-white/5 grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8">
      <h2 id={id} className="md:col-span-3 font-mono text-[10px] tracking-[0.3em] text-stone-400 uppercase font-sans pt-1">{label}</h2>
      <div className="md:col-span-9">{children}</div>
    </section>
  )
}

export default async function NowPage() {
  const [{ data }, copy] = await Promise.all([sanityFetch({ query: nowQuery }), getCopy(personalPagesQuery, DEFAULT_PERSONAL_PAGES).then((c) => c.now)])
  const home = data?.home
  const reading = data?.reading ?? []
  const notes = data?.recentNotes ?? []
  const posts = (data?.recentPosts ?? []).filter((p) => p.slug)
  const projects = (data?.activeProjects ?? []).filter((p) => p.slug)
  const certs = data?.certifications ?? []
  const updated = home?._updatedAt ? formatDate(home._updatedAt, 'long') : null

  return (
    <div className="w-full min-h-screen text-stone-300 pb-24">
      <div className="max-w-4xl mx-auto pt-24">
        <header className="pb-10">
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-white tracking-tight">{copy.header.title}</h1>
          <p className="mt-6 text-stone-300 text-lg font-serif italic leading-relaxed max-w-2xl">{home?.currently ?? copy.header.lede}</p>
          <p className="mt-4 font-sans text-sm text-stone-400">
            {home?.location ?? `${SITE.location.city}, ${SITE.location.region}`}
            {updated && <> · {copy.updatedLabel} {updated}</>}
            {' · '}A <a href="https://nownownow.com/about" target="_blank" rel="noopener noreferrer" className={`underline underline-offset-4 hover:text-white ${FOCUS} rounded-sm`}>{copy.nowLinkLabel}</a>
          </p>
        </header>

        {projects.length > 0 && (
          <Block id="now-projects" label={copy.blockLabels.projects}>
            <ul className="space-y-4 list-none m-0 p-0">
              {projects.map((p) => (
                <li key={p._id}>
                  <Link href={`/projects/${p.slug}`} className={`text-white font-serif text-xl hover:text-stone-200 ${FOCUS} rounded-sm`}>{p.title}</Link>
                  {p.overview && <p className="text-stone-400 text-sm mt-1 line-clamp-2">{toPlainText(p.overview)}</p>}
                </li>
              ))}
            </ul>
          </Block>
        )}

        {certs.length > 0 && (
          <Block id="now-certs" label={copy.blockLabels.certs}>
            <ul className="space-y-4 list-none m-0 p-0">
              {certs.map((c) => {
                const pct = Math.max(0, Math.min(100, c.progressPercent ?? 0))
                return (
                  <li key={c._id}>
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="text-stone-200">{c.title}{c.issuer && <span className="text-stone-400 text-xs ml-2">{c.issuer}</span>}</span>
                      <span className="font-mono text-[9px] uppercase tracking-widest text-stone-400">{c.targetDate ? `${copy.targetLabel} ${formatDate(c.targetDate, 'month')}` : `${pct}%`}</span>
                    </div>
                    <div className="mt-2 h-1 w-full rounded-full bg-white/10 overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${c.title} study progress`}>
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                )
              })}
            </ul>
          </Block>
        )}

        {reading.length > 0 && (
          <Block id="now-reading" label={copy.blockLabels.reading}>
            <CurrentlyReading items={reading} />
          </Block>
        )}

        {notes.length > 0 && (
          <Block id="now-notes" label={copy.blockLabels.notes}>
            <RecentlyTended notes={notes} />
          </Block>
        )}

        {posts.length > 0 && (
          <Block id="now-posts" label={copy.blockLabels.posts}>
            <ul className="space-y-3 list-none m-0 p-0">
              {posts.map((p) => (
                <li key={p._id} className="flex items-baseline justify-between gap-4">
                  <Link href={`/blog/${p.slug}`} className={`text-stone-200 hover:text-white font-serif text-lg ${FOCUS} rounded-sm`}>{p.title}</Link>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-stone-400 whitespace-nowrap">
                    {articleTypeMeta(p.articleType) && <span className="mr-2" style={{ color: articleTypeMeta(p.articleType)!.color }}>{articleTypeMeta(p.articleType)!.short}</span>}
                    {formatDate(p.publishedAt, 'short')}
                  </span>
                </li>
              ))}
            </ul>
          </Block>
        )}

        {projects.length === 0 && certs.length === 0 && reading.length === 0 && notes.length === 0 && posts.length === 0 && (
          <p className="py-10 border-t border-white/5 text-stone-400 text-sm">{copy.emptyState}</p>
        )}
      </div>
    </div>
  )
}
