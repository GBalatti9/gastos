'use client'

import { Check, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { fmtMes, fmtUSD } from '@/lib/format'
import type { EtapaDesriesgo, Fase, ValorCartera } from '@/lib/inversion'
import type { InvMeta } from '@/lib/types'
import { cn } from '@/lib/utils'

interface Props {
  meta: InvMeta
  fase: Fase
  etapas: EtapaDesriesgo[]
  cartera: ValorCartera
}

export function Desriesgo({ meta, fase, etapas, cartera }: Props) {
  const valorSeguro = cartera.porPosicion.filter((v) => v.posicion.rol === 'seguro').reduce((s, v) => s + v.valor, 0)
  const pctSeguroActual = cartera.total > 0 ? (valorSeguro / cartera.total) * 100 : 0
  const haySeguro = cartera.porPosicion.some((v) => v.posicion.rol === 'seguro')

  return (
    <Card>
      <CardHeader>
        <CardTitle>Desriesgo</CardTitle>
        <CardDescription>
          A medida que se acerca {fmtMes(meta.fecha_objetivo)}, una parte creciente de la cartera pasa al balde seguro.
          Hoy: <span className="font-medium text-foreground">{pctSeguroActual.toFixed(0)} %</span> en seguro ({fmtUSD(valorSeguro)}).
          {fase.nombre === 'acumulacion' ? ` Fase de acumulación hasta ${fmtMes(fase.inicioDesriesgo, 'MMM yyyy')}.` : ` Estás en la etapa ${fase.etapa}.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!haySeguro && (
          <p className="mb-4 text-sm text-orange-alert">No tenés ninguna posición con rol &quot;seguro&quot;. Agregá una en Cartera → Posiciones.</p>
        )}
        <ol className="relative flex flex-col gap-6 border-l pl-6">
          {etapas.map((e) => (
            <li key={e.etapa} className="relative">
              <span
                className={cn(
                  'absolute -left-[31px] flex size-5 items-center justify-center rounded-full border bg-background',
                  e.pasada && 'border-green-favor bg-green-favor text-background',
                  e.actual && 'border-primary bg-primary text-primary-foreground'
                )}
              >
                {e.pasada ? <Check className="size-3" /> : e.actual ? <ShieldCheck className="size-3" /> : <span className="text-[10px]">{e.etapa}</span>}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium capitalize">{fmtMes(e.mes)}</p>
                <Badge variant={e.actual ? 'default' : 'outline'}>{e.mesesAntes} meses antes</Badge>
                {e.actual && <Badge variant="secondary">etapa actual</Badge>}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {e.pctSeguro} % en seguro = {fmtUSD(e.usdObjetivoSeguro)} con la cartera de hoy.
                {e.usdAMover > 0
                  ? <> Habría que mover <span className="font-medium text-foreground">{fmtUSD(e.usdAMover)}</span> al balde seguro.</>
                  : ' Ya está cubierto.'}
              </p>
            </li>
          ))}
          <li className="relative">
            <span className="absolute -left-[31px] flex size-5 items-center justify-center rounded-full border bg-background text-[10px]">🎯</span>
            <p className="font-medium capitalize">{fmtMes(meta.fecha_objetivo)}</p>
            <p className="mt-1 text-sm text-muted-foreground">Fecha objetivo: {fmtUSD(meta.monto_objetivo_usd)}.</p>
          </li>
        </ol>
        <p className="mt-6 text-xs text-muted-foreground">
          Los montos se recalculan con el valor actual de la cartera. En desriesgo, el aporte sugerido va al balde seguro hasta cubrir el % de la etapa.
          Si la cartera cae más de 20 % en esta fase, te avisamos para revisar la fecha o el precio objetivo.
        </p>
      </CardContent>
    </Card>
  )
}
