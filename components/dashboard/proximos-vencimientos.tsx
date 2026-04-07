import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ProximoVencimiento } from '@/lib/types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar } from 'lucide-react'
import Link from 'next/link'

interface Props {
  proximos: ProximoVencimiento[]
}

export function ProximosVencimientos({ proximos }: Props) {
  if (proximos.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-indigo-600" />
            Próximos vencimientos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Sin vencimientos en los próximos 30 días 🎉</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="h-4 w-4 text-indigo-600" />
          Próximos vencimientos
          <Badge variant="secondary" className="ml-auto">{proximos.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {proximos.map((v) => (
          <Link key={v.pago.id} href={`/gastos/${v.gasto.id}`}>
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{v.gasto.descripcion}</p>
                <p className="text-xs text-muted-foreground">
                  Cuota {v.pago.numero_cuota}/{v.gasto.cuotas} •{' '}
                  {format(new Date(v.pago.fecha_vencimiento), "d MMM", { locale: es })}
                </p>
              </div>
              <div className="text-right ml-3">
                <p className="text-sm font-semibold">${v.pago.monto.toLocaleString('es-AR')}</p>
                <Badge
                  variant={v.dias_restantes <= 3 ? 'destructive' : v.dias_restantes <= 7 ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {v.dias_restantes === 0 ? 'Hoy' : v.dias_restantes === 1 ? 'Mañana' : `${v.dias_restantes}d`}
                </Badge>
              </div>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}
