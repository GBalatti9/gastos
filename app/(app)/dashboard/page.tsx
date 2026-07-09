import { auth } from '@/lib/auth'
import { getGastos, getPagos, getCategorias } from '@/lib/google-sheets'
import { calcularSaldoAcumulado } from '@/lib/saldo'
import { DeudaCard } from '@/components/dashboard/deuda-card'
import { SectionCards } from '@/components/dashboard/section-cards'
import { ChartGastos, ChartPoint } from '@/components/dashboard/chart-gastos'
import { GastosDataTable } from '@/components/dashboard/gastos-data-table'
import { getUsers } from '@/lib/users'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export const revalidate = 60

export default async function DashboardPage() {
  const session = await auth()
  const usuarioEmail = session?.user?.email || ''

  const hoy = new Date()
  const mesActual = format(hoy, 'yyyy-MM')
  const [anioAct, mesAct] = mesActual.split('-').map(Number)

  const [gastos, pagos, categorias] = await Promise.all([
    getGastos(),
    getPagos(),
    getCategorias(),
  ])

  const [u1, u2] = getUsers()
  const gastosActivos = gastos.filter(
    (g) => g.estado === 'activo' && g.tipo_division !== 'personal'
  )
  const esActivoARS = (gastoId: string) => {
    const g = gastos.find((g) => g.id === gastoId)
    return (
      g &&
      g.estado === 'activo' &&
      (g.moneda || 'ARS') === 'ARS' &&
      g.tipo_division !== 'personal'
    )
  }

  // ── Saldos ────────────────────────────────────────────────────────────
  const saldoARS = calcularSaldoAcumulado(pagos, gastos, 'ARS', mesActual)
  const saldoUSD = calcularSaldoAcumulado(pagos, gastos, 'USD', mesActual)

  // ── Gastado este mes vs mes anterior (por fecha_pago, ARS) ─────────────
  const pagosEnMes = (anio: number, mes: number) =>
    pagos.filter((p) => {
      if (!p.fecha_pago) return false
      const [y, m] = p.fecha_pago.split('-').map(Number)
      return y === anio && m === mes && esActivoARS(p.gasto_id)
    })

  const pagosGastadoMes = pagosEnMes(anioAct, mesAct)
  const gastadoMes = pagosGastadoMes.reduce((s, p) => s + p.monto, 0)
  const prevMes = mesAct === 1 ? 12 : mesAct - 1
  const prevAnio = mesAct === 1 ? anioAct - 1 : anioAct
  const gastadoMesPrev = pagosEnMes(prevAnio, prevMes).reduce((s, p) => s + p.monto, 0)

  // ── Comprometido: todas las cuotas pendientes (ARS) ────────────────────
  const comprometido = pagos.filter(
    (p) => p.estado === 'pendiente' && esActivoARS(p.gasto_id)
  )
  const comprometidoMonto = comprometido.reduce((s, p) => s + p.monto, 0)

  // ── Cuotas del mes actual (por fecha_vencimiento, ARS) ─────────────────
  const pagosMesVenc = pagos.filter((p) => {
    const [y, m] = p.fecha_vencimiento.split('-').map(Number)
    return y === anioAct && m === mesAct && esActivoARS(p.gasto_id)
  })
  const cuotasMesPagadas = pagosMesVenc.filter((p) => p.estado === 'pagado').length

  // ── Serie mensual para el chart (últimos 12 meses, ARS) ────────────────
  const chartData: ChartPoint[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(anioAct, mesAct - 1 - i, 1)
    const y = d.getFullYear()
    const m = d.getMonth() + 1
    let uno = 0
    let dos = 0
    const detalle: ChartPoint['pagos'] = []
    for (const p of pagos) {
      const [py, pm] = p.fecha_vencimiento.split('-').map(Number)
      if (py !== y || pm !== m || !esActivoARS(p.gasto_id)) continue
      const g = gastos.find((g) => g.id === p.gasto_id)!
      const pagador = p.pagado_por || g.pagado_por
      if (pagador === u1.email) uno += p.monto
      else if (pagador === u2.email) dos += p.monto
      detalle.push({
        id: p.id,
        descripcion: g.descripcion,
        monto: p.monto,
        pagador: pagador === u1.email ? u1.nombre : u2.nombre,
        fecha: p.fecha_vencimiento,
        estado: p.estado,
      })
    }
    detalle.sort((a, b) => b.monto - a.monto)
    chartData.push({
      month: format(d, 'MMM', { locale: es }),
      mesLabel: format(d, 'MMMM yyyy', { locale: es }),
      u1: uno,
      u2: dos,
      pagos: detalle,
    })
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <DeudaCard saldoARS={saldoARS} saldoUSD={saldoUSD} usuarioEmail={usuarioEmail} />

      <SectionCards
        gastadoMes={gastadoMes}
        gastadoMesPrev={gastadoMesPrev}
        comprometidoMonto={comprometidoMonto}
        comprometidoCuotas={comprometido.length}
        cuotasMesTotal={pagosMesVenc.length}
        cuotasMesPagadas={cuotasMesPagadas}
        pagosGastadoMes={pagosGastadoMes}
        pagosComprometido={comprometido}
        pagosCuotasMes={pagosMesVenc}
        gastos={gastosActivos}
        usuarios={{ [u1.email]: u1.nombre, [u2.email]: u2.nombre }}
      />

      <ChartGastos data={chartData} u1Nombre={u1.nombre} u2Nombre={u2.nombre} />

      <GastosDataTable
        gastos={gastosActivos}
        pagos={pagos}
        categorias={categorias}
        usuarios={[
          { email: u1.email, nombre: u1.nombre },
          { email: u2.email, nombre: u2.nombre },
        ]}
      />

    </div>
  )
}
