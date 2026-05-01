'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  listContent: React.ReactNode
  porPersonaContent: React.ReactNode
}

export function GastosTabs({ listContent, porPersonaContent }: Props) {
  const [tab, setTab] = useState<'lista' | 'persona'>('lista')

  return (
    <div className="space-y-4">
      <div
        className="flex gap-1 p-1 rounded-xl"
        style={{ background: 'rgba(42,31,23,0.06)' }}
      >
        {([
          { key: 'lista' as const, label: 'Todos' },
          { key: 'persona' as const, label: 'Por persona' },
        ]).map(v => (
          <button
            key={v.key}
            type="button"
            onClick={() => setTab(v.key)}
            className={cn(
              'flex-1 py-2 rounded-lg text-sm transition-all',
              tab === v.key
                ? 'bg-card font-semibold text-foreground'
                : 'font-medium text-muted-foreground'
            )}
            style={tab === v.key ? { boxShadow: '0 1px 3px rgba(42,31,23,0.08)' } : undefined}
          >
            {v.label}
          </button>
        ))}
      </div>

      {tab === 'lista' ? listContent : porPersonaContent}
    </div>
  )
}
