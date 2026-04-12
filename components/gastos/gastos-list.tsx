'use client'

import { useState, useMemo } from 'react'
import { Gasto, Pago, Categoria } from '@/lib/types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { Search, RefreshCw, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Props {
  gastos: Gasto[]
  pagos: Pago[]
  categorias: Categoria[]
  usuarioEmail: string
  otroUsuarioEmail: string
  otroUsuarioNombre: string
}

export function GastosList({ gastos, pagos, categorias, usuarioEmail, otroUsuarioEmail, otroUsuarioNombre }: Props) {
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<string>('activo')
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas')
  const [filtroMes, setFiltroMes] = useState<string>('todos')
  const [filtroPagador, setFiltroPagador] = useState<string>('todos')
  const [filtroMoneda, setFiltroMoneda] = useState<string>('todas')

  const mesesDisponibles = useMemo(() => {
    const mesesSet = new Set<string>()
    gastos.forEach(g => {
      if (g.fecha_inicio) mesesSet.add(g.fecha_inicio.slice(0, 7))
    })
    return Array.from(mesesSet).sort().reverse()
  }, [gastos])

  const gastosFiltrados = gastos.filter(g => {
    if (filtroEstado !== 'todos' && g.estado !== filtroEstado) return false
    if (filtroCategoria !== 'todas' && g.categoria !== filtroCategoria) return false
    if (busqueda && !g.descripcion.toLowerCase().includes(busqueda.toLowerCase())) return false
    if (filtroMes !== 'todos' && !g.fecha_inicio.startsWith(filtroMes)) return false
    if (filtroPagador !== 'todos' && g.pagado_por !== filtroPagador) return false
    if (filtroMoneda !== 'todas' && (g.moneda || 'ARS') !== filtroMoneda) return false
    return true
  })

  return (
    <div className="py-6 space-y-5">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-display italic text-foreground">Gastos</h1>
        <p className="text-xs text-muted-foreground mt-0.5">{gastosFiltrados.length} resultado(s)</p>
      </div>

      {/* Filters */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="pl-9 bg-card border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[
            {
              value: filtroEstado, onChange: setFiltroEstado,
              placeholder: 'Estado',
              options: [
                { value: 'todos', label: 'Todos' },
                { value: 'activo', label: 'Activos' },
                { value: 'cancelado', label: 'Cancelados' },
              ],
            },
            {
              value: filtroCategoria, onChange: setFiltroCategoria,
              placeholder: 'Categoría',
              options: [
                { value: 'todas', label: 'Todas' },
                ...categorias.map(c => ({ value: c.nombre, label: `${c.icono} ${c.nombre}` })),
              ],
            },
            {
              value: filtroMes, onChange: setFiltroMes,
              placeholder: 'Mes',
              options: [
                { value: 'todos', label: 'Todos los meses' },
                ...mesesDisponibles.map(mes => ({
                  value: mes,
                  label: format(new Date(mes + '-01'), 'MMM yyyy', { locale: es }),
                })),
              ],
            },
            {
              value: filtroPagador, onChange: setFiltroPagador,
              placeholder: 'Pagado por',
              options: [
                { value: 'todos', label: 'Todos' },
                { value: usuarioEmail, label: 'Yo' },
                { value: otroUsuarioEmail, label: otroUsuarioNombre },
              ],
            },
          ].map((f, i) => (
            <Select key={i} value={f.value} onValueChange={v => v && f.onChange(v)}>
              <SelectTrigger className="bg-card border-border text-foreground text-sm">
                <SelectValue placeholder={f.placeholder} />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {f.options.map(o => (
                  <SelectItem key={o.value} value={o.value} className="text-foreground">
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
        </div>

        <Select value={filtroMoneda} onValueChange={v => v && setFiltroMoneda(v)}>
          <SelectTrigger className="bg-card border-border text-foreground text-sm">
            <SelectValue placeholder="Moneda" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="todas" className="text-foreground">Todas las monedas</SelectItem>
            <SelectItem value="ARS" className="text-foreground">🇦🇷 ARS</SelectItem>
            <SelectItem value="USD" className="text-foreground">🇺🇸 USD</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      <div className="space-y-1">
        {gastosFiltrados.length === 0 ? (
          <p className="text-center text-muted-foreground py-12 text-sm">
            No hay gastos que coincidan.
          </p>
        ) : (
          gastosFiltrados.map(gasto => {
            const gastoPagos = pagos.filter(p => p.gasto_id === gasto.id)
            const pagados = gastoPagos.filter(p => p.estado === 'pagado').length
            const total = gastoPagos.length || gasto.cuotas
            const pct = total > 0 ? (pagados / total) * 100 : 0
            const cat = categorias.find(c => c.nombre === gasto.categoria)
            const simbolo = gasto.moneda === 'USD' ? 'U$S' : '$'
            const cancelado = gasto.estado === 'cancelado'

            return (
              <Link key={gasto.id} href={`/gastos/${gasto.id}`}>
                <div
                  className={`p-4 rounded-xl border border-border hover:bg-muted/30 transition-colors group space-y-2 ${
                    cancelado ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className="text-lg leading-none mt-0.5 flex-shrink-0">{cat?.icono || '📦'}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{gasto.descripcion}</p>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                            {gasto.categoria}
                          </span>
                          {gasto.moneda === 'USD' && (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-700/10 px-1.5 py-0.5 rounded">
                              USD
                            </span>
                          )}
                          {gasto.recurrente && (
                            <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <RefreshCw className="h-2.5 w-2.5" /> mensual
                            </span>
                          )}
                          {cancelado && (
                            <span className="text-[10px] text-red-700 bg-red-700/10 px-1.5 py-0.5 rounded">
                              cancelado
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 flex items-start gap-1">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {simbolo} {gasto.monto_total.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                        </p>
                        <p className="text-[10px] text-muted-foreground text-right">
                          {pagados}/{total} cuotas
                        </p>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground mt-1 group-hover:text-foreground transition-colors flex-shrink-0" />
                    </div>
                  </div>

                  {gasto.cuotas > 1 && (
                    <div className="h-0.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary/50 transition-all"
                        style={{ width: `${pct}%` }}
                      />
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
