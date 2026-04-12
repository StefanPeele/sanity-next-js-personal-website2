import Link from 'next/link'
// app/not-found.tsx

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-stone-300 flex flex-col items-center justify-center px-6">

      {/* Corner marks */}
      {['top-6 left-6', 'top-6 right-6', 'bottom-6 left-6', 'bottom-6 right-6'].map((pos, i) => (
        <div
          key={i}
          className={`absolute ${pos} w-3 h-3 ${
            i < 2
              ? 'border-t border-white/[0.06]'
              : 'border-b border-white/[0.06]'
          } ${
            i % 2 === 0
              ? 'border-l border-white/[0.06]'
              : 'border-r border-white/[0.06]'
          }`}
        />
      ))}

      <div className="max-w-lg w-full text-center">

        {/* Status label */}
        <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-stone-600 block mb-8 border-l border-stone-800 pl-4 text-left">
          System // Error
        </span>

        {/* 404 */}
        <div
          className="font-serif font-bold text-white leading-none mb-6 select-none"
          style={{ fontSize: 'clamp(96px, 18vw, 180px)' }}
        >
          4<span className="text-stone-700">0</span>4
        </div>

        {/* Message */}
        <p className="font-serif italic text-stone-500 text-xl mb-2 leading-snug">
          This intel doesn't exist in the archive.
        </p>
        <p className="font-mono text-[10px] text-stone-700 uppercase tracking-widest mb-12">
          The page you requested could not be located.
        </p>

        {/* Actions */}
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/blog"
            className="font-mono text-[10px] uppercase tracking-[0.3em] px-5 py-3 bg-white text-black hover:bg-stone-200 transition-colors"
          >
            Return to Archive
          </Link>
          <Link
            href="/"
            className="font-mono text-[10px] uppercase tracking-[0.3em] px-5 py-3 border border-white/10 text-stone-500 hover:border-white/30 hover:text-white transition-colors"
          >
            Home
          </Link>
        </div>

        {/* System readout */}
        <div className="mt-16 pt-8 border-t border-white/5">
          <p className="font-mono text-[9px] text-stone-800 uppercase tracking-widest">
            ERROR_CODE: 404 · STATUS: NOT_FOUND · ARCHIVE: STEFANPEELE.COM
          </p>
        </div>

      </div>
    </div>
  )
}