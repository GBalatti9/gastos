'use client'

import { ArrowDownRight, ArrowUpRight, Banknote, CalendarClock, Crosshair, Minus, PiggyBank, ShieldCheck, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress, ProgressLabel, ProgressValue } from '@/components/ui/progress'
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { fmtARS, fmtMes, fmtUSD } from '@/lib/format'
import { mesesEntre } from '@/lib/inversion'
import type { InvMeta } from '@/lib/types'
import type { ResumenInv } from './inversion-view'
import { cn } from '@/lib/utils'

interface Props {
  meta: InvMeta
  resumen: ResumenInv
  tc: number
  onCobro: () => void
  onAporte: () => void
  onValuar: () => void
}

const CARD = 'bg-gradient-to-t from-primary/5 to-card shadow-xs dark:bg-card'
const TITULO = 'text-xl font-semibold tabular-nums @[250px]/card:text-3xl'

export function ResumenInversion({ meta, resumen, tc, onCobro, onAporte, onValuar }: Props) {
  const { esteMes, acumulado, cartera, progreso, fechaEstimada, ritmo, destino, fase, alertas } = resumen

  const estadoMes = esteMes.debido === 0 ? 'neutro' : esteMes.desvio >= 0 ? 'ok' : esteMes.puesto > 0 ? 'parcial' : 'falta'
  const colorMes = { ok: 'text-green-favor', parcial: 'text-orange-alert', falta: 'text-destructive', neutro: 'text-muted-foreground' }[estadoMes]
  const faltanteMesUsd = Math.max(0, -esteMes.desvio)

  const difFecha = fechaEstimada ? mesesEntre(meta.fecha_objetivo, fechaEstimada) : null
  const sinValuacion = cartera.porPosicion.every((v) => v.fuente === 'costo') && cartera.total > 0

  return (
    <div className="flex flex-col gap-4">
      {alertas.map((a) => (
        <Alert key={a.tipo} variant={a.tipo === 'caida_desriesgo' ? 'destructive' : 'default'}>
          <AlertTitle>{a.titulo}</AlertTitle>
          <AlertDescription>{a.cuerpo}</AlertDescription>
          {a.url.includes('aporte=1') && (
            <AlertAction>
              <Button size="sm" variant="outline" onClick={onAporte}>Aportar</Button>
            </AlertAction>
          )}
        </Alert>
      ))}

      {/* Acciones principales */}
      <div className="grid grid-cols-2 gap-2">
        <Button size="lg" className="h-12" onClick={onCobro}>
          <Banknote data-icon="inline-start" />
          Cargar cobro
        </Button>
        <Button size="lg" variant="outline" className="h-12" onClick={onAporte}>
          <PiggyBank data-icon="inline-start" />
          Registrar aporte
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 @xl/main:gap-4 @5xl/main:grid-cols-3">
        {/* Este mes */}
        <Card className={cn('@container/card', CARD)}>
          <CardHeader>
            <CardDescription>Este mes</CardDescription>
            <CardTitle className={cn(TITULO, colorMes)}>
              {estadoMes === 'ok' ? `+${fmtUSD(esteMes.desvio)}` : estadoMes === 'neutro' ? '—' : `−${fmtUSD(faltanteMesUsd)}`}
            </CardTitle>
            <CardAction>
              <Badge variant="outline" className={colorMes}>
                {estadoMes === 'ok' ? <ArrowUpRight /> : estadoMes === 'neutro' ? <Minus /> : <ArrowDownRight />}
                {estadoMes === 'ok' ? 'al día' : estadoMes === 'parcial' ? 'parcial' : estadoMes === 'falta' ? 'falta' : 'sin plan'}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="text-xs text-muted-foreground">
            Pusiste {fmtUSD(esteMes.puesto)}, te tocaban {fmtUSD(esteMes.debido)}
            {faltanteMesUsd > 0 && tc > 0 && <> · faltan {fmtARS(faltanteMesUsd * tc)}</>}
          </CardFooter>
        </Card>

        {/* Acumulado */}
        <Card className={cn('@container/card', CARD)}>
          <CardHeader>
            <CardDescription>Acumulado vs plan</CardDescription>
            <CardTitle className={cn(TITULO, acumulado.desvio >= 0 ? 'text-green-favor' : 'text-orange-alert')}>
              {acumulado.desvio >= 0 ? '+' : '−'}{fmtUSD(Math.abs(acumulado.desvio))}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">{acumulado.desvio >= 0 ? 'adelantado' : 'atrasado'}</Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="text-xs text-muted-foreground">
            Desde {fmtMes(meta.fecha_inicio, 'MMM yyyy')}: {fmtUSD(acumulado.puesto)} de {fmtUSD(acumulado.debido)}
          </CardFooter>
        </Card>

        {/* Meta */}
        <Card className={cn('@container/card col-span-2 @5xl/main:col-span-1', CARD)}>
          <CardHeader>
            <CardDescription>Meta</CardDescription>
            <CardTitle className={TITULO}>
              {fmtUSD(cartera.total)} <span className="text-base font-normal text-muted-foreground">de {fmtUSD(meta.monto_objetivo_usd)}</span>
            </CardTitle>
            <CardAction>
              <Badge variant="outline"><Crosshair />{Math.round(progreso.pct)} %</Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <Progress value={progreso.pct}>
              <ProgressLabel className="text-xs text-muted-foreground">Faltan {fmtUSD(progreso.faltante)}</ProgressLabel>
              <ProgressValue className="text-xs">{(v) => `aportado ${fmtUSD(cartera.aportado)} · mercado ${cartera.total - cartera.aportado >= 0 ? '+' : '−'}${fmtUSD(Math.abs(cartera.total - cartera.aportado))}${v ? '' : ''}`}</ProgressValue>
            </Progress>
          </CardContent>
          {sinValuacion && (
            <CardFooter>
              <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={onValuar}>
                Todavía no valuaste la cartera: se usa lo aportado. Actualizar valores →
              </Button>
            </CardFooter>
          )}
        </Card>

        {/* Fecha estimada */}
        <Card className={cn('@container/card', CARD)}>
          <CardHeader>
            <CardDescription>Fecha estimada</CardDescription>
            <CardTitle className={cn(TITULO, 'capitalize')}>
              {fechaEstimada ? fmtMes(fechaEstimada, 'MMM yyyy') : '—'}
            </CardTitle>
            <CardAction>
              <Badge variant="outline" className={cn(difFecha !== null && difFecha > 0 && 'text-orange-alert', difFecha !== null && difFecha <= 0 && 'text-green-favor')}>
                <CalendarClock />
                {difFecha === null ? 'sin ritmo' : difFecha > 0 ? `+${difFecha} m` : difFecha < 0 ? `${difFecha} m` : 'justo'}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="text-xs text-muted-foreground">
            {ritmo > 0 ? <>A tu ritmo real ({fmtUSD(ritmo)}/mes, últimos 6 meses). Objetivo: {fmtMes(meta.fecha_objetivo, 'MMM yyyy')}.</> : <>Sin aportes en meses completos todavía. Objetivo: {fmtMes(meta.fecha_objetivo, 'MMM yyyy')}.</>}
          </CardFooter>
        </Card>

        {/* Próximo aporte */}
        <Card className={cn('@container/card', CARD)}>
          <CardHeader>
            <CardDescription>Próximo aporte va a</CardDescription>
            <CardTitle className={cn(TITULO, 'truncate')}>{destino ? destino.posicion.ticker || destino.posicion.nombre : '—'}</CardTitle>
            <CardAction>
              <Badge variant="outline"><TrendingUp />{destino?.motivo === 'desriesgo' ? 'desriesgo' : 'rebalanceo'}</Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="text-xs text-muted-foreground">
            {destino
              ? destino.faltante > 0
                ? `Le faltan ${fmtUSD(destino.faltante)} para su peso objetivo (${destino.posicion.peso_objetivo} %).`
                : 'Está en su peso objetivo; va por rebalanceo.'
              : 'Armá la cartera en la pestaña Cartera → Posiciones.'}
          </CardFooter>
        </Card>

        {/* Fase */}
        <Card className={cn('@container/card col-span-2 @5xl/main:col-span-1', CARD)}>
          <CardHeader>
            <CardDescription>Fase</CardDescription>
            <CardTitle className={TITULO}>{fase.nombre === 'acumulacion' ? 'Acumulación' : `Desriesgo · etapa ${fase.etapa}`}</CardTitle>
            <CardAction>
              <Badge variant="outline"><ShieldCheck />{fase.nombre === 'acumulacion' ? `hasta ${fmtMes(fase.inicioDesriesgo, 'MMM yyyy')}` : `${fase.pctSeguro} % seguro`}</Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="text-xs text-muted-foreground">
            {fase.nombre === 'acumulacion'
              ? `Faltan ${fase.mesesRestantes} meses para la meta. En ${fmtMes(fase.inicioDesriesgo, 'MMMM yyyy')} pasa sola a desriesgo y el aporte va al balde seguro.`
              : `Faltan ${fase.mesesRestantes} meses. El ${fase.pctSeguro} % de la cartera debería estar en el balde seguro.`}
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
