// app/loading.tsx — root-level skeleton shown while a route segment streams.
// Mirrors the (personal) layout offsets (mt-20, px-4/16/32) so nothing shifts on resolve.

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] mt-20 px-4 md:px-16 lg:px-32" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading</span>
      <div className="max-w-7xl mx-auto pt-16 space-y-8 motion-safe:animate-fade-in">
        <div className="h-3 w-24 rounded bg-white/[0.06]" />
        <div className="h-12 w-3/4 max-w-2xl rounded bg-white/[0.08]" />
        <div className="h-4 w-1/2 max-w-md rounded bg-white/[0.05]" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
          <div className="h-48 rounded-xl bg-white/[0.04]" />
          <div className="h-48 rounded-xl bg-white/[0.04]" />
          <div className="h-48 rounded-xl bg-white/[0.04]" />
        </div>
      </div>
    </div>
  )
}
