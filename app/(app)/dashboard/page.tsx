import { auth } from '@/lib/auth'
import { getGastos, getPagos, getCategorias, getCierres, getTarjetas } from '@/lib/google-sheets'
import { calcularSaldo, calcularSaldoMensual } from '@/lib/saldo'
import { SaldoCard } from '@/components/dashboard/saldo-card'
import { SaldoMesCard } from '@/components/dashboard/saldo-mes-card'
import { ProximosVencimientos } from '@/components/dashboard/proximos-vencimientos'
import { ResumenMes } from '@/components/dashboard/resumen-mes'
import { GastosActivos } from '@/components/dashboard/gastos-activos'
import { CierreMes } from '@/components/dashboard/cierre-mes'
import { MonthNavigator } from '@/components/dashboard/month-navigator'
import { CuotasMes } from '@/components/dashboard/cuotas-mes'
import { DashboardTabs } from '@/components/dashboard/dashboard-tabs'
import { getUsers } from '@/lib/users'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export const revalidate = 60

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>
}) {
  const session = await auth()
  const usuarioEmail = session?.user?.email || ''
  const { mes: mesParam } = await searchParams

  const hoy = new Date()
  const mesSeleccionado = mesParam || format(hoy, 'yyyy-MM')
  const [anioSel, mesSel] = mesSeleccionado.split('-').map(Number)
  const fechaMes = new Date(anioSel, mesSel - 1, 1)
  const mesLabel = format(fechaMes, 'MMMM yyyy', { locale: es })

  const [gastos, pagos, categorias, cierres, tarjetas] = await Promise.all([
    getGastos(),
    getPagos(),
    getCategorias(),
    getCierres(),
    getTarjetas(),
  ])

  const [u1, u2] = getUsers()

  // ── Saldos totales ─────────────────────────────────────────────────────
  const saldoARS = calcularSaldo(pagos, gastos, 'ARS')
  const saldoUSD = calcularSaldo(pagos, gastos, 'USD')

  // ── Saldos mensuales ──────────────────────────────────────────────────
  const saldoMesARS = calcularSaldoMensual(pagos, gastos, 'ARS', mesSeleccionado)
  const saldoMesUSD = calcularSaldoMensual(pagos, gastos, 'USD', mesSeleccionado)

  // ── Pagos del mes seleccionado (por fecha_vencimiento) ────────────────
  const pagosMesVenc = pagos.filter(p => {
    const fecha = new Date(p.fecha_vencimiento)
    return fecha.getFullYear() === anioSel && fecha.getMonth() + 1 === mesSel
  }).filter(p => {
    const gasto = gastos.find(g => g.id === p.gasto_id)
    return gasto && gasto.estado === 'activo'
  })

  // ── Próximos vencimientos (30 días) ──────────────────────────────────
  const en30dias = new Date(hoy.getTime() + 30 * 24 * 60 * 60 * 1000)
  const proximos = pagos
    .filter(p => {
      if (p.estado !== 'pendiente') return false
      const fecha = new Date(p.fecha_vencimiento)
      return fecha >= hoy && fecha <= en30dias
    })
    .map(p => {
      const gasto = gastos.find(g => g.id === p.gasto_id)
      if (!gasto || gasto.estado === 'cancelado') return null
      const msRestantes = new Date(p.fecha_vencimiento).getTime() - hoy.getTime()
      const dias = Math.ceil(msRestantes / (1000 * 60 * 60 * 24))
      return { pago: p, gasto, dias_restantes: dias }
    })
    .filter(Boolean)
    .sort((a, b) => a!.dias_restantes - b!.dias_restantes) as any[]

  // ── Resumen del mes (pagos realizados en el mes) ──────────────────────
  const inicioMes = new Date(anioSel, mesSel - 1, 1)
  const finMes = new Date(anioSel, mesSel, 0)

  const pagosMes = pagos.filter(p => {
    if (!p.fecha_pago) return false
    const f = new Date(p.fecha_pago)
    return f >= inicioMes && f <= finMes
  })

  const pagosMesARS = pagosMes.filter(p => {
    const g = gastos.find(g => g.id === p.gasto_id)
    return (g?.moneda || 'ARS') === 'ARS'
  })
  const totalMesARS = pagosMesARS.reduce((s, p) => s + p.monto, 0)
  const u1PagoMesARS = pagosMesARS.filter(p => p.pagado_por === u1.email).reduce((s, p) => s + p.monto, 0)
  const u2PagoMesARS = pagosMesARS.filter(p => p.pagado_por === u2.email).reduce((s, p) => s + p.monto, 0)

  const pagosMesUSD = pagosMes.filter(p => {
    const g = gastos.find(g => g.id === p.gasto_id)
    return g?.moneda === 'USD'
  })
  const totalMesUSD = pagosMesUSD.reduce((s, p) => s + p.monto, 0)
  const u1PagoMesUSD = pagosMesUSD.filter(p => p.pagado_por === u1.email).reduce((s, p) => s + p.monto, 0)
  const u2PagoMesUSD = pagosMesUSD.filter(p => p.pagado_por === u2.email).reduce((s, p) => s + p.monto, 0)

  const porCategoria = categorias.map(cat => {
    const total = pagosMesARS
      .filter(p => {
        const g = gastos.find(g => g.id === p.gasto_id)
        return g?.categoria === cat.nombre
      })
      .reduce((s, p) => s + p.monto, 0)
    return { categoria: cat.nombre, total, color: cat.color }
  }).filter(c => c.total > 0)

  const gastosActivos = gastos.filter(g => g.estado === 'activo')
  const mesActual = format(hoy, 'yyyy-MM')

  return (
    <div className="py-6 space-y-4">
      <MonthNavigator mes={mesSeleccionado} />

      <DashboardTabs
        mesContent={
          <>
            <SaldoMesCard
              saldoARS={saldoMesARS}
              saldoUSD={saldoMesUSD}
              usuarioEmail={usuarioEmail}
              mesLabel={mesLabel}
            />

            <CuotasMes
              pagos={pagosMesVenc}
              gastos={gastos}
              tarjetas={tarjetas}
            />

            <ResumenMes
              total={totalMesARS}
              porCategoria={porCategoria}
              user1={{ ...u1, pagado: u1PagoMesARS }}
              user2={{ ...u2, pagado: u2PagoMesARS }}
              totalUSD={totalMesUSD}
              user1USD={{ pagado: u1PagoMesUSD }}
              user2USD={{ pagado: u2PagoMesUSD }}
            />
          </>
        }
        totalContent={
          <>
            <SaldoCard
              saldoARS={saldoARS}
              saldoUSD={saldoUSD}
              usuarioEmail={usuarioEmail}
            />

            <ProximosVencimientos proximos={proximos} />

            <CierreMes
              cierres={cierres}
              saldoARS={saldoARS}
              saldoUSD={saldoUSD}
              mesActual={mesActual}
            />

            <GastosActivos gastos={gastosActivos} pagos={pagos} categorias={categorias} />
          </>
        }
      />
    </div>
  )
}
