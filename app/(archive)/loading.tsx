// app/(archive)/loading.tsx — skeleton for /blog, /garden, /library while data streams.
// Archive pages render their own <main> with top padding; this matches the reading column.

export default function ArchiveLoading() {
  return (
    <div className="min-h-screen pt-32 px-6 md:px-12" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading</span>
      <div className="max-w-3xl mx-auto space-y-6 motion-safe:animate-fade-in">
        <div className="h-3 w-32 rounded bg-white/[0.06]" />
        <div className="h-10 w-2/3 rounded bg-white/[0.08]" />
        <div className="h-4 w-full rounded bg-white/[0.05]" />
        <div className="h-4 w-11/12 rounded bg-white/[0.05]" />
        <div className="h-4 w-4/5 rounded bg-white/[0.05]" />
        <div className="pt-8 space-y-4">
          <div className="h-24 rounded-xl bg-white/[0.04]" />
          <div className="h-24 rounded-xl bg-white/[0.04]" />
          <div className="h-24 rounded-xl bg-white/[0.04]" />
        </div>
      </div>
    </div>
  )
}
