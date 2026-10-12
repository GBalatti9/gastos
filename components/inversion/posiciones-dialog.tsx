'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Field, FieldLabel } from '@/components/ui/field'
import { OpcionesToggle } from '@/components/gastos/opciones-toggle'
import { ModalResponsive } from './modal-responsive'
import { parseMonto } from '@/lib/format'
import type { InvPosicion, InvRol } from '@/lib/types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  posiciones: InvPosicion[]
}

const ROL_LABEL: Record<InvRol, string> = { core: 'Core', satelite: 'Satélite', seguro: 'Seguro' }
const ROL_OPTS = (Object.keys(ROL_LABEL) as InvRol[]).map((r) => ({ value: r, label: ROL_LABEL[r] }))

export function PosicionesDialog({ open, onOpenChange, posiciones }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [pesos, setPesos] = useState<Record<string, string>>(
    Object.fromEntries(posiciones.map((p) => [p.id, String(p.peso_objetivo)]))
  )
  const [nueva, setNueva] = useState({ ticker: '', nombre: '', peso: '0', rol: 'satelite' as InvRol })

  const activas = posiciones.filter((p) => p.activo)
  const suma = activas.reduce((s, p) => s + parseMonto(pesos[p.id] ?? String(p.peso_objetivo)), 0)

  async function guardarPeso(p: InvPosicion) {
    const peso = parseMonto(pesos[p.id] ?? '')
    if (peso === p.peso_objetivo) return
    setBusy(p.id)
    try {
      const res = await fetch(`/api/inversion/posiciones/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ peso_objetivo: peso }),
      })
      if (!res.ok) throw new Error()
      router.refresh()
    } catch {
      toast.error('No se pudo guardar el peso')
    } finally {
      setBusy(null)
    }
  }

  async function cambiarRol(p: InvPosicion, rol: InvRol) {
    setBusy(p.id)
    try {
      const res = await fetch(`/api/inversion/posiciones/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rol }),
      })
      if (!res.ok) throw new Error()
      router.refresh()
    } catch {
      toast.error('No se pudo cambiar el rol')
    } finally {
      setBusy(null)
    }
  }

  async function darDeBaja(p: InvPosicion) {
    setBusy(p.id)
    try {
      const res = await fetch(`/api/inversion/posiciones/${p.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success(`${p.ticker} dada de baja`)
      router.refresh()
    } catch {
      toast.error('No se pudo dar de baja')
    } finally {
      setBusy(null)
    }
  }

  async function agregar(e: React.FormEvent) {
    e.preventDefault()
    if (!nueva.ticker.trim()) return
    setBusy('nueva')
    try {
      const res = await fetch('/api/inversion/posiciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker: nueva.ticker, nombre: nueva.nombre, peso_objetivo: parseMonto(nueva.peso), rol: nueva.rol }),
      })
      if (!res.ok) throw new Error()
      toast.success(`${nueva.ticker.toUpperCase()} agregada`)
      setNueva({ ticker: '', nombre: '', peso: '0', rol: 'satelite' })
      router.refresh()
    } catch {
      toast.error('No se pudo agregar la posición')
    } finally {
      setBusy(null)
    }
  }

  return (
    <ModalResponsive open={open} onOpenChange={onOpenChange} titulo="Posiciones" descripcion="Pesos objetivo de la cartera (core-satellite). Tienen que sumar 100 %.">
      <div className="flex flex-col gap-4">
        {Math.round(suma) !== 100 && activas.length > 0 && (
          <Alert variant="destructive">
            <AlertDescription>Los pesos suman {Math.round(suma)} %, no 100 %.</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col gap-2">
          {activas.map((p) => (
            <div key={p.id} className="flex flex-col gap-2 rounded-xl border p-3">
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{p.ticker}</p>
                  <p className="truncate text-xs text-muted-foreground">{p.nombre}</p>
                </div>
                <div className="relative w-24">
                  <Input
                    inputMode="decimal"
                    aria-label={`Peso objetivo de ${p.ticker}`}
                    value={pesos[p.id] ?? String(p.peso_objetivo)}
                    onChange={(e) => setPesos((s) => ({ ...s, [p.id]: e.target.value }))}
                    onBlur={() => guardarPeso(p)}
                    className="pr-7 text-right text-base tabular-nums md:text-sm"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                </div>
                <Button variant="ghost" size="icon" aria-label={`Dar de baja ${p.ticker}`} onClick={() => darDeBaja(p)} disabled={busy === p.id}>
                  {busy === p.id ? <Spinner /> : <Trash2 />}
                </Button>
              </div>
              <OpcionesToggle
                aria-label={`Rol de ${p.ticker}`}
                value={p.rol}
                onChange={(v) => cambiarRol(p, v as InvRol)}
                opciones={ROL_OPTS}
                columnas={3}
                itemClassName="h-8 text-xs"
              />
            </div>
          ))}
          {activas.length === 0 && <p className="text-sm text-muted-foreground">Sin posiciones. Agregá al menos una.</p>}
        </div>

        <form onSubmit={agregar} className="flex flex-col gap-3 rounded-xl border bg-muted/30 p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nueva posición</p>
          <div className="grid grid-cols-2 gap-2">
            <Field>
              <FieldLabel htmlFor="pos-ticker">Ticker</FieldLabel>
              <Input id="pos-ticker" placeholder="VTI" value={nueva.ticker} onChange={(e) => setNueva((n) => ({ ...n, ticker: e.target.value }))} className="text-base md:text-sm" />
            </Field>
            <Field>
              <FieldLabel htmlFor="pos-peso">Peso %</FieldLabel>
              <Input id="pos-peso" inputMode="decimal" value={nueva.peso} onChange={(e) => setNueva((n) => ({ ...n, peso: e.target.value }))} className="text-base tabular-nums md:text-sm" />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="pos-nombre">Nombre</FieldLabel>
            <Input id="pos-nombre" placeholder="Total US market" value={nueva.nombre} onChange={(e) => setNueva((n) => ({ ...n, nombre: e.target.value }))} className="text-base md:text-sm" />
          </Field>
          <OpcionesToggle aria-label="Rol" value={nueva.rol} onChange={(v) => setNueva((n) => ({ ...n, rol: v as InvRol }))} opciones={ROL_OPTS} columnas={3} itemClassName="h-8 text-xs" />
          <Button type="submit" variant="outline" disabled={busy === 'nueva' || !nueva.ticker.trim()}>
            {busy === 'nueva' ? <Spinner data-icon="inline-start" /> : <Plus data-icon="inline-start" />}
            Agregar
          </Button>
        </form>

        <p className="text-xs text-muted-foreground">
          <Badge variant="outline" className="mr-1">Core</Badge> el grueso de la cartera ·{' '}
          <Badge variant="outline" className="mr-1">Satélite</Badge> apuestas chicas ·{' '}
          <Badge variant="outline" className="mr-1">Seguro</Badge> adonde va el desriesgo.
        </p>
      </div>
    </ModalResponsive>
  )
}
