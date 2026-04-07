import { auth } from '@/lib/auth'
import { getGastos, getPagos, getCategorias } from '@/lib/google-sheets'
import { calcularSaldo } from '@/lib/saldo'
import { SaldoCard } from '@/components/dashboard/saldo-card'
import { ProximosVencimientos } from '@/components/dashboard/proximos-vencimientos'
import { ResumenMes } from '@/components/dashboard/resumen-mes'
import { GastosActivos } from '@/components/dashboard/gastos-activos'
import { getUserByEmail, getUsers } from '@/lib/users'

export const revalidate = 60

export default async function DashboardPage() {
  const session = await auth()
  const [gastos, pagos, categorias] = await Promise.all([
    getGastos(),
    getPagos(),
    getCategorias(),
  ])

  const saldo = calcularSaldo(pagos)
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

  const totalMes = pagosMes.reduce((s, p) => s + p.monto, 0)
  const u1PagoMes = pagosMes.filter(p => p.pagado_por === u1.email).reduce((s, p) => s + p.monto, 0)
  const u2PagoMes = pagosMes.filter(p => p.pagado_por === u2.email).reduce((s, p) => s + p.monto, 0)

  const porCategoria = categorias.map(cat => {
    const total = pagosMes
      .filter(p => {
        const g = gastos.find(g => g.id === p.gasto_id)
        return g?.categoria === cat.nombre
      })
      .reduce((s, p) => s + p.monto, 0)
    return { categoria: cat.nombre, total, color: cat.color }
  }).filter(c => c.total > 0)

  const gastosActivos = gastos.filter(g => g.estado === 'activo')

  return (
    <div className="py-6 space-y-6">
      <SaldoCard saldo={saldo} />
      <ProximosVencimientos proximos={proximos} />
      <ResumenMes
        total={totalMes}
        porCategoria={porCategoria}
        user1={{ ...u1, pagado: u1PagoMes }}
        user2={{ ...u2, pagado: u2PagoMes }}
      />
      <GastosActivos gastos={gastosActivos} pagos={pagos} categorias={categorias} />
    </div>
  )
}
