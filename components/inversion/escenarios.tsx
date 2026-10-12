'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Field, FieldLabel } from '@/components/ui/field'
import { fechaEstimada, mesesEntre } from '@/lib/inversion'
import { fmtMes, fmtUSD } from '@/lib/format'
import { cn } from '@/lib/utils'

interface Props {
  valorActual: number
  objetivo: number
  fechaObjetivo: string
  ritmoReal: number
  aporteBase: number
  mesActual: string
}

export function Escenarios({ valorActual, objetivo, fechaObjetivo, ritmoReal, aporteBase, mesActual }: Props) {
  const [aporte, setAporte] = useState(Math.round(ritmoReal > 0 ? ritmoReal : aporteBase))
  const [rendimiento, setRendimiento] = useState(0)

  const fecha = fechaEstimada(valorActual, objetivo, aporte, rendimiento / 100, mesActual)
  const dif = fecha ? mesesEntre(fechaObjetivo, fecha) : null
  const mesesHasta = fecha ? mesesEntre(mesActual, fecha) : null

  const presets = [
    { label: 'Mi ritmo real', aporte: Math.round(ritmoReal), rend: 0, disabled: ritmoReal <= 0 },
    { label: `Base ${fmtUSD(aporteBase)}`, aporte: aporteBase, rend: 0 },
    { label: 'US$ 750', aporte: 750, rend: 0 },
    { label: 'US$ 1.000 + 8 %', aporte: 1000, rend: 8 },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Escenarios</CardTitle>
        <CardDescription>¿Y si pongo más por mes? ¿Y si el mercado rinde 0 %? Movés los controles y ves la fecha.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="rounded-xl border bg-muted/30 p-4 text-center">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Llegás a {fmtUSD(objetivo)} en</p>
          <p className="mt-1 text-3xl font-semibold capitalize">{fecha ? fmtMes(fecha) : 'nunca'}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {fecha && mesesHasta !== null ? `${mesesHasta} meses desde hoy · ` : ''}
            {dif === null ? (
              'con ese aporte y rendimiento no se alcanza'
            ) : (
              <Badge variant="outline" className={cn(dif > 0 ? 'text-orange-alert' : 'text-green-favor')}>
                {dif > 0 ? `${dif} meses después` : dif < 0 ? `${-dif} meses antes` : 'justo'} de {fmtMes(fechaObjetivo, 'MMM yyyy')}
              </Badge>
            )}
          </p>
        </div>

        <Field>
          <div className="flex items-center justify-between">
            <FieldLabel>Aporte mensual</FieldLabel>
            <span className="text-sm font-semibold tabular-nums">{fmtUSD(aporte)}</span>
          </div>
          <Slider min={0} max={2000} step={25} value={aporte} onValueChange={(v) => setAporte(Array.isArray(v) ? v[0] : v)} />
        </Field>

        <Field>
          <div className="flex items-center justify-between">
            <FieldLabel>Rendimiento anual</FieldLabel>
            <span className="text-sm font-semibold tabular-nums">{rendimiento} %</span>
          </div>
          <Slider min={-10} max={15} step={1} value={rendimiento} onValueChange={(v) => setRendimiento(Array.isArray(v) ? v[0] : v)} />
        </Field>

        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <Button key={p.label} size="sm" variant="outline" disabled={p.disabled} onClick={() => { setAporte(p.aporte); setRendimiento(p.rend) }}>
              {p.label}
            </Button>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          Parte de {fmtUSD(valorActual)} hoy. El rendimiento se capitaliza mes a mes; 0 % es el escenario conservador.
        </p>
      </CardContent>
    </Card>
  )
}
