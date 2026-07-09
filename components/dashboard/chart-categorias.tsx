'use client'

import * as React from 'react'
import { Pie, PieChart } from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'

export interface CategoriaPoint {
  categoria: string
  total: number
}

interface Props {
  data: CategoriaPoint[]
  titulo?: string
  descripcion?: string
}

export function ChartCategorias({
  data,
  titulo = 'Gastos por categoría',
  descripcion = 'Distribución del gasto de este mes',
}: Props) {
  const { chartData, chartConfig } = React.useMemo(() => {
    const points = data
      .filter((d) => d.total > 0)
      .sort((a, b) => b.total - a.total)

    const config: ChartConfig = { total: { label: 'Total' } }
    const rows = points.map((p, i) => {
      const key = `cat${i}`
      config[key] = {
        label: p.categoria,
        color: `var(--chart-${(i % 5) + 1})`,
      }
      return {
        key,
        categoria: p.categoria,
        total: p.total,
        fill: `var(--color-${key})`,
        color: `var(--chart-${(i % 5) + 1})`,
      }
    })
    return { chartData: rows, chartConfig: config }
  }, [data])

  const total = chartData.reduce((s, r) => s + r.total, 0)

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>{titulo}</CardTitle>
        <CardDescription>{descripcion}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        {chartData.length === 0 ? (
          <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
            Sin gastos este mes
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
          <ChartContainer
            config={chartConfig}
            className="aspect-square w-full max-w-[300px] shrink-0"
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    nameKey="key"
                    formatter={(value, name) => (
                      <div className="flex w-full items-center justify-between gap-3">
                        <span className="text-muted-foreground">
                          {chartConfig[name as string]?.label}
                        </span>
                        <span className="font-medium tabular-nums">
                          $ {Math.round(Number(value)).toLocaleString('es-AR')}
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <Pie
                data={chartData}
                dataKey="total"
                nameKey="key"
                innerRadius={60}
                strokeWidth={2}
              />
            </PieChart>
          </ChartContainer>

          {/* Categorías con montos */}
          <div className="flex w-full flex-1 flex-col gap-1 self-center">
            {chartData.map((row) => (
              <div
                key={row.key}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm"
              >
                <span
                  className="size-2.5 shrink-0 rounded-xs"
                  style={{ backgroundColor: row.color }}
                />
                <span className="truncate">{row.categoria}</span>
                <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                  {total > 0 ? `${Math.round((row.total / total) * 100)}%` : ''}
                </span>
                <span className="w-28 text-right font-medium tabular-nums">
                  $ {Math.round(row.total).toLocaleString('es-AR')}
                </span>
              </div>
            ))}
            <div className="mt-1 flex items-center gap-2 border-t px-2 pt-2 text-sm">
              <span className="font-medium">Total</span>
              <span className="ml-auto w-28 text-right font-semibold tabular-nums">
                $ {Math.round(total).toLocaleString('es-AR')}
              </span>
            </div>
          </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
