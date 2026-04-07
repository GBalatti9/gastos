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
import { Card, CardContent } from '@/components/ui/card'
import { Categoria } from '@/lib/types'
import { Loader2 } from 'lucide-react'

interface Props {
  categorias: Categoria[]
  usuarioEmail: string
  usuarioNombre: string
}

export function NuevoGastoForm({ categorias, usuarioEmail, usuarioNombre }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    descripcion: '',
    monto_total: '',
    pagado_por: usuarioEmail,
    cuotas: '1',
    fecha_inicio: format(new Date(), 'yyyy-MM-dd'),
    dia_vencimiento: '10',
    categoria: '',
    notas: '',
  })

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

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
      const { gasto, pagos } = await res.json()

      // Send notification to other person
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
      } catch {
        // Notification failure shouldn't block the user
      }

      toast.success('Gasto guardado correctamente')
      router.push('/gastos')
      router.refresh()
    } catch (err) {
      toast.error('Error al guardar el gasto')
    } finally {
      setLoading(false)
    }
  }

  const montoCuota = form.monto_total && form.cuotas
    ? (parseFloat(form.monto_total) / parseInt(form.cuotas)).toFixed(2)
    : null

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="descripcion">Descripción *</Label>
            <Input
              id="descripcion"
              placeholder="Ej: Netflix, Alquiler, Supermercado..."
              value={form.descripcion}
              onChange={e => set('descripcion', e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="monto_total">Monto total *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="monto_total"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                className="pl-7"
                value={form.monto_total}
                onChange={e => set('monto_total', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="categoria">Categoría *</Label>
            <Select value={form.categoria} onValueChange={v => v && set('categoria', v)} required>
              <SelectTrigger>
                <SelectValue placeholder="Seleccioná una categoría" />
              </SelectTrigger>
              <SelectContent>
                {categorias.map(c => (
                  <SelectItem key={c.id} value={c.nombre}>
                    {c.icono} {c.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pagado_por">Pagado por</Label>
            <Select value={form.pagado_por} onValueChange={v => v && set('pagado_por', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={usuarioEmail}>Yo ({usuarioNombre})</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cuotas">Cantidad de cuotas</Label>
              <Input
                id="cuotas"
                type="number"
                min="1"
                max="60"
                value={form.cuotas}
                onChange={e => set('cuotas', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dia_vencimiento">Día de vencimiento</Label>
              <Input
                id="dia_vencimiento"
                type="number"
                min="1"
                max="28"
                value={form.dia_vencimiento}
                onChange={e => set('dia_vencimiento', e.target.value)}
              />
            </div>
          </div>

          {montoCuota && parseInt(form.cuotas) > 1 && (
            <div className="bg-indigo-50 rounded-lg p-3 text-sm">
              <p className="text-indigo-700 font-medium">
                {form.cuotas} cuotas de ${parseFloat(montoCuota).toLocaleString('es-AR')}
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="fecha_inicio">Fecha de inicio</Label>
            <Input
              id="fecha_inicio"
              type="date"
              value={form.fecha_inicio}
              onChange={e => set('fecha_inicio', e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notas">Notas (opcional)</Label>
            <Textarea
              id="notas"
              placeholder="Información adicional..."
              rows={2}
              value={form.notas}
              onChange={e => set('notas', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Guardar gasto
      </Button>
    </form>
  )
}
