'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { ModalResponsive } from './modal-responsive'
import { mesActualAR } from '@/lib/dates'
import { parseMonto } from '@/lib/format'
import type { InvMeta } from '@/lib/types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** null = crear una meta nueva */
  meta: InvMeta | null
  puedeBorrar?: boolean
  onGuardada?: (meta: InvMeta) => void
}

export function MetaDialog({ open, onOpenChange, meta, puedeBorrar, onGuardada }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    nombre: meta?.nombre || '',
    monto_objetivo_usd: meta ? String(meta.monto_objetivo_usd) : '',
    fecha_objetivo: meta?.fecha_objetivo || '',
    aporte_base_usd: meta ? String(meta.aporte_base_usd) : '',
    ingreso_base_ars: meta ? String(meta.ingreso_base_ars) : '',
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
          id: meta?.id,
          monto_objetivo_usd: parseMonto(form.monto_objetivo_usd),
          aporte_base_usd: parseMonto(form.aporte_base_usd),
          ingreso_base_ars: parseMonto(form.ingreso_base_ars),
          pct_extra: parseMonto(form.pct_extra),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')
      toast.success(meta ? 'Meta actualizada' : 'Meta creada. Ahora armá la cartera.')
      onOpenChange(false)
      onGuardada?.(data)
      router.refresh()
    } catch (err) {
      toast.error((err as Error).message || 'Error al guardar la meta')
    } finally {
      setLoading(false)
    }
  }

  async function borrar() {
    if (!meta) return
    setLoading(true)
    try {
      const res = await fetch(`/api/inversion/meta/${meta.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success(`Meta "${meta.nombre}" borrada`)
      onOpenChange(false)
      router.push('/inversion')
      router.refresh()
    } catch {
      toast.error('No se pudo borrar la meta')
    } finally {
      setLoading(false)
    }
  }

  const input = 'h-11 text-base tabular-nums md:h-9 md:text-sm'

  return (
    <ModalResponsive
      open={open}
      onOpenChange={onOpenChange}
      titulo={meta ? `Editar ${meta.nombre}` : 'Nueva meta'}
      descripcion="La regla: una base fija en dólares por mes, más un porcentaje de lo que cobres por encima de tu ingreso base."
    >
      <form onSubmit={guardar} className="flex flex-col gap-4">
        <FieldGroup className="gap-4">
          <Field>
            <FieldLabel htmlFor="meta-nombre">Nombre</FieldLabel>
            <Input id="meta-nombre" placeholder="Fondo largo plazo, Viaje 2028…" value={form.nombre} onChange={(e) => set('nombre', e.target.value)} className="h-11 text-base md:h-9 md:text-sm" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel htmlFor="meta-objetivo">Objetivo (USD)</FieldLabel>
              <Input id="meta-objetivo" inputMode="decimal" placeholder="0" value={form.monto_objetivo_usd} onChange={(e) => set('monto_objetivo_usd', e.target.value)} className={input} />
            </Field>
            <Field>
              <FieldLabel htmlFor="meta-fecha">Fecha objetivo</FieldLabel>
              <Input id="meta-fecha" type="month" value={form.fecha_objetivo} onChange={(e) => set('fecha_objetivo', e.target.value)} className={input} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel htmlFor="meta-base">Aporte base (USD/mes)</FieldLabel>
              <Input id="meta-base" inputMode="decimal" placeholder="0" value={form.aporte_base_usd} onChange={(e) => set('aporte_base_usd', e.target.value)} className={input} />
            </Field>
            <Field>
              <FieldLabel htmlFor="meta-pct">% del extra a invertir</FieldLabel>
              <Input id="meta-pct" inputMode="numeric" value={form.pct_extra} onChange={(e) => set('pct_extra', e.target.value)} className={input} />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="meta-ingreso">Ingreso base (ARS/mes)</FieldLabel>
            <Input id="meta-ingreso" inputMode="decimal" placeholder="0" value={form.ingreso_base_ars} onChange={(e) => set('ingreso_base_ars', e.target.value)} className={input} />
            <FieldDescription>Lo que cobres por encima de esto cuenta como extra. Si tenés varias metas, repartí el % entre ellas.</FieldDescription>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel htmlFor="meta-inicio">Empecé en</FieldLabel>
              <Input id="meta-inicio" type="month" value={form.fecha_inicio} onChange={(e) => set('fecha_inicio', e.target.value)} className={input} />
            </Field>
            <Field>
              <FieldLabel htmlFor="meta-etapas">% en seguro a 24, 12 y 6 meses</FieldLabel>
              <Input id="meta-etapas" value={form.desriesgo_etapas} onChange={(e) => set('desriesgo_etapas', e.target.value)} placeholder="30,60,90" className={input} />
            </Field>
          </div>
          <FieldDescription>
            Desriesgo: a medida que se acerca la fecha, ese porcentaje de la cartera tiene que estar en tus posiciones con rol &quot;seguro&quot;
            (plazo fijo, letras, dólares…), para que una caída del mercado no te deje corto justo al final.
          </FieldDescription>
        </FieldGroup>

        <div className="sticky bottom-0 -mx-1 flex gap-2 bg-gradient-to-t from-popover via-popover/95 to-transparent px-1 pt-3">
          {meta && puedeBorrar && (
            <AlertDialog>
              <AlertDialogTrigger render={<Button type="button" variant="outline" size="lg" className="h-12" aria-label="Borrar meta" />}>
                <Trash2 />
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Borrar la meta &quot;{meta.nombre}&quot;?</AlertDialogTitle>
                  <AlertDialogDescription>Sus aportes y posiciones quedan en la planilla pero dejan de verse en la app.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={borrar}>Borrar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button type="submit" size="lg" className="h-12 flex-1" disabled={loading}>
            {loading && <Spinner data-icon="inline-start" />}
            {meta ? 'Guardar cambios' : 'Crear meta'}
          </Button>
        </div>
      </form>
    </ModalResponsive>
  )
}
