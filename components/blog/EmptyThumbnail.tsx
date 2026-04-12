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

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6">
        {category && (
          <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-stone-600">
            {category}
          </span>
        )}
        <p className="font-serif text-stone-600 text-center text-sm leading-snug line-clamp-3 max-w-[80%]">
          {title}
        </p>
      </div>

      {/* Corner accent */}
      <div className="absolute top-3 left-3 w-4 h-4 border-t border-l border-white/10" />
      <div className="absolute bottom-3 right-3 w-4 h-4 border-b border-r border-white/10" />
    </div>
  )
}