'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { ModalResponsive } from './modal-responsive'
import { fmtFecha, fmtUSD, parseMonto } from '@/lib/format'
import { hoyAR } from '@/lib/dates'
import type { ValorPosicion } from '@/lib/inversion'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  porPosicion: ValorPosicion[]
}

/** Una vez por mes: cuánto vale hoy cada posición, en USD. */
export function ValuacionesDialog({ open, onOpenChange, porPosicion }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fecha, setFecha] = useState(hoyAR())
  // Prellenar solo las que se valúan a mano; las automáticas y los dólares quedan vacías (no se guardan)
  const [valores, setValores] = useState<Record<string, string>>(
    Object.fromEntries(porPosicion.filter((v) => v.fuente === 'valuacion' || v.fuente === 'costo').map((v) => [v.posicion.id, String(Math.round(v.valor))]))
  )

  const total = porPosicion.reduce((s, v) => s + (valores[v.posicion.id]?.trim() ? parseMonto(valores[v.posicion.id]) : v.valor), 0)

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/inversion/valuaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fecha,
          valores: Object.fromEntries(Object.entries(valores).filter(([, v]) => v.trim() !== '').map(([id, v]) => [id, parseMonto(v)])),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')
      toast.success('Cartera actualizada')
      onOpenChange(false)
      router.refresh()
    } catch (err) {
      toast.error((err as Error).message || 'No se pudo guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ModalResponsive open={open} onOpenChange={onOpenChange} titulo="Actualizar valores" descripcion="Cuánto vale hoy cada posición. Así la app separa lo que pusiste vos de lo que hizo el mercado.">
      <form onSubmit={guardar} className="flex flex-col gap-4">
        <FieldGroup className="gap-3">
          <Field>
            <FieldLabel htmlFor="val-fecha">Fecha</FieldLabel>
            <Input id="val-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="h-11 text-base md:h-9 md:text-sm" />
          </Field>
          {porPosicion.filter((v) => v.fuente !== 'dolares').map((v) => (
            <Field key={v.posicion.id} orientation="horizontal">
              <div className="flex-1">
                <FieldLabel htmlFor={`val-${v.posicion.id}`}>{v.posicion.ticker}</FieldLabel>
                <FieldDescription>
                  {v.fuente === 'precio'
                    ? `tiene precio automático (${fmtUSD(v.valor)}); solo cargalo si querés pisarlo`
                    : v.fuente === 'dolares'
                    ? 'dólares quietos: vale lo aportado'
                    : v.fuente === 'valuacion' && v.fecha_valuacion
                    ? `última: ${fmtUSD(v.valor)} (${fmtFecha(v.fecha_valuacion)})`
                    : `sin valuación · costo ${fmtUSD(v.aportado)}`}
                </FieldDescription>
              </div>
              <div className="relative w-36">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">US$</span>
                <Input
                  id={`val-${v.posicion.id}`}
                  inputMode="decimal"
                  value={valores[v.posicion.id] ?? ''}
                  onChange={(e) => setValores((s) => ({ ...s, [v.posicion.id]: e.target.value }))}
                  className="pl-11 text-right text-base tabular-nums md:text-sm"
                />
              </div>
            </Field>
          ))}
        </FieldGroup>
        <p className="text-right text-sm text-muted-foreground">Total: <span className="font-semibold text-foreground">{fmtUSD(total)}</span></p>
        <div className="sticky bottom-0 -mx-1 bg-gradient-to-t from-popover via-popover/95 to-transparent px-1 pt-3">
          <Button type="submit" size="lg" className="h-12 w-full" disabled={loading || porPosicion.length === 0}>
            {loading && <Spinner data-icon="inline-start" />}
            Guardar valores
          </Button>
        </div>
      </form>
    </ModalResponsive>
  )
}
