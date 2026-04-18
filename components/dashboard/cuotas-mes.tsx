import { Gasto, Pago, TarjetaCredito } from '@/lib/types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CheckCircle2, Circle, CreditCard } from 'lucide-react'
import Link from 'next/link'

interface Props {
  pagos: Pago[]
  gastos: Gasto[]
  tarjetas: TarjetaCredito[]
}

export function CuotasMes({ pagos, gastos, tarjetas }: Props) {
  if (pagos.length === 0) {
    return (
      <div className="rounded-2xl bg-card border border-border p-5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Cuotas del mes
        </p>
        <p className="text-sm text-muted-foreground text-center py-4">
          No hay cuotas para este mes.
        </p>
      </div>
    )
  }

  const pendientes = pagos.filter(p => p.estado === 'pendiente')
  const pagados = pagos.filter(p => p.estado === 'pagado')

  return (
    <div className="rounded-2xl bg-card border border-border p-5 space-y-4">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        Cuotas del mes
      </p>

      {pendientes.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-orange-600">
            {pendientes.length} pendiente{pendientes.length > 1 ? 's' : ''}
          </p>
          {pendientes.map(pago => {
            const gasto = gastos.find(g => g.id === pago.gasto_id)
            if (!gasto) return null
            const tarjeta = gasto.tarjeta_id ? tarjetas.find(t => t.id === gasto.tarjeta_id) : null
            return (
              <Link
                key={pago.id}
                href={`/gastos/${gasto.id}`}
                className="flex items-center justify-between p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 hover:border-orange-200 dark:hover:border-orange-800/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Circle className="h-4 w-4 text-orange-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{gasto.descripcion}</p>
                    <p className="text-xs text-muted-foreground">
                      Cuota {pago.numero_cuota}/{gasto.cuotas}
                      {' · '}
                      Vence {format(new Date(pago.fecha_vencimiento), "d MMM", { locale: es })}
                      {tarjeta && (
                        <span className="inline-flex items-center gap-1 ml-1.5">
                          <CreditCard className="h-3 w-3" />
                          {tarjeta.nombre}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <span className="font-semibold text-sm whitespace-nowrap">
                  {gasto.moneda === 'USD' ? 'U$S ' : '$'}
                  {pago.monto.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                </span>
              </Link>
            )
          })}
        </div>
      )}

      {pagados.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-emerald-600">
            {pagados.length} pagada{pagados.length > 1 ? 's' : ''}
          </p>
          {pagados.map(pago => {
            const gasto = gastos.find(g => g.id === pago.gasto_id)
            if (!gasto) return null
            return (
              <Link
                key={pago.id}
                href={`/gastos/${gasto.id}`}
                className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 hover:border-emerald-200 dark:hover:border-emerald-800/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{gasto.descripcion}</p>
                    <p className="text-xs text-muted-foreground">
                      Cuota {pago.numero_cuota}/{gasto.cuotas}
                      {pago.fecha_pago && (
                        <> · Pagado {format(new Date(pago.fecha_pago), "d MMM", { locale: es })}</>
                      )}
                    </p>
                  </div>
                </div>
                <span className="font-semibold text-sm text-emerald-700 whitespace-nowrap">
                  {gasto.moneda === 'USD' ? 'U$S ' : '$'}
                  {pago.monto.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
