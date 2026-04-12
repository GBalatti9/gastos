'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { format } from 'date-fns'
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
import { Categoria } from '@/lib/types'
import { Loader2, RefreshCw, Plus, Check } from 'lucide-react'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Props {
  categorias: Categoria[]
  usuarioEmail: string
  usuarioNombre: string
  otroUsuarioNombre: string
}

// ─── Utilidades ───────────────────────────────────────────────────────────────

const COLORES_PRESET = [
  '#ef4444', '#f97316', '#f59e0b', '#22c55e',
  '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899',
  '#6b7280', '#e8a020',
]

const ICONOS_PRESET = [
  '🏠', '🛒', '💡', '🍽️', '🚗', '💊', '🎬', '👕',
  '✈️', '📦', '🐾', '🎓', '💻', '🏋️', '🎵', '📱',
]

function calcularSplitCuota(
  montoCuota: number,
  tipoDivision: string,
  divisionValor: string,
  yoSoyPagador: boolean
): { yo: number; otro: number } {
  switch (tipoDivision) {
    case 'porcentaje': {
      const pct = (parseFloat(divisionValor) || 50) / 100
      const yo = yoSoyPagador ? montoCuota * pct : montoCuota * (1 - pct)
      return { yo, otro: montoCuota - yo }
    }
    case 'monto_fijo': {
      const fijo = parseFloat(divisionValor) || 0
      if (yoSoyPagador) return { yo: montoCuota - fijo, otro: fijo }
      return { yo: fijo, otro: montoCuota - fijo }
    }
    default: // 50/50
      return { yo: montoCuota / 2, otro: montoCuota / 2 }
  }
}

function fmt(n: number, moneda: string) {
  const simbolo = moneda === 'USD' ? 'U$S ' : '$'
  return simbolo + n.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

// ─── Sub-componente: Crear categoría inline ───────────────────────────────────

function NuevaCategoriaInline({
  onCreada,
  onCancelar,
}: {
  onCreada: (cat: Categoria) => void
  onCancelar: () => void
}) {
  const [nombre, setNombre] = useState('')
  const [color, setColor] = useState(COLORES_PRESET[0])
  const [icono, setIcono] = useState(ICONOS_PRESET[0])
  const [loading, setLoading] = useState(false)

  async function handleCrear() {
    if (!nombre.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/categorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombre.trim(), color, icono }),
      })
      if (!res.ok) throw new Error()
      const cat = await res.json()
      onCreada(cat)
      toast.success(`Categoría "${cat.nombre}" creada`)
    } catch {
      toast.error('Error al crear la categoría')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 space-y-3 border-t border-border bg-muted/30">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        Nueva categoría
      </p>

      <Input
        placeholder="Nombre..."
        value={nombre}
        onChange={e => setNombre(e.target.value)}
        className="bg-background border-border text-foreground placeholder:text-muted-foreground h-8 text-sm"
        autoFocus
      />

      {/* Icono */}
      <div>
        <p className="text-[10px] text-muted-foreground mb-1.5">Ícono</p>
        <div className="flex flex-wrap gap-1.5">
          {ICONOS_PRESET.map(e => (
            <button
              key={e}
              type="button"
              onClick={() => setIcono(e)}
              className={`w-8 h-8 rounded-lg text-base flex items-center justify-center transition-colors ${
                icono === e ? 'bg-primary/20 ring-1 ring-primary' : 'bg-muted hover:bg-muted/80'
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Color */}
      <div>
        <p className="text-[10px] text-muted-foreground mb-1.5">Color</p>
        <div className="flex flex-wrap gap-1.5">
          {COLORES_PRESET.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110"
              style={{ backgroundColor: c }}
            >
              {color === c && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          className="flex-1 h-8 bg-primary text-primary-foreground hover:bg-primary/90 text-xs"
          onClick={handleCrear}
          disabled={!nombre.trim() || loading}
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : `${icono} Crear "${nombre || '...'}" `}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 text-xs border-border text-muted-foreground"
          onClick={onCancelar}
        >
          Cancelar
        </Button>
      </div>
    </div>
  )
}

// ─── Separador de sección ─────────────────────────────────────────────────────

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

// ─── Componente principal ─────────────────────────────────────────────��───────

export function NuevoGastoForm({ categorias: categoriasIniciales, usuarioEmail, usuarioNombre, otroUsuarioNombre }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [categorias, setCategorias] = useState<Categoria[]>(categoriasIniciales)
  const [mostrarNuevaCat, setMostrarNuevaCat] = useState(false)

  const [form, setForm] = useState({
    descripcion: '',
    monto_total: '',
    pagado_por: usuarioEmail,
    cuotas: '1',
    fecha_inicio: format(new Date(), 'yyyy-MM-dd'),
    categoria: '',
    notas: '',
    moneda: 'ARS',
    tipo_division: '50/50',
    division_valor: '',
    recurrente: 'no',
  })

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  // ─── Cálculo de preview ──────────────────────────────────────────────────

  const montoTotal = parseFloat(form.monto_total) || 0
  const numCuotas = parseInt(form.cuotas) || 1
  const montoCuota = montoTotal > 0 ? montoTotal / numCuotas : 0
  const yoSoyPagador = form.pagado_por === usuarioEmail

  const split = montoCuota > 0
    ? calcularSplitCuota(montoCuota, form.tipo_division, form.division_valor, yoSoyPagador)
    : null

  const pctYo = split && montoCuota > 0 ? Math.round((split.yo / montoCuota) * 100) : 0
  const pctOtro = 100 - pctYo

  // ─── Submit ──────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.descripcion || !form.monto_total || !form.categoria) {
      toast.error('Completá los campos obligatorios')
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
      toast.success('Gasto guardado')
      router.push('/gastos')
      router.refresh()
    } catch {
      toast.error('Error al guardar el gasto')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/20 focus-visible:border-primary/50'
  const selectTriggerCls = 'bg-muted/50 border-border text-foreground'

  return (
    <form onSubmit={handleSubmit} className="space-y-6 py-6">

      {/* ── Básico ───────────────────────────────────────────────────────── */}

      <div className="space-y-4">
        {/* Descripción */}
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

        {/* Monto + Moneda */}
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

        {/* Categoría */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Categoría *
          </Label>
          <div className="rounded-lg border border-border overflow-hidden">
            <Select
              value={form.categoria}
              onValueChange={v => {
                if (v === '__nueva__') {
                  setMostrarNuevaCat(true)
                } else if (v) {
                  set('categoria', v)
                  setMostrarNuevaCat(false)
                }
              }}
            >
              <SelectTrigger className={`${selectTriggerCls} border-0 rounded-none`}>
                <SelectValue placeholder="Seleccioná una categoría" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {categorias.map(c => (
                  <SelectItem key={c.id} value={c.nombre} className="text-foreground">
                    {c.icono} {c.nombre}
                  </SelectItem>
                ))}
                <SelectItem value="__nueva__" className="text-primary font-medium">
                  <span className="flex items-center gap-1.5">
                    <Plus className="h-3.5 w-3.5" /> Nueva categoría
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            {mostrarNuevaCat && (
              <NuevaCategoriaInline
                onCreada={cat => {
                  setCategorias(prev => [...prev, cat])
                  set('categoria', cat.nombre)
                  setMostrarNuevaCat(false)
                }}
                onCancelar={() => setMostrarNuevaCat(false)}
              />
            )}
          </div>
        </div>

        {/* Pagado por */}
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
                Yo ({usuarioNombre})
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── División ───────────────────────────────────────���─────────────── */}

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

      {/* ── Cuotas ───────────────────────────────────────────────────────── */}

      <SectionLabel>Cuotas y fecha</SectionLabel>

      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="flex-1 space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Cantidad de cuotas
            </Label>
            <Input
              type="number"
              min="1"
              max="60"
              value={form.cuotas}
              onChange={e => set('cuotas', e.target.value)}
              className={inputCls}
            />
          </div>

          <div className="flex-1 space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Fecha de inicio
            </Label>
            <Input
              type="date"
              value={form.fecha_inicio}
              onChange={e => set('fecha_inicio', e.target.value)}
              className={inputCls}
            />
          </div>
        </div>

        {/* Preview de cuotas */}
        {split && numCuotas >= 1 && (
          <div className="rounded-xl border border-border bg-muted/20 overflow-hidden">
            <div className="px-4 py-3 border-b border-border/50">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{numCuotas} cuota{numCuotas > 1 ? 's' : ''}</span>
                {' '}de{' '}
                <span className="font-semibold text-foreground">{fmt(montoCuota, form.moneda)}</span>
                {' '}· vence el 1° de cada mes
              </p>
            </div>
            <div className="divide-y divide-border/50">
              <div className="flex items-center justify-between px-4 py-2.5">
                <p className="text-sm text-foreground font-medium">{usuarioNombre}</p>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">{fmt(split.yo, form.moneda)}</p>
                  <p className="text-[10px] text-muted-foreground">{pctYo}% por cuota</p>
                </div>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5">
                <p className="text-sm text-foreground font-medium">{otroUsuarioNombre}</p>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">{fmt(split.otro, form.moneda)}</p>
                  <p className="text-[10px] text-muted-foreground">{pctOtro}% por cuota</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Extras ───────────────────────────────────────────────────────── */}

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

      {/* ── Submit ───────────────────────────────────────────────────────── */}

      <Button
        type="submit"
        className="w-full h-12 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 mt-2"
        disabled={loading}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Guardar gasto
      </Button>
    </form>
  )
}
