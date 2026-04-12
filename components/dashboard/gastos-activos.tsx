import { Gasto, Pago, Categoria } from '@/lib/types'
import Link from 'next/link'

interface Props {
  gastos: Gasto[]
  pagos: Pago[]
  categorias: Categoria[]
}

export function GastosActivos({ gastos, pagos, categorias }: Props) {
  return (
    <div className="rounded-2xl bg-card border border-border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Gastos activos
        </p>
        {gastos.length > 0 && (
          <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            {gastos.length}
          </span>
        )}
      </div>

      {gastos.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay gastos activos. ¡Agregá uno!</p>
      ) : (
        <div className="space-y-1">
          {gastos.map(gasto => {
            const gastoPagos = pagos.filter(p => p.gasto_id === gasto.id)
            const pagados = gastoPagos.filter(p => p.estado === 'pagado').length
            const total = gastoPagos.length || gasto.cuotas
            const pct = total > 0 ? (pagados / total) * 100 : 0
            const cat = categorias.find(c => c.nombre === gasto.categoria)
            const simbolo = gasto.moneda === 'USD' ? 'U$S' : '$'

            return (
              <Link key={gasto.id} href={`/gastos/${gasto.id}`}>
                <div className="p-3 rounded-xl hover:bg-muted/50 transition-colors group space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base leading-none flex-shrink-0">{cat?.icono || '📦'}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{gasto.descripcion}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                          {gasto.categoria}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-foreground">
                        {simbolo} {gasto.monto_total.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{pagados}/{total} cuotas</p>
                    </div>
                  </div>
                  {gasto.cuotas > 1 && (
                    <div className="h-0.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary/60 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
