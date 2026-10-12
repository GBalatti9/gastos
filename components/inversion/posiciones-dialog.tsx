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
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { OpcionesToggle } from '@/components/gastos/opciones-toggle'
import { ModalResponsive } from './modal-responsive'
import { parseMonto } from '@/lib/format'
import { ROLES, ROL_LABEL, TIPOS, TIPO_LABEL, TIPO_AYUDA, MONEDA_POR_TIPO, TIPOS_CON_PRECIO_AUTO } from '@/lib/activos'
import type { InvPosicion, InvRol, InvTipoActivo } from '@/lib/types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  posiciones: InvPosicion[]
  metaId: string
  /** Onboarding: texto de ayuda extra. */
  primeraVez?: boolean
}

const ROL_OPTS = ROLES.map((r) => ({ value: r, label: ROL_LABEL[r] }))
const ROL_AYUDA: Record<InvRol, string> = {
  core: 'el grueso de la cartera',
  satelite: 'apuestas más chicas',
  seguro: 'adonde va el desriesgo (plazo fijo, letras, dólares…)',
}

export function PosicionesDialog({ open, onOpenChange, posiciones, metaId, primeraVez }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [pesos, setPesos] = useState<Record<string, string>>(
    Object.fromEntries(posiciones.map((p) => [p.id, String(p.peso_objetivo)]))
  )
  const [nueva, setNueva] = useState({ tipo: 'cedear' as InvTipoActivo, ticker: '', nombre: '', peso: '', rol: 'core' as InvRol })

  const activas = posiciones.filter((p) => p.activo)
  const suma = activas.reduce((s, p) => s + parseMonto(pesos[p.id] ?? String(p.peso_objetivo)), 0)
  const necesitaTicker = TIPOS_CON_PRECIO_AUTO.includes(nueva.tipo)

  async function put(p: InvPosicion, body: Partial<InvPosicion>, okMsg?: string) {
    setBusy(p.id)
    try {
      const res = await fetch(`/api/inversion/posiciones/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      if (okMsg) toast.success(okMsg)
      router.refresh()
    } catch {
      toast.error('No se pudo guardar')
    } finally {
      setBusy(null)
    }
  }

  async function darDeBaja(p: InvPosicion) {
    setBusy(p.id)
    try {
      const res = await fetch(`/api/inversion/posiciones/${p.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success(`${p.ticker || p.nombre} dada de baja`)
      router.refresh()
    } catch {
      toast.error('No se pudo dar de baja')
    } finally {
      setBusy(null)
    }
  }

  async function agregar(e: React.FormEvent) {
    e.preventDefault()
    if (necesitaTicker && !nueva.ticker.trim()) {
      toast.error('Este tipo necesita ticker para buscar el precio')
      return
    }
    if (!nueva.ticker.trim() && !nueva.nombre.trim()) {
      toast.error('Poné un nombre')
      return
    }
    setBusy('nueva')
    try {
      const res = await fetch('/api/inversion/posiciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: nueva.tipo, ticker: nueva.ticker, nombre: nueva.nombre, peso_objetivo: parseMonto(nueva.peso), rol: nueva.rol, meta_id: metaId,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')
      toast.success(`${data.ticker || data.nombre} agregada`)
      setNueva({ tipo: nueva.tipo, ticker: '', nombre: '', peso: '', rol: nueva.rol })
      router.refresh()
    } catch (err) {
      toast.error((err as Error).message || 'No se pudo agregar la posición')
    } finally {
      setBusy(null)
    }
  }

  return (
    <ModalResponsive
      open={open}
      onOpenChange={onOpenChange}
      titulo={primeraVez ? 'Armá tu cartera' : 'Posiciones'}
      descripcion={
        primeraVez
          ? 'Cargá cada instrumento que tenés o pensás usar, con qué parte de la cartera querés que ocupe. Los pesos tienen que sumar 100 %.'
          : 'Pesos objetivo de la cartera (core-satellite). Tienen que sumar 100 %.'
      }
    >
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
                  <p className="text-sm font-semibold">
                    {p.ticker || p.nombre}
                    <Badge variant="outline" className="ml-2">{TIPO_LABEL[p.tipo]}</Badge>
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{p.ticker && p.nombre !== p.ticker ? p.nombre : ''} {p.moneda}</p>
                </div>
                <div className="relative w-24">
                  <Input
                    inputMode="decimal"
                    aria-label={`Peso objetivo de ${p.ticker || p.nombre}`}
                    value={pesos[p.id] ?? String(p.peso_objetivo)}
                    onChange={(e) => setPesos((s) => ({ ...s, [p.id]: e.target.value }))}
                    onBlur={() => {
                      const peso = parseMonto(pesos[p.id] ?? '')
                      if (peso !== p.peso_objetivo) put(p, { peso_objetivo: peso })
                    }}
                    className="pr-7 text-right text-base tabular-nums md:text-sm"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                </div>
                <Button variant="ghost" size="icon" aria-label={`Dar de baja ${p.ticker || p.nombre}`} onClick={() => darDeBaja(p)} disabled={busy === p.id}>
                  {busy === p.id ? <Spinner /> : <Trash2 />}
                </Button>
              </div>
              <OpcionesToggle
                aria-label={`Rol de ${p.ticker || p.nombre}`}
                value={p.rol}
                onChange={(v) => put(p, { rol: v as InvRol })}
                opciones={ROL_OPTS}
                columnas={3}
                itemClassName="h-8 text-xs"
              />
            </div>
          ))}
          {activas.length === 0 && <p className="text-sm text-muted-foreground">Todavía no hay posiciones.</p>}
        </div>

        <form onSubmit={agregar} className="flex flex-col gap-3 rounded-xl border bg-muted/30 p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nueva posición</p>
          <Field>
            <FieldLabel>Tipo</FieldLabel>
            <Select value={nueva.tipo} onValueChange={(v) => setNueva((n) => ({ ...n, tipo: (v as InvTipoActivo) || 'otro' }))}>
              <SelectTrigger className="w-full text-base md:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {TIPOS.map((t) => (
                    <SelectItem key={t} value={t}>{TIPO_LABEL[t]}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <FieldDescription>{TIPO_AYUDA[nueva.tipo]} Cotiza en {MONEDA_POR_TIPO[nueva.tipo]}.</FieldDescription>
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field>
              <FieldLabel htmlFor="pos-ticker">Ticker{necesitaTicker ? '' : ' (opcional)'}</FieldLabel>
              <Input id="pos-ticker" placeholder={necesitaTicker ? 'AAPL' : '—'} value={nueva.ticker} onChange={(e) => setNueva((n) => ({ ...n, ticker: e.target.value.toUpperCase() }))} className="text-base uppercase md:text-sm" />
            </Field>
            <Field>
              <FieldLabel htmlFor="pos-peso">Peso objetivo %</FieldLabel>
              <Input id="pos-peso" inputMode="decimal" placeholder="40" value={nueva.peso} onChange={(e) => setNueva((n) => ({ ...n, peso: e.target.value }))} className="text-base tabular-nums md:text-sm" />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="pos-nombre">Nombre{necesitaTicker ? ' (opcional)' : ''}</FieldLabel>
            <Input id="pos-nombre" placeholder={nueva.tipo === 'fci' ? 'FCI money market Banco X' : nueva.tipo === 'plazo_fijo' ? 'Plazo fijo UVA' : 'Apple'} value={nueva.nombre} onChange={(e) => setNueva((n) => ({ ...n, nombre: e.target.value }))} className="text-base md:text-sm" />
          </Field>
          <Field>
            <FieldLabel>Rol</FieldLabel>
            <OpcionesToggle aria-label="Rol" value={nueva.rol} onChange={(v) => setNueva((n) => ({ ...n, rol: v as InvRol }))} opciones={ROL_OPTS} columnas={3} itemClassName="h-8 text-xs" />
            <FieldDescription>{ROL_LABEL[nueva.rol]}: {ROL_AYUDA[nueva.rol]}.</FieldDescription>
          </Field>
          <Button type="submit" variant="outline" disabled={busy === 'nueva'}>
            {busy === 'nueva' ? <Spinner data-icon="inline-start" /> : <Plus data-icon="inline-start" />}
            Agregar
          </Button>
        </form>
      </div>
    </ModalResponsive>
  )
}
