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
import Link from 'next/link'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface Props {
  gastos: Gasto[]
  pagos: Pago[]
  categorias: Categoria[]
  usuarioEmail: string
  otroUsuarioEmail: string
  otroUsuarioNombre: string
}

export function GastosList({
  gastos,
  pagos,
  categorias,
  usuarioEmail,
  otroUsuarioEmail,
  otroUsuarioNombre,
}: Props) {
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<string>('activo')
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas')
  const [filtroMes, setFiltroMes] = useState<string>('todos')
  const [filtroPagador, setFiltroPagador] = useState<string>('todos')
  const [filtroMoneda, setFiltroMoneda] = useState<string>('todas')
  const [showFilters, setShowFilters] = useState(false)

  const mesesDisponibles = useMemo(() => {
    const mesesSet = new Set<string>()
    gastos.forEach(g => {
      if (g.fecha_inicio) mesesSet.add(g.fecha_inicio.slice(0, 7))
    })
    return Array.from(mesesSet).sort().reverse()
  }, [gastos])

  // Categories that actually appear in current dataset
  const categoriasPresentes = useMemo(() => {
    const nombres = new Set(gastos.map(g => g.categoria).filter(Boolean))
    return categorias.filter(c => nombres.has(c.nombre))
  }, [gastos, categorias])

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
    <div className="py-6 space-y-4">
      {/* Title */}
      <div className="flex items-baseline justify-between">
        <h1 className="font-display italic text-[34px] leading-none text-foreground">Gastos</h1>
        <span className="text-[13px] text-muted-foreground">{gastosFiltrados.length} resultados</span>
      </div>

      {/* Search + Filtros button */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 bg-card border border-border rounded-full px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <input
              type="text"
              placeholder="Buscar gastos…"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="flex-1 text-[14px] bg-transparent text-foreground placeholder:text-muted-foreground outline-none"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda('')}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowFilters(v => !v)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-full text-[13px] font-medium border border-border transition-all',
              showFilters
                ? 'bg-muted text-foreground'
                : 'bg-card text-muted-foreground hover:text-foreground'
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filtros
          </button>
        </div>

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {[
            { nombre: 'todas', icono: '', color: '#8A7565' },
            ...categoriasPresentes,
          ].map(cat => {
            const isAll = cat.nombre === 'todas'
            const isActive = filtroCategoria === cat.nombre
            return (
              <button
                key={cat.nombre}
                type="button"
                onClick={() => setFiltroCategoria(cat.nombre)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] whitespace-nowrap font-medium transition-all flex-shrink-0 border"
                style={{
                  backgroundColor: isActive ? '#2A1F17' : isAll ? 'transparent' : `${cat.color}22`,
                  color: isActive ? '#F5F1E8' : '#2A1F17',
                  borderColor: isActive ? '#2A1F17' : 'rgba(77,52,38,0.12)',
                }}
              >
                {!isAll && cat.icono && (
                  <span className="text-[14px] leading-none">{cat.icono}</span>
                )}
                {isAll ? 'Todas' : cat.nombre}
              </button>
            )
          })}
        </div>

        {/* Advanced filter panel */}
        {showFilters && (
          <div className="rounded-[14px] bg-card border border-border p-4">
            <div className="grid grid-cols-2 gap-x-3 gap-y-3">
              {[
                {
                  label: 'Estado',
                  value: filtroEstado,
                  onChange: setFiltroEstado,
                  options: [
                    { value: 'todos', label: 'Todos' },
                    { value: 'activo', label: 'Activos' },
                    { value: 'cancelado', label: 'Cancelados' },
                  ],
                },
                {
                  label: 'Moneda',
                  value: filtroMoneda,
                  onChange: setFiltroMoneda,
                  options: [
                    { value: 'todas', label: 'Todas' },
                    { value: 'ARS', label: '🇦🇷 ARS' },
                    { value: 'USD', label: '🇺🇸 USD' },
                  ],
                },
                {
                  label: 'Pagado por',
                  value: filtroPagador,
                  onChange: setFiltroPagador,
                  options: [
                    { value: 'todos', label: 'Todos' },
                    { value: usuarioEmail, label: 'Yo' },
                    { value: otroUsuarioEmail, label: otroUsuarioNombre },
                  ],
                },
                {
                  label: 'Mes',
                  value: filtroMes,
                  onChange: setFiltroMes,
                  options: [
                    { value: 'todos', label: 'Todos' },
                    ...mesesDisponibles.map(mes => ({
                      value: mes,
                      label: format(new Date(mes + '-01'), 'MMM yyyy', { locale: es }),
                    })),
                  ],
                },
              ].map(f => (
                <div key={f.label}>
                  <p className="text-[10px] font-semibold uppercase tracking-[1.2px] text-muted-foreground mb-1">
                    {f.label}
                  </p>
                  <Select value={f.value} onValueChange={v => v && f.onChange(v)}>
                    <SelectTrigger className="bg-muted/40 border-border text-foreground text-sm h-9 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {f.options.map(o => (
                        <SelectItem key={o.value} value={o.value} className="text-foreground">
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* List */}
      <div className="space-y-[10px]">
        {gastosFiltrados.length === 0 ? (
          <p className="text-center text-muted-foreground py-12 text-sm">
            No hay gastos que coincidan.
          </p>
        ) : (
          gastosFiltrados.map(gasto => {
            const gastoPagos = pagos.filter(p => p.gasto_id === gasto.id)
            const pagadosCuotas = gastoPagos.filter(p => p.estado === 'pagado').length
            const totalCuotas = gastoPagos.length || gasto.cuotas
            const pct = totalCuotas > 0 ? (pagadosCuotas / totalCuotas) * 100 : 0
            const cat = categorias.find(c => c.nombre === gasto.categoria)
            const simbolo = gasto.moneda === 'USD' ? 'U$S' : '$'
            const cancelado = gasto.estado === 'cancelado'
            const montoCuota = gasto.cuotas > 1 ? gasto.monto_total / gasto.cuotas : 0

            return (
              <Link key={gasto.id} href={`/gastos/${gasto.id}`}>
                <div
                  className="rounded-[14px] bg-card border border-border px-4 py-[14px] hover:bg-muted/20 transition-colors"
                  style={{
                    opacity: cancelado ? 0.5 : 1,
                    boxShadow: '0 1px 2px rgba(42,31,23,0.04)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    {/* Icon box */}
                    <div
                      className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0 text-[18px] leading-none"
                      style={{
                        backgroundColor: cat?.color ? `${cat.color}22` : 'rgba(138,117,101,0.13)',
                      }}
                    >
                      {cat?.icono || '📦'}
                    </div>

                    {/* Middle */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-semibold text-foreground truncate">
                        {gasto.descripcion}
                      </p>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.5px] text-muted-foreground mt-0.5">
                        {gasto.categoria}
                      </p>
                      {gasto.cuotas > 1 && (
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex-1 h-[3px] rounded-full overflow-hidden bg-muted">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: cat?.color || '#8B5E3C',
                              }}
                            />
                          </div>
                          <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                            {pagadosCuotas}/{totalCuotas}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Right: amount */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-[15px] font-semibold text-foreground">
                        {simbolo} {Math.round(gasto.monto_total).toLocaleString('es-AR')}
                      </p>
                      {gasto.cuotas > 1 && montoCuota > 0 && (
                        <p className="text-[11px] text-muted-foreground">
                          {simbolo} {Math.round(montoCuota).toLocaleString('es-AR')}/mes
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
