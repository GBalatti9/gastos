import { auth } from '@/lib/auth'
import { getGastos, getPagos, getCategorias } from '@/lib/google-sheets'
import { FinanzasCards, PagoDetalle } from '@/components/personal/finanzas-cards'
import { ChartCategorias, CategoriaPoint } from '@/components/dashboard/chart-categorias'
import { GastosDataTable } from '@/components/dashboard/gastos-data-table'
import { getUsers, getUserByEmail } from '@/lib/users'
import { calcularResponsabilidad } from '@/lib/saldo'
import { format } from 'date-fns'
import { Pago } from '@/lib/types'

export const revalidate = 60

export default async function PersonalPage() {
  const session = await auth()
  const email = session?.user?.email || ''
  const usuario = getUserByEmail(email)
  const [u1, u2] = getUsers()
  const esU1 = email === u1.email

  const hoy = new Date()
  const mesActual = format(hoy, 'yyyy-MM')
  const [anioAct, mesAct] = mesActual.split('-').map(Number)

  const [gastos, todosPagos, categorias] = await Promise.all([
    getGastos(),
    getPagos(),
    getCategorias(),
  ])

  // Todos los compartidos + solo MIS gastos personales
  const misGastos = gastos.filter(
    (g) =>
      g.estado === 'activo' &&
      (g.tipo_division !== 'personal' || g.pagado_por === email)
  )
  const idsMisGastos = new Set(misGastos.map((g) => g.id))
  const pagos = todosPagos.filter((p) => idsMisGastos.has(p.gasto_id))
  const gastoDe = (p: Pago) => misGastos.find((g) => g.id === p.gasto_id)!
  const esARS = (p: Pago) => (gastoDe(p).moneda || 'ARS') === 'ARS'

  // Mi responsabilidad sobre un pago (personal = 100%, compartido = mi parte)
  const miParte = (p: Pago) => {
    const r = calcularResponsabilidad(gastoDe(p), p.monto)
    return esU1 ? r.u1 : r.u2
  }
  const detalle = (ps: Pago[]): PagoDetalle[] =>
    ps.map((p) => ({ pago: p, gasto: gastoDe(p), miParte: miParte(p) }))

  // ── Costo real: mi parte de pagos con vencimiento este mes (ARS) ────────
  const pagosVencMes = pagos.filter((p) => {
    const [y, m] = p.fecha_vencimiento.split('-').map(Number)
    return y === anioAct && m === mesAct && esARS(p)
  })
  const costoReal = pagosVencMes.reduce((s, p) => s + miParte(p), 0)
  const costoPersonal = pagosVencMes
    .filter((p) => gastoDe(p).tipo_division === 'personal')
    .reduce((s, p) => s + miParte(p), 0)
  const costoCasa = costoReal - costoPersonal

  // ── Cash flow: lo que pagué yo, por fecha_pago (ARS) ────────────────────
  const pagosCashEnMes = (anio: number, mes: number) =>
    pagos.filter((p) => {
      if (!p.fecha_pago) return false
      const pagador = p.pagado_por || gastoDe(p).pagado_por
      if (pagador !== email) return false
      const [y, m] = p.fecha_pago.split('-').map(Number)
      return y === anio && m === mes && esARS(p)
    })

  const pagosCash = pagosCashEnMes(anioAct, mesAct)
  const cashFlow = pagosCash.reduce((s, p) => s + p.monto, 0)
  const prevMes = mesAct === 1 ? 12 : mesAct - 1
  const prevAnio = mesAct === 1 ? anioAct - 1 : anioAct
  const cashFlowPrev = pagosCashEnMes(prevAnio, prevMes).reduce((s, p) => s + p.monto, 0)

  // ── Comprometido: mi parte de todas las cuotas pendientes (ARS) ─────────
  const pendientes = pagos.filter((p) => p.estado === 'pendiente' && esARS(p))
  const comprometidoMonto = pendientes.reduce((s, p) => s + miParte(p), 0)

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
  const miPartes: Record<string, number> = {}
  for (const g of misGastos) {
    const r = calcularResponsabilidad(g, g.monto_total)
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
      />

      <GastosDataTable
        gastos={misGastos}
        pagos={pagos}
        categorias={categorias}
        usuarios={[u1, u2].map((u) => ({ email: u.email, nombre: u.nombre }))}
        mostrarTipo
        miPartes={miPartes}
      />
    </div>
  )
}
