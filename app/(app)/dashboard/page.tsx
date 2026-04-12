import { auth } from '@/lib/auth'
import { getGastos, getPagos, getCategorias, getCierres } from '@/lib/google-sheets'
import { calcularSaldo } from '@/lib/saldo'
import { SaldoCard } from '@/components/dashboard/saldo-card'
import { ProximosVencimientos } from '@/components/dashboard/proximos-vencimientos'
import { ResumenMes } from '@/components/dashboard/resumen-mes'
import { GastosActivos } from '@/components/dashboard/gastos-activos'
import { CierreMes } from '@/components/dashboard/cierre-mes'
import { getUsers } from '@/lib/users'
import { format } from 'date-fns'

export const revalidate = 60

export default async function DashboardPage() {
  const session = await auth()
  const usuarioEmail = session?.user?.email || ''

  const [gastos, pagos, categorias, cierres] = await Promise.all([
    getGastos(),
    getPagos(),
    getCategorias(),
    getCierres(),
  ])

  const saldoARS = calcularSaldo(pagos, gastos, 'ARS')
  const saldoUSD = calcularSaldo(pagos, gastos, 'USD')
  const [u1, u2] = getUsers()

  const hoy = new Date()
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

  // Resumen del mes actual
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)

  const pagosMes = pagos.filter(p => {
    if (!p.fecha_pago) return false
    const f = new Date(p.fecha_pago)
    return f >= inicioMes && f <= finMes
  })

  // ARS
  const pagosMesARS = pagosMes.filter(p => {
    const g = gastos.find(g => g.id === p.gasto_id)
    return (g?.moneda || 'ARS') === 'ARS'
  })
  const totalMesARS = pagosMesARS.reduce((s, p) => s + p.monto, 0)
  const u1PagoMesARS = pagosMesARS.filter(p => p.pagado_por === u1.email).reduce((s, p) => s + p.monto, 0)
  const u2PagoMesARS = pagosMesARS.filter(p => p.pagado_por === u2.email).reduce((s, p) => s + p.monto, 0)

  // USD
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
      <SaldoCard
        saldoARS={saldoARS}
        saldoUSD={saldoUSD}
        usuarioEmail={usuarioEmail}
      />

      <ProximosVencimientos proximos={proximos} />

      <ResumenMes
        total={totalMesARS}
        porCategoria={porCategoria}
        user1={{ ...u1, pagado: u1PagoMesARS }}
        user2={{ ...u2, pagado: u2PagoMesARS }}
        totalUSD={totalMesUSD}
        user1USD={{ pagado: u1PagoMesUSD }}
        user2USD={{ pagado: u2PagoMesUSD }}
      />

      <CierreMes
        cierres={cierres}
        saldoARS={saldoARS}
        saldoUSD={saldoUSD}
        mesActual={mesActual}
      />

      <GastosActivos gastos={gastosActivos} pagos={pagos} categorias={categorias} />
    </div>
  )
}
