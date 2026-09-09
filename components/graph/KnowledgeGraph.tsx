'use client'

import { useEffect, useMemo, useRef, useState, useId } from 'react'
import { useRouter } from 'next/navigation'
import { useReducedMotion } from 'framer-motion'
import * as d3 from 'd3'
import { ARTICLE_TYPES } from '@/lib/site'
import { NOTE_STATUS } from '@/components/garden/status'
import type { GraphQueryResult } from '@/sanity.types'
import { DEFAULT_KNOWLEDGE_PAGES } from '@/lib/cms/defaults/knowledgePages'
import { DEFAULT_TAXONOMY, type VocabEntry } from '@/lib/cms/defaults/taxonomy'
import { FOCUS } from '@/lib/ui'

type GraphCopy = typeof DEFAULT_KNOWLEDGE_PAGES.graph
// components/graph/KnowledgeGraph.tsx
// D3 force-directed graph connecting posts, notes, tags, library items, projects and series.
// D3 owns the SVG DOM. React manages overlay UI (hover card, filters, legend, a11y list).
//
// Two effects: `build` (re-runs on data/filter change, rebuilds the simulation) and
// `search` (cheap attribute update that dims non-matching nodes). Resize is debounced
// and only re-centres + gently reheats the simulation.

// ── Types ─────────────────────────────────────────────────────────
export type GraphData = GraphQueryResult

type NodeType = 'post' | 'note' | 'tag' | 'library' | 'project' | 'series'

interface GraphNode extends d3.SimulationNodeDatum {
  id: string
  type: NodeType
  subtype?: string
  label: string
  url?: string
  radius: number
  color: string
  description?: string
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  linkType: string
  color: string
}

type FilterState = Record<NodeType, boolean>

// ── Colours ───────────────────────────────────────────────────────
// Lane colours are shared with ARTICLE_TYPES in lib/site.ts.
const POST_COLORS: Record<string, string> = Object.fromEntries(
  Object.entries(ARTICLE_TYPES).map(([k, v]) => [k, v.color]),
)
const NOTE_COLORS: Record<string, string> = {
  seedling: NOTE_STATUS.seedling.hex,
  growing: NOTE_STATUS.growing.hex,
  evergreen: NOTE_STATUS.evergreen.hex,
}
const TYPE_COLORS: Record<NodeType, string> = {
  post: '#d6d3d1',
  note: NOTE_STATUS.growing.hex,
  tag: '#a855f7',
  library: '#06b6d4',
  project: '#f472b6',
  series: '#fb923c',
}
const LIBRARY_STATUS_COLORS: Record<string, string> = {
  current: '#22d3ee',
  finished: '#06b6d4',
  reference: '#0e7490',
}
const LINK_COLORS: Record<string, string> = {
  prerequisite: 'rgba(255,255,255,0.18)',
  readNext: 'rgba(255,255,255,0.1)',
  noteNote: 'rgba(74,222,128,0.18)',
  notePost: 'rgba(74,222,128,0.12)',
  noteTag: 'rgba(168,85,247,0.22)',
  postTag: 'rgba(168,85,247,0.16)',
  library: 'rgba(6,182,212,0.18)',
  project: 'rgba(244,114,182,0.18)',
  series: 'rgba(251,146,60,0.2)',
}
const DIM = 'rgba(255,255,255,0.07)'

export function graphLegend(copy: GraphCopy['legendLabels'], lanes: VocabEntry[]): { color: string; label: string; shape?: 'ring' }[] {
  return [
    ...lanes.map((t) => ({ color: t.color ?? POST_COLORS[t.key] ?? '#a8a29e', label: t.label })),
    { color: NOTE_STATUS.evergreen.hex, label: copy.evergreen },
    { color: NOTE_STATUS.growing.hex, label: copy.growing },
    { color: NOTE_STATUS.seedling.hex, label: copy.seedling },
    { color: TYPE_COLORS.tag, label: copy.tag },
    { color: LIBRARY_STATUS_COLORS.current, label: copy.libraryCurrent, shape: 'ring' },
    { color: LIBRARY_STATUS_COLORS.finished, label: copy.libraryFinished },
    { color: LIBRARY_STATUS_COLORS.reference, label: copy.libraryReference },
    { color: TYPE_COLORS.project, label: copy.project },
    { color: TYPE_COLORS.series, label: copy.series },
  ]
}

// ── Graph model ───────────────────────────────────────────────────
export function buildGraphModel(data: GraphData, filters: FilterState) {
  const nodes: GraphNode[] = []
  const ids = new Set<string>()
  const add = (n: GraphNode) => { if (!ids.has(n.id)) { nodes.push(n); ids.add(n.id) } }

  if (filters.post) data.posts.forEach((p) => p.title && add({
    id: p._id, type: 'post', subtype: p.articleType ?? 'post', label: p.title,
    url: `/blog/${p.slug}`, radius: 10, color: POST_COLORS[p.articleType ?? ''] ?? TYPE_COLORS.post,
    description: p.excerpt ?? undefined,
  }))
  if (filters.note) data.notes.forEach((n) => n.title && add({
    id: n._id, type: 'note', subtype: n.status ?? 'seedling', label: n.title,
    url: `/garden/${n.slug}`, radius: n.status === 'evergreen' ? 9 : 6,
    color: NOTE_COLORS[n.status ?? ''] ?? '#78716c', description: `${n.status ?? 'seedling'} note`,
  }))
  if (filters.tag) data.tags.forEach((t) => t.title && add({
    id: t._id, type: 'tag', label: `#${t.title}`, url: `/garden?tag=${t.slug}`,
    radius: 6, color: TYPE_COLORS.tag, description: t.category ?? undefined,
  }))
  if (filters.library) data.library.forEach((l) => l.title && add({
    id: l._id, type: 'library', subtype: l.status ?? undefined, label: l.title, url: `/library#${l._id}`,
    radius: 7, color: LIBRARY_STATUS_COLORS[l.status ?? ''] ?? TYPE_COLORS.library,
    description: [l.mediaType, l.status].filter(Boolean).join(' · '),
  }))
  if (filters.project) data.projects.forEach((p) => p.title && add({
    id: p._id, type: 'project', label: p.title, url: `/projects/${p.slug}`,
    radius: 9, color: TYPE_COLORS.project, description: 'project',
  }))
  if (filters.series) data.series.forEach((s) => s.title && add({
    id: s._id, type: 'series', label: s.title, url: `/blog/series/${s.slug}`,
    radius: 8, color: TYPE_COLORS.series, description: 'series',
  }))

  const links: GraphLink[] = []
  const seen = new Set<string>()
  const link = (a: string | null | undefined, b: string | null | undefined, linkType: string) => {
    if (!a || !b || a === b || !ids.has(a) || !ids.has(b)) return
    const key = a < b ? `${a}|${b}` : `${b}|${a}`
    if (seen.has(key)) return
    seen.add(key)
    links.push({ source: a, target: b, linkType, color: LINK_COLORS[linkType] ?? 'rgba(255,255,255,0.08)' })
  }

  data.posts.forEach((p) => {
    p.prerequisiteIds?.forEach((id) => link(p._id, id, 'prerequisite'))
    link(p._id, p.readDeeperId, 'readNext')
    link(p._id, p.readBroaderId, 'readNext')
    link(p._id, p.readApplyId, 'readNext')
    p.tagIds?.forEach((id) => link(p._id, id, 'postTag'))
    link(p._id, p.seriesId, 'series')
  })
  data.notes.forEach((n) => {
    n.relatedNoteIds?.forEach((id) => link(n._id, id, 'noteNote'))
    n.relatedPostIds?.forEach((id) => link(n._id, id, 'notePost'))
    n.tagIds?.forEach((id) => link(n._id, id, 'noteTag'))
  })
  data.library.forEach((l) => {
    l.influencedPostIds?.forEach((id) => link(l._id, id, 'library'))
    l.influencedNoteIds?.forEach((id) => link(l._id, id, 'library'))
  })
  data.projects.forEach((p) => {
    p.relatedPostIds?.forEach((id) => link(p._id, id, 'project'))
    p.relatedNoteIds?.forEach((id) => link(p._id, id, 'project'))
  })

  return { nodes, links }
}

const ALL_ON: FilterState = { post: true, note: true, tag: true, library: true, project: true, series: true }

/** Nodes within one hop of `focusId`, plus the edges between them. */
export function neighborhoodOf(data: GraphData, focusId: string) {
  const { nodes, links } = buildGraphModel(data, ALL_ON)
  const keep = new Set<string>([focusId])
  links.forEach((l) => {
    const s = l.source as string, t = l.target as string
    if (s === focusId) keep.add(t)
    if (t === focusId) keep.add(s)
  })
  return {
    nodes: nodes.filter((n) => keep.has(n.id)),
    links: links.filter((l) => keep.has(l.source as string) && keep.has(l.target as string)),
  }
}

// ── Shared D3 rendering ───────────────────────────────────────────
function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n) + '…' : s
}

interface RenderOpts {
  svg: SVGSVGElement
  nodes: GraphNode[]
  links: GraphLink[]
  W: number
  H: number
  reduceMotion: boolean
  zoomable: boolean
  focusId?: string
  onHover?: (n: GraphNode | null) => void
  onClick?: (n: GraphNode) => void
  onEnd?: () => void
  glowId: string
}

function render(o: RenderOpts) {
  const sel = d3.select(o.svg)
  sel.selectAll('*').remove()
  sel.attr('viewBox', `0 0 ${o.W} ${o.H}`)

  const defs = sel.append('defs')
  const glow = defs.append('filter').attr('id', o.glowId)
  glow.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'blur')
  const merge = glow.append('feMerge')
  merge.append('feMergeNode').attr('in', 'blur')
  merge.append('feMergeNode').attr('in', 'SourceGraphic')

  const g = sel.append('g').attr('class', 'graph-root')
  let zoom: d3.ZoomBehavior<SVGSVGElement, unknown> | null = null
  if (o.zoomable) {
    zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.15, 5])
      .on('zoom', (e) => g.attr('transform', e.transform.toString()))
    sel.call(zoom).on('dblclick.zoom', null)
  }

  const linkEl = g.append('g').attr('class', 'links')
    .selectAll<SVGLineElement, GraphLink>('line')
    .data(o.links).join('line')
    .attr('stroke', (d) => d.color)
    .attr('stroke-width', 1)

  const nodeEl = g.append('g').attr('class', 'nodes')
    .selectAll<SVGGElement, GraphNode>('g')
    .data(o.nodes, (d) => d.id).join('g')
    .attr('class', 'node')
    .attr('data-id', (d) => d.id)
    .style('cursor', (d) => (d.url ? 'pointer' : 'grab'))

  nodeEl.append('circle').attr('class', 'core')
    .attr('r', (d) => d.radius)
    .attr('fill', (d) => d.color)
    .attr('fill-opacity', (d) => (d.type === 'library' && d.subtype === 'current' ? 0.15 : 0.9))
    .attr('stroke', (d) => d.color)
    .attr('stroke-width', (d) => (d.id === o.focusId ? 3 : 1.5))
    .attr('stroke-opacity', (d) => (d.type === 'library' && d.subtype === 'current' ? 1 : 0.35))

  nodeEl.append('circle').attr('class', 'halo')
    .attr('r', (d) => d.radius + 4)
    .attr('fill', 'none')
    .attr('stroke', (d) => d.color)
    .attr('stroke-width', 1)
    .attr('stroke-opacity', (d) => (d.id === o.focusId ? 0.5 : 0.1))

  nodeEl.append('text')
    .text((d) => truncate(d.label, 22))
    .attr('text-anchor', 'middle')
    .attr('dy', (d) => d.radius + 12)
    .attr('font-size', '8px')
    .attr('font-family', 'var(--font-mono), monospace')
    .attr('fill', 'rgba(255,255,255,0.45)')
    .attr('pointer-events', 'none')
    .attr('data-label', '1')
    .style('display', (d) => (d.radius >= 6 || d.id === o.focusId ? 'block' : 'none'))

  nodeEl
    .on('mouseenter', function (_, d) {
      o.onHover?.(d)
      d3.select(this).select<SVGTextElement>('text').style('display', 'block')
      const c = d3.select(this).select<SVGCircleElement>('circle.core')
      if (o.reduceMotion) c.attr('r', d.radius * 1.3).attr('filter', `url(#${o.glowId})`)
      else c.transition().duration(120).attr('r', d.radius * 1.45).attr('fill-opacity', 1).attr('filter', `url(#${o.glowId})`)
    })
    .on('mouseleave', function (_, d) {
      o.onHover?.(null)
      d3.select(this).select<SVGTextElement>('text').style('display', d.radius >= 6 || d.id === o.focusId ? 'block' : 'none')
      const c = d3.select(this).select<SVGCircleElement>('circle.core')
      if (o.reduceMotion) c.attr('r', d.radius).attr('filter', null)
      else c.transition().duration(200).attr('r', d.radius).attr('fill-opacity', d.type === 'library' && d.subtype === 'current' ? 0.15 : 0.9).attr('filter', null)
    })
    .on('click', (_, d) => o.onClick?.(d))

  const simulation = d3.forceSimulation<GraphNode>(o.nodes)
    .force('link', d3.forceLink<GraphNode, GraphLink>(o.links).id((d) => d.id)
      .distance((d) => (d.linkType === 'noteTag' || d.linkType === 'postTag' ? 60 : d.linkType === 'prerequisite' ? 100 : 80))
      .strength(0.45))
    .force('charge', d3.forceManyBody<GraphNode>().strength((d) => -(200 + d.radius * 12)))
    .force('center', d3.forceCenter(o.W / 2, o.H / 2).strength(0.06))
    .force('collision', d3.forceCollide<GraphNode>().radius((d) => d.radius + 10).strength(0.8))
    .alphaDecay(0.025)

  if (o.focusId) {
    const f = o.nodes.find((n) => n.id === o.focusId)
    if (f) { f.fx = o.W / 2; f.fy = o.H / 2 }
  }

  const drag = d3.drag<SVGGElement, GraphNode>()
    .on('start', (event, d) => { if (!event.active) simulation.alphaTarget(0.25).restart(); d.fx = d.x ?? 0; d.fy = d.y ?? 0 })
    .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y })
    .on('end', (event, d) => { if (!event.active) simulation.alphaTarget(0); if (d.id !== o.focusId) { d.fx = null; d.fy = null } })
  nodeEl.call(drag)

  const tick = () => {
    linkEl
      .attr('x1', (d) => (d.source as GraphNode).x ?? 0)
      .attr('y1', (d) => (d.source as GraphNode).y ?? 0)
      .attr('x2', (d) => (d.target as GraphNode).x ?? 0)
      .attr('y2', (d) => (d.target as GraphNode).y ?? 0)
    nodeEl.attr('transform', (d) => `translate(${d.x ?? 0},${d.y ?? 0})`)
  }

  if (o.reduceMotion) {
    // Settle synchronously: no animated layout.
    simulation.stop()
    for (let i = 0; i < 300; i++) simulation.tick()
    tick()
    o.onEnd?.()
  } else {
    simulation.on('tick', tick)
    simulation.on('end', () => o.onEnd?.())
  }

  return { simulation, zoom, g, sel }
}

// ── Main component ────────────────────────────────────────────────
export function KnowledgeGraph({ data, copy = DEFAULT_KNOWLEDGE_PAGES.graph, lanes = DEFAULT_TAXONOMY.articleLanes }: { data: GraphData; copy?: GraphCopy; lanes?: VocabEntry[] }) {
  const router = useRouter()
  const legend = graphLegend(copy.legendLabels, lanes)
  const reduceMotion = useReducedMotion() ?? false
  const glowId = useId().replace(/:/g, '')
  const svgRef = useRef<SVGSVGElement>(null)
  const simRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [filters, setFilters] = useState<FilterState>(ALL_ON)
  const [search, setSearch] = useState('')
  const [settling, setSettling] = useState(true)

  const model = useMemo(() => buildGraphModel(data, filters), [data, filters])

  // Build effect: data / filters only.
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return undefined
    const W = svg.clientWidth || 900
    const H = svg.clientHeight || 650
    setSettling(true)
    // Copy nodes so d3 mutation never leaks into the memoised model.
    const nodes = model.nodes.map((n) => ({ ...n }))
    const links = model.links.map((l) => ({ ...l }))
    const r = render({
      svg, nodes, links, W, H, reduceMotion, zoomable: true, glowId,
      onHover: setHoveredNode,
      onClick: (d) => { if (d.url) router.push(d.url) },
      onEnd: () => setSettling(false),
    })
    simRef.current = r.simulation
    return () => { r.simulation.stop(); simRef.current = null }
  }, [model, reduceMotion, router, glowId])

  // Search effect: cheap attribute update, no rebuild.
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const q = search.trim().toLowerCase()
    d3.select(svg).selectAll<SVGGElement, GraphNode>('g.node').each(function (d) {
      const match = !q || d.label.toLowerCase().includes(q)
      const g = d3.select(this)
      g.select('circle.core').attr('fill', match ? d.color : DIM).attr('stroke', match ? d.color : DIM)
      g.select('circle.halo').attr('stroke', match ? d.color : DIM)
      g.select('text')
        .style('display', match && (q || d.radius >= 6) ? 'block' : q ? 'none' : d.radius >= 6 ? 'block' : 'none')
        .attr('fill', q && match ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.45)')
    })
  }, [search, model])

  // Debounced resize: update viewBox + centre force, gentle reheat.
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | null = null
    const onResize = () => {
      if (t) clearTimeout(t)
      t = setTimeout(() => {
        const svg = svgRef.current
        const sim = simRef.current
        if (!svg || !sim) return
        const W = svg.clientWidth || 900
        const H = svg.clientHeight || 650
        d3.select(svg).attr('viewBox', `0 0 ${W} ${H}`)
        const center = sim.force<d3.ForceCenter<GraphNode>>('center')
        center?.x(W / 2).y(H / 2)
        if (!reduceMotion) sim.alpha(0.15).restart()
        else { sim.stop(); for (let i = 0; i < 60; i++) sim.tick() }
      }, 180)
    }
    window.addEventListener('resize', onResize)
    return () => { window.removeEventListener('resize', onResize); if (t) clearTimeout(t) }
  }, [reduceMotion])

  useEffect(() => {
    const onMove = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  const toggleFilter = (key: NodeType) => setFilters((f) => ({ ...f, [key]: !f[key] }))

  const filterRows: { key: NodeType; label: string; color: string; count: number }[] = [
    { key: 'post', label: copy.typeLabels.post, color: TYPE_COLORS.post, count: data.posts.length },
    { key: 'note', label: copy.typeLabels.note, color: TYPE_COLORS.note, count: data.notes.length },
    { key: 'tag', label: copy.typeLabels.tag, color: TYPE_COLORS.tag, count: data.tags.length },
    { key: 'library', label: copy.typeLabels.library, color: TYPE_COLORS.library, count: data.library.length },
    { key: 'project', label: copy.typeLabels.project, color: TYPE_COLORS.project, count: data.projects.length },
    { key: 'series', label: copy.typeLabels.series, color: TYPE_COLORS.series, count: data.series.length },
  ]

  const q = search.trim().toLowerCase()
  const listNodes = q ? model.nodes.filter((n) => n.label.toLowerCase().includes(q)) : model.nodes

  return (
    <div className="relative w-full h-full select-none">
      <svg
        ref={svgRef}
        className="w-full h-full"
        role="img"
        aria-label={copy.ariaSummary.replace('{nodes}', String(model.nodes.length)).replace('{edges}', String(model.links.length))}
        style={{ background: 'radial-gradient(circle at 50% 50%, #0f0f13 0%, #0a0a0a 100%)' }}
      />

      {settling && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-3 pointer-events-none" aria-hidden="true">
          <div className="w-6 h-6 border border-white/20 border-t-white/50 rounded-full animate-spin" />
          <p className="font-mono text-[8px] text-stone-400 uppercase tracking-widest">Mapping connections…</p>
        </div>
      )}

      {/* Hover card */}
      {hoveredNode && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: Math.min(mousePos.x + 18, (typeof window !== 'undefined' ? window.innerWidth : 1200) - 230),
            top: Math.max(mousePos.y - 50, 8),
          }}
        >
          <div className="bg-[#111]/95 border border-white/15 rounded-xl p-4 w-56 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: hoveredNode.color }} />
              <span className="font-mono text-[8px] uppercase tracking-widest text-stone-400">
                {hoveredNode.type}{hoveredNode.subtype ? ` · ${hoveredNode.subtype.replace(/-/g, ' ')}` : ''}
              </span>
            </div>
            <p className="font-serif text-sm text-white leading-snug mb-1.5">{hoveredNode.label}</p>
            {hoveredNode.description && (
              <p className="font-mono text-[9px] text-stone-400 leading-relaxed line-clamp-2">{hoveredNode.description}</p>
            )}
            {hoveredNode.url && (
              <p className="font-mono text-[8px] text-stone-400 mt-2 uppercase tracking-widest">{copy.openHint}</p>
            )}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="absolute top-4 left-4 bg-[#0d0d0f]/90 border border-white/10 rounded-xl p-4 backdrop-blur-xl w-52 shadow-xl">
        <div className="flex gap-4 mb-4 pb-3 border-b border-white/[0.08]">
          <div>
            <div className="font-serif text-lg text-white font-bold">{model.nodes.length}</div>
            <div className="font-mono text-[7px] uppercase tracking-widest text-stone-400">{copy.nodesLabel}</div>
          </div>
          <div>
            <div className="font-serif text-lg text-white font-bold">{model.links.length}</div>
            <div className="font-mono text-[7px] uppercase tracking-widest text-stone-400">{copy.edgesLabel}</div>
          </div>
        </div>

        <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-stone-400 mb-2.5" id={`${glowId}-visible`}>{copy.visibleHeading}</p>
        <div className="space-y-1 mb-4" role="group" aria-labelledby={`${glowId}-visible`}>
          {filterRows.map(({ key, label, color, count }) => (
            <button
              key={key}
              type="button"
              onClick={() => toggleFilter(key)}
              aria-pressed={filters[key]}
              className={`flex items-center justify-between w-full px-2 py-1.5 rounded-md transition-all ${FOCUS} ${
                filters[key] ? 'bg-white/5 opacity-100' : 'bg-transparent opacity-40'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} aria-hidden="true" />
                <span className="font-mono text-[9px] uppercase tracking-widest text-stone-300">{label}</span>
              </span>
              <span className="font-mono text-[8px] text-stone-400">{count}</span>
            </button>
          ))}
        </div>

        <label htmlFor={`${glowId}-search`} className="sr-only">{copy.searchPlaceholder}</label>
        <input
          id={`${glowId}-search`}
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={copy.searchPlaceholder}
          className={`w-full bg-white/5 border border-white/10 rounded-md px-3 py-1.5 font-mono text-[10px] text-white placeholder:text-stone-500 focus:border-white/25 transition-colors ${FOCUS}`}
        />

        <p className="font-mono text-[7px] text-stone-400 uppercase tracking-widest mt-3 leading-loose">
          {copy.helpLine}
        </p>
      </div>

      {/* Legend */}
      <details className="absolute bottom-4 left-4 bg-[#0d0d0f]/85 border border-white/[0.08] rounded-lg backdrop-blur-xl max-w-[220px]" open>
        <summary className={`cursor-pointer px-3 py-2 font-mono text-[8px] uppercase tracking-[0.3em] text-stone-400 ${FOCUS} rounded-lg`}>
          {copy.legendHeading}
        </summary>
        <ul className="px-3 pb-3 space-y-1.5">
          {legend.map(({ color, label, shape }) => (
            <li key={label} className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={shape === 'ring' ? { border: `1.5px solid ${color}` } : { backgroundColor: color }}
                aria-hidden="true"
              />
              <span className="font-mono text-[7px] text-stone-400 uppercase tracking-widest">{label}</span>
            </li>
          ))}
          <li className="pt-1 mt-1 border-t border-white/[0.06] font-mono text-[7px] text-stone-400 uppercase tracking-widest">
            {copy.linesNote}
          </li>
        </ul>
      </details>

      {/* Keyboard / screen-reader alternative */}
      <div className="absolute bottom-4 right-4">
        <details className="bg-[#0d0d0f]/90 border border-white/[0.08] rounded-lg backdrop-blur-xl max-w-xs">
          <summary className={`cursor-pointer px-3 py-2 font-mono text-[8px] uppercase tracking-[0.3em] text-stone-400 ${FOCUS} rounded-lg`}>
            {copy.nodeListLabel} ({listNodes.length})
          </summary>
          <ul ref={listRef} className="max-h-64 overflow-y-auto px-3 pb-3 space-y-1" aria-label={copy.nodeListLabel}>
            {listNodes.map((n) => (
              <li key={n.id}>
                {n.url ? (
                  <a
                    href={n.url}
                    className={`flex items-center gap-2 font-mono text-[9px] text-stone-300 hover:text-white rounded-sm ${FOCUS}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: n.color }} aria-hidden="true" />
                    <span className="truncate">{n.label}</span>
                    <span className="ml-auto text-[7px] uppercase tracking-widest text-stone-400 flex-shrink-0">{n.type}</span>
                  </a>
                ) : (
                  <span className="flex items-center gap-2 font-mono text-[9px] text-stone-400">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: n.color }} aria-hidden="true" />
                    {n.label}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </details>
      </div>
    </div>
  )
}

// ── Neighbourhood (embed) variant ─────────────────────────────────
// Small, non-zoomable 1-hop view around a focus node. Rendered by GraphEmbed.
export function GraphNeighborhood({ data, focusId, height = 260 }: { data: GraphData; focusId: string; height?: number }) {
  const router = useRouter()
  const reduceMotion = useReducedMotion() ?? false
  const glowId = useId().replace(/:/g, '')
  const svgRef = useRef<SVGSVGElement>(null)
  const [hovered, setHovered] = useState<GraphNode | null>(null)

  const model = useMemo(() => neighborhoodOf(data, focusId), [data, focusId])

  useEffect(() => {
    const svg = svgRef.current
    if (!svg || model.nodes.length === 0) return undefined
    const W = svg.clientWidth || 600
    const H = height
    const r = render({
      svg, nodes: model.nodes.map((n) => ({ ...n })), links: model.links.map((l) => ({ ...l })),
      W, H, reduceMotion, zoomable: false, focusId, glowId,
      onHover: setHovered,
      onClick: (d) => { if (d.url && d.id !== focusId) router.push(d.url) },
    })
    return () => { r.simulation.stop() }
  }, [model, reduceMotion, focusId, height, router, glowId])

  if (model.nodes.length <= 1) return null

  const focus = model.nodes.find((n) => n.id === focusId)
  const neighbours = model.nodes.filter((n) => n.id !== focusId)

  return (
    <div className="relative rounded-xl border border-white/[0.08] overflow-hidden" style={{ background: '#0c0c0f' }}>
      <svg
        ref={svgRef}
        className="w-full"
        style={{ height }}
        role="img"
        aria-label={`${focus?.label ?? 'This item'} is connected to ${neighbours.length} other item${neighbours.length === 1 ? '' : 's'}: ${neighbours.map((n) => n.label).join(', ')}.`}
      />
      <div className="absolute top-2 right-3 font-mono text-[8px] uppercase tracking-widest text-stone-400" aria-live="polite">
        {hovered ? `${hovered.type} · ${hovered.label}` : `${neighbours.length} connection${neighbours.length === 1 ? '' : 's'}`}
      </div>
      <ul className="flex flex-wrap gap-2 p-3 border-t border-white/[0.06]" aria-label="Connected items">
        {neighbours.map((n) => (
          <li key={n.id}>
            <a
              href={n.url}
              className={`flex items-center gap-1.5 font-mono text-[9px] text-stone-400 hover:text-white border border-white/10 hover:border-white/30 px-2 py-1 rounded-sm transition-colors ${FOCUS}`}
            >
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: n.color }} aria-hidden="true" />
              {n.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
