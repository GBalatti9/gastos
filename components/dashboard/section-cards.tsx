'use client'

import { useState } from 'react'
import { TrendingDown, TrendingUp, Layers, CircleCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PromedioCard, FilaMes } from '@/components/dashboard/promedio-card'
import type { Gasto, Pago } from '@/lib/types'

export interface PromedioPareja {
  pareja: number
  u1: number
  u2: number
  meses: string[]
  filas: FilaMes[]
  u1Nombre: string
  u2Nombre: string
  soyU1: boolean
}

interface Props {
  costoMes: number
  costoMesPrev: number
  comprometidoMonto: number
  comprometidoCuotas: number
  cuotasMesTotal: number
  cuotasMesPagadas: number
  pagosCostoMes: Pago[]
  pagosComprometido: Pago[]
  gastos: Gasto[]
  usuarios: Record<string, string>
  promedio: PromedioPareja
}

const ars = (n: number) => `$ ${Math.round(n).toLocaleString('es-AR')}`

type DialogKey = 'costo' | 'comprometido' | null

function PagosTable({ pagos, gastos, usuarios, showEstado }: { pagos: Pago[]; gastos: Gasto[]; usuarios: Record<string, string>; showEstado?: boolean }) {
  if (pagos.length === 0) {
    return <p className="py-4 text-center text-sm text-muted-foreground">Sin datos</p>
  }
  return (
    <div className="max-h-80 overflow-auto">
      <Table className="min-w-[480px]">
        <TableHeader>
          <TableRow>
            <TableHead>Descripción</TableHead>
            <TableHead className="text-right">Monto</TableHead>
            <TableHead>Pagado por</TableHead>
            <TableHead>Fecha</TableHead>
            {showEstado && <TableHead>Estado</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {pagos.map((p) => {
            const g = gastos.find((g) => g.id === p.gasto_id)
            const pagador = p.pagado_por || g?.pagado_por || ''
            return (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{g?.descripcion ?? '—'}</TableCell>
                <TableCell className="text-right tabular-nums">{ars(p.monto)}</TableCell>
                <TableCell>{usuarios[pagador] || pagador}</TableCell>
                <TableCell className="text-muted-foreground">
                  {p.fecha_pago || p.fecha_vencimiento}
                </TableCell>
                {showEstado && (
                  <TableCell>
                    <Badge variant={p.estado === 'pagado' ? 'default' : 'outline'}>
                      {p.estado === 'pagado' ? 'Pagado' : 'Pendiente'}
                    </Badge>
                  </TableCell>
                )}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

export function SectionCards({
  costoMes,
  costoMesPrev,
  comprometidoMonto,
  comprometidoCuotas,
  cuotasMesTotal,
  cuotasMesPagadas,
  pagosCostoMes,
  pagosComprometido,
  gastos,
  usuarios,
  promedio,
}: Props) {
  const [openDialog, setOpenDialog] = useState<DialogKey>(null)

  const costoDiff = costoMesPrev > 0
    ? ((costoMes - costoMesPrev) / costoMesPrev) * 100
    : 0
  const costoUp = costoDiff >= 0

  const miPromedio = promedio.soyU1 ? promedio.u1 : promedio.u2
  const otroPromedio = promedio.soyU1 ? promedio.u2 : promedio.u1
  const otroNombre = promedio.soyU1 ? promedio.u2Nombre : promedio.u1Nombre

  return (
    <>
      <div className="grid grid-cols-2 gap-3 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs @xl/main:gap-4 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
        {/* Costo del mes */}
        <Card className="@container/card cursor-pointer transition-colors hover:border-primary/30" onClick={() => setOpenDialog('costo')}>
          <CardHeader>
            <CardDescription>Costo del mes</CardDescription>
            <CardTitle className="text-xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {ars(costoMes)}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                {costoUp ? <TrendingUp /> : <TrendingDown />}
                {costoUp ? '+' : ''}{costoDiff.toFixed(0)}%
              </Badge>
            </CardAction>
          </CardHeader>
        </Card>

        {/* Promedio mensual */}
        <PromedioCard
          titulo="Promedio mensual"
          monto={promedio.pareja}
          meses={promedio.meses}
          columnas={['Pareja', promedio.u1Nombre, promedio.u2Nombre]}
          filas={promedio.filas}
          detalle={
            promedio.meses.length > 0 ? (
              <span className="truncate">
                vos {ars(miPromedio)} · {otroNombre} {ars(otroPromedio)}
              </span>
            ) : undefined
          }
        />

        {/* Cuotas del mes */}
        <Card className="@container/card cursor-pointer transition-colors hover:border-primary/30" onClick={() => setOpenDialog('costo')}>
          <CardHeader>
            <CardDescription>Cuotas del mes</CardDescription>
            <CardTitle className="text-xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {cuotasMesPagadas}/{cuotasMesTotal}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <CircleCheck />
                {cuotasMesTotal > 0
                  ? `${Math.round((cuotasMesPagadas / cuotasMesTotal) * 100)}%`
                  : '—'}
              </Badge>
            </CardAction>
          </CardHeader>
        </Card>

        {/* Próximas cuotas */}
        <Card className="@container/card cursor-pointer transition-colors hover:border-primary/30" onClick={() => setOpenDialog('comprometido')}>
          <CardHeader>
            <CardDescription>Próximas cuotas</CardDescription>
            <CardTitle className="text-xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {comprometidoMonto < 1 ? 'Sin cuotas' : ars(comprometidoMonto)}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <Layers />
                {comprometidoCuotas}
              </Badge>
            </CardAction>
          </CardHeader>
        </Card>
      </div>

      {/* Dialogs */}
      <Dialog open={openDialog === 'costo'} onOpenChange={(open) => !open && setOpenDialog(null)}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Costo del mes</DialogTitle>
          </DialogHeader>
          <PagosTable pagos={pagosCostoMes} gastos={gastos} usuarios={usuarios} showEstado />
        </DialogContent>
      </Dialog>

      <Dialog open={openDialog === 'comprometido'} onOpenChange={(open) => !open && setOpenDialog(null)}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Próximas cuotas</DialogTitle>
          </DialogHeader>
          <PagosTable pagos={pagosComprometido} gastos={gastos} usuarios={usuarios} />
        </DialogContent>
      </Dialog>
    </>
  )
}
