'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Cierre, SaldoData } from '@/lib/types'
import { CheckCircle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'

interface Props {
  cierres: Cierre[]
  saldoARS: SaldoData
  saldoUSD: SaldoData
  mesActual: string
}

export function CierreMes({ cierres, saldoARS, saldoUSD, mesActual }: Props) {
  const [loading, setLoading] = useState(false)
  const [mostrarHistorial, setMostrarHistorial] = useState(false)
  const [listaCierres, setListaCierres] = useState(cierres)

  const cierreARSExiste = listaCierres.some(c => c.mes === mesActual && c.moneda === 'ARS')
  const cierreUSDExiste = listaCierres.some(c => c.mes === mesActual && c.moneda === 'USD')
  const mesLabel = format(new Date(mesActual + '-01'), 'MMMM yyyy', { locale: es })
  const cierresOrdenados = [...listaCierres].sort((a, b) => b.mes.localeCompare(a.mes))

  async function cerrarMes(moneda: 'ARS' | 'USD') {
    setLoading(true)
    try {
      const res = await fetch('/api/cierres', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mes: mesActual, moneda }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al cerrar')
      }
      const nuevo = await res.json()
      setListaCierres(prev => [...prev, nuevo])
      toast.success(`Mes cerrado en ${moneda}`)
    } catch (err: any) {
      toast.error(err.message || 'Error al cerrar el mes')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl bg-card border border-border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Cierre de mes
        </p>
        <p className="text-[10px] text-muted-foreground capitalize">{mesLabel}</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* ARS */}
        <div className="rounded-xl bg-muted/40 border border-border p-3 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">ARS</p>
          {cierreARSExiste ? (
            <div className="flex items-center gap-1.5 text-emerald-700 text-sm">
              <CheckCircle className="h-3.5 w-3.5" />
              <span className="font-medium">Cerrado</span>
            </div>
          ) : (
            <>
              <p className="text-sm font-semibold text-foreground">
                ${saldoARS.monto_deuda.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
              </p>
              <Button
                size="sm"
                variant="outline"
                className="w-full text-xs h-7 border-border text-muted-foreground hover:text-foreground"
                onClick={() => cerrarMes('ARS')}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Cerrar ARS'}
              </Button>
            </>
          )}
        </div>

        {/* USD */}
        <div className="rounded-xl bg-muted/40 border border-border p-3 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">USD</p>
          {cierreUSDExiste ? (
            <div className="flex items-center gap-1.5 text-emerald-700 text-sm">
              <CheckCircle className="h-3.5 w-3.5" />
              <span className="font-medium">Cerrado</span>
            </div>
          ) : (
            <>
              <p className="text-sm font-semibold text-foreground">
                U$S {saldoUSD.monto_deuda.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
              </p>
              <Button
                size="sm"
                variant="outline"
                className="w-full text-xs h-7 border-border text-muted-foreground hover:text-foreground"
                onClick={() => cerrarMes('USD')}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Cerrar USD'}
              </Button>
            </>
          )}
        </div>
      </div>

      {listaCierres.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setMostrarHistorial(v => !v)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {mostrarHistorial ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {mostrarHistorial ? 'Ocultar' : 'Ver'} historial ({listaCierres.length})
          </button>

          {mostrarHistorial && (
            <div className="mt-3 space-y-1">
              {cierresOrdenados.map(c => (
                <div key={c.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-foreground capitalize">
                      {format(new Date(c.mes + '-01'), 'MMM yyyy', { locale: es })}
                    </span>
                    <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {c.moneda}
                    </span>
                  </div>
                  <span className={`text-sm font-medium ${c.deuda_final < 1 ? 'text-emerald-700' : 'text-foreground'}`}>
                    {c.deuda_final < 1
                      ? 'Al día'
                      : `${c.moneda === 'USD' ? 'U$S ' : '$'}${c.deuda_final.toLocaleString('es-AR', { minimumFractionDigits: 0 })}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
