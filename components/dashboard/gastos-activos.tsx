import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Gasto, Pago, Categoria } from '@/lib/types'
import { CreditCard } from 'lucide-react'
import Link from 'next/link'

interface Props {
  gastos: Gasto[]
  pagos: Pago[]
  categorias: Categoria[]
}

export function GastosActivos({ gastos, pagos, categorias }: Props) {
  if (gastos.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-indigo-600" />
            Gastos activos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No hay gastos activos. ¡Agregá uno!</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-indigo-600" />
          Gastos activos
          <Badge variant="secondary" className="ml-auto">{gastos.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {gastos.map(gasto => {
          const gastoPagos = pagos.filter(p => p.gasto_id === gasto.id)
          const pagados = gastoPagos.filter(p => p.estado === 'pagado').length
          const total = gastoPagos.length || gasto.cuotas
          const progreso = total > 0 ? (pagados / total) * 100 : 0
          const cat = categorias.find(c => c.nombre === gasto.categoria)

          return (
            <Link key={gasto.id} href={`/gastos/${gasto.id}`}>
              <div className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{cat?.icono || '📦'}</span>
                      <p className="text-sm font-medium truncate">{gasto.descripcion}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{gasto.categoria}</p>
                  </div>
                  <div className="text-right ml-3">
                    <p className="text-sm font-semibold">${gasto.monto_total.toLocaleString('es-AR')}</p>
                    <p className="text-xs text-muted-foreground">{pagados}/{total} cuotas</p>
                  </div>
                </div>
                {gasto.cuotas > 1 && (
                  <Progress value={progreso} className="h-1.5" />
                )}
              </div>
            </Link>
          )
        })}
      </CardContent>
    </Card>
  )
}
