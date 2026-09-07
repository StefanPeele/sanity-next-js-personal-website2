// components/blog/EmptyThumbnail.tsx
// Shown when a post has no cover image.
// Generates a unique gradient pattern based on the post title/category.

interface EmptyThumbnailProps {
  title: string
  category?: string
}

const GRADIENTS = [
  'from-stone-900 via-stone-800 to-stone-900',
  'from-zinc-900 via-stone-800 to-zinc-900',
  'from-stone-900 via-zinc-800 to-stone-900',
  'from-neutral-900 via-stone-800 to-neutral-900',
]

const PATTERNS = [
  // Diagonal lines
  'repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 12px)',
  // Grid
  'repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 20px), repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 20px)',
  // Diagonal other way
  'repeating-linear-gradient(-45deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 12px)',
  // Dots
  'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
]

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

export function EmptyThumbnail({ title, category }: EmptyThumbnailProps) {
  const seed     = hashString(title)
  const gradient = GRADIENTS[seed % GRADIENTS.length]
  const pattern  = PATTERNS[seed % PATTERNS.length]
  const isDots   = seed % PATTERNS.length === 3

  return (
    <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`}>
      {/* Texture pattern */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: pattern,
          backgroundSize: isDots ? '16px 16px' : undefined,
        }}
      />

      {/* Center content. The post title used to be repeated here, directly above the same title
          printed below the card — so the card said everything twice. Only the category remains,
          raised from 9px/0.4em/stone-600 (below the 12px floor and barely legible on this
          gradient) to 11px/0.15em/stone-400. */}
      <div className="absolute inset-0 flex items-center justify-center p-6">
        {category && (
          <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-stone-400">
            {category}
          </span>
        )}
      </div>

      {/* Corner accent */}
      <div className="absolute top-3 left-3 w-4 h-4 border-t border-l border-white/10" />
      <div className="absolute bottom-3 right-3 w-4 h-4 border-b border-r border-white/10" />
    </div>
  )
}