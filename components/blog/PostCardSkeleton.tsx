// components/blog/PostCardSkeleton.tsx

export function PostCardSkeleton() {
  return (
    <div className="flex flex-col space-y-4 animate-pulse">
      {/* Thumbnail */}
      <div className="aspect-[4/3] w-full rounded-lg bg-surface-fill border border-edge" />

      <div className="flex flex-col gap-3">
        {/* Category tag */}
        <div className="h-4 w-20 bg-surface-fill rounded-sm" />
        {/* Title */}
        <div className="space-y-2">
          <div className="h-5 w-full bg-surface-fill rounded-sm" />
          <div className="h-5 w-3/4 bg-surface-fill rounded-sm" />
        </div>
        {/* Excerpt */}
        <div className="space-y-1.5">
          <div className="h-3.5 w-full bg-surface-fill rounded-sm" />
          <div className="h-3.5 w-5/6 bg-surface-fill rounded-sm" />
        </div>
        {/* Footer */}
        <div className="flex justify-between pt-4 border-t border-edge-faint">
          <div className="h-3 w-24 bg-surface-fill rounded-sm" />
          <div className="h-3 w-12 bg-surface-fill rounded-sm" />
        </div>
      </div>
    </div>
  )
}