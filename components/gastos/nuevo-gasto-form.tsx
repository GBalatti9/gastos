'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CreditCard } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Badge } from '@/components/ui/badge'
import { Field, FieldGroup, FieldLabel, FieldDescription } from '@/components/ui/field'
import { Categoria, TarjetaCredito } from '@/lib/types'
import { calcularFechaVencimientoCuota } from '@/lib/billing-cycle'
import { calcularSplitCuota } from '@/lib/saldo'
import { parseLocalDate, hoyAR } from '@/lib/dates'
import { cn } from '@/lib/utils'
import { OpcionesToggle } from './opciones-toggle'
import { CategoriaPicker } from './categoria-picker'

interface Props {
  categorias: Categoria[]
  tarjetas: TarjetaCredito[]
  usuarioEmail: string
  usuarioNombre: string
  otroUsuarioEmail: string
  otroUsuarioNombre: string
  /** Se llama al guardar OK (ej. para cerrar el dialog). */
  onSuccess?: () => void
}

function fmt(n: number, moneda: string): string {
  const simbolo = moneda === 'USD' ? 'U$S ' : '$ '
  return simbolo + n.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

const SECCION = 'flex flex-col gap-3 rounded-xl border bg-muted/20 p-4'
const TITULO = 'text-[11px] font-semibold uppercase tracking-[1.4px] text-muted-foreground'

export function NuevoGastoForm({
  categorias: categoriasIniciales,
  tarjetas,
  usuarioEmail,
  usuarioNombre,
  otroUsuarioEmail,
  otroUsuarioNombre,
  onSuccess,
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [categorias, setCategorias] = useState<Categoria[]>(categoriasIniciales)

  const [form, setForm] = useState({
    descripcion: '',
    monto_total: '',
    pagado_por: usuarioEmail,
    cuotas: '1',
    fecha_inicio: hoyAR(),
    // Efectivo/débito/MP nacen pagados: la cuota única se marca pagada al cargar
    carga_inmediata: 'si',
    categoria: '',
    notas: '',
    moneda: 'ARS',
    tipo_division: '50/50',
    division_valor: '',
    recurrente: 'no',
    metodo_pago: 'efectivo',
    tarjeta_id: '',
  })

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  // ─── Calculations ───────────────────────────────────────────────────────
  const montoTotal = parseFloat(form.monto_total.replace(/[^\d.,]/g, '').replace(',', '.')) || 0
  const numCuotas = parseInt(form.cuotas) || 1
  const montoCuota = montoTotal > 0 ? montoTotal / numCuotas : 0
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
      const res = await fetch('/api/gastos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Error al guardar')
      const { gasto } = await res.json()
      if (form.tipo_division !== 'personal') {
        try {
          await fetch('/api/notificaciones', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tipo: 'nuevo_gasto',
              gasto,
              autor_email: usuarioEmail,
              autor_nombre: usuarioNombre,
            }),
          })
        } catch {}
      }
      toast.success('Gasto guardado')
      onSuccess?.()
      router.refresh()
    } catch {
      toast.error('Error al guardar el gasto')
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
  const cuotasPresets = [
    { value: '1', label: '1 pago' },
    { value: '3', label: '3×' },
    { value: '6', label: '6×' },
    { value: '12', label: '12×' },
    { value: 'otro', label: 'Otro' },
  ]
  const presetValues = ['1', '3', '6', '12']
  const isCustomCuotas = !presetValues.includes(form.cuotas)

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
          autoFocus
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
          className="h-11 bg-background text-base md:h-9 md:text-sm"
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
                if (v !== 'credito') {
                  set('tarjeta_id', '')
                  set('carga_inmediata', 'si')
                  set('cuotas', '1')
                } else {
                  set('carga_inmediata', 'no')
                }
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
              <FieldLabel htmlFor="division-pct" className="flex-1">
                % que paga {yoSoyPagador ? usuarioNombre : otroUsuarioNombre}
              </FieldLabel>
              <div className="relative w-28">
                <Input
                  id="division-pct"
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
              <FieldLabel htmlFor="division-fijo" className="flex-1">
                {otroUsuarioNombre} paga por cuota
              </FieldLabel>
              <div className="relative w-36">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  {form.moneda === 'USD' ? 'U$S' : '$'}
                </span>
                <Input
                  id="division-fijo"
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

        {/* Split preview */}
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
                  {numCuotas > 1 && <span className="font-normal text-muted-foreground"> / cuota</span>}
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
            <Field>
              <OpcionesToggle
                aria-label="Cantidad de cuotas"
                value={isCustomCuotas ? 'otro' : form.cuotas}
                onChange={v => {
                  if (v === 'otro') {
                    if (!isCustomCuotas) set('cuotas', '24')
                  } else {
                    set('cuotas', v)
                  }
                }}
                opciones={cuotasPresets}
                columnas={5}
              />
            </Field>

            {isCustomCuotas && (
              <Field orientation="horizontal">
                <FieldLabel htmlFor="cuotas-custom" className="flex-1">Cantidad de cuotas</FieldLabel>
                <Input
                  id="cuotas-custom"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max="60"
                  value={form.cuotas}
                  onChange={e => set('cuotas', e.target.value)}
                  className="w-24 text-center text-base md:text-sm"
                  autoFocus
                />
              </Field>
            )}

            {numCuotas > 1 && montoTotal > 0 && (
              <div className="flex justify-center">
                <Badge variant="secondary">
                  {numCuotas} cuotas de {fmt(montoCuota, form.moneda)}
                </Badge>
              </div>
            )}

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
          <FieldLabel htmlFor="fecha-compra">Fecha de compra</FieldLabel>
          <Input
            id="fecha-compra"
            type="date"
            value={form.fecha_inicio}
            onChange={e => set('fecha_inicio', e.target.value)}
            className="h-11 bg-background text-base md:h-9 md:text-sm"
          />
          <FieldDescription>Si no la cambiás, se usa la fecha de hoy.</FieldDescription>
        </Field>
      </div>

      {/* ── Guardar (sticky al pie del scroll) ──────────────────────────── */}
      <div className={cn('sticky bottom-0 -mx-1 bg-gradient-to-t from-popover via-popover/95 to-transparent px-1 pt-3 pb-[max(0.25rem,env(safe-area-inset-bottom))]')}>
        <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={loading || !ctaEnabled}>
          {loading ? <Spinner data-icon="inline-start" /> : null}
          Guardar gasto
        </Button>
      </div>
    </form>
  )
}
