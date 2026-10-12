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

export interface SugerenciaMeta {
  meta_id: string
  nombre: string
  sugerencia: Sugerencia
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  metas: InvMeta[]
  metaActual: InvMeta
  cobros: InvCobro[]
  tc: number
  /** Se llama al guardar; si `registrarAporte` es true, el padre abre el alta de aporte prellenada. */
  onGuardado: (cobro: InvCobro, sugerencias: SugerenciaMeta[], registrarAporte: boolean) => void
}

export function CobroDialog({ open, onOpenChange, metas, metaActual, cobros, tc, onGuardado }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<'guardar' | 'aporte' | null>(null)
  const [monto, setMonto] = useState('')
  const [tipo, setTipo] = useState<'base' | 'extra'>('base')
  const [fecha, setFecha] = useState(hoyAR())
  const [tcInput, setTcInput] = useState('')

  const montoNum = parseMonto(monto)
  const tcNum = parseMonto(tcInput)
  const sugerencias: SugerenciaMeta[] =
    montoNum > 0 && tcNum > 0
      ? metas.map((m) => ({
          meta_id: m.id,
          nombre: m.nombre,
          sugerencia: sugerenciaParaCobro({ monto_ars: montoNum, tipo, tipo_cambio: tcNum, fecha }, m, cobros),
        }))
      : []
  const total = sugerencias.reduce((s, x) => s + x.sugerencia.total_usd, 0)
  const totalArs = sugerencias.reduce((s, x) => s + x.sugerencia.total_ars, 0)
  const deActual = sugerencias.find((s) => s.meta_id === metaActual.id)?.sugerencia

  function reset() {
    setMonto('')
    setTipo('base')
    setFecha(hoyAR())
    setTcInput('')
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
      const sugs: SugerenciaMeta[] = data.sugerencias
      const tot = sugs.reduce((s, x) => s + x.sugerencia.total_ars, 0)
      toast.success(tot > 0 ? `Cobro guardado · te toca invertir ${fmtARS(tot)}` : 'Cobro guardado')
      reset()
      onOpenChange(false)
      onGuardado(data.cobro, sugs, registrarAporte)
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
              placeholder="0"
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
                ? `Base: ${fmtUSD(metaActual.aporte_base_usd)} al dólar que cargues. Lo que supere tu ingreso base se invierte al ${metaActual.pct_extra} %.`
                : `Un extra se invierte al ${metaActual.pct_extra} %.`}
            </FieldDescription>
          </Field>
          <div className="grid grid-cols-2 gap-3 *:min-w-0">
            <Field className="min-w-0">
              <FieldLabel htmlFor="cobro-fecha">Fecha</FieldLabel>
              <Input id="cobro-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="h-11 w-full min-w-0 text-base md:h-9 md:text-sm" />
            </Field>
            <Field className="min-w-0">
              <FieldLabel htmlFor="cobro-tc">Dólar</FieldLabel>
              <Input id="cobro-tc" inputMode="decimal" placeholder={tc > 0 ? `ref. CCL ${Math.round(tc)}` : 'ej. 1450'} value={tcInput} onChange={(e) => setTcInput(e.target.value)} className="h-11 w-full min-w-0 text-base tabular-nums md:h-9 md:text-sm" />
            </Field>
          </div>
          <FieldDescription className="-mt-2">Cargá el dólar al que realmente comprás. El CCL de referencia es solo orientativo.</FieldDescription>
        </FieldGroup>

        <div className="rounded-xl border bg-muted/30 p-4">
          {sugerencias.length > 0 ? (
            <>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">De este cobro te toca invertir</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {fmtARS(totalArs)}
                <span className="ml-2 text-base font-normal text-muted-foreground">≈ {fmtUSD(total)}</span>
              </p>
              <div className="mt-2 flex flex-col gap-1 text-xs text-muted-foreground">
                {sugerencias.map(({ meta_id, nombre, sugerencia: s }) => (
                  <p key={meta_id}>
                    {metas.length > 1 && <span className="font-medium text-foreground">{nombre}: </span>}
                    {s.incluye_base && <>base {fmtUSD(s.base_usd)}</>}
                    {s.incluye_base && s.extra_usd > 0 && ' + '}
                    {s.extra_usd > 0 && <>extra {fmtUSD(s.extra_usd)} ({fmtARS(s.extra_ars)})</>}
                    {!s.incluye_base && s.extra_usd === 0 && 'este mes ya cargaste el sueldo base; de este cobro no toca nada'}
                  </p>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">{montoNum > 0 && tcNum <= 0 ? 'Cargá el dólar para ver cuánto te toca.' : 'Ingresá el monto para ver cuánto te toca.'}</p>
          )}
        </div>

        <div className="sticky bottom-0 -mx-1 flex flex-col gap-2 bg-gradient-to-t from-popover via-popover/95 to-transparent px-1 pt-3 sm:flex-row">
          <Button type="submit" variant="outline" size="lg" className="h-12 flex-1" disabled={loading !== null}>
            {loading === 'guardar' && <Spinner data-icon="inline-start" />}
            Guardar
          </Button>
          <Button type="button" size="lg" className="h-12 flex-1" disabled={loading !== null || !deActual || deActual.total_usd <= 0} onClick={() => guardar(true)}>
            {loading === 'aporte' && <Spinner data-icon="inline-start" />}
            Guardar y aportar{metas.length > 1 ? ` a ${metaActual.nombre}` : ''}
          </Button>
        </div>
      </form>
    </ModalResponsive>
  )
}
