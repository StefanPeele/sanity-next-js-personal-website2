import { Icon, type IconName } from '@/lib/cms/icons'
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

const TYPE_CONFIG: Record<string, { icon: IconName; label: string }> = {
  article:       { icon: 'newspaper', label: 'Article' },
  rfc:           { icon: 'clipboard-list', label: 'RFC / Standard' },
  paper:         { icon: 'file-text', label: 'Research paper' },
  whitepaper:    { icon: 'file-text', label: 'White paper' },
  book:          { icon: 'book', label: 'Book' },
  documentation: { icon: 'book-open', label: 'Documentation' },
  video:         { icon: 'video', label: 'Video' },
  podcast:       { icon: 'mic', label: 'Podcast' },
  other:         { icon: 'link', label: 'Source' },
}

export function SourcesList({ sources, heading = 'Sources' }: SourcesListProps & { heading?: string }) {
  if (!sources || sources.length === 0) return null

  return (
    <section className="mt-20 pt-10 border-t border-white/[0.08]">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <h2 className="section-label">{heading}</h2>
        <span className="font-sans text-xs text-stone-400">
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
              <span className="font-mono text-xs text-stone-400 flex-shrink-0 mt-0.5 w-6 text-right">
                [{i + 1}]
              </span>

              {/* Source card */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-3 flex-wrap">
                  <Icon name={config.icon} size={14} className="flex-shrink-0 mt-0.5 text-stone-400" />

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
                        <span className="font-mono text-xs text-stone-400 ml-1.5 group-hover:text-stone-400 transition-colors">
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
                      <span className="meta-label text-stone-400 border border-stone-700 px-1.5 py-0.5 rounded-sm">
                        {config.label}
                      </span>
                      {source.author && (
                        <span className="font-mono text-xs text-stone-400">
                          {source.author}
                        </span>
                      )}
                    </div>

                    {/* Optional description */}
                    {source.description && (
                      <p className="font-mono text-xs text-stone-400 mt-1.5 leading-relaxed italic">
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
