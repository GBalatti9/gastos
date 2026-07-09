'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'

interface Props {
  montoDeudaARS: number
  montoDeudaUSD: number
  deudorEmail: string
  deudorNombre: string
  acreedorNombre: string
  usuarioEmail: string
}

export function SaldarDeuda({
  montoDeudaARS,
  montoDeudaUSD,
  deudorEmail,
  deudorNombre,
  acreedorNombre,
  usuarioEmail,
}: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [moneda, setMoneda] = useState<'ARS' | 'USD'>(montoDeudaARS > 0 ? 'ARS' : 'USD')
  const [montoInput, setMontoInput] = useState('')

  const deudaActual = moneda === 'ARS' ? montoDeudaARS : montoDeudaUSD
  const hayDeuda = montoDeudaARS > 0 || montoDeudaUSD > 0
  const yoSoyDeudor = deudorEmail === usuarioEmail

  if (!hayDeuda) return null

  const montoNumerico = parseFloat(montoInput.replace(/[^\d.,]/g, '').replace(',', '.')) || 0
  const montoValido = montoNumerico > 0 && montoNumerico <= deudaActual
  const simbolo = moneda === 'USD' ? 'U$S' : '$'

  function handleOpen(isOpen: boolean) {
    setOpen(isOpen)
    if (isOpen) {
      setMontoInput(Math.round(deudaActual).toString())
      setMoneda(montoDeudaARS > 0 ? 'ARS' : 'USD')
    }
  }

  async function handleSaldar() {
    if (!montoValido) return
    setLoading(true)
    try {
      const res = await fetch('/api/gastos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          descripcion: 'Liquidacion de deuda',
          monto_total: montoNumerico,
          pagado_por: deudorEmail,
          cuotas: '1',
          fecha_inicio: format(new Date(), 'yyyy-MM-dd'),
          carga_inmediata: 'si',
          categoria: 'Liquidacion',
          notas: `Pago de ${deudorNombre} a ${acreedorNombre}`,
          moneda,
          tipo_division: 'porcentaje',
          division_valor: '0',
          recurrente: 'no',
          metodo_pago: 'efectivo',
          tarjeta_id: '',
        }),
      })
      if (!res.ok) throw new Error()
      toast.success(`Deuda saldada: ${simbolo} ${Math.round(montoNumerico).toLocaleString('es-AR')}`)
      setOpen(false)
      router.refresh()
    } catch {
      toast.error('Error al saldar la deuda')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpen}>
      <AlertDialogTrigger render={<Button size="lg" />}>Saldar deuda</AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Saldar deuda</AlertDialogTitle>
          <AlertDialogDescription>
            {yoSoyDeudor
              ? <>Le debes <strong>{simbolo} {Math.round(deudaActual).toLocaleString('es-AR')}</strong> a <strong>{acreedorNombre}</strong></>
              : <><strong>{deudorNombre}</strong> te debe <strong>{simbolo} {Math.round(deudaActual).toLocaleString('es-AR')}</strong></>
            }
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3">
          {/* Moneda selector */}
          {montoDeudaARS > 0 && montoDeudaUSD > 0 && (
            <div className="flex rounded-full overflow-hidden border border-border w-fit">
              {(['ARS', 'USD'] as const).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMoneda(m)
                    const d = m === 'ARS' ? montoDeudaARS : montoDeudaUSD
                    setMontoInput(Math.round(d).toString())
                  }}
                  className={cn(
                    'px-3 py-1 text-[12px] font-semibold transition-all',
                    moneda === m
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          )}

          {/* Monto input */}
          <div className="space-y-1">
            <p className="text-[12px] text-muted-foreground">Monto a pagar</p>
            <div className="flex items-center gap-2 bg-muted rounded-[10px] px-3 py-2">
              <span className="text-[14px] text-muted-foreground">{simbolo}</span>
              <input
                type="text"
                inputMode="decimal"
                value={montoInput}
                onChange={e => setMontoInput(e.target.value.replace(/[^\d.,]/g, ''))}
                className="flex-1 text-[18px] font-semibold bg-transparent text-foreground outline-none"
                autoFocus
              />
            </div>
            {montoNumerico > deudaActual && (
              <p className="text-[11px]" style={{ color: '#C23B2A' }}>
                El monto no puede superar la deuda
              </p>
            )}
          </div>

          {/* Quick amounts */}
          {deudaActual > 10000 && (
            <div className="flex gap-1.5 flex-wrap">
              {[
                { label: 'Total', value: Math.round(deudaActual) },
                { label: '50%', value: Math.round(deudaActual / 2) },
                ...(deudaActual > 100000 ? [{ label: '100k', value: 100000 }] : []),
                ...(deudaActual > 50000 ? [{ label: '50k', value: 50000 }] : []),
              ].map(q => (
                <button
                  key={q.label}
                  type="button"
                  onClick={() => setMontoInput(q.value.toString())}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors',
                    montoInput === q.value.toString()
                      ? 'bg-foreground/10 border-foreground/20 text-foreground'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  )}
                >
                  {q.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <button
            type="button"
            onClick={handleSaldar}
            disabled={loading || !montoValido}
            className={cn(
              'inline-flex items-center justify-center h-9 px-4 rounded-md text-sm font-medium transition-all',
              montoValido
                ? 'bg-foreground text-background hover:opacity-90'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            )}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              `Pagar ${simbolo} ${montoNumerico > 0 ? Math.round(montoNumerico).toLocaleString('es-AR') : '0'}`
            )}
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
