import Link from 'next/link'
import { sanityFetch } from '@/sanity/lib/live'
import { graphQuery } from '@/sanity/lib/queries'
import { GraphNeighborhood } from './KnowledgeGraph'
import { QUIET_LINK } from '@/lib/ui'
// components/graph/GraphEmbed.tsx
// Server-safe wrapper: fetches the graph and renders the 1-hop neighbourhood of `focusId`.
//
//   <GraphEmbed focusId={post._id} title="Connected to this post" />
//
// Props: { focusId: string; title?: string }. Renders nothing when the item has no connections.

export async function GraphEmbed({ focusId, title = 'In the knowledge graph' }: { focusId: string; title?: string }) {
  const { data } = await sanityFetch({ query: graphQuery, stega: false })
  if (!data) return null

  const connected =
    data.posts.some((p) => p._id === focusId || p.prerequisiteIds?.includes(focusId) || p.readDeeperId === focusId || p.readBroaderId === focusId || p.readApplyId === focusId || p.tagIds?.includes(focusId) || p.seriesId === focusId) ||
    data.notes.some((n) => n._id === focusId || n.relatedNoteIds?.includes(focusId) || n.relatedPostIds?.includes(focusId) || n.tagIds?.includes(focusId)) ||
    data.library.some((l) => l._id === focusId || l.influencedPostIds?.includes(focusId) || l.influencedNoteIds?.includes(focusId)) ||
    data.projects.some((p) => p._id === focusId || p.relatedPostIds?.includes(focusId) || p.relatedNoteIds?.includes(focusId)) ||
    data.series.some((s) => s._id === focusId)
  if (!connected) return null

  return (
    <section aria-label={title}>
      <div className="mb-3 flex items-center justify-between">
        <span className="meta-label text-stone-400 border-l-2 border-stone-700 pl-3">{title}</span>
        <Link href="/graph" className={`meta-label ${QUIET_LINK}`}>
          Full graph →
        </Link>
      </div>
      <GraphNeighborhood data={data} focusId={focusId} />
    </section>
  )
}
