'use client'

import * as React from 'react'
import { Bar, CartesianGrid, ComposedChart, Line, XAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Pencil } from 'lucide-react'
import { fmtFecha, fmtMes, fmtUSD } from '@/lib/format'
import type { MesInversion } from '@/lib/inversion'
import type { InvAporte, InvCobro, InvPosicion } from '@/lib/types'
import { cn } from '@/lib/utils'

interface Props {
  serie: MesInversion[]
  cobros: InvCobro[]
  aportes: InvAporte[]
  posiciones: InvPosicion[]
  onEditarAporte?: (aporte: InvAporte) => void
}

const chartConfig = {
  aportado: { label: 'Aportado (acumulado)', color: 'var(--chart-2)' },
  valor: { label: 'Valor de la cartera', color: 'var(--chart-1)' },
} satisfies ChartConfig

export function HistorialChart({ serie, cobros, aportes, posiciones, onEditarAporte }: Props) {
  const data = serie.map((r) => ({
    mes: fmtMes(r.mes, 'MMM'),
    mesFull: fmtMes(r.mes),
    aportado: Math.round(r.aportadoAcumulado),
    valor: Math.round(r.valorCartera),
  }))
  const ultimo = serie[serie.length - 1]
  const mercado = ultimo ? ultimo.valorCartera - ultimo.aportadoAcumulado : 0
  const posNombre = (id: string) => { const p = posiciones.find((p) => p.id === id); return p ? p.ticker || p.nombre : '—' }

  const movimientos = React.useMemo(() => {
    const items: { key: string; fecha: string; tipo: 'aporte' | 'cobro'; texto: string; usd: number; ars: number; aporte?: InvAporte }[] = [
      ...aportes.map((a) => ({ key: `a-${a.id}`, fecha: a.fecha, tipo: 'aporte' as const, texto: `Aporte a ${posNombre(a.posicion_id)}`, usd: a.monto_usd, ars: a.monto_ars, aporte: a })),
      ...cobros.map((c) => ({ key: `c-${c.id}`, fecha: c.fecha, tipo: 'cobro' as const, texto: c.tipo === 'base' ? 'Cobro base' : 'Cobro extra', usd: c.tipo_cambio > 0 ? c.monto_ars / c.tipo_cambio : 0, ars: c.monto_ars })),
    ]
    return items.sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 30)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aportes, cobros, posiciones])

  return (
    <div className="flex flex-col gap-4">
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Historial</CardTitle>
          <CardDescription>
            Barras: lo que pusiste vos. Línea: lo que vale la cartera.
            {ultimo && <> Diferencia hoy: <span className={cn('font-medium', mercado >= 0 ? 'text-green-favor' : 'text-destructive')}>{mercado >= 0 ? '+' : '−'}{fmtUSD(Math.abs(mercado))}</span> del mercado.</>}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          {data.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Todavía no hay meses para mostrar.</p>
          ) : (
            <ChartContainer config={chartConfig} className="aspect-auto h-56 w-full md:h-72">
              <ComposedChart data={data}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="mes" tickLine={false} axisLine={false} tickMargin={8} minTickGap={16} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.mesFull ?? ''}
                      formatter={(value, name) => (
                        <div className="flex w-full items-center justify-between gap-3">
                          <span className="text-muted-foreground">{chartConfig[name as keyof typeof chartConfig]?.label}</span>
                          <span className="font-medium tabular-nums">{fmtUSD(Number(value))}</span>
                        </div>
                      )}
                    />
                  }
                />
                <Bar dataKey="aportado" fill="var(--color-aportado)" radius={4} />
                <Line dataKey="valor" type="monotone" stroke="var(--color-valor)" strokeWidth={2} dot={false} />
                <ChartLegend content={<ChartLegendContent />} />
              </ComposedChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mes a mes</CardTitle>
          <CardDescription>Debido vs puesto. El desvío mira solo tus aportes, no el mercado.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table className="min-w-[420px]">
            <TableHeader>
              <TableRow>
                <TableHead>Mes</TableHead>
                <TableHead className="text-right">Debido</TableHead>
                <TableHead className="text-right">Puesto</TableHead>
                <TableHead className="text-right">Desvío</TableHead>
                <TableHead className="text-right">Cartera</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...serie].reverse().map((r) => (
                <TableRow key={r.mes}>
                  <TableCell className="font-medium capitalize">{fmtMes(r.mes, 'MMM yyyy')}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtUSD(r.debido)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtUSD(r.puesto)}</TableCell>
                  <TableCell className={cn('text-right tabular-nums', r.desvio >= 0 ? 'text-green-favor' : 'text-orange-alert')}>
                    {r.desvio >= 0 ? '+' : '−'}{fmtUSD(Math.abs(r.desvio))}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">{fmtUSD(r.valorCartera)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Últimos movimientos</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {movimientos.length === 0 && <p className="text-sm text-muted-foreground">Sin cobros ni aportes todavía.</p>}
          {onEditarAporte && aportes.length > 0 && (
            <p className="text-xs text-muted-foreground">Tocá un aporte para corregirlo o borrarlo.</p>
          )}
          {movimientos.map((m) => {
            const { aporte } = m
            const editar = aporte && onEditarAporte ? () => onEditarAporte(aporte) : undefined
            const Fila = editar ? 'button' : 'div'
            return (
              <Fila
                key={m.key}
                type={editar ? 'button' : undefined}
                onClick={editar}
                className={cn(
                  'flex items-center justify-between gap-3 text-sm',
                  editar && '-mx-2 rounded-md px-2 py-1 text-left hover:bg-muted active:bg-muted',
                )}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <Badge variant={m.tipo === 'aporte' ? 'default' : 'secondary'}>{m.tipo}</Badge>
                  <span className="truncate">{m.texto}</span>
                  {editar && <Pencil className="size-3.5 shrink-0 text-muted-foreground" />}
                </div>
                <div className="shrink-0 text-right tabular-nums">
                  <p className="font-medium">{fmtUSD(m.usd)}</p>
                  <p className="text-xs text-muted-foreground">{fmtFecha(m.fecha)}</p>
                </div>
              </Fila>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
