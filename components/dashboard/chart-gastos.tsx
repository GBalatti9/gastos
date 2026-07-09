'use client'

import * as React from 'react'
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group'
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
import { Badge } from '@/components/ui/badge'

export interface PagoMes {
  id: string
  descripcion: string
  monto: number
  pagador: string
  fecha: string
  estado: string
}

export interface ChartPoint {
  month: string
  mesLabel: string
  u1: number
  u2: number
  pagos: PagoMes[]
}

const ars = (n: number) => `$ ${Math.round(n).toLocaleString('es-AR')}`

interface Props {
  data: ChartPoint[]
  u1Nombre: string
  u2Nombre: string
}

export function ChartGastos({ data, u1Nombre, u2Nombre }: Props) {
  const [range, setRange] = React.useState('6')
  const [mesSeleccionado, setMesSeleccionado] = React.useState<ChartPoint | null>(null)

  const chartConfig = {
    total: { label: 'Total', color: 'var(--chart-3)' },
    u1: { label: u1Nombre, color: 'var(--chart-1)' },
    u2: { label: u2Nombre, color: 'var(--chart-2)' },
  } satisfies ChartConfig

  const filtered = React.useMemo(() => {
    const n = parseInt(range)
    return data.slice(-n).map((p) => ({ ...p, total: p.u1 + p.u2 }))
  }, [data, range])

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Evolución de gastos</CardTitle>
        <CardDescription>
          Gasto mensual por persona y total. Tocá un mes para ver el detalle.
        </CardDescription>
        <CardAction>
          <ToggleGroup
            value={[range]}
            onValueChange={(v: string[]) => v[0] && setRange(v[0])}
            variant="outline"
            className="hidden @[540px]/card:flex"
          >
            <ToggleGroupItem value="12">12 meses</ToggleGroupItem>
            <ToggleGroupItem value="6">6 meses</ToggleGroupItem>
            <ToggleGroupItem value="3">3 meses</ToggleGroupItem>
          </ToggleGroup>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[320px] w-full cursor-pointer">
          <AreaChart
            data={filtered}
            onClick={(state) => {
              // En recharts 3 el índice puede venir como string
              const i = Number(state?.activeTooltipIndex)
              if (!Number.isNaN(i) && filtered[i]) setMesSeleccionado(filtered[i])
            }}
          >
            <defs>
              <linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-total)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="var(--color-total)" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="fillU1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-u1)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="var(--color-u1)" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="fillU2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-u2)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="var(--color-u2)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={16}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="dot"
                  formatter={(value, name) => (
                    <div className="flex w-full items-center justify-between gap-3">
                      <span className="text-muted-foreground">
                        {chartConfig[name as keyof typeof chartConfig]?.label}
                      </span>
                      <span className="font-medium tabular-nums">
                        $ {Math.round(Number(value)).toLocaleString('es-AR')}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Area
              dataKey="total"
              type="monotone"
              fill="url(#fillTotal)"
              stroke="var(--color-total)"
              strokeWidth={2}
            />
            <Area
              dataKey="u1"
              type="monotone"
              fill="url(#fillU1)"
              stroke="var(--color-u1)"
              strokeWidth={2}
            />
            <Area
              dataKey="u2"
              type="monotone"
              fill="url(#fillU2)"
              stroke="var(--color-u2)"
              strokeWidth={2}
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>

      <Dialog open={mesSeleccionado !== null} onOpenChange={(open) => !open && setMesSeleccionado(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="capitalize">
              {mesSeleccionado?.mesLabel} · {ars((mesSeleccionado?.u1 ?? 0) + (mesSeleccionado?.u2 ?? 0))}
            </DialogTitle>
          </DialogHeader>
          {mesSeleccionado && (
            mesSeleccionado.pagos.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Sin datos</p>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descripción</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead>Pagado por</TableHead>
                      <TableHead>Vence</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mesSeleccionado.pagos.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.descripcion}</TableCell>
                        <TableCell className="text-right tabular-nums">{ars(p.monto)}</TableCell>
                        <TableCell>{p.pagador}</TableCell>
                        <TableCell className="text-muted-foreground">{p.fecha}</TableCell>
                        <TableCell>
                          <Badge variant={p.estado === 'pagado' ? 'default' : 'outline'}>
                            {p.estado === 'pagado' ? 'Pagado' : 'Pendiente'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}
