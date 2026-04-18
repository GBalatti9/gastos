'use client'

import { useState } from 'react'
import { TarjetaCredito } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CreditCard, Pencil, Trash2, Plus, X, Check } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Props {
  tarjetas: TarjetaCredito[]
}

export function TarjetasConfig({ tarjetas }: Props) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [nombre, setNombre] = useState('')
  const [ultimos4, setUltimos4] = useState('')
  const [fechaCierre, setFechaCierre] = useState('')
  const [fechaVencimiento, setFechaVencimiento] = useState('')

  function resetForm() {
    setNombre('')
    setUltimos4('')
    setFechaCierre('')
    setFechaVencimiento('')
    setShowForm(false)
    setEditingId(null)
  }

  function startEdit(tarjeta: TarjetaCredito) {
    setEditingId(tarjeta.id)
    setNombre(tarjeta.nombre)
    setUltimos4(tarjeta.ultimos_4)
    setFechaCierre(String(tarjeta.fecha_cierre))
    setFechaVencimiento(String(tarjeta.fecha_vencimiento))
    setShowForm(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      if (editingId) {
        const res = await fetch(`/api/tarjetas/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre, ultimos_4: ultimos4, fecha_cierre: fechaCierre, fecha_vencimiento: fechaVencimiento }),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Error al actualizar')
        }
        toast.success('Tarjeta actualizada')
      } else {
        const res = await fetch('/api/tarjetas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre, ultimos_4: ultimos4, fecha_cierre: fechaCierre, fecha_vencimiento: fechaVencimiento }),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Error al crear')
        }
        toast.success('Tarjeta agregada')
      }
      resetForm()
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/tarjetas/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al eliminar')
      }
      toast.success('Tarjeta eliminada')
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error inesperado')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Tarjetas de crédito</h2>
        {!showForm && !editingId && (
          <Button variant="ghost" size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Agregar
          </Button>
        )}
      </div>

      {tarjetas.length === 0 && !showForm && (
        <p className="text-sm text-muted-foreground py-6 text-center">
          No tenés tarjetas configuradas. Agregá una para trackear gastos en cuotas.
        </p>
      )}

      {/* Card list */}
      <div className="space-y-2">
        {tarjetas.map(tarjeta => (
          <div key={tarjeta.id}>
            {editingId === tarjeta.id ? (
              <form onSubmit={handleSubmit} className="rounded-xl bg-muted/50 border border-border p-4 space-y-3">
                <CardFormFields
                  nombre={nombre} setNombre={setNombre}
                  ultimos4={ultimos4} setUltimos4={setUltimos4}
                  fechaCierre={fechaCierre} setFechaCierre={setFechaCierre}
                  fechaVencimiento={fechaVencimiento} setFechaVencimiento={setFechaVencimiento}
                />
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="ghost" size="sm" onClick={resetForm}>
                    <X className="h-4 w-4" />
                  </Button>
                  <Button type="submit" size="sm" disabled={loading}>
                    <Check className="h-4 w-4 mr-1" />
                    Guardar
                  </Button>
                </div>
              </form>
            ) : (
              <div className="rounded-xl bg-card border border-border p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {tarjeta.nombre}
                      <span className="text-muted-foreground ml-2">•••• {tarjeta.ultimos_4}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Cierre: día {tarjeta.fecha_cierre} · Vencimiento: día {tarjeta.fecha_vencimiento}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(tarjeta)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-md text-red-600 hover:text-red-700 hover:bg-accent">
                      <Trash2 className="h-3.5 w-3.5" />
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar tarjeta</AlertDialogTitle>
                        <AlertDialogDescription>
                          ¿Seguro que querés eliminar {tarjeta.nombre} (•••• {tarjeta.ultimos_4})?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(tarjeta.id)}>
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* New card form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl bg-muted/50 border border-border p-4 space-y-3">
          <CardFormFields
            nombre={nombre} setNombre={setNombre}
            ultimos4={ultimos4} setUltimos4={setUltimos4}
            fechaCierre={fechaCierre} setFechaCierre={setFechaCierre}
            fechaVencimiento={fechaVencimiento} setFechaVencimiento={setFechaVencimiento}
          />
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" size="sm" onClick={resetForm}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={loading}>
              <Plus className="h-4 w-4 mr-1" />
              Agregar tarjeta
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}

function CardFormFields({
  nombre, setNombre,
  ultimos4, setUltimos4,
  fechaCierre, setFechaCierre,
  fechaVencimiento, setFechaVencimiento,
}: {
  nombre: string; setNombre: (v: string) => void
  ultimos4: string; setUltimos4: (v: string) => void
  fechaCierre: string; setFechaCierre: (v: string) => void
  fechaVencimiento: string; setFechaVencimiento: (v: string) => void
}) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Nombre</label>
          <Input
            placeholder="Visa Banco Nación"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Últimos 4 dígitos</label>
          <Input
            placeholder="4532"
            maxLength={4}
            pattern="\d{4}"
            value={ultimos4}
            onChange={e => setUltimos4(e.target.value.replace(/\D/g, '').slice(0, 4))}
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Día de cierre</label>
          <Input
            type="number"
            min={1}
            max={31}
            placeholder="17"
            value={fechaCierre}
            onChange={e => setFechaCierre(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Día de vencimiento</label>
          <Input
            type="number"
            min={1}
            max={31}
            placeholder="10"
            value={fechaVencimiento}
            onChange={e => setFechaVencimiento(e.target.value)}
            required
          />
        </div>
      </div>
    </>
  )
}
