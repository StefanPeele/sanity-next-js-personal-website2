// lib/cms/icons.tsx
// Editable icon names (chosen in Studio) mapped to lucide components. Client-safe.

import {
  ArrowDown, ArrowLeftRight, ArrowRight, Award, Book, BookOpen, Camera, Check, ExternalLink,
  FileText, Gift, GitBranch, GraduationCap, Layers, Leaf, Library, Lightbulb, ListOrdered, Mail,
  Mic, Network, Newspaper, RotateCcw, Route, Rss, Search, Settings2, Sprout, TreePine, Type, Video,
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
  mail: Mail,
  rss: Rss,
  search: Search,
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
} as const satisfies Record<string, LucideIcon>

export type IconName = keyof typeof ICONS
export const ICON_NAMES = Object.keys(ICONS) as IconName[]

export function Icon({ name, className, size = 14 }: { name?: string | null; className?: string; size?: number }) {
  const Cmp = name && name in ICONS ? ICONS[name as IconName] : null
  if (!Cmp) return null
  return <Cmp className={className} size={size} aria-hidden />
}
