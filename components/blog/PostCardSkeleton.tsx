// components/blog/PostCardSkeleton.tsx

export function PostCardSkeleton() {
  return (
    <div className="flex flex-col space-y-4 animate-pulse">
      {/* Thumbnail */}
      <div className="aspect-[4/3] w-full rounded-lg bg-white/5 border border-white/10" />

      <div className="flex flex-col gap-3">
        {/* Category tag */}
        <div className="h-4 w-20 bg-white/5 rounded-sm" />
        {/* Title */}
        <div className="space-y-2">
          <div className="h-5 w-full bg-white/5 rounded-sm" />
          <div className="h-5 w-3/4 bg-white/5 rounded-sm" />
        </div>
        {/* Excerpt */}
        <div className="space-y-1.5">
          <div className="h-3.5 w-full bg-white/[0.04] rounded-sm" />
          <div className="h-3.5 w-5/6 bg-white/[0.04] rounded-sm" />
        </div>
        {/* Footer */}
        <div className="flex justify-between pt-4 border-t border-white/5">
          <div className="h-3 w-24 bg-white/5 rounded-sm" />
          <div className="h-3 w-12 bg-white/5 rounded-sm" />
        </div>
      </div>
    </div>
  )
}