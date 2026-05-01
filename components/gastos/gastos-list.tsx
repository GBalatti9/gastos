'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { Gasto, Pago, Categoria } from '@/lib/types'
import Link from 'next/link'
import { Search, X, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
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

type SortKey = 'descripcion' | 'monto_total' | 'categoria' | 'fecha_inicio' | 'cuotas' | 'pagado_por'
type SortDir = 'asc' | 'desc'

function ColumnFilter({
  value,
  options,
  onChange,
  label,
}: {
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
  label: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const activeLabel = options.find(o => o.value === value)?.label || label
  const isFiltered = value !== options[0]?.value

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={cn(
          'flex items-center gap-1 text-[11px] font-medium rounded-md px-1.5 py-0.5 transition-colors',
          isFiltered
            ? 'bg-foreground/10 text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <span className="truncate max-w-[80px]">{isFiltered ? activeLabel : label}</span>
        <ChevronDown className="h-3 w-3 flex-shrink-0" />
      </button>
      {open && (
        <div
          className="absolute top-full left-0 mt-1 z-50 min-w-[140px] rounded-lg bg-card border border-border py-1"
          style={{ boxShadow: '0 4px 16px rgba(42,31,23,0.12)' }}
        >
          {options.map(o => (
            <button
              key={o.value}
              type="button"
              onClick={() => { onChange(o.value); setOpen(false) }}
              className={cn(
                'w-full text-left px-3 py-1.5 text-[12px] hover:bg-muted/40 transition-colors',
                value === o.value ? 'font-semibold text-foreground' : 'text-muted-foreground'
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
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
  const [sortKey, setSortKey] = useState<SortKey>('fecha_inicio')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const mesesDisponibles = useMemo(() => {
    const mesesSet = new Set<string>()
    gastos.forEach(g => {
      if (g.fecha_inicio) mesesSet.add(g.fecha_inicio.slice(0, 7))
    })
    return Array.from(mesesSet).sort().reverse()
  }, [gastos])

  const categoriasPresentes = useMemo(() => {
    const nombres = new Set(gastos.map(g => g.categoria).filter(Boolean))
    return categorias.filter(c => nombres.has(c.nombre))
  }, [gastos, categorias])

  const gastosFiltrados = useMemo(() => {
    let result = gastos.filter(g => {
      if (filtroEstado !== 'todos' && g.estado !== filtroEstado) return false
      if (filtroCategoria !== 'todas' && g.categoria !== filtroCategoria) return false
      if (busqueda && !g.descripcion.toLowerCase().includes(busqueda.toLowerCase())) return false
      if (filtroMes !== 'todos' && !g.fecha_inicio.startsWith(filtroMes)) return false
      if (filtroPagador !== 'todos' && g.pagado_por !== filtroPagador) return false
      if (filtroMoneda !== 'todas' && (g.moneda || 'ARS') !== filtroMoneda) return false
      return true
    })

    result.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'descripcion':
          cmp = a.descripcion.localeCompare(b.descripcion); break
        case 'monto_total':
          cmp = a.monto_total - b.monto_total; break
        case 'categoria':
          cmp = (a.categoria || '').localeCompare(b.categoria || ''); break
        case 'fecha_inicio':
          cmp = a.fecha_inicio.localeCompare(b.fecha_inicio); break
        case 'cuotas':
          cmp = a.cuotas - b.cuotas; break
        case 'pagado_por':
          cmp = a.pagado_por.localeCompare(b.pagado_por); break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

    return result
  }, [gastos, filtroEstado, filtroCategoria, busqueda, filtroMes, filtroPagador, filtroMoneda, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir(key === 'monto_total' || key === 'fecha_inicio' ? 'desc' : 'asc')
    }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />
    return sortDir === 'asc'
      ? <ArrowUp className="h-3 w-3 text-foreground" />
      : <ArrowDown className="h-3 w-3 text-foreground" />
  }

  const activeFilters = [
    filtroEstado !== 'activo' && filtroEstado !== 'todos' ? 1 : 0,
    filtroCategoria !== 'todas' ? 1 : 0,
    filtroMes !== 'todos' ? 1 : 0,
    filtroPagador !== 'todos' ? 1 : 0,
    filtroMoneda !== 'todas' ? 1 : 0,
  ].reduce((a, b) => a + b, 0)

  function clearFilters() {
    setFiltroEstado('activo')
    setFiltroCategoria('todas')
    setFiltroMes('todos')
    setFiltroPagador('todos')
    setFiltroMoneda('todas')
    setBusqueda('')
  }

  return (
    <div className="py-6 space-y-3">
      {/* Header */}
      <div className="flex items-baseline justify-between">
        <h1 className="font-display italic text-[34px] leading-none text-foreground">Gastos</h1>
        <span className="text-[13px] text-muted-foreground">{gastosFiltrados.length} resultados</span>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-card border border-border rounded-full px-3 py-2">
        <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="flex-1 text-[14px] bg-transparent text-foreground placeholder:text-muted-foreground outline-none"
        />
        {(busqueda || activeFilters > 0) && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-[12px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <X className="h-3.5 w-3.5" />
            Limpiar
          </button>
        )}
      </div>

      {/* Table */}
      <div
        className="rounded-[16px] bg-card border border-border overflow-hidden"
        style={{ boxShadow: '0 1px 2px rgba(42,31,23,0.04)' }}
      >
        {/* Table header */}
        <div className="grid grid-cols-[1fr_80px_60px_110px] gap-x-3 px-4 py-2.5 border-b border-border bg-muted/30">
          {/* Descripcion col */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => toggleSort('descripcion')}
              className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[1px] text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
            >
              Descripcion <SortIcon col="descripcion" />
            </button>
            <ColumnFilter
              label="Categoria"
              value={filtroCategoria}
              onChange={setFiltroCategoria}
              options={[
                { value: 'todas', label: 'Todas' },
                ...categoriasPresentes.map(c => ({ value: c.nombre, label: `${c.icono} ${c.nombre}` })),
              ]}
            />
            <ColumnFilter
              label="Estado"
              value={filtroEstado}
              onChange={setFiltroEstado}
              options={[
                { value: 'todos', label: 'Todos' },
                { value: 'activo', label: 'Activos' },
                { value: 'cancelado', label: 'Cancelados' },
              ]}
            />
          </div>

          {/* Pagador col */}
          <div className="flex items-center justify-center">
            <ColumnFilter
              label="Pagador"
              value={filtroPagador}
              onChange={setFiltroPagador}
              options={[
                { value: 'todos', label: 'Todos' },
                { value: usuarioEmail, label: 'Yo' },
                { value: otroUsuarioEmail, label: otroUsuarioNombre },
              ]}
            />
          </div>

          {/* Cuotas col */}
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={() => toggleSort('cuotas')}
              className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[1px] text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
            >
              Cuotas <SortIcon col="cuotas" />
            </button>
          </div>

          {/* Monto col */}
          <div className="flex items-center justify-end gap-2">
            <ColumnFilter
              label="Moneda"
              value={filtroMoneda}
              onChange={setFiltroMoneda}
              options={[
                { value: 'todas', label: 'Todas' },
                { value: 'ARS', label: 'ARS' },
                { value: 'USD', label: 'USD' },
              ]}
            />
            <button
              type="button"
              onClick={() => toggleSort('monto_total')}
              className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[1px] text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
            >
              Monto <SortIcon col="monto_total" />
            </button>
          </div>
        </div>

        {/* Mes filter row */}
        <div className="flex items-center gap-2 px-4 py-1.5 border-b border-border/50 bg-muted/10">
          <ColumnFilter
            label="Mes"
            value={filtroMes}
            onChange={setFiltroMes}
            options={[
              { value: 'todos', label: 'Todos los meses' },
              ...mesesDisponibles.map(mes => ({
                value: mes,
                label: format(new Date(mes + '-01'), 'MMMM yyyy', { locale: es }),
              })),
            ]}
          />
          <button
            type="button"
            onClick={() => toggleSort('fecha_inicio')}
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Fecha <SortIcon col="fecha_inicio" />
          </button>
        </div>

        {/* Rows */}
        {gastosFiltrados.length === 0 ? (
          <p className="text-center text-muted-foreground py-12 text-[13px]">
            No hay gastos que coincidan.
          </p>
        ) : (
          gastosFiltrados.map((gasto, i) => {
            const gastoPagos = pagos.filter(p => p.gasto_id === gasto.id)
            const pagadosCuotas = gastoPagos.filter(p => p.estado === 'pagado').length
            const totalCuotas = gastoPagos.length || gasto.cuotas
            const pct = totalCuotas > 0 ? (pagadosCuotas / totalCuotas) * 100 : 0
            const cat = categorias.find(c => c.nombre === gasto.categoria)
            const simbolo = gasto.moneda === 'USD' ? 'U$S' : '$'
            const cancelado = gasto.estado === 'cancelado'
            const esPagadorUsuario = gasto.pagado_por === usuarioEmail
            const fechaLabel = format(
              new Date(gasto.fecha_inicio + 'T12:00:00'),
              'dd MMM yy',
              { locale: es }
            )

            return (
              <Link key={gasto.id} href={`/gastos/${gasto.id}`}>
                <div
                  className={cn(
                    'grid grid-cols-[1fr_80px_60px_110px] gap-x-3 px-4 py-2.5 hover:bg-muted/20 transition-colors items-center',
                    i < gastosFiltrados.length - 1 && 'border-b border-border/40'
                  )}
                  style={{ opacity: cancelado ? 0.45 : 1 }}
                >
                  {/* Descripcion + categoria + fecha */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-[14px] leading-none"
                      style={{
                        backgroundColor: cat?.color ? `${cat.color}18` : 'rgba(138,117,101,0.1)',
                      }}
                    >
                      {cat?.icono || ''}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-foreground truncate">
                        {gasto.descripcion}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {gasto.categoria}
                        <span className="mx-1">·</span>
                        {fechaLabel}
                        {cancelado && (
                          <span className="ml-1" style={{ color: '#C23B2A' }}>· cancelado</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Pagador */}
                  <div className="flex justify-center">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-background"
                      style={{ backgroundColor: esPagadorUsuario ? '#5E7A3C' : '#8B5E3C' }}
                      title={esPagadorUsuario ? 'Yo' : otroUsuarioNombre}
                    >
                      {esPagadorUsuario ? 'Yo' : otroUsuarioNombre.charAt(0).toUpperCase()}
                    </div>
                  </div>

                  {/* Cuotas */}
                  <div className="text-center">
                    {gasto.cuotas > 1 ? (
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-[12px] font-medium text-foreground">
                          {pagadosCuotas}/{totalCuotas}
                        </span>
                        <div className="w-8 h-[2px] rounded-full overflow-hidden bg-muted">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: cat?.color || '#8B5E3C',
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-[12px] text-muted-foreground">1</span>
                    )}
                  </div>

                  {/* Monto */}
                  <div className="text-right">
                    <p className="text-[13px] font-semibold text-foreground">
                      {simbolo} {Math.round(gasto.monto_total).toLocaleString('es-AR')}
                    </p>
                    {gasto.cuotas > 1 && (
                      <p className="text-[10px] text-muted-foreground">
                        {simbolo} {Math.round(gasto.monto_total / gasto.cuotas).toLocaleString('es-AR')}/mes
                      </p>
                    )}
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
