'use client'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'

export interface Opcion {
  value: string
  label: React.ReactNode
}

interface Props {
  value: string
  onChange: (value: string) => void
  opciones: Opcion[]
  className?: string
  itemClassName?: string
  /** `grid` reparte en columnas iguales; `wrap` deja que fluyan. */
  layout?: 'grid' | 'wrap'
  columnas?: 2 | 3 | 4 | 5
  'aria-label'?: string
}

const cols: Record<number, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
}

/**
 * Set de opciones de selección única (2–7 choices) sobre ToggleGroup de shadcn.
 * API base: `value` es un array y deseleccionar devuelve `[]`, por eso se
 * ignora el vacío (siempre hay una opción activa).
 */
export function OpcionesToggle({
  value,
  onChange,
  opciones,
  className,
  itemClassName,
  layout = 'grid',
  columnas,
  ...rest
}: Props) {
  const n = columnas ?? (Math.min(opciones.length, 5) as 2 | 3 | 4 | 5)
  return (
    <ToggleGroup
      variant="outline"
      value={[value]}
      onValueChange={(v: string[]) => v[0] && onChange(v[0])}
      className={cn(
        'w-full',
        layout === 'grid' ? cn('grid', cols[n]) : 'flex flex-wrap',
        className
      )}
      {...rest}
    >
      {opciones.map((o) => (
        <ToggleGroupItem
          key={o.value}
          value={o.value}
          className={cn(
            'h-10 min-w-0 justify-center px-2 text-sm aria-pressed:border-primary/40 aria-pressed:bg-accent aria-pressed:text-accent-foreground',
            layout === 'wrap' && 'flex-1',
            itemClassName
          )}
        >
          <span className="truncate">{o.label}</span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
