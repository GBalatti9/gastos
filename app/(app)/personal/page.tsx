import { auth } from '@/lib/auth'
import { getGastos, getPagos, getCategorias } from '@/lib/google-sheets'
import { FinanzasCards, PagoDetalle } from '@/components/personal/finanzas-cards'
import { ChartCategorias, CategoriaPoint } from '@/components/dashboard/chart-categorias'
import { GastosDataTable } from '@/components/dashboard/gastos-data-table'
import { getUsers, getUserByEmail } from '@/lib/users'
import { calcularResponsabilidad, responsabilidadTotal } from '@/lib/saldo'
import { resumenPorMes, promedioMensual } from '@/lib/metricas'
import { cuentaComoGasto, esLiquidacion, esPersonal } from '@/lib/gastos-utils'
import { mesActualAR, mesAnterior } from '@/lib/dates'
import { Pago } from '@/lib/types'

// Sin `revalidate`: la página ya es dinámica por auth() y, con Node 24, el
// cache de fetch de Next rompe las llamadas a Google Sheets ("ArrayBuffer is
// not detachable"). Los datos se leen frescos en cada request.
export const dynamic = 'force-dynamic'

export default async function PersonalPage() {
  const session = await auth()
  const email = session?.user?.email || ''
  const usuario = getUserByEmail(email)
  const [u1, u2] = getUsers()
  const esU1 = email === u1.email

  const mesActual = mesActualAR()
  const mesPrev = mesAnterior(mesActual)

  const [gastos, todosPagos, categorias] = await Promise.all([
    getGastos(),
    getPagos(),
    getCategorias(),
  ])

  // Tabla: todos los compartidos + solo MIS gastos personales (activos)
  const misGastos = gastos.filter(
    (g) => g.estado === 'activo' && (!esPersonal(g) || g.pagado_por === email)
  )
  const idsMisGastos = new Set(misGastos.map((g) => g.id))
  const pagos = todosPagos.filter((p) => idsMisGastos.has(p.gasto_id))

  // Métricas: lo mismo pero ARS y sin liquidaciones
  const gastosMetrica = new Map(
    misGastos.filter((g) => cuentaComoGasto(g, 'ARS')).map((g) => [g.id, g])
  )
  const pagosMetrica = pagos.filter((p) => gastosMetrica.has(p.gasto_id))
  const gastoDe = (p: Pago) => gastosMetrica.get(p.gasto_id)!

  // Mi responsabilidad sobre un pago (personal = 100%, compartido = mi parte)
  const miParte = (p: Pago) => {
    const r = calcularResponsabilidad(gastoDe(p), p.monto)
    return esU1 ? r.u1 : r.u2
  }
  const detalle = (ps: Pago[]): PagoDetalle[] =>
    ps.map((p) => ({ pago: p, gasto: gastoDe(p), miParte: miParte(p) }))

  // ── Costo real: mi parte de pagos con vencimiento este mes (ARS) ────────
  const pagosVencMes = pagosMetrica.filter((p) => p.fecha_vencimiento.slice(0, 7) === mesActual)
  const costoReal = pagosVencMes.reduce((s, p) => s + miParte(p), 0)
  const costoPersonal = pagosVencMes
    .filter((p) => esPersonal(gastoDe(p)))
    .reduce((s, p) => s + miParte(p), 0)
  const costoCasa = costoReal - costoPersonal

  // ── Cash flow: lo que pagué yo, por fecha_pago (ARS) ────────────────────
  const pagosCashEnMes = (mes: string) =>
    pagosMetrica.filter((p) => {
      if (!p.fecha_pago) return false
      const pagador = p.pagado_por || gastoDe(p).pagado_por
      return pagador === email && p.fecha_pago.slice(0, 7) === mes
    })

  const pagosCash = pagosCashEnMes(mesActual)
  const cashFlow = pagosCash.reduce((s, p) => s + p.monto, 0)
  const cashFlowPrev = pagosCashEnMes(mesPrev).reduce((s, p) => s + p.monto, 0)

  // ── Comprometido: mi parte de todas las cuotas pendientes (ARS) ─────────
  const pendientes = pagosMetrica.filter((p) => p.estado === 'pendiente')
  const comprometidoMonto = pendientes.reduce((s, p) => s + miParte(p), 0)

  // ── Promedio mensual: mi parte (casa + personal), meses completos ────────
  const resumen = resumenPorMes(todosPagos, gastos, 'ARS')
  const promedio = promedioMensual(resumen, { ultimos: 6 })
  const resumenPromedio = resumen.filter((r) => promedio.meses.includes(r.mes))
  const mio = esU1
    ? { total: promedio.u1, casa: promedio.casaU1, personal: promedio.personalU1 }
    : { total: promedio.u2, casa: promedio.casaU2, personal: promedio.personalU2 }

  // ── Pie: mi costo del mes por categoría (ARS) ───────────────────────────
  const porCategoria = new Map<string, number>()
  for (const p of pagosVencMes) {
    const cat = gastoDe(p).categoria || 'Sin categoría'
    porCategoria.set(cat, (porCategoria.get(cat) || 0) + miParte(p))
  }
  const pieData: CategoriaPoint[] = Array.from(porCategoria, ([categoria, total]) => ({
    categoria,
    total,
  }))

  // ── Mi parte del total de cada gasto (para la tabla) ────────────────────
  // Sumando cuota por cuota: con "monto fijo" el fijo es por cuota.
  const miPartes: Record<string, number> = {}
  for (const g of misGastos) {
    const r = responsabilidadTotal(g, pagos)
    miPartes[g.id] = esU1 ? r.u1 : r.u2
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <ChartCategorias
        data={pieData}
        titulo="Mi costo por categoría"
        descripcion={`Tu parte de cada categoría este mes, ${usuario?.nombre || ''}`}
      />

      <FinanzasCards
        costoReal={costoReal}
        costoPersonal={costoPersonal}
        costoCasa={costoCasa}
        cashFlow={cashFlow}
        cashFlowPrev={cashFlowPrev}
        comprometidoMonto={comprometidoMonto}
        comprometidoCuotas={pendientes.length}
        detalleCostoReal={detalle(pagosVencMes)}
        detalleCashFlow={detalle(pagosCash)}
        detalleComprometido={detalle(pendientes)}
        promedio={{
          total: mio.total,
          casa: mio.casa,
          personal: mio.personal,
          meses: promedio.meses,
          filas: resumenPromedio.map((r) => ({
            mes: r.mes,
            valores: esU1 ? [r.u1, r.casaU1, r.personalU1] : [r.u2, r.casaU2, r.personalU2],
          })),
        }}
      />

      <GastosDataTable
        gastos={misGastos}
        pagos={pagos}
        categorias={categorias}
        usuarios={[u1, u2].map((u) => ({ email: u.email, nombre: u.nombre }))}
        mostrarTipo
        miPartes={miPartes}
        liquidaciones={misGastos.filter(esLiquidacion).map((g) => g.id)}
      />
    </div>
  )
}
