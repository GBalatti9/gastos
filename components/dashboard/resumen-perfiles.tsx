import { Gasto, Pago } from '@/lib/types'
import Link from 'next/link'

interface Props {
  gastos: Gasto[]
  pagos: Pago[]
  user1: { email: string; nombre: string }
  user2: { email: string; nombre: string }
  mesSeleccionado: string
}

export function ResumenPerfiles({ gastos, pagos, user1, user2, mesSeleccionado }: Props) {
  const [anioSel, mesSel] = mesSeleccionado.split('-').map(Number)

  // Pagos del mes seleccionado (por fecha_vencimiento) de gastos activos
  const pagosMes = pagos.filter(p => {
    const [y, m] = p.fecha_vencimiento.split('-').map(Number)
    if (y !== anioSel || m !== mesSel) return false
    const gasto = gastos.find(g => g.id === p.gasto_id)
    return gasto && gasto.estado === 'activo'
  })

  function buildPerfil(email: string) {
    // Gastos donde esta persona es el pagador
    const gastosDelUsuario = gastos.filter(
      g => g.pagado_por === email && g.estado === 'activo'
    )
    // Pagos del mes que corresponden a gastos de esta persona
    const pagosDelMes = pagosMes.filter(p => {
      const g = gastos.find(g => g.id === p.gasto_id)
      return g?.pagado_por === email
    })

    const totalARS = pagosDelMes
      .filter(p => {
        const g = gastos.find(g => g.id === p.gasto_id)
        return (g?.moneda || 'ARS') === 'ARS'
      })
      .reduce((s, p) => s + p.monto, 0)

    const totalUSD = pagosDelMes
      .filter(p => {
        const g = gastos.find(g => g.id === p.gasto_id)
        return g?.moneda === 'USD'
      })
      .reduce((s, p) => s + p.monto, 0)

    // Detalle por gasto (agrupar pagos del mes por gasto)
    const gastoIds = [...new Set(pagosDelMes.map(p => p.gasto_id))]
    const detalle = gastoIds.map(gid => {
      const gasto = gastos.find(g => g.id === gid)!
      const pagosGastoMes = pagosDelMes.filter(p => p.gasto_id === gid)
      const montoMes = pagosGastoMes.reduce((s, p) => s + p.monto, 0)
      // Progreso total del gasto (todas las cuotas, no solo las del mes)
      const todosPagos = pagos.filter(p => p.gasto_id === gid)
      const cuotasPagadas = todosPagos.filter(p => p.estado === 'pagado').length
      const cuotasTotal = todosPagos.length || gasto.cuotas
      return { gasto, montoMes, cuotasPagadas, cuotasTotal }
    }).sort((a, b) => b.montoMes - a.montoMes)

    return { totalARS, totalUSD, detalle }
  }

  const perfil1 = buildPerfil(user1.email)
  const perfil2 = buildPerfil(user2.email)

  const perfiles = [
    { user: user1, ...perfil1 },
    { user: user2, ...perfil2 },
  ]

  const hayDatos = perfil1.detalle.length > 0 || perfil2.detalle.length > 0

  if (!hayDatos) return null

  return (
    <div
      className="rounded-[20px] bg-card border border-border overflow-hidden"
      style={{ boxShadow: '0 1px 2px rgba(42,31,23,0.04)' }}
    >
      <div className="px-[22px] pt-5 pb-3">
        <p className="text-[11px] font-semibold uppercase tracking-[1.4px] text-muted-foreground">
          Gastos por perfil
        </p>
      </div>

      {perfiles.map(({ user, totalARS, totalUSD, detalle }) => (
        <div key={user.email} className="border-t border-border">
          {/* Profile header */}
          <div className="px-[22px] py-3 flex items-center justify-between bg-muted/30">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold text-background"
                style={{ backgroundColor: '#2E86C1' }}
              >
                {user.nombre.charAt(0).toUpperCase()}
              </div>
              <p className="text-[14px] font-semibold text-foreground">{user.nombre}</p>
            </div>
            <div className="text-right">
              {totalARS > 0 && (
                <p className="text-[14px] font-semibold text-foreground">
                  ${Math.round(totalARS).toLocaleString('es-AR')}
                </p>
              )}
              {totalUSD > 0 && (
                <p className="text-[12px] text-muted-foreground">
                  U$S {Math.round(totalUSD).toLocaleString('es-AR')}
                </p>
              )}
              {totalARS === 0 && totalUSD === 0 && (
                <p className="text-[12px] text-muted-foreground">Sin gastos</p>
              )}
            </div>
          </div>

          {/* Expense detail */}
          {detalle.length > 0 && (
            <div>
              {detalle.map(({ gasto, montoMes, cuotasPagadas, cuotasTotal }) => {
                const simbolo = gasto.moneda === 'USD' ? 'U$S ' : '$'
                return (
                  <Link key={gasto.id} href={`/gastos/${gasto.id}`}>
                    <div className="flex items-center justify-between px-[22px] py-[10px] hover:bg-muted/20 transition-colors">
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-foreground truncate">
                          {gasto.descripcion}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {gasto.categoria}
                          {cuotasTotal > 1 && (
                            <span>
                              {' · '}cuota {Math.min(cuotasPagadas, cuotasTotal)}/{cuotasTotal}
                            </span>
                          )}
                        </p>
                      </div>
                      <span className="text-[13px] font-semibold text-foreground flex-shrink-0 ml-3">
                        {simbolo}{Math.round(montoMes).toLocaleString('es-AR')}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
