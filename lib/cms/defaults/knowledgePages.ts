// lib/cms/defaults/knowledgePages.ts — copy for garden, library, glossary, series, graph.
import type { NavLink } from './navigation'

const header = (title: string, lede: string, metaDescription = lede) => ({ title, lede, metaTitle: title, metaDescription })
const link = (label: string, path: string): NavLink => ({ label, kind: 'internal', path })

export const DEFAULT_KNOWLEDGE_PAGES = {
  garden: {
    header: header('Garden', 'Notes are unfinished by design. A seedling is an idea worth capturing. A growing note is being developed. An evergreen note is worth returning to. This is where thinking happens before it becomes a post.', 'A digital garden: notes, ideas, and developing thoughts on networking, infrastructure, and photography.'),
    stats: { notes: 'Notes', evergreen: 'Evergreen', tags: 'Tags in use' },
    emptyState: { title: 'No notes yet.', hint: 'Add the first note in the Studio under Knowledge → Notes.' },
    relatedNav: [link('Blog', '/blog'), link('Knowledge graph', '/graph')],
    note: {
      plantedLabel: 'Planted', tendedLabel: 'Last tended', statusLabel: 'Status',
      staleWarning: 'Not tended in {n} days. Details may be stale.',
      relatedNotes: 'Related notes', relatedPosts: 'Related posts', linksHere: 'Notes that link here', citedBy: 'Posts that cite this',
      graphHeading: 'Nearby in the graph', prevLabel: 'Tended earlier', nextLabel: 'Tended later', backLabel: 'Back to the garden', openGraph: 'Open the full graph',
    },
  },
  library: {
    header: header('Library', 'Books, articles, white papers, RFCs, podcasts, and courses. A log of what I read and how it connects to what I write.', "Books, articles, white papers, podcasts, and courses I've read, am reading, or want to read, and how they connect to my work."),
    stats: { total: 'Items', finished: 'Finished', current: 'Reading now', changedThinking: 'Changed my thinking', influenced: 'Shaped writing' },
    emptyState: { title: 'Nothing on the shelves yet.', hint: 'Add the first item in the Studio under Knowledge → Library items.' },
    relatedNav: [link('Blog', '/blog'), link('Garden', '/garden'), link('Knowledge graph', '/graph')],
    filterLabels: { type: 'Type', status: 'Status', all: 'All', clear: 'Clear' },
  },
  glossary: {
    header: header('Glossary', 'When one of these terms appears in an article, hovering it shows the short definition. This page holds the longer version.', 'Networking and infrastructure terms as used in the writing on this site: short definitions, longer explanations, and where each one shows up.'),
    emptyState: { title: 'No terms defined yet.', hint: '' },
    backLabel: 'Blog',
    termsCount: '{n} terms',
  },
  series: {
    header: header('Series', 'Longer arguments broken into parts. Each series is meant to be read in order. Start at part one.', 'Multi-part writing: home lab builds, protocol deep dives and PowerShell, in reading order.'),
    emptyState: { title: 'No series published yet.', hint: '' },
    backLabel: 'Blog',
    partsLabel: '{n} parts', publishedLabel: '{published} of {total} published', updatedLabel: 'Updated',
    statusLabels: { inProgress: 'In progress', complete: 'Complete', paused: 'Paused' },
  },
  graph: {
    header: header('Knowledge graph', 'Every post, note, tag, library item, project and series, and how they connect.', 'An interactive map of every post, note, tag, library item, project and series, and how they connect.'),
    emptyState: { title: 'The graph is empty.', hint: 'Add posts, notes, and connections in the Studio. They appear here automatically.' },
    backLabel: 'Blog',
    legendHeading: 'Legend', visibleHeading: 'Show', nodesLabel: 'Nodes', edgesLabel: 'Links', searchPlaceholder: 'Search',
    helpLine: 'Scroll to zoom. Drag to pan. Drag nodes to move them.',
    typeLabels: { post: 'Posts', note: 'Notes', tag: 'Tags', library: 'Library', project: 'Projects', series: 'Series' },
    legendLabels: {
      evergreen: 'Evergreen note', growing: 'Growing note', seedling: 'Seedling note', tag: 'Tag',
      libraryCurrent: 'Library, reading now', libraryFinished: 'Library, finished', libraryReference: 'Library, reference',
      project: 'Project', series: 'Series',
    },
    linesNote: 'Lines: prerequisites, read next, related, tags, influence',
    nodeListLabel: 'Node list', openHint: 'Click to open',
    ariaSummary: 'Knowledge graph with {nodes} nodes and {edges} connections between posts, notes, tags, library items, projects and series. A text list of every node follows.',
  },
  osi: {
    header: header('OSI model', 'The Open Systems Interconnection model is the conceptual framework that everything in networking is built on. Seven layers. Each with a job. Click any layer to inspect its protocols, what it actually does, and how it shows up in the real world.', 'An interactive reference for the 7-layer OSI model: protocols, real-world examples, and a full packet journey walkthrough. Built for CCNA students and network engineers.'),
    breadcrumbLabel: 'OSI model reference', backLabel: 'Blog',
    packetJourney: {
      heading: 'Packet journey',
      lede: 'Step through how a real HTTPS request travels down the OSI stack from your browser to the wire, one layer at a time.',
      scenario: 'HTTPS GET request, full stack walkthrough',
    },
    quickReference: {
      heading: 'Quick reference',
      columns: { n: '#', layer: 'Layer', pdu: 'PDU', addressing: 'Addressing', protocols: 'Key protocols' },
    },
  },
}

export type KnowledgePagesCopy = typeof DEFAULT_KNOWLEDGE_PAGES
