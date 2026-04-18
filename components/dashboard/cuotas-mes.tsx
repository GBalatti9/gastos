import { Gasto, Pago, TarjetaCredito } from '@/lib/types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'

interface Props {
  pagos: Pago[]
  gastos: Gasto[]
  tarjetas: TarjetaCredito[]
}

export function CuotasMes({ pagos, gastos, tarjetas }: Props) {
  if (pagos.length === 0) {
    return (
      <div
        className="rounded-[20px] bg-card border border-border px-[22px] py-5"
        style={{ boxShadow: '0 1px 2px rgba(42,31,23,0.04)' }}
      >
        <p className="text-[11px] font-semibold uppercase tracking-[1.4px] text-muted-foreground">
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
  const totalPendiente = pendientes.reduce((s, p) => s + p.monto, 0)

  const mostrar = [...pendientes, ...pagados].slice(0, 5)

  return (
    <div
      className="rounded-[20px] bg-card border border-border overflow-hidden"
      style={{ boxShadow: '0 1px 2px rgba(42,31,23,0.04)' }}
    >
      {/* Header */}
      <div className="px-[22px] pt-5 pb-3 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[1.4px] text-muted-foreground">
          Cuotas del mes
        </p>
        <Link
          href="/gastos"
          className="text-[12px] font-semibold"
          style={{ color: '#8B5E3C' }}
        >
          Ver todas
        </Link>
      </div>

      {/* Subtitle: pending count + total */}
      {pendientes.length > 0 && (
        <div className="px-[22px] pb-3">
          <p className="text-[13px] font-semibold" style={{ color: '#D97A4E' }}>
            {pendientes.length} pendiente{pendientes.length > 1 ? 's' : ''} · $
            {Math.round(totalPendiente).toLocaleString('es-AR')}
          </p>
        </div>
      )}

      {/* Rows */}
      <div>
        {mostrar.map(pago => {
          const gasto = gastos.find(g => g.id === pago.gasto_id)
          if (!gasto) return null
          const esPagado = pago.estado === 'pagado'
          return (
            <Link key={pago.id} href={`/gastos/${gasto.id}`}>
              <div
                className="flex items-center justify-between px-4 py-[14px] border-t border-border transition-colors hover:bg-muted/30"
                style={{ opacity: esPagado ? 0.5 : 1 }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Circular checkbox */}
                  {esPagado ? (
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: '#5E7A3C' }}
                    >
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path
                          d="M1 4l3 3 5-6"
                          stroke="white"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  ) : (
                    <div
                      className="w-5 h-5 rounded-full border-2 flex-shrink-0"
                      style={{ borderColor: '#D97A4E' }}
                    />
                  )}
                  <div className="min-w-0">
                    <p className={`text-[15px] font-semibold text-foreground truncate ${esPagado ? 'line-through' : ''}`}>
                      {gasto.descripcion}
                    </p>
                    <p className="text-[12px] text-muted-foreground">
                      Cuota {pago.numero_cuota}/{gasto.cuotas} · Vence{' '}
                      {format(new Date(pago.fecha_vencimiento), 'd MMM', { locale: es })}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-[15px] font-semibold flex-shrink-0 ml-3 ${
                    esPagado ? 'text-muted-foreground line-through' : 'text-foreground'
                  }`}
                >
                  {gasto.moneda === 'USD' ? 'U$S ' : '$'}
                  {pago.monto.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
