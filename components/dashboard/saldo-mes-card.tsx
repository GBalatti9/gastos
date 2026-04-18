import { SaldoData } from '@/lib/types'
import { ArrowDown, ArrowUp, Minus } from 'lucide-react'

interface Props {
  saldoARS: SaldoData
  saldoUSD: SaldoData
  usuarioEmail: string
  mesLabel: string
}

function SaldoBlock({
  saldo,
  usuarioEmail,
  moneda,
}: {
  saldo: SaldoData
  usuarioEmail: string
  moneda: string
}) {
  const equilibrado = saldo.monto_deuda < 1
  const yoSoyDeudor = saldo.deudor === usuarioEmail
  const simbolo = moneda === 'USD' ? 'U$S' : '$'
  const montoFmt = saldo.monto_deuda.toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
  const acreedorNombre =
    saldo.acreedor === saldo.user1.email ? saldo.user1.nombre : saldo.user2.nombre
  const deudorNombre =
    saldo.deudor === saldo.user1.email ? saldo.user1.nombre : saldo.user2.nombre

  return (
    <div className="flex-1">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
        {moneda}
      </p>
      {equilibrado ? (
        <div className="flex items-center gap-2">
          <Minus className="h-4 w-4 text-muted-foreground" />
          <span className="font-display italic text-2xl text-muted-foreground">al día</span>
        </div>
      ) : (
        <div>
          <div className="flex items-start gap-1.5">
            {yoSoyDeudor ? (
              <ArrowDown className="h-4 w-4 text-red-700 mt-1.5 flex-shrink-0" />
            ) : (
              <ArrowUp className="h-4 w-4 text-emerald-700 mt-1.5 flex-shrink-0" />
            )}
            <span
              className={`font-display italic text-3xl leading-none ${
                yoSoyDeudor ? 'text-red-700' : 'text-emerald-700'
              }`}
            >
              {simbolo} {montoFmt}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            {yoSoyDeudor
              ? `le debés a ${acreedorNombre}`
              : `${deudorNombre} te debe`}
          </p>
        </div>
      )}
    </div>
  )
}

export function SaldoMesCard({ saldoARS, saldoUSD, usuarioEmail, mesLabel }: Props) {
  return (
    <div className="rounded-2xl bg-card border border-border p-5 space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Saldo del mes
        </p>
        <p className="text-[10px] text-muted-foreground capitalize">{mesLabel}</p>
      </div>

      <div className="flex gap-6">
        <SaldoBlock saldo={saldoARS} usuarioEmail={usuarioEmail} moneda="ARS" />
        <div className="w-px bg-border" />
        <SaldoBlock saldo={saldoUSD} usuarioEmail={usuarioEmail} moneda="USD" />
      </div>

      <div className="pt-4 border-t border-border grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
            {saldoARS.user1.nombre}
          </p>
          <p className="text-sm font-medium text-foreground">
            ${saldoARS.user1.total_pagado.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
            {saldoARS.user2.nombre}
          </p>
          <p className="text-sm font-medium text-foreground">
            ${saldoARS.user2.total_pagado.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
          </p>
        </div>
      </div>
    </div>
  )
}
