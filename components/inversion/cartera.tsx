'use client'

import { RefreshCw, SlidersHorizontal } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { fmtFecha, fmtUSD } from '@/lib/format'
import type { ValorCartera } from '@/lib/inversion'
import type { InvRol } from '@/lib/types'
import { cn } from '@/lib/utils'

interface Props {
  cartera: ValorCartera
  onValuar: () => void
  onPosiciones: () => void
}

const ROL: Record<InvRol, string> = { core: 'Core', satelite: 'Satélite', seguro: 'Seguro' }

export function Cartera({ cartera, onValuar, onPosiciones }: Props) {
  const total = cartera.total
  const filas = cartera.porPosicion.map((v) => {
    const pesoActual = total > 0 ? (v.valor / total) * 100 : 0
    const objetivoUsd = (v.posicion.peso_objetivo / 100) * total
    return { ...v, pesoActual, faltante: objetivoUsd - v.valor }
  })
  const ultimaValuacion = filas.map((f) => f.fecha_valuacion).filter(Boolean).sort().reverse()[0]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cartera · {fmtUSD(total)}</CardTitle>
        <CardDescription>
          Peso actual vs objetivo de cada posición y cuánto le falta.
          {ultimaValuacion ? ` Última valuación: ${fmtFecha(ultimaValuacion)}.` : ' Sin valuaciones: se muestra lo aportado.'}
        </CardDescription>
        <div className="flex flex-wrap gap-2 pt-2">
          <Button size="sm" onClick={onValuar}><RefreshCw data-icon="inline-start" />Actualizar valores</Button>
          <Button size="sm" variant="outline" onClick={onPosiciones}><SlidersHorizontal data-icon="inline-start" />Posiciones</Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {/* Mobile: cards */}
        <div className="flex flex-col gap-2 md:hidden">
          {filas.map((f) => (
            <div key={f.posicion.id} className="rounded-xl border p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{f.posicion.ticker} <Badge variant="outline" className="ml-1">{ROL[f.posicion.rol]}</Badge></p>
                  <p className="text-xs text-muted-foreground">{f.posicion.nombre}</p>
                </div>
                <p className="text-sm font-semibold tabular-nums">{fmtUSD(f.valor)}</p>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, f.pesoActual)}%` }} />
              </div>
              <div className="mt-1 flex justify-between text-xs text-muted-foreground tabular-nums">
                <span>{f.pesoActual.toFixed(0)} % de {f.posicion.peso_objetivo} %</span>
                <span className={cn(f.faltante > 0 ? 'text-orange-alert' : 'text-green-favor')}>
                  {f.faltante > 0 ? `faltan ${fmtUSD(f.faltante)}` : `+${fmtUSD(-f.faltante)} de más`}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: tabla */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Posición</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Aportado</TableHead>
                <TableHead className="text-right">Peso</TableHead>
                <TableHead className="text-right">Objetivo</TableHead>
                <TableHead className="text-right">Falta</TableHead>
                <TableHead>Fuente</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filas.map((f) => (
                <TableRow key={f.posicion.id}>
                  <TableCell className="font-medium">{f.posicion.ticker} <span className="text-muted-foreground">· {f.posicion.nombre}</span></TableCell>
                  <TableCell><Badge variant="outline">{ROL[f.posicion.rol]}</Badge></TableCell>
                  <TableCell className="text-right tabular-nums">{fmtUSD(f.valor)}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">{fmtUSD(f.aportado)}</TableCell>
                  <TableCell className="text-right tabular-nums">{f.pesoActual.toFixed(1)} %</TableCell>
                  <TableCell className="text-right tabular-nums">{f.posicion.peso_objetivo} %</TableCell>
                  <TableCell className={cn('text-right tabular-nums', f.faltante > 0 ? 'text-orange-alert' : 'text-green-favor')}>
                    {f.faltante > 0 ? fmtUSD(f.faltante) : `+${fmtUSD(-f.faltante)}`}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {f.fuente === 'valuacion' && f.fecha_valuacion ? `valuado ${fmtFecha(f.fecha_valuacion)}` : 'costo'}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/50 font-semibold">
                <TableCell colSpan={2}>Total</TableCell>
                <TableCell className="text-right tabular-nums">{fmtUSD(total)}</TableCell>
                <TableCell className="text-right tabular-nums">{fmtUSD(cartera.aportado)}</TableCell>
                <TableCell colSpan={4} className="text-right text-xs font-normal text-muted-foreground">
                  rendimiento {total - cartera.aportado >= 0 ? '+' : '−'}{fmtUSD(Math.abs(total - cartera.aportado))}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        {filas.length === 0 && <p className="text-sm text-muted-foreground">Sin posiciones activas. Agregalas desde Posiciones.</p>}
      </CardContent>
    </Card>
  )
}
