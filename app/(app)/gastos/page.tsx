import { getGastos, getPagos, getCategorias } from '@/lib/google-sheets'
import { GastosDataTable } from '@/components/dashboard/gastos-data-table'
import { ChartCategorias, CategoriaPoint } from '@/components/dashboard/chart-categorias'
import { getUsers } from '@/lib/users'
import { cuentaComoGasto, esCompartido, esLiquidacion } from '@/lib/gastos-utils'
import { mesActualAR } from '@/lib/dates'

export const revalidate = 60

export default async function GastosPage() {
  const [u1, u2] = getUsers()

  const [todosGastos, pagos, categorias] = await Promise.all([
    getGastos(),
    getPagos(),
    getCategorias(),
  ])

  // Los gastos personales viven en /personal, acá solo se ven los compartidos.
  // Se incluyen cancelados: el filtro de estado de la tabla los oculta por default.
  const gastos = todosGastos.filter(esCompartido)

  // ── Pie: gastos del mes por categoría (ARS, por fecha_vencimiento, sin liquidaciones)
  const mesActual = mesActualAR()
  const gastosMetrica = new Map(
    gastos.filter((g) => cuentaComoGasto(g, 'ARS')).map((g) => [g.id, g])
  )
  const porCategoria = new Map<string, number>()
  for (const p of pagos) {
    if (p.fecha_vencimiento.slice(0, 7) !== mesActual) continue
    const g = gastosMetrica.get(p.gasto_id)
    if (!g) continue
    const cat = g.categoria || 'Sin categoría'
    porCategoria.set(cat, (porCategoria.get(cat) || 0) + p.monto)
  }
  const pieData: CategoriaPoint[] = Array.from(porCategoria, ([categoria, total]) => ({
    categoria,
    total,
  }))

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <ChartCategorias data={pieData} />

      <GastosDataTable
        gastos={gastos}
        pagos={pagos}
        categorias={categorias}
        usuarios={[
          { email: u1.email, nombre: u1.nombre },
          { email: u2.email, nombre: u2.nombre },
        ]}
        conFiltros
        liquidaciones={gastos.filter(esLiquidacion).map((g) => g.id)}
      />
    </div>
  )
}
