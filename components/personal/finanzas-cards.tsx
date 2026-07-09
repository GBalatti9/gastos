'use client'

import { useState } from 'react'
import { TrendingDown, TrendingUp, Layers, Scale } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
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

export interface PagoDetalle {
  pago: Pago
  gasto: Gasto
  miParte: number
}

interface Props {
  costoReal: number
  costoPersonal: number
  costoCasa: number
  cashFlow: number
  cashFlowPrev: number
  comprometidoMonto: number
  comprometidoCuotas: number
  detalleCostoReal: PagoDetalle[]
  detalleCashFlow: PagoDetalle[]
  detalleComprometido: PagoDetalle[]
}

const ars = (n: number) => `$ ${Math.round(n).toLocaleString('es-AR')}`

type DialogKey = 'costo' | 'cash' | 'comprometido' | null

function DetalleTable({ detalle }: { detalle: PagoDetalle[] }) {
  if (detalle.length === 0) {
    return <p className="text-sm text-muted-foreground py-4 text-center">Sin datos</p>
  }
  return (
    <div className="max-h-80 overflow-y-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Descripción</TableHead>
            <TableHead className="text-right">Monto</TableHead>
            <TableHead className="text-right">Mi parte</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Tipo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {detalle.map(({ pago, gasto, miParte }) => (
            <TableRow key={pago.id}>
              <TableCell className="font-medium">{gasto.descripcion}</TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground">
                {ars(pago.monto)}
              </TableCell>
              <TableCell className="text-right tabular-nums font-medium">
                {ars(miParte)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {pago.fecha_pago || pago.fecha_vencimiento}
              </TableCell>
              <TableCell>
                <Badge variant={gasto.tipo_division === 'personal' ? 'secondary' : 'outline'}>
                  {gasto.tipo_division === 'personal' ? 'Personal' : 'Compartido'}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function FinanzasCards({
  costoReal,
  costoPersonal,
  costoCasa,
  cashFlow,
  cashFlowPrev,
  comprometidoMonto,
  comprometidoCuotas,
  detalleCostoReal,
  detalleCashFlow,
  detalleComprometido,
}: Props) {
  const [openDialog, setOpenDialog] = useState<DialogKey>(null)

  const diferencia = cashFlow - costoReal
  const cashDiff = cashFlowPrev > 0 ? ((cashFlow - cashFlowPrev) / cashFlowPrev) * 100 : 0
  const cashUp = cashDiff >= 0

  return (
    <>
      <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
        {/* Costo real del mes */}
        <Card className="@container/card cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setOpenDialog('costo')}>
          <CardHeader>
            <CardDescription>Costo real del mes</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl col-span-2">
              {ars(costoReal)}
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Cash flow del mes */}
        <Card className="@container/card cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setOpenDialog('cash')}>
          <CardHeader>
            <CardDescription>Cash flow del mes</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl col-span-2">
              {ars(cashFlow)}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                {cashUp ? <TrendingUp /> : <TrendingDown />}
                {cashUp ? '+' : ''}{cashDiff.toFixed(1)}%
              </Badge>
            </CardAction>
          </CardHeader>
        </Card>

        {/* Diferencia */}
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Diferencia</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl col-span-2">
              {diferencia >= 0 ? '+' : '−'}{ars(Math.abs(diferencia))}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <Scale />
                Cash − Costo
              </Badge>
            </CardAction>
          </CardHeader>
        </Card>

        {/* Comprometido (mi parte) */}
        <Card className="@container/card cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setOpenDialog('comprometido')}>
          <CardHeader>
            <CardDescription>Comprometido</CardDescription>
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
      <Dialog open={openDialog === 'costo'} onOpenChange={(open) => !open && setOpenDialog(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Costo real del mes</DialogTitle>
          </DialogHeader>
          <DetalleTable detalle={detalleCostoReal} />
        </DialogContent>
      </Dialog>

      <Dialog open={openDialog === 'cash'} onOpenChange={(open) => !open && setOpenDialog(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cash flow del mes</DialogTitle>
          </DialogHeader>
          <DetalleTable detalle={detalleCashFlow} />
        </DialogContent>
      </Dialog>

      <Dialog open={openDialog === 'comprometido'} onOpenChange={(open) => !open && setOpenDialog(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Comprometido (mi parte)</DialogTitle>
          </DialogHeader>
          <DetalleTable detalle={detalleComprometido} />
        </DialogContent>
      </Dialog>
    </>
  )
}
