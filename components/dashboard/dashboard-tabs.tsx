'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  mesContent: React.ReactNode
  totalContent: React.ReactNode
}

export function DashboardTabs({ mesContent, totalContent }: Props) {
  const [tab, setTab] = useState<'mes' | 'total'>('mes')

  return (
    <div className="space-y-4">
      {/* Tab switcher */}
      <div
        className="flex gap-1 p-1 rounded-xl"
        style={{ background: 'rgba(42,31,23,0.06)' }}
      >
        {(['mes', 'total'] as const).map(v => (
          <button
            key={v}
            type="button"
            onClick={() => setTab(v)}
            className={cn(
              'flex-1 py-2 rounded-lg text-sm transition-all',
              tab === v
                ? 'bg-card font-semibold text-foreground'
                : 'font-medium text-muted-foreground'
            )}
            style={tab === v ? { boxShadow: '0 1px 3px rgba(42,31,23,0.08)' } : undefined}
          >
            {v === 'mes' ? 'Mes actual' : 'Histórico'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-4">
        {tab === 'mes' ? mesContent : totalContent}
      </div>
    </div>
  )
}
