import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { TrendingUp } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Props {
  total: number
  porCategoria: { categoria: string; total: number; color: string }[]
  user1: { nombre: string; pagado: number }
  user2: { nombre: string; pagado: number }
}

export function ResumenMes({ total, porCategoria, user1, user2 }: Props) {
  const mesActual = format(new Date(), 'MMMM yyyy', { locale: es })

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-indigo-600" />
          {mesActual.charAt(0).toUpperCase() + mesActual.slice(1)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <p className="text-3xl font-bold">${total.toLocaleString('es-AR')}</p>
          <p className="text-sm text-muted-foreground">total pagado este mes</p>
        </div>

        {total > 0 && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-indigo-50 rounded-lg">
                <p className="text-xs text-muted-foreground">{user1.nombre}</p>
                <p className="font-semibold text-indigo-700">${user1.pagado.toLocaleString('es-AR')}</p>
                <p className="text-xs text-muted-foreground">
                  {total > 0 ? Math.round((user1.pagado / total) * 100) : 0}%
                </p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-xs text-muted-foreground">{user2.nombre}</p>
                <p className="font-semibold text-purple-700">${user2.pagado.toLocaleString('es-AR')}</p>
                <p className="text-xs text-muted-foreground">
                  {total > 0 ? Math.round((user2.pagado / total) * 100) : 0}%
                </p>
              </div>
            </div>

            {porCategoria.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Por categoría</p>
                {porCategoria
                  .sort((a, b) => b.total - a.total)
                  .slice(0, 5)
                  .map(cat => (
                    <div key={cat.categoria} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>{cat.categoria}</span>
                        <span className="font-medium">${cat.total.toLocaleString('es-AR')}</span>
                      </div>
                      <Progress
                        value={(cat.total / total) * 100}
                        className="h-1.5"
                      />
                    </div>
                  ))}
              </div>
            )}
          </>
        )}

        {total === 0 && (
          <p className="text-center text-muted-foreground text-sm">Sin pagos registrados este mes</p>
        )}
      </CardContent>
    </Card>
  )
}
