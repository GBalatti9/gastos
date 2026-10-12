'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { OpcionesToggle } from '@/components/gastos/opciones-toggle'
import { ModalResponsive } from './modal-responsive'
import { sugerenciaParaCobro, type Sugerencia } from '@/lib/inversion'
import { fmtARS, fmtUSD, parseMonto } from '@/lib/format'
import { hoyAR } from '@/lib/dates'
import type { InvCobro, InvMeta } from '@/lib/types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  meta: InvMeta
  cobros: InvCobro[]
  tc: number
  /** Se llama al guardar; si `registrarAporte` es true, el padre abre el alta de aporte prellenada. */
  onGuardado: (cobro: InvCobro, sugerencia: Sugerencia, registrarAporte: boolean) => void
}

export function CobroDialog({ open, onOpenChange, meta, cobros, tc, onGuardado }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<'guardar' | 'aporte' | null>(null)
  const [monto, setMonto] = useState('')
  const [tipo, setTipo] = useState<'base' | 'extra'>('base')
  const [fecha, setFecha] = useState(hoyAR())
  const [tcInput, setTcInput] = useState(tc > 0 ? String(Math.round(tc)) : '')

  const montoNum = parseMonto(monto)
  const tcNum = parseMonto(tcInput)
  const sugerencia =
    montoNum > 0 && tcNum > 0
      ? sugerenciaParaCobro({ monto_ars: montoNum, tipo, tipo_cambio: tcNum, fecha }, meta, cobros)
      : null

  function reset() {
    setMonto('')
    setTipo('base')
    setFecha(hoyAR())
    setTcInput(tc > 0 ? String(Math.round(tc)) : '')
  }

  async function guardar(registrarAporte: boolean) {
    if (montoNum <= 0 || tcNum <= 0) {
      toast.error('Completá el monto y el tipo de cambio')
      return
    }
    setLoading(registrarAporte ? 'aporte' : 'guardar')
    try {
      const res = await fetch('/api/inversion/cobros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monto_ars: montoNum, tipo, fecha, tipo_cambio: tcNum }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')
      toast.success(
        data.sugerencia.total_usd > 0
          ? `Cobro guardado · te toca invertir ${fmtARS(data.sugerencia.total_ars)}`
          : 'Cobro guardado'
      )
      reset()
      onOpenChange(false)
      onGuardado(data.cobro, data.sugerencia, registrarAporte)
      router.refresh()
    } catch (e) {
      toast.error((e as Error).message || 'Error al guardar el cobro')
    } finally {
      setLoading(null)
    }
  }

  return (
    <ModalResponsive
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) reset()
      }}
      titulo="Cargar cobro"
      descripcion="La app te dice al instante cuánto de este cobro te toca invertir."
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          guardar(false)
        }}
        className="flex flex-col gap-4"
      >
        <FieldGroup className="gap-4">
          <Field>
            <FieldLabel htmlFor="cobro-monto">Monto cobrado (ARS)</FieldLabel>
            <Input
              id="cobro-monto"
              inputMode="decimal"
              placeholder="3.500.000"
              autoFocus
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              className="h-12 text-2xl font-semibold tabular-nums md:h-10 md:text-lg"
            />
          </Field>
          <Field>
            <FieldLabel>Tipo</FieldLabel>
            <OpcionesToggle
              value={tipo}
              onChange={(v) => setTipo(v as 'base' | 'extra')}
              opciones={[
                { value: 'base', label: 'Sueldo base' },
                { value: 'extra', label: 'Extra' },
              ]}
              columnas={2}
            />
            <FieldDescription>
              {tipo === 'base'
                ? `Base: ${fmtUSD(meta.aporte_base_usd)} al dólar del día. Lo que supere ${fmtARS(meta.ingreso_base_ars)} se invierte al ${meta.pct_extra} %.`
                : `Un extra se invierte al ${meta.pct_extra} %.`}
            </FieldDescription>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel htmlFor="cobro-fecha">Fecha</FieldLabel>
              <Input id="cobro-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="h-11 text-base md:h-9 md:text-sm" />
            </Field>
            <Field>
              <FieldLabel htmlFor="cobro-tc">Dólar CCL</FieldLabel>
              <Input id="cobro-tc" inputMode="decimal" value={tcInput} onChange={(e) => setTcInput(e.target.value)} className="h-11 text-base tabular-nums md:h-9 md:text-sm" />
            </Field>
          </div>
        </FieldGroup>

        <div className="rounded-xl border bg-muted/30 p-4">
          {sugerencia ? (
            <>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">De este cobro te toca invertir</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {fmtARS(sugerencia.total_ars)}
                <span className="ml-2 text-base font-normal text-muted-foreground">≈ {fmtUSD(sugerencia.total_usd)}</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {sugerencia.incluye_base && <>Base {fmtUSD(sugerencia.base_usd)}</>}
                {sugerencia.incluye_base && sugerencia.extra_usd > 0 && ' + '}
                {sugerencia.extra_usd > 0 && <>extra {fmtUSD(sugerencia.extra_usd)} ({fmtARS(sugerencia.extra_ars)})</>}
                {!sugerencia.incluye_base && sugerencia.extra_usd === 0 && 'Este mes ya cargaste el sueldo base; de este cobro no toca nada.'}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Ingresá el monto para ver cuánto te toca.</p>
          )}
        </div>

        <div className="sticky bottom-0 -mx-1 flex flex-col gap-2 bg-gradient-to-t from-popover via-popover/95 to-transparent px-1 pt-3 sm:flex-row">
          <Button type="submit" variant="outline" size="lg" className="h-12 flex-1" disabled={loading !== null}>
            {loading === 'guardar' && <Spinner data-icon="inline-start" />}
            Guardar
          </Button>
          <Button type="button" size="lg" className="h-12 flex-1" disabled={loading !== null || !sugerencia || sugerencia.total_usd <= 0} onClick={() => guardar(true)}>
            {loading === 'aporte' && <Spinner data-icon="inline-start" />}
            Guardar y registrar aporte
          </Button>
        </div>
      </form>
    </ModalResponsive>
  )
}
