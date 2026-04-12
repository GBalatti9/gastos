import { ProximoVencimiento } from '@/lib/types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'

interface Props {
  proximos: ProximoVencimiento[]
}

export function ProximosVencimientos({ proximos }: Props) {
  return (
    <div className="rounded-2xl bg-card border border-border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Próximos vencimientos
        </p>
        {proximos.length > 0 && (
          <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            {proximos.length}
          </span>
        )}
      </div>

      {proximos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin vencimientos en los próximos 30 días.</p>
      ) : (
        <div className="space-y-1">
          {proximos.map(v => {
            const urgente = v.dias_restantes <= 3
            const proximo = v.dias_restantes <= 7
            const simbolo = v.gasto.moneda === 'USD' ? 'U$S' : '$'
            const labelDias =
              v.dias_restantes === 0 ? 'Hoy' :
              v.dias_restantes === 1 ? 'Mañana' :
              `${v.dias_restantes}d`

            return (
              <Link key={v.pago.id} href={`/gastos/${v.gasto.id}`}>
                <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors group">
                  {/* Urgency bar */}
                  <div
                    className={`w-0.5 h-8 rounded-full flex-shrink-0 ${
                      urgente ? 'bg-red-600' : proximo ? 'bg-primary' : 'bg-border'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {v.gasto.descripcion}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Cuota {v.pago.numero_cuota}/{v.gasto.cuotas} ·{' '}
                      {format(new Date(v.pago.fecha_vencimiento), "d MMM", { locale: es })}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-foreground">
                      {simbolo} {v.pago.monto.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                    </p>
                    <p
                      className={`text-[10px] font-semibold uppercase tracking-wide ${
                        urgente ? 'text-red-700' : proximo ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    >
                      {labelDias}
                    </p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
