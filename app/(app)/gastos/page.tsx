import { getGastos, getPagos, getCategorias } from '@/lib/google-sheets'
import { GastosDataTable } from '@/components/dashboard/gastos-data-table'
import { ChartCategorias, CategoriaPoint } from '@/components/dashboard/chart-categorias'
import { getUsers } from '@/lib/users'
import { format } from 'date-fns'

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
  const gastos = todosGastos.filter((g) => g.tipo_division !== 'personal')

  // ── Pie: gastos del mes por categoría (ARS, por fecha_vencimiento) ──────
  const [anioAct, mesAct] = format(new Date(), 'yyyy-MM').split('-').map(Number)
  const porCategoria = new Map<string, number>()
  for (const p of pagos) {
    const [y, m] = p.fecha_vencimiento.split('-').map(Number)
    if (y !== anioAct || m !== mesAct) continue
    const g = gastos.find((g) => g.id === p.gasto_id)
    if (!g || g.estado !== 'activo' || (g.moneda || 'ARS') !== 'ARS') continue
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
      />
    </div>
  )
}
