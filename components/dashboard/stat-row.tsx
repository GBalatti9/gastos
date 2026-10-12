'use client'

import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  label: string
  value: React.ReactNode
  hint?: React.ReactNode
  onClick?: () => void
  valueClassName?: string
}

/** Fila compacta para mobile: etiqueta y ayuda a la izquierda, número a la derecha. */
export function StatRow({ label, value, hint, onClick, valueClassName }: Props) {
  const Comp = onClick ? 'button' : 'div'
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 px-4 py-3 text-left',
        onClick && 'active:bg-muted/60'
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        {hint && <p className="truncate text-xs text-muted-foreground/80">{hint}</p>}
      </div>
      <p className={cn('shrink-0 text-base font-semibold tabular-nums whitespace-nowrap', valueClassName)}>{value}</p>
      {onClick && <ChevronRight className="size-4 shrink-0 text-muted-foreground/60" />}
    </Comp>
  )
}
