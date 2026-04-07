'use client'

import { useState } from 'react'
import { Gasto, Pago, Categoria } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { Search } from 'lucide-react'

interface Props {
  gastos: Gasto[]
  pagos: Pago[]
  categorias: Categoria[]
}

export function GastosList({ gastos, pagos, categorias }: Props) {
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<string>('activo')
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas')

  const gastosFiltrados = gastos.filter(g => {
    if (filtroEstado !== 'todos' && g.estado !== filtroEstado) return false
    if (filtroCategoria !== 'todas' && g.categoria !== filtroCategoria) return false
    if (busqueda && !g.descripcion.toLowerCase().includes(busqueda.toLowerCase())) return false
    return true
  })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Gastos</h1>
        <p className="text-muted-foreground text-sm">{gastosFiltrados.length} resultado(s)</p>
      </div>

      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar gasto..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Select value={filtroEstado} onValueChange={v => v && setFiltroEstado(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="activo">Activos</SelectItem>
              <SelectItem value="cancelado">Cancelados</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filtroCategoria} onValueChange={v => v && setFiltroCategoria(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              {categorias.map(c => (
                <SelectItem key={c.id} value={c.nombre}>{c.icono} {c.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        {gastosFiltrados.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No hay gastos que coincidan</p>
        ) : (
          gastosFiltrados.map(gasto => {
            const gastoPagos = pagos.filter(p => p.gasto_id === gasto.id)
            const pagados = gastoPagos.filter(p => p.estado === 'pagado').length
            const total = gastoPagos.length || gasto.cuotas
            const progreso = total > 0 ? (pagados / total) * 100 : 0
            const cat = categorias.find(c => c.nombre === gasto.categoria)

            return (
              <Link key={gasto.id} href={`/gastos/${gasto.id}`}>
                <div className={`p-4 rounded-lg border bg-white hover:bg-gray-50 transition-colors ${gasto.estado === 'cancelado' ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span>{cat?.icono || '📦'}</span>
                        <p className="font-medium truncate">{gasto.descripcion}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{gasto.categoria}</Badge>
                        {gasto.estado === 'cancelado' && (
                          <Badge variant="destructive" className="text-xs">Cancelado</Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right ml-3">
                      <p className="font-semibold">${gasto.monto_total.toLocaleString('es-AR')}</p>
                      <p className="text-xs text-muted-foreground">{pagados}/{total} cuotas</p>
                    </div>
                  </div>
                  {gasto.cuotas > 1 && (
                    <div className="mt-3">
                      <Progress value={progreso} className="h-1.5" />
                    </div>
                  )}
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
