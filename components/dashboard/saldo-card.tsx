import { SaldoData, Cierre } from '@/lib/types'
import { ArrowDown, ArrowUp, Minus } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Props {
  saldoARS: SaldoData
  saldoUSD: SaldoData
  usuarioEmail: string
  cierres?: Cierre[]
}

export function SaldoCard({ saldoARS, saldoUSD, usuarioEmail, cierres = [] }: Props) {
  const equilibrado = saldoARS.monto_deuda < 1
  const yoSoyDeudor = saldoARS.deudor === usuarioEmail
  const montoFmt = Math.round(saldoARS.monto_deuda).toLocaleString('es-AR')
  const acreedorNombre = saldoARS.acreedor === saldoARS.user1.email
    ? saldoARS.user1.nombre : saldoARS.user2.nombre
  const deudorNombre = saldoARS.deudor === saldoARS.user1.email
    ? saldoARS.user1.nombre : saldoARS.user2.nombre

  // Last 6 closed months (ARS) for bar chart
  const cierresARS = [...cierres]
    .filter(c => c.moneda === 'ARS')
    .sort((a, b) => a.mes.localeCompare(b.mes))
    .slice(-6)
  const maxDeuda = cierresARS.length > 0
    ? Math.max(...cierresARS.map(c => c.deuda_final), 1)
    : 1

  return (
    <div className="space-y-4">
      {/* Balance histórico card */}
      <div
        className="rounded-[20px] bg-card border border-border overflow-hidden"
        style={{ boxShadow: '0 1px 2px rgba(42,31,23,0.04)' }}
      >
        <div className="px-[22px] pt-5">
          <p className="text-[11px] font-semibold uppercase tracking-[1.4px] text-muted-foreground">
            Balance histórico
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Desde enero 2024</p>
        </div>

        <div className="px-[22px] mt-4">
          {equilibrado ? (
            <div className="flex items-center gap-2">
              <Minus className="h-5 w-5 text-muted-foreground" />
              <span className="font-display italic text-[48px] leading-none text-muted-foreground">
                al día
              </span>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              {yoSoyDeudor
                ? <ArrowDown className="h-5 w-5 mt-2.5 flex-shrink-0" style={{ color: '#C23B2A' }} />
                : <ArrowUp className="h-5 w-5 mt-2.5 flex-shrink-0" style={{ color: '#5E7A3C' }} />
              }
              <span
                className="font-display italic text-[48px] leading-none"
                style={{ color: yoSoyDeudor ? '#C23B2A' : '#5E7A3C' }}
              >
                $ {montoFmt}
              </span>
            </div>
          )}
          <p className="text-[14px] text-muted-foreground mt-1.5 mb-4">
            {equilibrado
              ? 'Están al día'
              : yoSoyDeudor
              ? <>Le debés a <strong className="text-foreground font-semibold">{acreedorNombre}</strong> en total</>
              : <><strong className="text-foreground font-semibold">{deudorNombre}</strong> te debe en total</>
            }
          </p>
        </div>

        <div className="w-full h-px bg-border" />

        <div className="px-[22px] py-4 grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
              {saldoARS.user1.nombre}
            </p>
            <p className="text-sm font-semibold text-foreground">
              $ {Math.round(saldoARS.user1.total_pagado).toLocaleString('es-AR')}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
              {saldoARS.user2.nombre}
            </p>
            <p className="text-sm font-semibold text-foreground">
              $ {Math.round(saldoARS.user2.total_pagado).toLocaleString('es-AR')}
            </p>
          </div>
        </div>
      </div>

      {/* Monthly bar chart */}
      {cierresARS.length > 0 && (
        <div
          className="rounded-[20px] bg-card border border-border p-5"
          style={{ boxShadow: '0 1px 2px rgba(42,31,23,0.04)' }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[1.4px] text-muted-foreground mb-5">
            Por mes
          </p>
          <div className="flex items-end gap-2" style={{ height: '88px' }}>
            {cierresARS.map(c => {
              const pct = c.deuda_final / maxDeuda
              const barH = Math.max(Math.round(pct * 60), 4)
              const mesLabel = format(new Date(c.mes + '-01'), 'MMM', { locale: es })
              const monto = c.deuda_final >= 1000
                ? `${(c.deuda_final / 1000).toFixed(0)}k`
                : `${Math.round(c.deuda_final)}`
              const esDeudor = c.deudor === usuarioEmail
              const barColor = c.deuda_final < 1 ? '#8A7565' : esDeudor ? '#C23B2A' : '#5E7A3C'
              return (
                <div key={c.id} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-semibold" style={{ color: barColor }}>
                    {monto}
                  </span>
                  <div
                    className="w-full rounded-sm"
                    style={{ height: `${barH}px`, backgroundColor: barColor, opacity: 0.85 }}
                  />
                  <span className="text-[10px] text-muted-foreground capitalize">{mesLabel}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
