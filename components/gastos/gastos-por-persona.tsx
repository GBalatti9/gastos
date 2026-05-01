'use client'

import { useMemo, useState } from 'react'
import { Gasto, Pago, Categoria } from '@/lib/types'
import Link from 'next/link'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  gastos: Gasto[]
  pagos: Pago[]
  categorias: Categoria[]
  usuarioEmail: string
  otroUsuarioEmail: string
  otroUsuarioNombre: string
  usuarioNombre: string
}

interface GastoResumen {
  gasto: Gasto
  cuotasPagadas: number
  cuotasTotal: number
  montoPagado: number
}

interface CategoriaSummary {
  nombre: string
  color: string
  icono: string
  total: number
  cantidad: number
}

function PersonaCard({
  nombre,
  email,
  gastos,
  pagos,
  categorias,
}: {
  nombre: string
  email: string
  gastos: Gasto[]
  pagos: Pago[]
  categorias: Categoria[]
}) {
  const [categoriaAbierta, setCategoriaAbierta] = useState<string | null>(null)

  const gastosUsuario = useMemo(
    () => gastos.filter(g => g.pagado_por === email && g.estado === 'activo'),
    [gastos, email]
  )

  const resumenPorCategoria = useMemo(() => {
    const map = new Map<string, { gastos: GastoResumen[]; cat: Categoria | undefined }>()

    gastosUsuario.forEach(gasto => {
      const gastoPagos = pagos.filter(p => p.gasto_id === gasto.id)
      const cuotasPagadas = gastoPagos.filter(p => p.estado === 'pagado').length
      const cuotasTotal = gastoPagos.length || gasto.cuotas
      const montoPagado = gastoPagos
        .filter(p => p.estado === 'pagado')
        .reduce((s, p) => s + p.monto, 0)

      const key = gasto.categoria || 'Sin categoria'
      if (!map.has(key)) {
        map.set(key, {
          gastos: [],
          cat: categorias.find(c => c.nombre === key),
        })
      }
      map.get(key)!.gastos.push({ gasto, cuotasPagadas, cuotasTotal, montoPagado })
    })

    const result: (CategoriaSummary & { gastos: GastoResumen[] })[] = []
    map.forEach((val, key) => {
      const total = val.gastos.reduce((s, g) => s + g.gasto.monto_total, 0)
      result.push({
        nombre: key,
        color: val.cat?.color || '#8A7565',
        icono: val.cat?.icono || '',
        total,
        cantidad: val.gastos.length,
        gastos: val.gastos.sort((a, b) => b.gasto.monto_total - a.gasto.monto_total),
      })
    })

    return result.sort((a, b) => b.total - a.total)
  }, [gastosUsuario, pagos, categorias])

  const totalARS = gastosUsuario
    .filter(g => (g.moneda || 'ARS') === 'ARS')
    .reduce((s, g) => s + g.monto_total, 0)

  const totalUSD = gastosUsuario
    .filter(g => g.moneda === 'USD')
    .reduce((s, g) => s + g.monto_total, 0)

  return (
    <div
      className="rounded-[20px] bg-card border border-border overflow-hidden"
      style={{ boxShadow: '0 1px 2px rgba(42,31,23,0.04)' }}
    >
      {/* Header */}
      <div className="px-[22px] py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-[14px] font-bold text-background"
            style={{ backgroundColor: '#8B5E3C' }}
          >
            {nombre.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-[16px] font-semibold text-foreground">{nombre}</p>
            <p className="text-[12px] text-muted-foreground">
              {gastosUsuario.length} gasto{gastosUsuario.length !== 1 ? 's' : ''} activo{gastosUsuario.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="text-right">
          {totalARS > 0 && (
            <p className="text-[18px] font-semibold text-foreground">
              ${Math.round(totalARS).toLocaleString('es-AR')}
            </p>
          )}
          {totalUSD > 0 && (
            <p className="text-[13px] text-muted-foreground">
              U$S {Math.round(totalUSD).toLocaleString('es-AR')}
            </p>
          )}
        </div>
      </div>

      {/* Categories */}
      {resumenPorCategoria.map(cat => {
        const isOpen = categoriaAbierta === cat.nombre
        const simboloDefault = cat.gastos[0]?.gasto.moneda === 'USD' ? 'U$S' : '$'

        return (
          <div key={cat.nombre} className="border-t border-border">
            <button
              type="button"
              onClick={() => setCategoriaAbierta(isOpen ? null : cat.nombre)}
              className="w-full px-[22px] py-3 flex items-center justify-between hover:bg-muted/20 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[15px] leading-none"
                  style={{ backgroundColor: `${cat.color}22` }}
                >
                  {cat.icono || ''}
                </div>
                <div className="text-left">
                  <p className="text-[14px] font-medium text-foreground">{cat.nombre}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {cat.cantidad} gasto{cat.cantidad !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-semibold text-foreground">
                  ${Math.round(cat.total).toLocaleString('es-AR')}
                </span>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </button>

            {isOpen && (
              <div className="bg-muted/10">
                {cat.gastos.map(({ gasto, cuotasPagadas, cuotasTotal }) => {
                  const simbolo = gasto.moneda === 'USD' ? 'U$S' : '$'
                  const montoCuota = gasto.cuotas > 1 ? gasto.monto_total / gasto.cuotas : 0
                  const pct = cuotasTotal > 0 ? (cuotasPagadas / cuotasTotal) * 100 : 0

                  return (
                    <Link key={gasto.id} href={`/gastos/${gasto.id}`}>
                      <div className="flex items-center justify-between px-[22px] pl-[58px] py-[10px] hover:bg-muted/20 transition-colors">
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-medium text-foreground truncate">
                            {gasto.descripcion}
                          </p>
                          {gasto.cuotas > 1 && (
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex-1 max-w-[100px] h-[3px] rounded-full overflow-hidden bg-muted">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${pct}%`,
                                    backgroundColor: cat.color,
                                  }}
                                />
                              </div>
                              <span className="text-[11px] text-muted-foreground">
                                {cuotasPagadas}/{cuotasTotal}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0 ml-3">
                          <p className="text-[13px] font-semibold text-foreground">
                            {simbolo} {Math.round(gasto.monto_total).toLocaleString('es-AR')}
                          </p>
                          {gasto.cuotas > 1 && montoCuota > 0 && (
                            <p className="text-[11px] text-muted-foreground">
                              {simbolo} {Math.round(montoCuota).toLocaleString('es-AR')}/mes
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {gastosUsuario.length === 0 && (
        <div className="border-t border-border px-[22px] py-8 text-center">
          <p className="text-[13px] text-muted-foreground">Sin gastos activos</p>
        </div>
      )}
    </div>
  )
}

export function GastosPorPersona({
  gastos,
  pagos,
  categorias,
  usuarioEmail,
  otroUsuarioEmail,
  otroUsuarioNombre,
  usuarioNombre,
}: Props) {
  return (
    <div className="py-6 space-y-4">
      <div className="flex items-baseline justify-between">
        <h1 className="font-display italic text-[34px] leading-none text-foreground">Por persona</h1>
      </div>

      <div className="space-y-4">
        <PersonaCard
          nombre={usuarioNombre}
          email={usuarioEmail}
          gastos={gastos}
          pagos={pagos}
          categorias={categorias}
        />
        <PersonaCard
          nombre={otroUsuarioNombre}
          email={otroUsuarioEmail}
          gastos={gastos}
          pagos={pagos}
          categorias={categorias}
        />
      </div>
    </div>
  )
}
