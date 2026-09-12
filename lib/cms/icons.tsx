// lib/cms/icons.tsx
// Editable icon names (chosen in Studio) mapped to lucide components. Client-safe.

import {
  ArrowDown, ArrowLeftRight, ArrowRight, Award, Book, BookOpen, Camera, Check, ExternalLink,
  FileText, Gift, GitBranch, GraduationCap, Layers, Leaf, Library, Lightbulb, ListOrdered, Mail,
  MessageSquare, Mic, Network, Newspaper, RotateCcw, Route, Rss, Search, Settings2, Sprout, TreePine, Type, Video,
  AlertTriangle, AlertCircle, ClipboardList, Diamond, Factory, Info, Link2, Sparkles, Wrench, Zap,
  HelpCircle, PlusCircle,
  type LucideIcon,
} from 'lucide-react'

export const ICONS = {
  'book-open': BookOpen,
  book: Book,
  sprout: Sprout,
  leaf: Leaf,
  'tree-pine': TreePine,
  network: Network,
  library: Library,
  type: Type,
  route: Route,
  'list-ordered': ListOrdered,
  'rotate-ccw': RotateCcw,
  // 3B's three revision kinds need three distinct SHAPES, not three colours -- same rule
  // as 3.3's marks: a greyscale reader must still tell a correction from an update.
  'alert-circle': AlertCircle,
  info: Info,
  mail: Mail,
  rss: Rss,
  search: Search,
  'message-square': MessageSquare,
  layers: Layers,
  'git-branch': GitBranch,
  'graduation-cap': GraduationCap,
  camera: Camera,
  gift: Gift,
  award: Award,
  'external-link': ExternalLink,
  'file-text': FileText,
  newspaper: Newspaper,
  mic: Mic,
  video: Video,
  check: Check,
  lightbulb: Lightbulb,
  'arrow-right': ArrowRight,
  'arrow-down': ArrowDown,
  'arrow-left-right': ArrowLeftRight,
  'settings-2': Settings2,
  'alert-triangle': AlertTriangle,
  'clipboard-list': ClipboardList,
  diamond: Diamond,
  factory: Factory,
  link: Link2,
  sparkles: Sparkles,
  wrench: Wrench,
  zap: Zap,
  // Phase 8's comment labels. Distinct SHAPES, not three shades of one -- the same rule
  // 3.3 applies to status marks, because colour alone fails a greyscale reader.
  'help-circle': HelpCircle,
  'plus-circle': PlusCircle,
} as const satisfies Record<string, LucideIcon>

export type IconName = keyof typeof ICONS
export const ICON_NAMES = Object.keys(ICONS) as IconName[]

export function Icon({ name, className, size = 14 }: { name?: string | null; className?: string; size?: number }) {
  const Cmp = name && name in ICONS ? ICONS[name as IconName] : null
  if (!Cmp) return null
  return <Cmp className={className} size={size} aria-hidden />
}
