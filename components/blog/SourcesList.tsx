// components/blog/SourcesList.tsx

interface Source {
  _key?: string
  title: string
  url?: string
  author?: string
  type?: string
  description?: string
}

interface SourcesListProps {
  sources: Source[]
}

const TYPE_CONFIG: Record<string, { icon: string; label: string }> = {
  article:       { icon: '📰', label: 'Article' },
  rfc:           { icon: '📋', label: 'RFC / Standard' },
  paper:         { icon: '📄', label: 'Research Paper' },
  book:          { icon: '📚', label: 'Book' },
  documentation: { icon: '📖', label: 'Documentation' },
  video:         { icon: '🎥', label: 'Video' },
  other:         { icon: '🔗', label: 'Source' },
}

export function SourcesList({ sources }: SourcesListProps) {
  if (!sources || sources.length === 0) return null

  return (
    <section className="mt-20 pt-10 border-t border-white/8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-stone-500 border-l-2 border-stone-600 pl-4">
          Sources & References
        </span>
        <span className="font-mono text-[9px] text-stone-700 uppercase tracking-widest">
          {sources.length} cited
        </span>
      </div>

      {/* Source list */}
      <ol className="space-y-4">
        {sources.map((source, i) => {
          const config = TYPE_CONFIG[source.type ?? 'other'] ?? TYPE_CONFIG.other

          return (
            <li
              key={source._key ?? i}
              className="flex items-start gap-4 group"
            >
              {/* Index number */}
              <span className="font-mono text-[10px] text-stone-700 flex-shrink-0 mt-0.5 w-6 text-right">
                [{i + 1}]
              </span>

              {/* Source card */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-3 flex-wrap">
                  <span className="text-sm flex-shrink-0 mt-0.5">{config.icon}</span>

                  <div className="flex-1 min-w-0">
                    {/* Title — link if URL provided */}
                    {source.url ? (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="font-serif text-stone-300 hover:text-white transition-colors leading-snug group-hover:underline underline-offset-4 decoration-stone-600 hover:decoration-white"
                      >
                        {source.title}
                        <span className="font-mono text-[9px] text-stone-600 ml-1.5 group-hover:text-stone-400 transition-colors">
                          ↗
                        </span>
                      </a>
                    ) : (
                      <span className="font-serif text-stone-400 leading-snug">
                        {source.title}
                      </span>
                    )}

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="font-mono text-[8px] uppercase tracking-widest text-stone-700 border border-stone-800 px-1.5 py-0.5 rounded-sm">
                        {config.label}
                      </span>
                      {source.author && (
                        <span className="font-mono text-[9px] text-stone-600">
                          {source.author}
                        </span>
                      )}
                    </div>

                    {/* Optional description */}
                    {source.description && (
                      <p className="font-mono text-[10px] text-stone-600 mt-1.5 leading-relaxed italic">
                        {source.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
