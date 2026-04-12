import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Props {
  total: number
  porCategoria: { categoria: string; total: number; color: string }[]
  user1: { nombre: string; pagado: number }
  user2: { nombre: string; pagado: number }
  totalUSD?: number
  user1USD?: { pagado: number }
  user2USD?: { pagado: number }
}

export function ResumenMes({ total, porCategoria, user1, user2, totalUSD = 0, user1USD, user2USD }: Props) {
  const mesActual = format(new Date(), 'MMMM yyyy', { locale: es })
  const sorted = [...porCategoria].sort((a, b) => b.total - a.total).slice(0, 5)

  return (
    <div className="rounded-2xl bg-card border border-border p-5 space-y-5">
      {/* Header */}
      <div className="flex items-baseline justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Este mes
        </p>
        <p className="text-[10px] text-muted-foreground capitalize">{mesActual}</p>
      </div>

      {/* Totals */}
      <div className="flex gap-6 items-end">
        <div>
          <p className="font-display italic text-4xl text-foreground leading-none">
            ${total.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
          </p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">ARS</p>
        </div>
        {totalUSD > 0 && (
          <>
            <div className="w-px h-10 bg-border" />
            <div>
              <p className="font-display italic text-2xl text-muted-foreground leading-none">
                U$S {totalUSD.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">USD</p>
            </div>
          </>
        )}
      </div>

      {total > 0 && (
        <>
          {/* Person split */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { nombre: user1.nombre, pagado: user1.pagado },
              { nombre: user2.nombre, pagado: user2.pagado },
            ].map(u => (
              <div key={u.nombre} className="rounded-xl bg-muted/50 px-3 py-2.5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{u.nombre}</p>
                <p className="text-sm font-semibold text-foreground mt-0.5">
                  ${u.pagado.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {total > 0 ? Math.round((u.pagado / total) * 100) : 0}%
                </p>
              </div>
            ))}
          </div>

          {/* Categories */}
          {sorted.length > 0 && (
            <div className="space-y-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Por categoría
              </p>
              {sorted.map(cat => {
                const pct = Math.round((cat.total / total) * 100)
                return (
                  <div key={cat.categoria}>
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-xs text-foreground">{cat.categoria}</span>
                      <span className="text-xs text-muted-foreground">
                        ${cat.total.toLocaleString('es-AR', { minimumFractionDigits: 0 })} · {pct}%
                      </span>
                    </div>
                    <div className="h-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: cat.color }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {total === 0 && (
        <p className="text-sm text-muted-foreground">Sin pagos registrados este mes.</p>
      )}
    </div>
  )
}
