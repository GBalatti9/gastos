'use client'

import { Banknote, PiggyBank } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { fmtARS, fmtMes, fmtUSD } from '@/lib/format'
import { fechaEstimada, mesesEntre } from '@/lib/inversion'
import type { InvMeta } from '@/lib/types'
import type { ResumenInv } from './inversion-view'
import { cn } from '@/lib/utils'

interface Props {
  meta: InvMeta
  resumen: ResumenInv
  tc: number
  mesActual: string
  onCobro: () => void
  onAporte: () => void
  onValuar: () => void
  onPosiciones: () => void
}

export function ResumenInversion({ meta, resumen, tc, mesActual, onCobro, onAporte, onValuar, onPosiciones }: Props) {
  const { esteMes, acumulado, cartera, progreso, fechaEstimada: fechaRitmo, ritmo, destino, fase, alertas, serie } = resumen

  // ── Este mes ────────────────────────────────────────────────────────────
  const faltaMes = Math.max(0, esteMes.debido - esteMes.puesto)
  const pctMes = esteMes.debido > 0 ? Math.min(100, (esteMes.puesto / esteMes.debido) * 100) : 0
  const mesLabel = fmtMes(mesActual, 'MMMM')
  const hayMesesAnteriores = serie.length > 1
  const atrasoPrevio = acumulado.desvio - esteMes.desvio // desvío acumulado sin contar este mes

  // ── Meta ────────────────────────────────────────────────────────────────
  const mercado = cartera.total - cartera.aportado
  const aporteParaFecha = ritmo > 0 ? ritmo : meta.aporte_base_usd
  const fecha = ritmo > 0 ? fechaRitmo : fechaEstimada(cartera.total, meta.monto_objetivo_usd, meta.aporte_base_usd, 0, mesActual)
  const difMeses = fecha ? mesesEntre(meta.fecha_objetivo, fecha) : null
  const sinValuacion = cartera.total > 0 && cartera.porPosicion.every((v) => v.fuente === 'costo')

  // ── Próximo paso ────────────────────────────────────────────────────────
  const haySeguro = cartera.porPosicion.some((v) => v.posicion.rol === 'seguro')
  const valorSeguro = cartera.porPosicion.filter((v) => v.posicion.rol === 'seguro').reduce((s, v) => s + v.valor, 0)
  const pctSeguroHoy = cartera.total > 0 ? (valorSeguro / cartera.total) * 100 : 0

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

      {/* 1. Este mes */}
      <Card>
        <CardHeader>
          <CardDescription className="capitalize">{mesLabel}</CardDescription>
          <CardTitle className="text-2xl leading-tight">
            {esteMes.debido === 0 ? (
              'Este mes no te toca aportar.'
            ) : faltaMes <= 0 ? (
              <>Ya cumpliste: pusiste <span className="text-green-favor">{fmtUSD(esteMes.puesto)}</span> de {fmtUSD(esteMes.debido)}.</>
            ) : (
              <>
                Te faltan <span className={cn(esteMes.puesto > 0 ? 'text-orange-alert' : 'text-destructive')}>{fmtUSD(faltaMes)}</span>
                {tc > 0 && <span className="font-normal text-muted-foreground"> (≈ {fmtARS(faltaMes * tc)})</span>}
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {esteMes.debido > 0 && <Progress value={pctMes} />}
          <p className="text-sm text-muted-foreground">
            Te tocan {fmtUSD(esteMes.debido)} este mes ({fmtUSD(meta.aporte_base_usd)} de base
            {esteMes.debido > meta.aporte_base_usd && <> + {fmtUSD(esteMes.debido - meta.aporte_base_usd)} por extras</>}).
            {esteMes.puesto > 0 && <> Llevás {fmtUSD(esteMes.puesto)}.</>}
            {hayMesesAnteriores && Math.abs(atrasoPrevio) >= 1 && (
              <> De meses anteriores venís {atrasoPrevio >= 0 ? 'adelantado' : 'atrasado'} {fmtUSD(Math.abs(atrasoPrevio))}.</>
            )}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button size="lg" className="h-12" onClick={onCobro}>
              <Banknote data-icon="inline-start" />
              Cargar cobro
            </Button>
            <Button size="lg" variant={faltaMes > 0 ? 'default' : 'outline'} className="h-12" onClick={onAporte}>
              <PiggyBank data-icon="inline-start" />
              Registrar aporte
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 2. Meta */}
      <Card>
        <CardHeader>
          <CardDescription>{meta.nombre}</CardDescription>
          <CardTitle className="text-2xl leading-tight">
            {fmtUSD(cartera.total)} <span className="font-normal text-muted-foreground">de {fmtUSD(meta.monto_objetivo_usd)}</span>
            <span className="ml-2 text-base font-normal text-muted-foreground">· {Math.round(progreso.pct)} %</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Progress value={progreso.pct} />
          <p className="text-sm text-muted-foreground">
            Pusiste {fmtUSD(cartera.aportado)}; el mercado {mercado >= 0 ? 'sumó' : 'restó'} {fmtUSD(Math.abs(mercado))}.
            {' '}Faltan {fmtUSD(progreso.faltante)}.
          </p>
          <p className="text-sm">
            {fecha ? (
              <>
                Con {fmtUSD(aporteParaFecha)} por mes{ritmo > 0 ? ' (tu ritmo real)' : ' (la base)'} llegás en{' '}
                <span className="font-medium capitalize">{fmtMes(fecha)}</span>
                {difMeses !== null && difMeses !== 0 && (
                  <span className={cn(difMeses > 0 ? 'text-orange-alert' : 'text-green-favor')}>
                    {' '}· {Math.abs(difMeses)} meses {difMeses > 0 ? 'después' : 'antes'} de tu objetivo ({fmtMes(meta.fecha_objetivo, 'MMM yyyy')})
                  </span>
                )}
                {difMeses === 0 && <span className="text-green-favor"> · justo en tu objetivo</span>}.
              </>
            ) : (
              <>Para {fmtMes(meta.fecha_objetivo)} faltan {fase.mesesRestantes} meses.</>
            )}
          </p>
          {sinValuacion && (
            <Button variant="link" size="sm" className="h-auto w-fit p-0 text-xs" onClick={onValuar}>
              La cartera se muestra a costo. Actualizar valores →
            </Button>
          )}
        </CardContent>
      </Card>

      {/* 3. Próximo paso */}
      <Card>
        <CardHeader>
          <CardDescription>Próximo aporte</CardDescription>
          <CardTitle className="text-2xl leading-tight">
            {destino ? (
              <>
                Va a <span className="text-primary">{destino.posicion.ticker || destino.posicion.nombre}</span>
              </>
            ) : (
              'Primero armá la cartera'
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
          {destino ? (
            <p>
              {destino.motivo === 'desriesgo'
                ? <>Es tu posición segura y le faltan {fmtUSD(destino.faltante)} para el {fase.pctSeguro} % que pide esta etapa.</>
                : destino.faltante > 0
                ? <>Es la que más lejos está de su peso objetivo ({destino.posicion.peso_objetivo} %): le faltan {fmtUSD(destino.faltante)}.</>
                : <>Todas están en su peso; va por rebalanceo.</>}
            </p>
          ) : (
            <Button variant="outline" size="sm" className="w-fit" onClick={onPosiciones}>Agregar posiciones</Button>
          )}
          {fase.nombre === 'acumulacion' ? (
            <p>
              Faltan {fase.mesesRestantes} meses para {fmtMes(meta.fecha_objetivo, 'MMM yyyy')}. Hasta {fmtMes(fase.inicioDesriesgo, 'MMM yyyy')} todo va a crecer;
              después empieza el desriesgo.
            </p>
          ) : (
            <p>
              Faltan {fase.mesesRestantes} meses: estás en desriesgo (etapa {fase.etapa}). El {fase.pctSeguro} % de la cartera debería estar en algo seguro y hoy tenés {pctSeguroHoy.toFixed(0)} %.
              {!haySeguro && (
                <>
                  {' '}No tenés ninguna posición con rol &quot;seguro&quot;:{' '}
                  <Button variant="link" size="sm" className="h-auto p-0 text-sm" onClick={onPosiciones}>agregá una</Button>
                  {' '}(plazo fijo, letras, dólares) o corré la fecha objetivo.
                </>
              )}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
