import { Icon } from '@/lib/cms/icons'
// components/blog/FailureNote.tsx

interface FailureNoteProps {
  value: {
    label?: 'failed' | 'lesson' | 'fixed' | 'warning'
    content: string
  }
}

const CONFIG = {
  failed: {
    icon: 'alert-triangle',
    label: 'What failed',
    border: 'border-red-500/30',
    bg: 'bg-red-950/15',
    accent: 'text-red-400',
    labelBg: 'bg-red-500/10 border-red-500/20',
  },
  lesson: {
    icon: 'zap',
    label: 'What I learned',
    border: 'border-amber-500/30',
    bg: 'bg-amber-950/15',
    accent: 'text-amber-400',
    labelBg: 'bg-amber-500/10 border-amber-500/20',
  },
  fixed: {
    icon: 'wrench',
    label: 'What I fixed',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-950/15',
    accent: 'text-emerald-400',
    labelBg: 'bg-emerald-500/10 border-emerald-500/20',
  },
  warning: {
    icon: 'alert-triangle',
    label: 'Warning',
    border: 'border-amber-500/30',
    bg: 'bg-amber-950/15',
    accent: 'text-amber-400',
    labelBg: 'bg-amber-500/10 border-amber-500/20',
  },
}

export function FailureNote({ value }: FailureNoteProps) {
  const { label = 'failed', content } = value
  const config = CONFIG[label] ?? CONFIG.failed

  return (
    <div className={`my-8 rounded-xl border ${config.border} ${config.bg} overflow-hidden`}>
      {/* Header */}
      <div className={`flex items-center gap-2.5 px-5 py-3 border-b ${config.border}`}>
        <Icon name={config.icon} size={16} className={config.accent} />
        <span className={`meta-label font-bold ${config.accent}`}>
          {config.label}
        </span>
      </div>

      {/* Content */}
      <div className="px-5 py-4">
        <p className="font-mono text-xs text-stone-300 leading-relaxed whitespace-pre-wrap">
          {content}
        </p>
      </div>
    </div>
  )
}
