'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { parseMonto } from '@/lib/format'
import { es } from 'date-fns/locale'
import { CreditCard } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Badge } from '@/components/ui/badge'
import { Field, FieldGroup, FieldLabel, FieldDescription } from '@/components/ui/field'
import { Gasto, Categoria, TarjetaCredito } from '@/lib/types'
import { calcularFechaVencimientoCuota } from '@/lib/billing-cycle'
import { calcularSplitCuota } from '@/lib/saldo'
import { parseLocalDate } from '@/lib/dates'
import { OpcionesToggle } from './opciones-toggle'
import { CategoriaPicker } from './categoria-picker'

interface Props {
  gasto: Gasto
  categorias: Categoria[]
  tarjetas: TarjetaCredito[]
  usuarioEmail: string
  usuarioNombre: string
  otroUsuarioEmail: string
  otroUsuarioNombre: string
  onGuardado: (gastoActualizado: Gasto) => void
  onCancelar: () => void
}

function fmt(n: number, moneda: string): string {
  const simbolo = moneda === 'USD' ? 'U$S ' : '$ '
  return simbolo + n.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

const SECCION = 'flex flex-col gap-3 rounded-xl border bg-card p-4'
const TITULO = 'text-[11px] font-semibold uppercase tracking-[1.4px] text-muted-foreground'

export function EditarGastoForm({
  gasto,
  categorias: categoriasIniciales,
  tarjetas,
  usuarioEmail,
  usuarioNombre,
  otroUsuarioEmail,
  otroUsuarioNombre,
  onGuardado,
  onCancelar,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [categorias, setCategorias] = useState<Categoria[]>(categoriasIniciales)

  const [form, setForm] = useState({
    descripcion: gasto.descripcion,
    monto_total: String(gasto.monto_total),
    moneda: gasto.moneda || 'ARS',
    categoria: gasto.categoria,
    pagado_por: gasto.pagado_por,
    metodo_pago: gasto.metodo_pago || 'efectivo',
    tarjeta_id: gasto.tarjeta_id || '',
    tipo_division: gasto.tipo_division || '50/50',
    division_valor: gasto.division_valor || '',
    recurrente: gasto.recurrente ? 'si' : 'no',
    notas: gasto.notas || '',
    fecha_inicio: gasto.fecha_inicio,
  })

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  // ─── Calculations ───────────────────────────────────────────────────────
  const montoTotal = parseMonto(form.monto_total)
  const montoCuota = montoTotal > 0 ? montoTotal / gasto.cuotas : 0
  const yoSoyPagador = form.pagado_por === usuarioEmail
  const isCredito = form.metodo_pago === 'credito'
  const esPersonal = form.tipo_division === 'personal'

  const split = montoCuota > 0
    ? calcularSplitCuota(montoCuota, form.tipo_division, form.division_valor, yoSoyPagador)
    : null

  const tarjetaSeleccionada = isCredito && form.tarjeta_id
    ? tarjetas.find(t => t.id === form.tarjeta_id) || null
    : null

  function getPrimeraVencimientoLabel(): string | null {
    if (!tarjetaSeleccionada || !form.fecha_inicio) return null
    try {
      const primera = calcularFechaVencimientoCuota(parseLocalDate(form.fecha_inicio), 0, tarjetaSeleccionada)
      return format(primera, "d 'de' MMMM yyyy", { locale: es })
    } catch {
      return null
    }
  }

  const ctaEnabled = !!(form.descripcion.trim() && montoTotal > 0 && form.categoria)

  // ─── Submit ──────────────────────────────────────────────────────────────
  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    if (!ctaEnabled) {
      toast.error('Completá monto, descripción y categoría')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/gastos/${gasto.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, monto_total: montoTotal }),
      })
      if (!res.ok) throw new Error()
      const { gasto: gastoActualizado } = await res.json()
      toast.success('Gasto actualizado')
      onGuardado(gastoActualizado)
    } catch {
      toast.error('Error al actualizar el gasto')
    } finally {
      setLoading(false)
    }
  }

  // ─── Options ─────────────────────────────────────────────────────────────
  const pagadoPorOptions = [
    { value: usuarioEmail, label: usuarioNombre },
    { value: otroUsuarioEmail, label: otroUsuarioNombre },
  ]
  const metodoPagoOptions = [
    { value: 'efectivo', label: 'Efectivo' },
    { value: 'debito', label: 'Débito' },
    { value: 'mercadopago', label: 'Mercado Pago' },
    { value: 'credito', label: 'Crédito' },
  ]
  const divisionOptions = [
    { value: '50/50', label: '50 / 50' },
    { value: 'porcentaje', label: 'Personalizada' },
    { value: 'monto_fijo', label: `Fijo ${otroUsuarioNombre}` },
    { value: 'personal', label: 'Personal' },
  ]

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* ── Monto + descripción ────────────────────────────────────────── */}
      <div className={SECCION}>
        <div className="flex items-center justify-between">
          <span className={TITULO}>Monto</span>
          <OpcionesToggle
            aria-label="Moneda"
            value={form.moneda}
            onChange={v => set('moneda', v)}
            opciones={[{ value: 'ARS', label: 'ARS' }, { value: 'USD', label: 'USD' }]}
            className="w-auto"
            itemClassName="h-8 px-3 text-xs"
          />
        </div>
        <input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder="0"
          aria-label="Monto"
          value={form.monto_total}
          onChange={e => set('monto_total', e.target.value.replace(/[^\d.,]/g, ''))}
          className="w-full bg-transparent text-5xl font-semibold leading-none tabular-nums text-foreground outline-none placeholder:text-muted-foreground/40"
        />
        <Input
          type="text"
          placeholder="Descripción (ej. Netflix)"
          aria-label="Descripción"
          value={form.descripcion}
          onChange={e => set('descripcion', e.target.value)}
          className="h-11 text-base md:h-9 md:text-sm"
        />
      </div>

      {/* ── Categoría ───────────────────────────────────────────────────── */}
      <div className={SECCION}>
        <span className={TITULO}>Categoría</span>
        <CategoriaPicker
          categorias={categorias}
          value={form.categoria}
          onChange={v => set('categoria', v)}
          onCategoriaCreada={cat => setCategorias(prev => [...prev, cat])}
        />
      </div>

      {/* ── Pago ────────────────────────────────────────────────────────── */}
      <div className={SECCION}>
        <span className={TITULO}>Pago</span>
        <FieldGroup className="gap-4">
          <Field>
            <FieldLabel>Método</FieldLabel>
            <OpcionesToggle
              value={form.metodo_pago}
              onChange={v => {
                set('metodo_pago', v)
                if (v !== 'credito') set('tarjeta_id', '')
              }}
              opciones={metodoPagoOptions}
              columnas={2}
            />
          </Field>

          <Field>
            <FieldLabel>División</FieldLabel>
            <OpcionesToggle
              value={form.tipo_division}
              onChange={v => {
                set('tipo_division', v)
                if (v === 'personal') {
                  set('pagado_por', usuarioEmail)
                  set('division_valor', '')
                }
              }}
              opciones={divisionOptions}
              columnas={2}
            />
          </Field>

          {!esPersonal && (
            <Field>
              <FieldLabel>Pagado por</FieldLabel>
              <OpcionesToggle
                value={form.pagado_por}
                onChange={v => set('pagado_por', v)}
                opciones={pagadoPorOptions}
                columnas={2}
              />
            </Field>
          )}

          {form.tipo_division === 'porcentaje' && (
            <Field orientation="horizontal">
              <FieldLabel htmlFor="edit-division-pct" className="flex-1">
                % que paga {yoSoyPagador ? usuarioNombre : otroUsuarioNombre}
              </FieldLabel>
              <div className="relative w-28">
                <Input
                  id="edit-division-pct"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max="100"
                  placeholder="50"
                  value={form.division_valor}
                  onChange={e => set('division_valor', e.target.value)}
                  className="pr-7 text-right text-base md:text-sm"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
              </div>
            </Field>
          )}

          {form.tipo_division === 'monto_fijo' && (
            <Field orientation="horizontal">
              <FieldLabel htmlFor="edit-division-fijo" className="flex-1">
                {otroUsuarioNombre} paga por cuota
              </FieldLabel>
              <div className="relative w-36">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  {form.moneda === 'USD' ? 'U$S' : '$'}
                </span>
                <Input
                  id="edit-division-fijo"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={form.division_valor}
                  onChange={e => set('division_valor', e.target.value)}
                  className="pl-10 text-right text-base md:text-sm"
                />
              </div>
            </Field>
          )}
        </FieldGroup>

        {!esPersonal && split && montoCuota > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {[
              { nombre: usuarioNombre, monto: split.yo },
              { nombre: otroUsuarioNombre, monto: split.otro },
            ].map(s => (
              <div key={s.nombre} className="rounded-lg bg-muted/60 px-3 py-2">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{s.nombre}</p>
                <p className="text-sm font-semibold tabular-nums">
                  {fmt(s.monto, form.moneda)}
                  {gasto.cuotas > 1 && <span className="font-normal text-muted-foreground"> / cuota</span>}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Cuotas (solo crédito) ──────────────────────────────────────── */}
      {isCredito && (
        <div className={SECCION}>
          <span className={TITULO}>Cuotas</span>
          <FieldGroup className="gap-4">
            <div className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2.5 text-sm">
              <span className="text-muted-foreground">Cantidad de cuotas</span>
              <span className="font-semibold">
                {gasto.cuotas} {gasto.cuotas === 1 ? 'pago' : 'cuotas'}
                {gasto.cuotas > 1 && montoTotal > 0 && (
                  <span className="font-normal text-muted-foreground"> · {fmt(montoCuota, form.moneda)} c/u</span>
                )}
              </span>
            </div>

            <Field>
              <FieldLabel>Tarjeta</FieldLabel>
              {tarjetas.length === 0 ? (
                <FieldDescription>
                  Sin tarjetas.{' '}
                  <a href="/configuracion" className="text-primary underline">Configurar</a>
                </FieldDescription>
              ) : (
                <>
                  <OpcionesToggle
                    value={form.tarjeta_id}
                    onChange={v => set('tarjeta_id', v)}
                    opciones={tarjetas.map(t => ({
                      value: t.id,
                      label: (
                        <span className="flex items-center gap-1.5">
                          <CreditCard className="size-3.5" />
                          {t.nombre} ••{t.ultimos_4}
                        </span>
                      ),
                    }))}
                    layout="wrap"
                  />
                  {tarjetaSeleccionada && (
                    <FieldDescription>
                      Cierra el {tarjetaSeleccionada.fecha_cierre} · vence el {tarjetaSeleccionada.fecha_vencimiento}
                      {getPrimeraVencimientoLabel() && (
                        <> · primera cuota: <span className="text-foreground">{getPrimeraVencimientoLabel()}</span></>
                      )}
                    </FieldDescription>
                  )}
                </>
              )}
            </Field>
          </FieldGroup>
        </div>
      )}

      {/* ── Fecha ───────────────────────────────────────────────────────── */}
      <div className={SECCION}>
        <Field>
          <FieldLabel htmlFor="edit-fecha">{isCredito ? 'Fecha de compra' : 'Fecha de inicio'}</FieldLabel>
          <Input
            id="edit-fecha"
            type="date"
            value={form.fecha_inicio}
            onChange={e => set('fecha_inicio', e.target.value)}
            className="h-11 text-base md:h-9 md:text-sm"
          />
          {isCredito && (
            <FieldDescription>
              Al cambiarla se recalculan los vencimientos de todas las cuotas.
            </FieldDescription>
          )}
        </Field>
        {gasto.recurrente && (
          <Badge variant="secondary" className="w-fit">Gasto recurrente</Badge>
        )}
      </div>

      {/* ── Acciones (sticky al pie) ───────────────────────────────────── */}
      <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-10 -mx-1 flex gap-2 bg-gradient-to-t from-background via-background/95 to-transparent px-1 pt-3 pb-2 md:bottom-0">
        <Button type="button" variant="outline" size="lg" className="h-12" onClick={onCancelar} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" size="lg" className="h-12 flex-1 text-base" disabled={loading || !ctaEnabled}>
          {loading ? <Spinner data-icon="inline-start" /> : null}
          Guardar cambios
        </Button>
      </div>
    </form>
  )
}
