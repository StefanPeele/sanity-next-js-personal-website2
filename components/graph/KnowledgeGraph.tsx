'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import * as d3 from 'd3'
// components/graph/KnowledgeGraph.tsx
// D3 force-directed graph connecting posts, notes, tags, and library items.
// D3 owns the SVG DOM entirely. React manages overlay UI only (hover cards, filters).

// ── Types ─────────────────────────────────────────────────────────
interface GraphNode extends d3.SimulationNodeDatum {
  id: string
  type: 'post' | 'note' | 'tag' | 'library'
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

export interface GraphData {
  posts: {
    _id: string; title: string; slug: string; articleType?: string
    excerpt?: string; prerequisiteIds?: string[]
    readDeeperId?: string; readBroaderId?: string; readApplyId?: string
  }[]
  notes: {
    _id: string; title: string; slug: string; status: string
    relatedNoteIds?: string[]; relatedPostIds?: string[]; tagIds?: string[]
  }[]
  tags: { _id: string; title: string; slug: string; category?: string }[]
  library: { _id: string; title: string; mediaType?: string; influencedPostIds?: string[] }[]
}

type FilterState = { posts: boolean; notes: boolean; tags: boolean; library: boolean }

// ── Colors ────────────────────────────────────────────────────────
const POST_COLORS: Record<string, string> = {
  'perspective':       '#8b5cf6',
  'concept-deep-dive': '#f59e0b',
  'field-notes':       '#10b981',
  'transmission':      '#3b82f6',
}

const NOTE_COLORS: Record<string, string> = {
  seedling:  '#57534e',
  growing:   '#4ade80',
  evergreen: '#22c55e',
}

const LINK_COLORS: Record<string, string> = {
  prerequisite: 'rgba(255,255,255,0.18)',
  readNext:     'rgba(255,255,255,0.1)',
  noteNote:     'rgba(74,222,128,0.18)',
  notePost:     'rgba(74,222,128,0.12)',
  noteTag:      'rgba(168,85,247,0.22)',
  library:      'rgba(6,182,212,0.18)',
}

const LEGEND = [
  { color: '#8b5cf6', label: 'Perspective' },
  { color: '#f59e0b', label: 'Concept Deep Dive' },
  { color: '#10b981', label: 'Field Notes' },
  { color: '#3b82f6', label: 'Transmission' },
  { color: '#22c55e', label: 'Evergreen note' },
  { color: '#4ade80', label: 'Growing note' },
  { color: '#57534e', label: 'Seedling note' },
  { color: '#a855f7', label: 'Tag' },
  { color: '#06b6d4', label: 'Library' },
]

// ── Main component ────────────────────────────────────────────────
export function KnowledgeGraph({ data }: { data: GraphData }) {
  const svgRef       = useRef<SVGSVGElement>(null)
  const simRef       = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null)

  const [hoveredNode, setHoveredNode]   = useState<GraphNode | null>(null)
  const [mousePos, setMousePos]         = useState({ x: 0, y: 0 })
  const [filters, setFilters]           = useState<FilterState>({ posts: true, notes: true, tags: true, library: true })
  const [search, setSearch]             = useState('')
  const [settling, setSettling]         = useState(true)

  // ── Build and render graph ─────────────────────────────────────
  const buildGraph = useCallback(() => {
    const svg = svgRef.current
    if (!svg) return

    const W = svg.clientWidth  || 900
    const H = svg.clientHeight || 650

    // ── Nodes ────────────────────────────────────────────────────
    const nodes: GraphNode[] = []
    const nodeIds = new Set<string>()

    const searchQ = search.toLowerCase().trim()

    const dimColor = (color: string, id: string, label: string): string => {
      if (!searchQ) return color
      return label.toLowerCase().includes(searchQ) ? color : 'rgba(255,255,255,0.07)'
    }

    if (filters.posts) {
      data.posts.forEach(p => {
        const base = POST_COLORS[p.articleType ?? ''] ?? '#d6d3d1'
        nodes.push({
          id: p._id, type: 'post', subtype: p.articleType ?? 'post',
          label: p.title, url: `/blog/${p.slug}`,
          radius: 10, color: dimColor(base, p._id, p.title),
          description: p.excerpt,
        })
        nodeIds.add(p._id)
      })
    }

    if (filters.notes) {
      data.notes.forEach(n => {
        const base = NOTE_COLORS[n.status] ?? '#78716c'
        nodes.push({
          id: n._id, type: 'note', subtype: n.status,
          label: n.title, url: '/garden',
          radius: n.status === 'evergreen' ? 9 : 6,
          color: dimColor(base, n._id, n.title),
          description: `${n.status} note`,
        })
        nodeIds.add(n._id)
      })
    }

    if (filters.tags) {
      data.tags.forEach(t => {
        nodes.push({
          id: t._id, type: 'tag',
          label: `#${t.title}`, url: undefined,
          radius: 5, color: dimColor('#a855f7', t._id, t.title),
          description: t.category,
        })
        nodeIds.add(t._id)
      })
    }

    if (filters.library) {
      data.library.forEach(l => {
        nodes.push({
          id: l._id, type: 'library',
          label: l.title, url: undefined,
          radius: 7, color: dimColor('#06b6d4', l._id, l.title),
          description: l.mediaType,
        })
        nodeIds.add(l._id)
      })
    }

    // ── Links ────────────────────────────────────────────────────
    const links: GraphLink[] = []

    const addLink = (source: string, target: string, linkType: string) => {
      if (nodeIds.has(source) && nodeIds.has(target)) {
        links.push({ source, target, linkType, color: LINK_COLORS[linkType] ?? 'rgba(255,255,255,0.08)' })
      }
    }

    data.posts.forEach(p => {
      p.prerequisiteIds?.forEach(pid => addLink(p._id, pid, 'prerequisite'))
      if (p.readDeeperId)  addLink(p._id, p.readDeeperId,  'readNext')
      if (p.readBroaderId) addLink(p._id, p.readBroaderId, 'readNext')
      if (p.readApplyId)   addLink(p._id, p.readApplyId,   'readNext')
    })

    data.notes.forEach(n => {
      n.relatedNoteIds?.forEach(nid => addLink(n._id, nid, 'noteNote'))
      n.relatedPostIds?.forEach(pid => addLink(n._id, pid, 'notePost'))
      n.tagIds?.forEach(tid => addLink(n._id, tid, 'noteTag'))
    })

    data.library.forEach(l => {
      l.influencedPostIds?.forEach(pid => addLink(l._id, pid, 'library'))
    })

    // ── D3 SVG setup ──────────────────────────────────────────────
    const sel = d3.select(svg)
    sel.selectAll('*').remove()

    // Background gradient
    const defs = sel.append('defs')
    const grad = defs.append('radialGradient').attr('id', 'bg-grad').attr('cx', '50%').attr('cy', '50%').attr('r', '50%')
    grad.append('stop').attr('offset', '0%').attr('stop-color', '#0f0f13')
    grad.append('stop').attr('offset', '100%').attr('stop-color', '#0a0a0a')

    sel.append('rect').attr('width', '100%').attr('height', '100%').attr('fill', 'url(#bg-grad)')

    // Zoom container
    const g = sel.append('g').attr('class', 'graph-root')

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.15, 5])
      .on('zoom', (e) => g.attr('transform', e.transform.toString()))

    sel.call(zoom).on('dblclick.zoom', null)

    // Initial centering
    sel.call(zoom.translateTo, W / 2, H / 2)

    // ── Links layer ───────────────────────────────────────────────
    const linkG = g.append('g').attr('class', 'links')
    const linkEl = linkG.selectAll<SVGLineElement, GraphLink>('line')
      .data(links)
      .join('line')
      .attr('stroke', d => d.color)
      .attr('stroke-width', 1)

    // ── Nodes layer ───────────────────────────────────────────────
    const nodeG = g.append('g').attr('class', 'nodes')
    const nodeEl = nodeG.selectAll<SVGGElement, GraphNode>('g')
      .data(nodes, d => d.id)
      .join('g')
      .attr('class', 'node')
      .style('cursor', d => d.url ? 'pointer' : 'grab')

    // Glow filter for highlighted nodes
    defs.append('filter').attr('id', 'glow')
      .append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'blur')

    const glowMerge = defs.select('#glow').append('feMerge')
    glowMerge.append('feMergeNode').attr('in', 'blur')
    glowMerge.append('feMergeNode').attr('in', 'SourceGraphic')

    // Node circle
    nodeEl.append('circle')
      .attr('r', d => d.radius)
      .attr('fill', d => d.color)
      .attr('fill-opacity', 0.9)
      .attr('stroke', d => d.color)
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.35)

    // Soft glow ring (subtle)
    nodeEl.append('circle')
      .attr('r', d => d.radius + 4)
      .attr('fill', 'none')
      .attr('stroke', d => d.color)
      .attr('stroke-width', 1)
      .attr('stroke-opacity', 0.1)

    // Node labels
    nodeEl.append('text')
      .text(d => d.label.length > 20 ? d.label.slice(0, 20) + '…' : d.label)
      .attr('text-anchor', 'middle')
      .attr('dy', d => d.radius + 12)
      .attr('font-size', '8px')
      .attr('font-family', 'var(--font-mono), monospace')
      .attr('fill', 'rgba(255,255,255,0.38)')
      .attr('pointer-events', 'none')
      .style('display', d => d.radius >= 6 ? 'block' : 'none')

    // ── Mouse events ──────────────────────────────────────────────
    nodeEl
      .on('mouseenter', function(_, d) {
        setHoveredNode(d)
        d3.select(this).select('circle:first-of-type')
          .transition().duration(120)
          .attr('r', d.radius * 1.45)
          .attr('fill-opacity', 1)
          .attr('filter', 'url(#glow)')
      })
      .on('mouseleave', function(_, d) {
        setHoveredNode(null)
        d3.select(this).select('circle:first-of-type')
          .transition().duration(200)
          .attr('r', d.radius)
          .attr('fill-opacity', 0.9)
          .attr('filter', null)
      })
      .on('click', (_, d) => { if (d.url) window.location.href = d.url })

    // ── Drag ──────────────────────────────────────────────────────
    const drag = d3.drag<SVGGElement, GraphNode>()
      .on('start', (event, d) => {
        if (!event.active) simRef.current?.alphaTarget(0.25).restart()
        d.fx = d.x ?? 0; d.fy = d.y ?? 0
      })
      .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y })
      .on('end', (event, d) => {
        if (!event.active) simRef.current?.alphaTarget(0)
        d.fx = null; d.fy = null
      })

    nodeEl.call(drag)

    // ── Simulation ────────────────────────────────────────────────
    simRef.current?.stop()

    const simulation = d3.forceSimulation<GraphNode>(nodes)
      .force('link',
        d3.forceLink<GraphNode, GraphLink>(links)
          .id(d => d.id)
          .distance(d => {
            const lt = (d as any).linkType
            if (lt === 'noteTag') return 60
            if (lt === 'prerequisite') return 100
            return 80
          })
          .strength(0.45)
      )
      .force('charge', d3.forceManyBody<GraphNode>().strength(d => -(200 + d.radius * 12)))
      .force('center', d3.forceCenter(W / 2, H / 2).strength(0.06))
      .force('collision', d3.forceCollide<GraphNode>().radius(d => d.radius + 10).strength(0.8))
      .alphaDecay(0.025)

    simRef.current = simulation

    simulation.on('tick', () => {
      linkEl
        .attr('x1', (d: any) => d.source.x ?? 0)
        .attr('y1', (d: any) => d.source.y ?? 0)
        .attr('x2', (d: any) => d.target.x ?? 0)
        .attr('y2', (d: any) => d.target.y ?? 0)

      nodeEl.attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`)
    })

    simulation.on('end', () => setSettling(false))

  }, [data, filters, search])

  useEffect(() => {
    setSettling(true)
    buildGraph()
    return () => { simRef.current?.stop() }
  }, [buildGraph])

  // Resize handler
  useEffect(() => {
    const onResize = () => { simRef.current?.stop(); buildGraph() }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [buildGraph])

  // Mouse tracking for hover card
  useEffect(() => {
    const onMove = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  const toggleFilter = (key: keyof FilterState) =>
    setFilters(f => ({ ...f, [key]: !f[key] }))

  const totalNodes = data.posts.length + data.notes.length + data.tags.length + data.library.length
  const totalLinks = data.posts.reduce((n, p) => n + (p.prerequisiteIds?.length ?? 0) + (p.readDeeperId ? 1 : 0) + (p.readBroaderId ? 1 : 0) + (p.readApplyId ? 1 : 0), 0)
    + data.notes.reduce((n, note) => n + (note.relatedNoteIds?.length ?? 0) + (note.relatedPostIds?.length ?? 0) + (note.tagIds?.length ?? 0), 0)
    + data.library.reduce((n, l) => n + (l.influencedPostIds?.length ?? 0), 0)

  return (
    <div className="relative w-full h-full select-none">

      {/* Graph canvas */}
      <svg ref={svgRef} className="w-full h-full" />

      {/* Settling indicator */}
      {settling && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-3 pointer-events-none">
          <div className="w-6 h-6 border border-white/20 border-t-white/50 rounded-full animate-spin" />
          <p className="font-mono text-[8px] text-stone-700 uppercase tracking-widest">Mapping connections…</p>
        </div>
      )}

      {/* ── Hover card ────────────────────────────────────────────── */}
      {hoveredNode && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: Math.min(mousePos.x + 18, (typeof window !== 'undefined' ? window.innerWidth : 1200) - 230),
            top:  Math.max(mousePos.y - 50, 8),
          }}
        >
          <div className="bg-[#111]/96 border border-white/15 rounded-xl p-4 w-56 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: hoveredNode.color }} />
              <span className="font-mono text-[8px] uppercase tracking-widest text-stone-500">
                {hoveredNode.type}{hoveredNode.subtype ? ` · ${hoveredNode.subtype.replace(/-/g, ' ')}` : ''}
              </span>
            </div>
            <p className="font-serif text-sm text-white leading-snug mb-1.5">{hoveredNode.label}</p>
            {hoveredNode.description && (
              <p className="font-mono text-[9px] text-stone-500 leading-relaxed line-clamp-2">
                {hoveredNode.description}
              </p>
            )}
            {hoveredNode.url && (
              <p className="font-mono text-[8px] text-stone-700 mt-2 uppercase tracking-widest">
                Click to navigate →
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Controls panel (top-left) ──────────────────────────────── */}
      <div className="absolute top-4 left-4 bg-[#0d0d0f]/92 border border-white/10 rounded-xl p-4 backdrop-blur-xl w-48 shadow-xl">

        {/* Stats */}
        <div className="flex gap-4 mb-4 pb-3 border-b border-white/[0.08]">
          <div>
            <div className="font-serif text-lg text-white font-bold">{totalNodes}</div>
            <div className="font-mono text-[7px] uppercase tracking-widest text-stone-600">Nodes</div>
          </div>
          <div>
            <div className="font-serif text-lg text-white font-bold">{totalLinks}</div>
            <div className="font-mono text-[7px] uppercase tracking-widest text-stone-600">Edges</div>
          </div>
        </div>

        {/* Type filters */}
        <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-stone-600 mb-2.5">Visible</p>
        <div className="space-y-1.5 mb-4">
          {([
            { key: 'posts',   label: 'Posts',   color: '#d6d3d1', count: data.posts.length },
            { key: 'notes',   label: 'Notes',   color: '#4ade80', count: data.notes.length },
            { key: 'tags',    label: 'Tags',    color: '#a855f7', count: data.tags.length },
            { key: 'library', label: 'Library', color: '#06b6d4', count: data.library.length },
          ] as const).map(({ key, label, color, count }) => (
            <button
              key={key}
              onClick={() => toggleFilter(key)}
              className={`flex items-center justify-between w-full px-2 py-1.5 rounded-md transition-all ${
                filters[key]
                  ? 'bg-white/5 opacity-100'
                  : 'bg-transparent opacity-30'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                <span className="font-mono text-[9px] uppercase tracking-widest text-stone-300">{label}</span>
              </div>
              <span className="font-mono text-[8px] text-stone-600">{count}</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search..."
          className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-1.5 font-mono text-[10px] text-white placeholder:text-stone-700 focus:outline-none focus:border-white/25 transition-colors"
        />

        {/* Zoom hint */}
        <p className="font-mono text-[7px] text-stone-800 uppercase tracking-widest mt-3 leading-loose">
          Scroll to zoom<br />Drag to pan<br />Drag nodes to reposition
        </p>
      </div>

      {/* ── Legend (bottom-left) ───────────────────────────────────── */}
      <div className="absolute bottom-4 left-4 bg-[#0d0d0f]/80 border border-white/[0.08] rounded-lg p-3 backdrop-blur-xl">
        <div className="space-y-1.5">
          {LEGEND.map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
              <span className="font-mono text-[7px] text-stone-600 uppercase tracking-widest">{label}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}