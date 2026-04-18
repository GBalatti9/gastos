'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Input } from '@/components/ui/input'
import { Categoria, TarjetaCredito } from '@/lib/types'
import { calcularFechaVencimientoCuota } from '@/lib/billing-cycle'
import { Loader2, ChevronLeft, CreditCard, Plus } from 'lucide-react'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  categorias: Categoria[]
  tarjetas: TarjetaCredito[]
  usuarioEmail: string
  usuarioNombre: string
  otroUsuarioEmail: string
  otroUsuarioNombre: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
    default:
      return { yo: montoCuota / 2, otro: montoCuota / 2 }
  }
}

function fmtARS(n: number): string {
  return '$ ' + Math.round(n).toLocaleString('es-AR')
}

function fmt(n: number, moneda: string): string {
  const simbolo = moneda === 'USD' ? 'U$S ' : '$'
  return simbolo + n.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

// ─── Nueva Categoría inline ───────────────────────────────────────────────────

const ICONOS_GRUPOS: { label: string; iconos: string[] }[] = [
  {
    label: 'Hogar',
    iconos: ['🏠', '🏡', '🏢', '🏗️', '🛋️', '🛏️', '🚪', '🪟', '🪴', '🔑', '🔒', '🧹', '🪣', '🛠️', '🪚', '🔧'],
  },
  {
    label: 'Comida',
    iconos: ['🛒', '🥦', '🥕', '🍎', '🥩', '🐟', '🥚', '🧃', '☕', '🍺', '🍷', '🥐', '🍕', '🍔', '🍜', '🥗'],
  },
  {
    label: 'Restaurantes',
    iconos: ['🍽️', '🥡', '🍱', '🌮', '🍣', '🍦', '🧁', '🍰', '🫕', '🥘', '🍳', '🫙'],
  },
  {
    label: 'Transporte',
    iconos: ['🚗', '🚕', '🚌', '🚆', '🚇', '✈️', '🛵', '🚲', '🛺', '⛽', '🅿️', '🗺️'],
  },
  {
    label: 'Servicios',
    iconos: ['💡', '💧', '🔥', '🌐', '📡', '📺', '📱', '💻', '🖨️', '🔌', '📶', '🗑️'],
  },
  {
    label: 'Salud',
    iconos: ['💊', '🏥', '🩺', '💉', '🩹', '🧴', '🦷', '👓', '🩻', '🧠', '🫀', '🌡️'],
  },
  {
    label: 'Ocio',
    iconos: ['🎬', '🎮', '🎵', '🎭', '🎨', '📚', '🏋️', '⚽', '🎾', '🏊', '🎲', '🎉', '🎸', '🎯', '🏄', '🧗'],
  },
  {
    label: 'Ropa',
    iconos: ['👕', '👗', '👔', '👟', '👠', '👜', '🧢', '🧥', '👒', '💍', '⌚', '🕶️'],
  },
  {
    label: 'Mascotas',
    iconos: ['🐾', '🐕', '🐈', '🦜', '🐠', '🐇', '🦴', '🐾', '🏡', '🧸'],
  },
  {
    label: 'Educación',
    iconos: ['🎓', '📚', '🖊️', '🏫', '📐', '🔬', '🎒', '📝', '🖥️', '📖'],
  },
  {
    label: 'Finanzas',
    iconos: ['💰', '💳', '🏦', '📊', '📈', '💸', '🪙', '🏧', '🧾', '📉'],
  },
  {
    label: 'Varios',
    iconos: ['📦', '🎁', '🌟', '❤️', '💼', '🧳', '🔮', '⭐', '🪐', '🌈', '☀️', '🌙'],
  },
]

const ICONOS_PRESET = ICONOS_GRUPOS.flatMap(g => g.iconos)
const COLORES_PRESET = ['#ef4444', '#f97316', '#f59e0b', '#22c55e', '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899', '#e8a020']

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
    <div className="col-span-4 rounded-[12px] border border-border bg-muted/30 p-4 space-y-3">
      <p className="text-[10px] font-semibold uppercase tracking-[1.4px] text-muted-foreground">
        Nueva categoría
      </p>
      <Input
        placeholder="Nombre..."
        value={nombre}
        onChange={e => setNombre(e.target.value)}
        className="h-8 text-sm bg-background border-border"
        autoFocus
      />
      <div>
        <p className="text-[10px] text-muted-foreground mb-1.5">Ícono</p>
        <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
          {ICONOS_GRUPOS.map(grupo => (
            <div key={grupo.label}>
              <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                {grupo.label}
              </p>
              <div className="flex flex-wrap gap-1">
                {grupo.iconos.map(e => (
                  <button
                    key={grupo.label + e}
                    type="button"
                    onClick={() => setIcono(e)}
                    className={cn(
                      'w-8 h-8 rounded-lg text-base flex items-center justify-center transition-colors',
                      icono === e ? 'bg-primary/20 ring-1 ring-primary' : 'bg-muted hover:bg-muted/80'
                    )}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="text-[10px] text-muted-foreground mb-1.5">Color</p>
        <div className="flex flex-wrap gap-1.5">
          {COLORES_PRESET.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
              style={{
                backgroundColor: c,
                borderColor: color === c ? 'rgba(42,31,23,0.5)' : 'transparent',
              }}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleCrear}
          disabled={!nombre.trim() || loading}
          className="flex-1 h-8 rounded-lg text-xs font-semibold bg-primary text-primary-foreground disabled:opacity-40"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin mx-auto" /> : `${icono} Crear`}
        </button>
        <button
          type="button"
          onClick={onCancelar}
          className="h-8 px-3 rounded-lg text-xs font-medium border border-border text-muted-foreground"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function NuevoGastoForm({
  categorias: categoriasIniciales,
  tarjetas,
  usuarioEmail,
  usuarioNombre,
  otroUsuarioEmail,
  otroUsuarioNombre,
}: Props) {
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
    carga_inmediata: 'no',
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

  const split = montoCuota > 0
    ? calcularSplitCuota(montoCuota, form.tipo_division, form.division_valor, yoSoyPagador)
    : null

  const tarjetaSeleccionada = form.metodo_pago === 'credito' && form.tarjeta_id
    ? tarjetas.find(t => t.id === form.tarjeta_id) || null
    : null

  function getPrimeraVencimientoLabel(): string | null {
    if (!tarjetaSeleccionada || !form.fecha_inicio) return null
    try {
      const primera = calcularFechaVencimientoCuota(new Date(form.fecha_inicio), 0, tarjetaSeleccionada)
      return format(primera, "d 'de' MMMM yyyy", { locale: es })
    } catch {
      return null
    }
  }

  const esCreditoConTarjeta = form.metodo_pago === 'credito' && !!tarjetaSeleccionada
  const isCredito = form.metodo_pago === 'credito'

  // CTA enabled when desc + monto + cat are set
  const ctaEnabled = form.descripcion.trim() && form.monto_total && form.categoria

  // ─── Submit ──────────────────────────────────────────────────────────────
  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()
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

  // ─── Pago section options ────────────────────────────────────────────────
  const pagadoPorOptions = [
    { value: usuarioEmail, label: usuarioNombre },
    { value: otroUsuarioEmail, label: otroUsuarioNombre },
  ]

  const metodoPagoOptions = [
    { value: 'efectivo', label: 'Efectivo' },
    { value: 'debito', label: 'Débito' },
    { value: 'mercadopago', label: 'Mercadopago' },
    { value: 'credito', label: 'Crédito' },
  ]

  const divisionOptions = [
    { value: '50/50', label: '50 / 50' },
    { value: 'porcentaje', label: 'Personalizada' },
    { value: 'monto_fijo', label: `Monto fijo ${otroUsuarioNombre}` },
  ]

  // ─── Cuotas presets ──────────────────────────────────────────────────────
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
    <form onSubmit={handleSubmit} className="pb-28">
      {/* Form header */}
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-0.5 text-[15px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
          Cancelar
        </button>
        <span className="font-display italic text-[17px] font-semibold text-foreground whitespace-nowrap">
          Nuevo gasto
        </span>
        <div className="w-[80px]" />
      </div>

      <div className="space-y-4">
        {/* ── Hero monto ──────────────────────────────────────────────────── */}
        <div
          className="rounded-[20px] bg-card border border-border p-[20px] space-y-3"
          style={{ boxShadow: '0 1px 2px rgba(42,31,23,0.04)' }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[1.4px] text-muted-foreground">
            Monto
          </p>

          {/* Currency + amount row */}
          <div className="flex items-center gap-3">
            {/* ARS/USD pill toggle */}
            <div className="flex rounded-full overflow-hidden border border-border flex-shrink-0">
              {(['ARS', 'USD'] as const).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => set('moneda', m)}
                  className={cn(
                    'px-2.5 py-1 text-[11px] font-semibold transition-all',
                    form.moneda === m
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* Number input */}
            <input
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={form.monto_total}
              onChange={e => set('monto_total', e.target.value.replace(/[^\d.,]/g, ''))}
              className="flex-1 font-display italic text-[44px] leading-none bg-transparent text-foreground placeholder:text-muted-foreground/40 outline-none w-0"
              style={{ caretColor: '#8B5E3C' }}
            />
          </div>

          {/* Description */}
          <input
            type="text"
            placeholder="Descripción (ej. Netflix)"
            value={form.descripcion}
            onChange={e => set('descripcion', e.target.value)}
            className="w-full text-[14px] text-center bg-muted rounded-[10px] py-2 px-3 text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>

        {/* ── Categoría ───────────────────────────────────────────────────── */}
        <div
          className="rounded-[20px] bg-card border border-border p-[20px]"
          style={{ boxShadow: '0 1px 2px rgba(42,31,23,0.04)' }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[1.4px] text-muted-foreground mb-3">
            Categoría <span className="text-orange-alert">*</span>
          </p>
          <div className="grid grid-cols-4 gap-2">
            {categorias.map(cat => {
              const isActive = form.categoria === cat.nombre
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => set('categoria', cat.nombre)}
                  className="flex flex-col items-center gap-1 py-2.5 px-1 rounded-[10px] transition-all border"
                  style={{
                    backgroundColor: isActive ? `${cat.color}33` : `${cat.color}11`,
                    borderColor: isActive ? cat.color : 'transparent',
                  }}
                >
                  <span className="text-[20px] leading-none">{cat.icono}</span>
                  <span className="text-[10.5px] font-medium text-foreground text-center leading-tight">
                    {cat.nombre}
                  </span>
                </button>
              )
            })}

            {/* Add new category */}
            {!mostrarNuevaCat && (
              <button
                type="button"
                onClick={() => setMostrarNuevaCat(true)}
                className="flex flex-col items-center gap-1 py-2.5 px-1 rounded-[10px] border border-dashed border-border text-muted-foreground transition-colors hover:border-foreground/30"
              >
                <Plus className="h-5 w-5" />
                <span className="text-[10.5px] font-medium text-center leading-tight">Nueva</span>
              </button>
            )}

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

        {/* ── Pago ────────────────────────────────────────────────────────── */}
        <div
          className="rounded-[20px] bg-card border border-border p-[20px] space-y-4"
          style={{ boxShadow: '0 1px 2px rgba(42,31,23,0.04)' }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[1.4px] text-muted-foreground">
            Pago
          </p>

          {/* Pagado por */}
          <div className="space-y-2">
            <p className="text-[12px] text-muted-foreground">Pagado por</p>
            <div className="flex gap-2">
              {pagadoPorOptions.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set('pagado_por', opt.value)}
                  className={cn(
                    'flex-1 py-2 rounded-[10px] text-[13px] font-semibold transition-all',
                    form.pagado_por === opt.value
                      ? 'bg-foreground text-background'
                      : 'bg-muted text-foreground'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Método */}
          <div className="space-y-2">
            <p className="text-[12px] text-muted-foreground">Método</p>
            <div className="grid grid-cols-2 gap-1.5">
              {metodoPagoOptions.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    set('metodo_pago', opt.value)
                    if (opt.value !== 'credito') {
                      set('tarjeta_id', '')
                      set('carga_inmediata', 'si')
                      set('cuotas', '1')
                    } else {
                      set('carga_inmediata', 'no')
                    }
                  }}
                  className={cn(
                    'py-2 rounded-[10px] text-[13px] font-semibold transition-all',
                    form.metodo_pago === opt.value
                      ? 'bg-foreground text-background'
                      : 'bg-muted text-foreground'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* División */}
          <div className="space-y-2">
            <p className="text-[12px] text-muted-foreground">División</p>
            <div className="flex gap-1.5 flex-wrap">
              {divisionOptions.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set('tipo_division', opt.value)}
                  className={cn(
                    'px-3 py-2 rounded-[10px] text-[13px] font-semibold transition-all',
                    form.tipo_division === opt.value
                      ? 'bg-foreground text-background'
                      : 'bg-muted text-foreground'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {form.tipo_division === 'porcentaje' && (
              <div className="flex items-center gap-3 pt-1">
                <span className="text-[13px] text-muted-foreground flex-1">% que pagás vos</span>
                <div className="relative w-24">
                  <input
                    type="number"
                    min="1"
                    max="99"
                    placeholder="50"
                    value={form.division_valor}
                    onChange={e => set('division_valor', e.target.value)}
                    className="w-full text-[14px] font-semibold text-right bg-muted rounded-lg px-2 py-1.5 pr-6 text-foreground outline-none focus:ring-1 focus:ring-primary/30"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[13px] text-muted-foreground">%</span>
                </div>
              </div>
            )}

            {form.tipo_division === 'monto_fijo' && (
              <div className="flex items-center gap-3 pt-1">
                <span className="text-[13px] text-muted-foreground flex-1">{otroUsuarioNombre} paga</span>
                <div className="relative w-32">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[13px] text-muted-foreground">
                    {form.moneda === 'USD' ? 'U$S' : '$'}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    value={form.division_valor}
                    onChange={e => set('division_valor', e.target.value)}
                    className="w-full text-[14px] font-semibold text-right bg-muted rounded-lg px-2 py-1.5 pl-8 text-foreground outline-none focus:ring-1 focus:ring-primary/30"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Split preview */}
          {split && montoCuota > 0 && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="rounded-[10px] bg-muted/50 px-3 py-2">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{usuarioNombre}</p>
                <p className="text-[13px] font-semibold text-foreground">{fmt(split.yo, form.moneda)}</p>
              </div>
              <div className="rounded-[10px] bg-muted/50 px-3 py-2">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{otroUsuarioNombre}</p>
                <p className="text-[13px] font-semibold text-foreground">{fmt(split.otro, form.moneda)}</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Cuotas (solo crédito) ────────────────────────────────────── */}
        {isCredito && (
          <div
            className="rounded-[20px] bg-card border border-border p-[20px] space-y-4"
            style={{ boxShadow: '0 1px 2px rgba(42,31,23,0.04)' }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[1.4px] text-muted-foreground">
              Cuotas
            </p>

            {/* Presets */}
            <div className="flex gap-2">
              {cuotasPresets.map(preset => {
                const isOtro = preset.value === 'otro'
                const isActive = isOtro ? isCustomCuotas : form.cuotas === preset.value
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => {
                      if (isOtro) {
                        if (!isCustomCuotas) set('cuotas', '24')
                      } else {
                        set('cuotas', preset.value)
                      }
                    }}
                    className={cn(
                      'flex-1 py-2 rounded-[10px] text-[13px] font-semibold transition-all',
                      isActive ? 'bg-foreground text-background' : 'bg-muted text-foreground'
                    )}
                  >
                    {preset.label}
                  </button>
                )
              })}
            </div>

            {/* Custom input when "Otro" */}
            {isCustomCuotas && (
              <div className="flex items-center gap-3">
                <span className="text-[13px] text-muted-foreground flex-1">Cantidad de cuotas</span>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={form.cuotas}
                  onChange={e => set('cuotas', e.target.value)}
                  className="w-20 text-center text-[15px] font-semibold bg-muted rounded-[10px] py-1.5 text-foreground outline-none focus:ring-1 focus:ring-primary/30"
                  autoFocus
                />
              </div>
            )}

            {/* Preview pill */}
            {numCuotas > 1 && montoTotal > 0 && (
              <div className="flex justify-center">
                <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-muted">
                  <span className="text-[12px] text-muted-foreground font-medium">
                    {numCuotas} cuotas de{' '}
                    <span className="text-foreground font-semibold">{fmt(montoCuota, form.moneda)}</span>
                  </span>
                </div>
              </div>
            )}

            {/* Tarjeta picker */}
            {tarjetas.length === 0 ? (
              <p className="text-[12px] text-muted-foreground">
                Sin tarjetas.{' '}
                <a href="/configuracion" className="text-primary underline">Configurar</a>
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-[12px] text-muted-foreground">Tarjeta</p>
                <div className="flex gap-2 flex-wrap">
                  {tarjetas.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => set('tarjeta_id', t.id)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[13px] font-semibold border transition-all',
                        form.tarjeta_id === t.id
                          ? 'bg-foreground text-background border-foreground'
                          : 'bg-muted text-foreground border-transparent'
                      )}
                    >
                      <CreditCard className="h-3.5 w-3.5" />
                      {t.nombre} ••{t.ultimos_4}
                    </button>
                  ))}
                </div>
                {tarjetaSeleccionada && (
                  <p className="text-[11px] text-muted-foreground">
                    Cierra el día {tarjetaSeleccionada.fecha_cierre} · vence el día {tarjetaSeleccionada.fecha_vencimiento}
                    {getPrimeraVencimientoLabel() && (
                      <> · primera cuota: <span className="text-foreground">{getPrimeraVencimientoLabel()}</span></>
                    )}
                  </p>
                )}
              </div>
            )}

            {/* Fecha de compra */}
            <div className="space-y-1">
              <p className="text-[12px] text-muted-foreground">Fecha de compra</p>
              <input
                type="date"
                value={form.fecha_inicio}
                onChange={e => set('fecha_inicio', e.target.value)}
                className="w-full text-sm bg-muted rounded-[10px] px-3 py-2 text-foreground outline-none focus:ring-1 focus:ring-primary/30 border border-border"
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Sticky CTA ──────────────────────────────────────────────────── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 px-5 pb-[84px] pt-4"
        style={{
          background: 'linear-gradient(to bottom, transparent, var(--background) 40%)',
        }}
      >
        <button
          type="submit"
          disabled={loading || !ctaEnabled}
          className={cn(
            'w-full h-12 rounded-[14px] text-[15px] font-semibold transition-all',
            ctaEnabled
              ? 'bg-foreground text-background'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          )}
          style={ctaEnabled ? { boxShadow: '0 4px 12px rgba(42,31,23,0.25)' } : undefined}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mx-auto" />
          ) : (
            'Guardar gasto'
          )}
        </button>
      </div>
    </form>
  )
}
