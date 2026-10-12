'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Field, FieldLabel } from '@/components/ui/field'
import { Categoria } from '@/lib/types'
import { cn } from '@/lib/utils'

// ─── Nueva categoría inline ───────────────────────────────────────────────────

const ICONOS_GRUPOS: { label: string; iconos: string[] }[] = [
  { label: 'Hogar', iconos: ['🏠', '🏡', '🏢', '🏗️', '🛋️', '🛏️', '🚪', '🪟', '🪴', '🔑', '🔒', '🧹', '🪣', '🛠️', '🪚', '🔧'] },
  { label: 'Comida', iconos: ['🛒', '🥦', '🥕', '🍎', '🥩', '🐟', '🥚', '🧃', '☕', '🍺', '🍷', '🥐', '🍕', '🍔', '🍜', '🥗'] },
  { label: 'Restaurantes', iconos: ['🍽️', '🥡', '🍱', '🌮', '🍣', '🍦', '🧁', '🍰', '🫕', '🥘', '🍳', '🫙'] },
  { label: 'Transporte', iconos: ['🚗', '🚕', '🚌', '🚆', '🚇', '✈️', '🛵', '🚲', '🛺', '⛽', '🅿️', '🗺️'] },
  { label: 'Servicios', iconos: ['💡', '💧', '🔥', '🌐', '📡', '📺', '📱', '💻', '🖨️', '🔌', '📶', '🗑️'] },
  { label: 'Salud', iconos: ['💊', '🏥', '🩺', '💉', '🩹', '🧴', '🦷', '👓', '🩻', '🧠', '🫀', '🌡️'] },
  { label: 'Ocio', iconos: ['🎬', '🎮', '🎵', '🎭', '🎨', '📚', '🏋️', '⚽', '🎾', '🏊', '🎲', '🎉', '🎸', '🎯', '🏄', '🧗'] },
  { label: 'Ropa', iconos: ['👕', '👗', '👔', '👟', '👠', '👜', '🧢', '🧥', '👒', '💍', '⌚', '🕶️'] },
  { label: 'Mascotas', iconos: ['🐾', '🐕', '🐈', '🦜', '🐠', '🐇', '🦴', '🧸'] },
  { label: 'Educación', iconos: ['🎓', '🖊️', '🏫', '📐', '🔬', '🎒', '📝', '🖥️', '📖'] },
  { label: 'Finanzas', iconos: ['💰', '💳', '🏦', '📊', '📈', '💸', '🪙', '🏧', '🧾', '📉'] },
  { label: 'Varios', iconos: ['📦', '🎁', '🌟', '❤️', '💼', '🧳', '🔮', '⭐', '🪐', '🌈', '☀️', '🌙'] },
]

const ICONOS_PRESET = ICONOS_GRUPOS.flatMap(g => g.iconos)
const COLORES_PRESET = ['#ef4444', '#f97316', '#f59e0b', '#22c55e', '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899', '#e8a020']

export function NuevaCategoriaInline({
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
    <div className="col-span-full flex flex-col gap-3 rounded-xl border bg-muted/30 p-3">
      <Field>
        <FieldLabel htmlFor="nueva-cat-nombre">Nueva categoría</FieldLabel>
        <Input
          id="nueva-cat-nombre"
          placeholder="Nombre…"
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          className="bg-background text-base md:text-sm"
          autoFocus
        />
      </Field>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-muted-foreground">Ícono</span>
        <div className="flex max-h-44 flex-col gap-2 overflow-y-auto pr-1">
          {ICONOS_GRUPOS.map(grupo => (
            <div key={grupo.label}>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {grupo.label}
              </p>
              <div className="flex flex-wrap gap-1">
                {grupo.iconos.map(e => (
                  <button
                    key={grupo.label + e}
                    type="button"
                    aria-pressed={icono === e}
                    onClick={() => setIcono(e)}
                    className={cn(
                      'flex size-9 items-center justify-center rounded-lg text-base transition-colors',
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
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-muted-foreground">Color</span>
        <div className="flex flex-wrap gap-1.5">
          {COLORES_PRESET.map(c => (
            <button
              key={c}
              type="button"
              aria-label={`Color ${c}`}
              aria-pressed={color === c}
              onClick={() => setColor(c)}
              className={cn(
                'size-7 rounded-full border-2 transition-transform hover:scale-110',
                color === c ? 'border-foreground/50' : 'border-transparent'
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="button" size="sm" className="flex-1" onClick={handleCrear} disabled={!nombre.trim() || loading}>
          {loading ? <Spinner data-icon="inline-start" /> : <span>{icono}</span>}
          Crear
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancelar}>
          Cancelar
        </Button>
      </div>
    </div>
  )
}

// ─── Picker ───────────────────────────────────────────────────────────────────

interface PickerProps {
  categorias: Categoria[]
  value: string
  onChange: (nombre: string) => void
  onCategoriaCreada: (cat: Categoria) => void
}

/** Grilla de categorías con botón "Nueva" que despliega el alta inline. */
export function CategoriaPicker({ categorias, value, onChange, onCategoriaCreada }: PickerProps) {
  const [mostrarNueva, setMostrarNueva] = useState(false)

  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
      {categorias.map(cat => {
        const isActive = value === cat.nombre
        return (
          <button
            key={cat.id}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(cat.nombre)}
            className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border px-1 py-2 transition-all active:scale-95"
            style={{
              backgroundColor: isActive ? `${cat.color}33` : `${cat.color}11`,
              borderColor: isActive ? cat.color : 'transparent',
            }}
          >
            <span className="text-xl leading-none">{cat.icono}</span>
            <span className="line-clamp-1 text-[11px] font-medium leading-tight text-foreground">
              {cat.nombre}
            </span>
          </button>
        )
      })}

      {!mostrarNueva && (
        <button
          type="button"
          onClick={() => setMostrarNueva(true)}
          className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border border-dashed px-1 py-2 text-muted-foreground transition-colors hover:border-foreground/30"
        >
          <Plus className="size-5" />
          <span className="text-[11px] font-medium leading-tight">Nueva</span>
        </button>
      )}

      {mostrarNueva && (
        <NuevaCategoriaInline
          onCreada={cat => {
            onCategoriaCreada(cat)
            onChange(cat.nombre)
            setMostrarNueva(false)
          }}
          onCancelar={() => setMostrarNueva(false)}
        />
      )}
    </div>
  )
}
