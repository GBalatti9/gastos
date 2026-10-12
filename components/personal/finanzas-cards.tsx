'use client'

import { useState } from 'react'
import { TrendingDown, TrendingUp, Layers, Scale } from 'lucide-react'
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
import { PromedioCard, PromedioDialog, FilaMes } from '@/components/dashboard/promedio-card'
import { StatRow } from '@/components/dashboard/stat-row'
import type { Gasto, Pago } from '@/lib/types'

export interface PagoDetalle {
  pago: Pago
  gasto: Gasto
  miParte: number
}

export interface PromedioPersonal {
  total: number
  casa: number
  personal: number
  meses: string[]
  filas: FilaMes[]
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
  promedio: PromedioPersonal
}

const ars = (n: number) => `$ ${Math.round(n).toLocaleString('es-AR')}`

type DialogKey = 'costo' | 'cash' | 'comprometido' | 'promedio' | null

function DetalleTable({ detalle }: { detalle: PagoDetalle[] }) {
  if (detalle.length === 0) {
    return <p className="py-4 text-center text-sm text-muted-foreground">Sin datos</p>
  }
  return (
    <div className="max-h-80 overflow-auto">
      <Table className="min-w-[520px]">
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
  promedio,
}: Props) {
  const [openDialog, setOpenDialog] = useState<DialogKey>(null)

  const diferencia = cashFlow - costoReal
  const cashDiff = cashFlowPrev > 0 ? ((cashFlow - cashFlowPrev) / cashFlowPrev) * 100 : 0
  const cashUp = cashDiff >= 0

  return (
    <>
      {/* Mobile: una card con filas */}
      <Card className="py-0 md:hidden">
        <div className="divide-y">
          <StatRow label="Costo real del mes" value={ars(costoReal)} hint={`casa ${ars(costoCasa)} · personal ${ars(costoPersonal)}`} onClick={() => setOpenDialog('costo')} />
          <StatRow
            label="Tu promedio mensual"
            value={promedio.meses.length ? ars(promedio.total) : '—'}
            hint={promedio.meses.length ? `casa ${ars(promedio.casa)} · personal ${ars(promedio.personal)} · ${promedio.meses.length} meses` : 'sin meses completos'}
            onClick={() => setOpenDialog('promedio')}
          />
          <StatRow label="Cash flow del mes" value={ars(cashFlow)} hint={cashFlowPrev > 0 ? `${cashUp ? '+' : ''}${cashDiff.toFixed(0)} % vs mes anterior` : 'lo que pagaste vos este mes'} onClick={() => setOpenDialog('cash')} />
          <StatRow label="Diferencia" value={`${diferencia >= 0 ? '+' : '−'}${ars(Math.abs(diferencia))}`} hint="cash flow − costo real" valueClassName={diferencia >= 0 ? 'text-green-favor' : 'text-orange-alert'} />
          <StatRow label="Comprometido" value={comprometidoMonto < 1 ? '—' : ars(comprometidoMonto)} hint={`tu parte de ${comprometidoCuotas} cuotas pendientes`} onClick={() => setOpenDialog('comprometido')} />
        </div>
      </Card>

      {/* Desktop: grid de cards */}
      <div className="hidden grid-cols-2 gap-3 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs md:grid @xl/main:gap-4 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
        {/* Costo real del mes */}
        <Card className="@container/card cursor-pointer transition-colors hover:border-primary/30" onClick={() => setOpenDialog('costo')}>
          <CardHeader>
            <CardDescription>Costo real del mes</CardDescription>
            <CardTitle className="text-xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {ars(costoReal)}
            </CardTitle>
            <CardAction>
              <Badge variant="outline" className="hidden @[250px]/card:inline-flex">
                casa {ars(costoCasa)} · pers. {ars(costoPersonal)}
              </Badge>
            </CardAction>
          </CardHeader>
        </Card>

        {/* Promedio mensual (mi parte) */}
        <PromedioCard
          titulo="Tu promedio mensual"
          monto={promedio.total}
          meses={promedio.meses}
          columnas={['Total', 'Casa', 'Personal']}
          filas={promedio.filas}
          descripcion="Tu parte de los gastos compartidos más tus gastos personales, sobre meses completos. Cada cuota cuenta en el mes de su vencimiento. Las liquidaciones de deuda no cuentan."
          detalle={
            promedio.meses.length > 0 ? (
              <span className="truncate">
                casa {ars(promedio.casa)} · personal {ars(promedio.personal)}
              </span>
            ) : undefined
          }
        />

        {/* Cash flow del mes */}
        <Card className="@container/card cursor-pointer transition-colors hover:border-primary/30" onClick={() => setOpenDialog('cash')}>
          <CardHeader>
            <CardDescription>Cash flow del mes</CardDescription>
            <CardTitle className="text-xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {ars(cashFlow)}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                {cashUp ? <TrendingUp /> : <TrendingDown />}
                {cashUp ? '+' : ''}{cashDiff.toFixed(0)}%
              </Badge>
            </CardAction>
          </CardHeader>
        </Card>

        {/* Diferencia */}
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Diferencia</CardDescription>
            <CardTitle className="text-xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {diferencia >= 0 ? '+' : '−'}{ars(Math.abs(diferencia))}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <Scale />
                <span className="hidden @[250px]/card:inline">Cash − Costo</span>
              </Badge>
            </CardAction>
          </CardHeader>
        </Card>

        {/* Comprometido (mi parte) */}
        <Card className="@container/card col-span-2 cursor-pointer transition-colors hover:border-primary/30 @5xl/main:col-span-4" onClick={() => setOpenDialog('comprometido')}>
          <CardHeader>
            <CardDescription>Comprometido (mi parte de las cuotas pendientes)</CardDescription>
            <CardTitle className="text-xl font-semibold tabular-nums @[250px]/card:text-3xl">
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
        <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Costo real del mes</DialogTitle>
          </DialogHeader>
          <DetalleTable detalle={detalleCostoReal} />
        </DialogContent>
      </Dialog>

      <PromedioDialog
        open={openDialog === 'promedio'}
        onOpenChange={(open) => !open && setOpenDialog(null)}
        titulo="Tu promedio mensual"
        meses={promedio.meses}
        columnas={['Total', 'Casa', 'Personal']}
        filas={promedio.filas}
        descripcion="Tu parte de los gastos compartidos más tus gastos personales, sobre meses completos. Cada cuota cuenta en el mes de su vencimiento. Las liquidaciones de deuda no cuentan."
      />

      <Dialog open={openDialog === 'cash'} onOpenChange={(open) => !open && setOpenDialog(null)}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cash flow del mes</DialogTitle>
          </DialogHeader>
          <DetalleTable detalle={detalleCashFlow} />
        </DialogContent>
      </Dialog>

      <Dialog open={openDialog === 'comprometido'} onOpenChange={(open) => !open && setOpenDialog(null)}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Comprometido (mi parte)</DialogTitle>
          </DialogHeader>
          <DetalleTable detalle={detalleComprometido} />
        </DialogContent>
      </Dialog>
    </>
  )
}
