'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { ModalResponsive } from './modal-responsive'
import { mesActualAR } from '@/lib/dates'
import { parseMonto } from '@/lib/format'
import type { InvMeta } from '@/lib/types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  meta: InvMeta | null
}

export function MetaDialog({ open, onOpenChange, meta }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    monto_objetivo_usd: meta ? String(meta.monto_objetivo_usd) : '50000',
    fecha_objetivo: meta?.fecha_objetivo || '2029-04',
    aporte_base_usd: meta ? String(meta.aporte_base_usd) : '500',
    ingreso_base_ars: meta ? String(meta.ingreso_base_ars) : '3500000',
    pct_extra: meta ? String(meta.pct_extra) : '100',
    fecha_inicio: meta?.fecha_inicio || mesActualAR(),
    desriesgo_etapas: meta ? meta.desriesgo_etapas.join(',') : '30,60,90',
  })
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/inversion/meta', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          monto_objetivo_usd: parseMonto(form.monto_objetivo_usd),
          aporte_base_usd: parseMonto(form.aporte_base_usd),
          ingreso_base_ars: parseMonto(form.ingreso_base_ars),
          pct_extra: parseMonto(form.pct_extra),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')
      toast.success(meta ? 'Meta actualizada' : 'Meta creada')
      onOpenChange(false)
      router.refresh()
    } catch (err) {
      toast.error((err as Error).message || 'Error al guardar la meta')
    } finally {
      setLoading(false)
    }
  }

  const input = 'h-11 text-base tabular-nums md:h-9 md:text-sm'

  return (
    <ModalResponsive
      open={open}
      onOpenChange={onOpenChange}
      titulo={meta ? 'Editar meta' : 'Configurar mi meta'}
      descripcion="La regla: una base fija en dólares por mes, más un porcentaje de lo que cobres por encima de tu ingreso base."
    >
      <form onSubmit={guardar} className="flex flex-col gap-4">
        <FieldGroup className="gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel htmlFor="meta-objetivo">Objetivo (USD)</FieldLabel>
              <Input id="meta-objetivo" inputMode="decimal" value={form.monto_objetivo_usd} onChange={(e) => set('monto_objetivo_usd', e.target.value)} className={input} />
            </Field>
            <Field>
              <FieldLabel htmlFor="meta-fecha">Fecha objetivo</FieldLabel>
              <Input id="meta-fecha" type="month" value={form.fecha_objetivo} onChange={(e) => set('fecha_objetivo', e.target.value)} className={input} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel htmlFor="meta-base">Aporte base (USD/mes)</FieldLabel>
              <Input id="meta-base" inputMode="decimal" value={form.aporte_base_usd} onChange={(e) => set('aporte_base_usd', e.target.value)} className={input} />
            </Field>
            <Field>
              <FieldLabel htmlFor="meta-pct">% del extra a invertir</FieldLabel>
              <Input id="meta-pct" inputMode="numeric" value={form.pct_extra} onChange={(e) => set('pct_extra', e.target.value)} className={input} />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="meta-ingreso">Ingreso base (ARS/mes)</FieldLabel>
            <Input id="meta-ingreso" inputMode="decimal" value={form.ingreso_base_ars} onChange={(e) => set('ingreso_base_ars', e.target.value)} className={input} />
            <FieldDescription>Lo que cobres por encima de esto cuenta como extra.</FieldDescription>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel htmlFor="meta-inicio">Empecé en</FieldLabel>
              <Input id="meta-inicio" type="month" value={form.fecha_inicio} onChange={(e) => set('fecha_inicio', e.target.value)} className={input} />
            </Field>
            <Field>
              <FieldLabel htmlFor="meta-etapas">Desriesgo (% a 24/12/6 m)</FieldLabel>
              <Input id="meta-etapas" value={form.desriesgo_etapas} onChange={(e) => set('desriesgo_etapas', e.target.value)} placeholder="30,60,90" className={input} />
            </Field>
          </div>
          <FieldDescription>
            A 24, 12 y 6 meses de la fecha objetivo, ese porcentaje de la cartera tiene que estar en el balde seguro.
          </FieldDescription>
        </FieldGroup>

        <div className="sticky bottom-0 -mx-1 bg-gradient-to-t from-popover via-popover/95 to-transparent px-1 pt-3">
          <Button type="submit" size="lg" className="h-12 w-full" disabled={loading}>
            {loading && <Spinner data-icon="inline-start" />}
            {meta ? 'Guardar cambios' : 'Crear meta'}
          </Button>
        </div>
      </form>
    </ModalResponsive>
  )
}
