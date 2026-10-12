'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { OpcionesToggle } from '@/components/gastos/opciones-toggle'
import { ModalResponsive } from './modal-responsive'
import { fmtARS, fmtUSD, parseMonto } from '@/lib/format'
import { hoyAR } from '@/lib/dates'
import { unidadesPorMonto, type Precio } from '@/lib/precios'
import { TIPO_LABEL, UNIDAD_LABEL } from '@/lib/activos'
import type { DestinoAporte } from '@/lib/inversion'
import type { InvPosicion } from '@/lib/types'

export interface PrefillAporte {
  monto_usd?: number
  cobro_id?: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  metaId: string
  posiciones: InvPosicion[]
  destino: DestinoAporte | null
  precios: Record<string, Precio>
  tc: number
  prefill?: PrefillAporte
}

/**
 * El padre lo monta con una `key` nueva cada vez que lo abre, así el estado
 * inicial (monto sugerido, TC, posición destino) sale fresco de las props.
 */
export function AporteDialog({ open, onOpenChange, metaId, posiciones, destino, precios, tc, prefill }: Props) {
  const router = useRouter()
  const activas = posiciones.filter((p) => p.activo)
  const [loading, setLoading] = useState(false)
  const [moneda, setMoneda] = useState<'USD' | 'ARS'>('USD')
  const [monto, setMonto] = useState(prefill?.monto_usd ? String(Math.round(prefill.monto_usd)) : '')
  const [tcInput, setTcInput] = useState('')
  const [posicionId, setPosicionId] = useState(destino?.posicion.id || activas[0]?.id || '')
  const [fecha, setFecha] = useState(hoyAR())
  const [unidadesInput, setUnidadesInput] = useState('')

  const montoNum = parseMonto(monto)
  const tcNum = parseMonto(tcInput)
  const montoUsd = moneda === 'USD' ? montoNum : tcNum > 0 ? montoNum / tcNum : 0
  const montoArs = moneda === 'ARS' ? montoNum : montoNum * tcNum
  const posicion = activas.find((p) => p.id === posicionId)
  const precio = posicion ? precios[posicion.id] : undefined
  const unidadesAuto = precio && montoUsd > 0 ? unidadesPorMonto(montoUsd, precio, tcNum) : 0
  const unidadLabel = posicion ? UNIDAD_LABEL[posicion.tipo] : ''
  const muestraUnidades = !!posicion && posicion.tipo !== 'dolares' && posicion.tipo !== 'plazo_fijo'

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    if (montoUsd <= 0 || !posicionId) {
      toast.error('Completá el monto y la posición')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/inversion/aportes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meta_id: metaId,
          monto_usd: montoUsd,
          monto_ars: montoArs,
          tipo_cambio: tcNum,
          posicion_id: posicionId,
          fecha,
          cobro_id: prefill?.cobro_id || '',
          unidades: unidadesInput ? parseMonto(unidadesInput) : undefined,
          precio: precio?.precio,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')
      toast.success(`Aporte de ${fmtUSD(montoUsd)} a ${posicion?.ticker || posicion?.nombre || ''} registrado`)
      onOpenChange(false)
      router.refresh()
    } catch (err) {
      toast.error((err as Error).message || 'Error al registrar el aporte')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ModalResponsive
      open={open}
      onOpenChange={onOpenChange}
      titulo="Registrar aporte"
      descripcion="Se guarda en dólares al tipo de cambio del día."
    >
      <form onSubmit={guardar} className="flex flex-col gap-4">
        <FieldGroup className="gap-4">
          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="aporte-monto">Monto</FieldLabel>
              <OpcionesToggle
                aria-label="Moneda"
                value={moneda}
                onChange={(v) => setMoneda(v as 'USD' | 'ARS')}
                opciones={[{ value: 'USD', label: 'USD' }, { value: 'ARS', label: 'ARS' }]}
                className="w-auto"
                itemClassName="h-8 px-3 text-xs"
              />
            </div>
            <Input
              id="aporte-monto"
              inputMode="decimal"
              placeholder="0"
              autoFocus
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              className="h-12 text-2xl font-semibold tabular-nums md:h-10 md:text-lg"
            />
            {montoNum > 0 && tcNum > 0 && (
              <FieldDescription>
                {moneda === 'USD' ? `≈ ${fmtARS(montoArs)}` : `≈ ${fmtUSD(montoUsd, 2)}`} al dólar {fmtARS(tcNum)}
              </FieldDescription>
            )}
          </Field>

          <Field>
            <FieldLabel>Va a</FieldLabel>
            {activas.length === 0 ? (
              <FieldDescription>No hay posiciones en esta meta. Agregalas desde Cartera → Posiciones.</FieldDescription>
            ) : (
              <OpcionesToggle
                value={posicionId}
                onChange={(v) => { setPosicionId(v); setUnidadesInput('') }}
                opciones={activas.map((p) => ({ value: p.id, label: p.ticker || p.nombre }))}
                layout="chips"
                itemClassName="px-3"
              />
            )}
            {posicion && (
              <FieldDescription className="flex flex-wrap items-center gap-1.5">
                <Badge variant="outline">{TIPO_LABEL[posicion.tipo]}</Badge>
                {destino?.posicion.id === posicion.id && (
                  <>
                    <Badge variant="secondary">Sugerida</Badge>
                    {destino.faltante > 0 ? `le faltan ${fmtUSD(destino.faltante)} para su peso objetivo` : 'está en su peso objetivo'}
                    {destino.motivo === 'desriesgo' && ' · fase de desriesgo'}
                  </>
                )}
              </FieldDescription>
            )}
          </Field>

          <div className="grid grid-cols-2 gap-3 *:min-w-0">
            <Field className="min-w-0">
              <FieldLabel htmlFor="aporte-fecha">Fecha</FieldLabel>
              <Input id="aporte-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="h-11 w-full min-w-0 text-base md:h-9 md:text-sm" />
            </Field>
            <Field className="min-w-0">
              <FieldLabel htmlFor="aporte-tc">Dólar</FieldLabel>
              <Input id="aporte-tc" inputMode="decimal" placeholder={tc > 0 ? `ref. CCL ${Math.round(tc)}` : 'ej. 1450'} value={tcInput} onChange={(e) => setTcInput(e.target.value)} className="h-11 w-full min-w-0 text-base tabular-nums md:h-9 md:text-sm" />
            </Field>
          </div>
          <FieldDescription className="-mt-2">Cargá el dólar al que realmente compraste. El CCL de referencia es solo orientativo.</FieldDescription>

          {muestraUnidades && (
            <Field className="min-w-0">
              <FieldLabel htmlFor="aporte-unidades">Cantidad{unidadLabel ? ` de ${unidadLabel}` : ''} (opcional)</FieldLabel>
              <Input
                id="aporte-unidades"
                inputMode="decimal"
                placeholder={unidadesAuto > 0 ? `≈ ${unidadesAuto.toLocaleString('es-AR', { maximumFractionDigits: 2 })} con el precio de hoy` : 'Cuántas compraste'}
                value={unidadesInput}
                onChange={(e) => setUnidadesInput(e.target.value)}
                className="h-11 w-full min-w-0 text-base tabular-nums md:h-9 md:text-sm"
              />
              <FieldDescription>
                {precio
                  ? `Cotiza ${precio.moneda === 'USD' ? fmtUSD(precio.precio, 2) : fmtARS(precio.precio)}${precio.cada100 ? ' cada 100' : ''} (${precio.fuente}). Si lo dejás vacío se calcula con ese precio y el dólar que cargues.`
                  : 'Sin precio automático: anotá cuántas compraste si querés llevarlo.'}
              </FieldDescription>
            </Field>
          )}
        </FieldGroup>

        <div className="sticky bottom-0 -mx-1 bg-gradient-to-t from-popover via-popover/95 to-transparent px-1 pt-3">
          <Button type="submit" size="lg" className="h-12 w-full" disabled={loading || montoUsd <= 0 || !posicionId || tcNum <= 0}>
            {loading && <Spinner data-icon="inline-start" />}
            Confirmar aporte{montoUsd > 0 ? ` de ${fmtUSD(montoUsd)}` : ''}
          </Button>
        </div>
      </form>
    </ModalResponsive>
  )
}
