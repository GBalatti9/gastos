import { auth } from '@/lib/auth'
import { getGastos, getPagos, getCategorias } from '@/lib/google-sheets'
import { calcularSaldoAcumulado } from '@/lib/saldo'
import { resumenPorMes, promedioMensual } from '@/lib/metricas'
import { cuentaComoGasto, esCompartido, esLiquidacion } from '@/lib/gastos-utils'
import { mesActualAR, mesAnterior, primerDiaDelMes } from '@/lib/dates'
import { DeudaCard } from '@/components/dashboard/deuda-card'
import { SectionCards } from '@/components/dashboard/section-cards'
import { ChartGastos, ChartPoint } from '@/components/dashboard/chart-gastos'
import { GastosDataTable } from '@/components/dashboard/gastos-data-table'
import { getUsers } from '@/lib/users'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

// Sin `revalidate`: la página ya es dinámica por auth() y, con Node 24, el
// cache de fetch de Next rompe las llamadas a Google Sheets ("ArrayBuffer is
// not detachable"). Los datos se leen frescos en cada request.
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await auth()
  const usuarioEmail = session?.user?.email || ''

  const mesActual = mesActualAR()
  const mesPrev = mesAnterior(mesActual)

  const [gastos, pagos, categorias] = await Promise.all([
    getGastos(),
    getPagos(),
    getCategorias(),
  ])

  const [u1, u2] = getUsers()
  // Tabla: compartidos activos (incluye liquidaciones, con badge)
  const gastosActivos = gastos.filter((g) => g.estado === 'activo' && esCompartido(g))
  // Métricas: compartidos activos en ARS, SIN liquidaciones
  const gastosMetrica = new Map(
    gastos.filter((g) => cuentaComoGasto(g, 'ARS') && esCompartido(g)).map((g) => [g.id, g])
  )
  const pagosMetrica = pagos.filter((p) => gastosMetrica.has(p.gasto_id))

  // ── Saldos ────────────────────────────────────────────────────────────
  const saldoARS = calcularSaldoAcumulado(pagos, gastos, 'ARS', mesActual)
  const saldoUSD = calcularSaldoAcumulado(pagos, gastos, 'USD', mesActual)

  // ── Costo del mes vs mes anterior (por fecha_vencimiento, ARS) ─────────
  const pagosDelMes = (mes: string) =>
    pagosMetrica.filter((p) => p.fecha_vencimiento.slice(0, 7) === mes)

  const pagosCostoMes = pagosDelMes(mesActual)
  const costoMes = pagosCostoMes.reduce((s, p) => s + p.monto, 0)
  const costoMesPrev = pagosDelMes(mesPrev).reduce((s, p) => s + p.monto, 0)
  const cuotasMesPagadas = pagosCostoMes.filter((p) => p.estado === 'pagado').length

  // ── Comprometido: todas las cuotas pendientes (ARS) ────────────────────
  const comprometido = pagosMetrica.filter((p) => p.estado === 'pendiente')
  const comprometidoMonto = comprometido.reduce((s, p) => s + p.monto, 0)

  // ── Promedio mensual (meses completos) ────────────────────────────────
  const resumen = resumenPorMes(pagos, gastos, 'ARS')
  const promedio = promedioMensual(resumen, { ultimos: 6 })
  const resumenPromedio = resumen.filter((r) => promedio.meses.includes(r.mes))

  // ── Serie mensual para el chart (últimos 12 meses, ARS) ────────────────
  const [anioAct, mesAct] = mesActual.split('-').map(Number)
  const chartData: ChartPoint[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(anioAct, mesAct - 1 - i, 1)
    const mes = format(d, 'yyyy-MM')
    let uno = 0
    let dos = 0
    const detalle: ChartPoint['pagos'] = []
    for (const p of pagosMetrica) {
      if (p.fecha_vencimiento.slice(0, 7) !== mes) continue
      const g = gastosMetrica.get(p.gasto_id)!
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
      mesLabel: format(primerDiaDelMes(mes), 'MMMM yyyy', { locale: es }),
      u1: uno,
      u2: dos,
      pagos: detalle,
    })
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <DeudaCard saldoARS={saldoARS} saldoUSD={saldoUSD} usuarioEmail={usuarioEmail} />

      <SectionCards
        costoMes={costoMes}
        costoMesPrev={costoMesPrev}
        comprometidoMonto={comprometidoMonto}
        comprometidoCuotas={comprometido.length}
        cuotasMesTotal={pagosCostoMes.length}
        cuotasMesPagadas={cuotasMesPagadas}
        pagosCostoMes={pagosCostoMes}
        pagosComprometido={comprometido}
        gastos={gastosActivos}
        usuarios={{ [u1.email]: u1.nombre, [u2.email]: u2.nombre }}
        promedio={{
          pareja: promedio.pareja,
          u1: promedio.casaU1,
          u2: promedio.casaU2,
          meses: promedio.meses,
          filas: resumenPromedio.map((r) => ({
            mes: r.mes,
            valores: [r.pareja, r.casaU1, r.casaU2],
          })),
          u1Nombre: u1.nombre,
          u2Nombre: u2.nombre,
          soyU1: usuarioEmail === u1.email,
        }}
      />

      <ChartGastos
        data={chartData}
        u1Nombre={u1.nombre}
        u2Nombre={u2.nombre}
        promedio={promedio.meses.length > 0 ? promedio.pareja : undefined}
      />

      <GastosDataTable
        gastos={gastosActivos}
        pagos={pagos}
        categorias={categorias}
        usuarios={[
          { email: u1.email, nombre: u1.nombre },
          { email: u2.email, nombre: u2.nombre },
        ]}
        liquidaciones={gastosActivos.filter(esLiquidacion).map((g) => g.id)}
      />
    </div>
  )
}
