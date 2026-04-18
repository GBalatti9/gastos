'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Gasto, Categoria, TarjetaCredito } from '@/lib/types'
import { calcularFechaVencimientoCuota } from '@/lib/billing-cycle'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Loader2, CreditCard, RefreshCw } from 'lucide-react'

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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
        {children}
      </p>
      <div className="flex-1 h-px bg-border" />
    </div>
  )
}

export function EditarGastoForm({
  gasto,
  categorias,
  tarjetas,
  usuarioEmail,
  usuarioNombre,
  otroUsuarioEmail,
  otroUsuarioNombre,
  onGuardado,
  onCancelar,
}: Props) {
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    descripcion: gasto.descripcion,
    monto_total: String(gasto.monto_total),
    moneda: gasto.moneda,
    categoria: gasto.categoria,
    pagado_por: gasto.pagado_por,
    metodo_pago: gasto.metodo_pago,
    tarjeta_id: gasto.tarjeta_id,
    tipo_division: gasto.tipo_division,
    division_valor: gasto.division_valor,
    recurrente: gasto.recurrente ? 'si' : 'no',
    notas: gasto.notas,
    fecha_inicio: gasto.fecha_inicio,
  })

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const tarjetaSeleccionada = form.metodo_pago === 'credito' && form.tarjeta_id
    ? tarjetas.find(t => t.id === form.tarjeta_id) || null
    : null

  function getPrimeraVencimientoLabel(): string | null {
    if (!tarjetaSeleccionada || !form.fecha_inicio) return null
    try {
      const primera = calcularFechaVencimientoCuota(
        new Date(form.fecha_inicio), 0, tarjetaSeleccionada
      )
      return format(primera, "d 'de' MMMM yyyy", { locale: es })
    } catch {
      return null
    }
  }

  const primeraVenc = getPrimeraVencimientoLabel()
  const esCreditoConTarjeta = form.metodo_pago === 'credito' && !!tarjetaSeleccionada

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.descripcion || !form.monto_total || !form.categoria) {
      toast.error('Completá los campos obligatorios')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/gastos/${gasto.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
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

  const inputCls = 'bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/20 focus-visible:border-primary/50'
  const selectTriggerCls = 'bg-muted/50 border-border text-foreground'

  return (
    <form onSubmit={handleSubmit} className="space-y-6 py-4">

      {/* ── Básico ─────────────────────────────────────────────────────────── */}

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Descripción *
          </Label>
          <Input
            placeholder="Ej: Netflix, Alquiler, Supermercado..."
            value={form.descripcion}
            onChange={e => set('descripcion', e.target.value)}
            className={inputCls}
            required
          />
        </div>

        <div className="flex gap-3">
          <div className="w-28 space-y-1.5 flex-shrink-0">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Moneda
            </Label>
            <Select value={form.moneda} onValueChange={v => v && set('moneda', v)}>
              <SelectTrigger className={selectTriggerCls}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="ARS" className="text-foreground">🇦🇷 ARS</SelectItem>
                <SelectItem value="USD" className="text-foreground">🇺🇸 USD</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Monto total *
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
                {form.moneda === 'USD' ? 'U$S' : '$'}
              </span>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                className={`${inputCls} pl-10`}
                value={form.monto_total}
                onChange={e => set('monto_total', e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        {/* Cuotas — solo info, no editable */}
        <div className="rounded-lg bg-muted/30 border border-border px-3 py-2.5 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Cuotas</p>
          <p className="text-sm font-medium">{gasto.cuotas} {gasto.cuotas === 1 ? 'cuota' : 'cuotas'}</p>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Categoría *
          </Label>
          <Select value={form.categoria} onValueChange={v => v && set('categoria', v)}>
            <SelectTrigger className={selectTriggerCls}>
              <SelectValue placeholder="Seleccioná una categoría" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {categorias.map(c => (
                <SelectItem key={c.id} value={c.nombre} className="text-foreground">
                  {c.icono} {c.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Pagado por
          </Label>
          <Select value={form.pagado_por} onValueChange={v => v && set('pagado_por', v)}>
            <SelectTrigger className={selectTriggerCls}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value={usuarioEmail} className="text-foreground">
                {usuarioNombre}
              </SelectItem>
              <SelectItem value={otroUsuarioEmail} className="text-foreground">
                {otroUsuarioNombre}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Método de pago ──────────────────────────────────────────────────── */}

      <SectionLabel>Método de pago</SectionLabel>

      <div className="space-y-4">
        <Select
          value={form.metodo_pago}
          onValueChange={v => {
            if (!v) return
            set('metodo_pago', v)
            if (v !== 'credito') set('tarjeta_id', '')
          }}
        >
          <SelectTrigger className={selectTriggerCls}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="efectivo" className="text-foreground">Efectivo</SelectItem>
            <SelectItem value="debito" className="text-foreground">Débito</SelectItem>
            <SelectItem value="mercadopago" className="text-foreground">Mercadopago</SelectItem>
            <SelectItem value="credito" className="text-foreground">
              <span className="flex items-center gap-2">
                <CreditCard className="h-3 w-3" /> Tarjeta de crédito
              </span>
            </SelectItem>
          </SelectContent>
        </Select>

        {form.metodo_pago === 'credito' && (
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Tarjeta
            </Label>
            {tarjetas.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                No hay tarjetas configuradas.{' '}
                <a href="/configuracion" className="text-primary underline">Configurar tarjetas</a>
              </p>
            ) : (
              <Select value={form.tarjeta_id} onValueChange={v => v && set('tarjeta_id', v)}>
                <SelectTrigger className={selectTriggerCls}>
                  <SelectValue placeholder="Seleccioná una tarjeta" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {tarjetas.map(t => (
                    <SelectItem key={t.id} value={t.id} className="text-foreground">
                      {t.nombre} •••• {t.ultimos_4}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        {/* Fecha de compra / inicio */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {esCreditoConTarjeta ? 'Fecha de compra' : 'Fecha de inicio'}
          </Label>
          <Input
            type="date"
            value={form.fecha_inicio}
            onChange={e => set('fecha_inicio', e.target.value)}
            className={inputCls}
          />
          {esCreditoConTarjeta && tarjetaSeleccionada && (
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Cierre día {tarjetaSeleccionada.fecha_cierre} · vence día {tarjetaSeleccionada.fecha_vencimiento}
              {primeraVenc && (
                <> · <span className="text-foreground font-medium">primera cuota: {primeraVenc}</span></>
              )}
            </p>
          )}
        </div>
      </div>

      {/* ── División ────────────────────────────────────────────────────────── */}

      <SectionLabel>División</SectionLabel>

      <div className="space-y-4">
        <Select value={form.tipo_division} onValueChange={v => v && set('tipo_division', v)}>
          <SelectTrigger className={selectTriggerCls}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="50/50" className="text-foreground">50 / 50 — partes iguales</SelectItem>
            <SelectItem value="porcentaje" className="text-foreground">Porcentaje personalizado</SelectItem>
            <SelectItem value="monto_fijo" className="text-foreground">{otroUsuarioNombre} paga monto fijo</SelectItem>
          </SelectContent>
        </Select>

        {form.tipo_division === 'porcentaje' && (
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              % que pagás vos ({usuarioNombre})
            </Label>
            <div className="relative">
              <Input
                type="number"
                min="1"
                max="99"
                placeholder="60"
                className={`${inputCls} pr-8`}
                value={form.division_valor}
                onChange={e => set('division_valor', e.target.value)}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">%</span>
            </div>
          </div>
        )}

        {form.tipo_division === 'monto_fijo' && (
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Monto fijo que paga {otroUsuarioNombre} por cuota
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
                {form.moneda === 'USD' ? 'U$S' : '$'}
              </span>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                className={`${inputCls} pl-10`}
                value={form.division_valor}
                onChange={e => set('division_valor', e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Extras ──────────────────────────────────────────────────────────── */}

      <SectionLabel>Extras</SectionLabel>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Recurrente
          </Label>
          <Select value={form.recurrente} onValueChange={v => v && set('recurrente', v)}>
            <SelectTrigger className={selectTriggerCls}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="no" className="text-foreground">No</SelectItem>
              <SelectItem value="si" className="text-foreground">
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-3 w-3" /> Sí, mensual
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Notas (opcional)
          </Label>
          <Textarea
            placeholder="Información adicional..."
            rows={2}
            value={form.notas}
            onChange={e => set('notas', e.target.value)}
            className={inputCls}
          />
        </div>
      </div>

      {/* ── Actions ─────────────────────────────────────────────────────────── */}

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1 h-11 border-border text-muted-foreground"
          onClick={onCancelar}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          className="flex-1 h-11 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={loading}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar cambios
        </Button>
      </div>
    </form>
  )
}
