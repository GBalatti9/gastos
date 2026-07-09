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
import type { Gasto, Pago } from '@/lib/types'

interface Props {
  gastadoMes: number
  gastadoMesPrev: number
  comprometidoMonto: number
  comprometidoCuotas: number
  cuotasMesTotal: number
  cuotasMesPagadas: number
  pagosGastadoMes: Pago[]
  pagosComprometido: Pago[]
  pagosCuotasMes: Pago[]
  gastos: Gasto[]
  usuarios: Record<string, string>
}

const ars = (n: number) => `$ ${Math.round(n).toLocaleString('es-AR')}`

type DialogKey = 'gastado' | 'comprometido' | 'cuotas' | null

function PagosTable({ pagos, gastos, usuarios, showEstado }: { pagos: Pago[]; gastos: Gasto[]; usuarios: Record<string, string>; showEstado?: boolean }) {
  if (pagos.length === 0) {
    return <p className="text-sm text-muted-foreground py-4 text-center">Sin datos</p>
  }
  return (
    <div className="max-h-80 overflow-y-auto">
      <Table>
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
  gastadoMes,
  gastadoMesPrev,
  comprometidoMonto,
  comprometidoCuotas,
  cuotasMesTotal,
  cuotasMesPagadas,
  pagosGastadoMes,
  pagosComprometido,
  pagosCuotasMes,
  gastos,
  usuarios,
}: Props) {
  const [openDialog, setOpenDialog] = useState<DialogKey>(null)

  const gastoDiff = gastadoMesPrev > 0
    ? ((gastadoMes - gastadoMesPrev) / gastadoMesPrev) * 100
    : 0
  const gastoUp = gastoDiff >= 0

  return (
    <>
      <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-3 dark:*:data-[slot=card]:bg-card">
        {/* Gastado este mes */}
        <Card className="@container/card cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setOpenDialog('gastado')}>
          <CardHeader>
            <CardDescription>Gastado este mes</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {ars(gastadoMes)}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                {gastoUp ? <TrendingUp /> : <TrendingDown />}
                {gastoUp ? '+' : ''}{gastoDiff.toFixed(1)}%
              </Badge>
            </CardAction>
          </CardHeader>
        </Card>

        {/* Cuotas del mes */}
        <Card className="@container/card cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setOpenDialog('cuotas')}>
          <CardHeader>
            <CardDescription>Cuotas del mes</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
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
        <Card className="@container/card cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setOpenDialog('comprometido')}>
          <CardHeader>
            <CardDescription>Próximas cuotas</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl col-span-2">
              {comprometidoMonto < 1 ? 'Sin cuotas' : ars(comprometidoMonto)}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <Layers />
                {comprometidoCuotas} cuotas
              </Badge>
            </CardAction>
          </CardHeader>
        </Card>
      </div>

      {/* Dialogs */}
      <Dialog open={openDialog === 'gastado'} onOpenChange={(open) => !open && setOpenDialog(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gastado este mes</DialogTitle>
          </DialogHeader>
          <PagosTable pagos={pagosGastadoMes} gastos={gastos} usuarios={usuarios} />
        </DialogContent>
      </Dialog>

      <Dialog open={openDialog === 'comprometido'} onOpenChange={(open) => !open && setOpenDialog(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Próximas cuotas</DialogTitle>
          </DialogHeader>
          <PagosTable pagos={pagosComprometido} gastos={gastos} usuarios={usuarios} />
        </DialogContent>
      </Dialog>

      <Dialog open={openDialog === 'cuotas'} onOpenChange={(open) => !open && setOpenDialog(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cuotas del mes</DialogTitle>
          </DialogHeader>
          <PagosTable pagos={pagosCuotasMes} gastos={gastos} usuarios={usuarios} showEstado />
        </DialogContent>
      </Dialog>
    </>
  )
}
