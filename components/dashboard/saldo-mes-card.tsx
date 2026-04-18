import { SaldoData } from '@/lib/types'
import { ArrowDown, ArrowUp, Minus } from 'lucide-react'

interface Props {
  saldoARS: SaldoData
  saldoUSD: SaldoData
  usuarioEmail: string
  mesLabel: string
}

export function SaldoMesCard({ saldoARS, saldoUSD, usuarioEmail, mesLabel }: Props) {
  const equilibrado = saldoARS.monto_deuda < 1
  const yoSoyDeudor = saldoARS.deudor === usuarioEmail
  const montoFmt = Math.round(saldoARS.monto_deuda).toLocaleString('es-AR')
  const acreedorNombre = saldoARS.acreedor === saldoARS.user1.email
    ? saldoARS.user1.nombre : saldoARS.user2.nombre
  const deudorNombre = saldoARS.deudor === saldoARS.user1.email
    ? saldoARS.user1.nombre : saldoARS.user2.nombre

  const totalPagado = saldoARS.user1.total_pagado + saldoARS.user2.total_pagado
  const pct1 = totalPagado > 0 ? (saldoARS.user1.total_pagado / totalPagado) * 100 : 50

  const usdEquilibrado = saldoUSD.monto_deuda < 1
  const usdYoSoyDeudor = saldoUSD.deudor === usuarioEmail
  const usdMontoFmt = Math.round(saldoUSD.monto_deuda).toLocaleString('es-AR')
  const usdAcreedorNombre = saldoUSD.acreedor === saldoUSD.user1.email
    ? saldoUSD.user1.nombre : saldoUSD.user2.nombre

  return (
    <div
      className="rounded-[20px] bg-card border border-border overflow-hidden"
      style={{ boxShadow: '0 1px 2px rgba(42,31,23,0.04)' }}
    >
      {/* Header */}
      <div className="px-[22px] pt-5 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[1.4px] text-muted-foreground">
          Saldo del mes
        </p>
        <p className="text-[11px] text-muted-foreground capitalize">{mesLabel}</p>
      </div>

      {/* Hero monto */}
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
            ? <>Le debés a <strong className="text-foreground font-semibold">{acreedorNombre}</strong></>
            : <><strong className="text-foreground font-semibold">{deudorNombre}</strong> te debe</>
          }
        </p>
      </div>

      {/* Full-bleed separator */}
      <div className="w-full h-px bg-border" />

      {/* Desglose barras */}
      <div className="px-[22px] py-4 space-y-2">
        <div className="flex justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[1.4px] text-muted-foreground">
            {saldoARS.user1.nombre.toUpperCase()}
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-[1.4px] text-muted-foreground">
            {saldoARS.user2.nombre.toUpperCase()}
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden bg-muted flex">
          <div
            className="h-full rounded-l-full"
            style={{ width: `${pct1}%`, backgroundColor: '#B8876B' }}
          />
          <div className="h-full rounded-r-full flex-1" style={{ backgroundColor: '#8B5E3C' }} />
        </div>
        <div className="flex justify-between">
          <span className="text-[14px] font-semibold text-foreground">
            $ {Math.round(saldoARS.user1.total_pagado).toLocaleString('es-AR')}
          </span>
          <span className="text-[14px] font-semibold text-foreground">
            $ {Math.round(saldoARS.user2.total_pagado).toLocaleString('es-AR')}
          </span>
        </div>
      </div>

      {/* USD pill footer */}
      <div className="px-[22px] pb-5">
        <div className="flex items-center justify-between px-3 py-2 rounded-full bg-muted">
          <span className="text-[11px] font-semibold text-muted-foreground">USD</span>
          <span className="font-display italic text-[13px] text-muted-foreground">
            {usdEquilibrado
              ? '— al día'
              : `${usdYoSoyDeudor ? '↓' : '↑'} U$S ${usdMontoFmt}${usdYoSoyDeudor
                ? ` · debés a ${usdAcreedorNombre}`
                : ' · te deben'}`
            }
          </span>
        </div>
      </div>
    </div>
  )
}
