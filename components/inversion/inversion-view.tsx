'use client'

import { Suspense, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Settings2, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import type {
  Alerta, DestinoAporte, EtapaDesriesgo, Fase, MesInversion, Sugerencia, ValorCartera,
} from '@/lib/inversion'
import type { InvAporte, InvCobro, InvMeta, InvPosicion, InvValuacion } from '@/lib/types'
import { MetaDialog } from './meta-dialog'
import { CobroDialog } from './cobro-dialog'
import { AporteDialog, type PrefillAporte } from './aporte-dialog'
import { PosicionesDialog } from './posiciones-dialog'
import { ValuacionesDialog } from './valuaciones-dialog'
import { ResumenInversion } from './resumen-inversion'
import { Cartera } from './cartera'
import { HistorialChart } from './historial-chart'
import { Escenarios } from './escenarios'
import { Desriesgo } from './desriesgo'

export interface ResumenInv {
  esteMes: { debido: number; puesto: number; desvio: number }
  acumulado: { debido: number; puesto: number; desvio: number }
  cartera: ValorCartera
  progreso: { pct: number; faltante: number }
  ritmo: number
  fechaEstimada: string | null
  destino: DestinoAporte | null
  fase: Fase
  etapas: EtapaDesriesgo[]
  serie: MesInversion[]
  alertas: Alerta[]
}

export interface DatosInversion {
  meta: InvMeta | null
  cobros: InvCobro[]
  aportes: InvAporte[]
  posiciones: InvPosicion[]
  valuaciones: InvValuacion[]
  tc: number
  hoy: string
  mesActual: string
  resumen: ResumenInv | null
}

const TABS = ['resumen', 'cartera', 'historial', 'escenarios', 'desriesgo'] as const
type Tab = (typeof TABS)[number]

export function InversionView({ datos }: { datos: DatosInversion }) {
  return (
    <Suspense fallback={null}>
      <InversionViewInner datos={datos} />
    </Suspense>
  )
}

function InversionViewInner({ datos }: { datos: DatosInversion }) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const { meta, resumen } = datos

  const tabInicial = (searchParams.get('tab') as Tab) || 'resumen'
  const [tab, setTab] = useState<Tab>(TABS.includes(tabInicial) ? tabInicial : 'resumen')

  // Dialogs. Las `key` fuerzan un remount al abrir, así el estado inicial sale fresco de las props.
  const [metaOpen, setMetaOpen] = useState(false)
  const [cobroOpen, setCobroOpen] = useState(() => !!meta && searchParams.get('cobro') === '1')
  const [aporteOpen, setAporteOpen] = useState(() => !!meta && searchParams.get('aporte') === '1')
  const [posicionesOpen, setPosicionesOpen] = useState(false)
  const [valuacionesOpen, setValuacionesOpen] = useState(false)
  const [aporteKey, setAporteKey] = useState(0)
  const [prefill, setPrefill] = useState<PrefillAporte | undefined>(undefined)
  const [dialogKey, setDialogKey] = useState(0)

  function limpiarQuery() {
    if (!searchParams.get('cobro') && !searchParams.get('aporte')) return
    const params = new URLSearchParams(searchParams.toString())
    params.delete('cobro')
    params.delete('aporte')
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname)
  }

  function abrirAporte(p?: PrefillAporte) {
    setPrefill(p)
    setAporteKey((k) => k + 1)
    setAporteOpen(true)
  }

  function onCobroGuardado(cobro: InvCobro, sugerencia: Sugerencia, registrarAporte: boolean) {
    if (registrarAporte && sugerencia.total_usd > 0) {
      abrirAporte({ monto_usd: sugerencia.total_usd, cobro_id: cobro.id })
    }
  }

  // ── Sin meta: onboarding ────────────────────────────────────────────────
  if (!meta || !resumen) {
    return (
      <>
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Target />
            </EmptyMedia>
            <EmptyTitle>Inversión con objetivo</EmptyTitle>
            <EmptyDescription>
              Definí tu meta en dólares, cuánto aportás por mes y qué parte de los extras invertís.
              Después, cada vez que cargues un cobro la app te dice cuánto te toca invertir y cuándo llegás.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button size="lg" onClick={() => setMetaOpen(true)}>Configurar mi meta</Button>
          </EmptyContent>
        </Empty>
        <MetaDialog key={`meta-${dialogKey}`} open={metaOpen} onOpenChange={(o) => { setMetaOpen(o); if (!o) setDialogKey((k) => k + 1) }} meta={null} />
      </>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1 overflow-x-auto">
            <TabsList className="w-max">
              <TabsTrigger value="resumen">Resumen</TabsTrigger>
              <TabsTrigger value="cartera">Cartera</TabsTrigger>
              <TabsTrigger value="historial">Historial</TabsTrigger>
              <TabsTrigger value="escenarios">Escenarios</TabsTrigger>
              <TabsTrigger value="desriesgo">Desriesgo</TabsTrigger>
            </TabsList>
          </div>
          <Button variant="ghost" size="icon" aria-label="Editar meta" onClick={() => { setDialogKey((k) => k + 1); setMetaOpen(true) }}>
            <Settings2 />
          </Button>
        </div>

        <TabsContent value="resumen">
          <ResumenInversion
            meta={meta}
            resumen={resumen}
            tc={datos.tc}
            onCobro={() => { setDialogKey((k) => k + 1); setCobroOpen(true) }}
            onAporte={() => abrirAporte()}
            onValuar={() => { setDialogKey((k) => k + 1); setValuacionesOpen(true) }}
          />
        </TabsContent>
        <TabsContent value="cartera">
          <Cartera
            cartera={resumen.cartera}
            onValuar={() => { setDialogKey((k) => k + 1); setValuacionesOpen(true) }}
            onPosiciones={() => { setDialogKey((k) => k + 1); setPosicionesOpen(true) }}
          />
        </TabsContent>
        <TabsContent value="historial">
          <HistorialChart serie={resumen.serie} cobros={datos.cobros} aportes={datos.aportes} posiciones={datos.posiciones} />
        </TabsContent>
        <TabsContent value="escenarios">
          <Escenarios
            valorActual={resumen.cartera.total}
            objetivo={meta.monto_objetivo_usd}
            fechaObjetivo={meta.fecha_objetivo}
            ritmoReal={resumen.ritmo}
            aporteBase={meta.aporte_base_usd}
            mesActual={datos.mesActual}
          />
        </TabsContent>
        <TabsContent value="desriesgo">
          <Desriesgo meta={meta} fase={resumen.fase} etapas={resumen.etapas} cartera={resumen.cartera} />
        </TabsContent>
      </Tabs>

      <MetaDialog key={`meta-${dialogKey}`} open={metaOpen} onOpenChange={setMetaOpen} meta={meta} />
      <CobroDialog
        key={`cobro-${dialogKey}`}
        open={cobroOpen}
        onOpenChange={(o) => { setCobroOpen(o); if (!o) limpiarQuery() }}
        meta={meta}
        cobros={datos.cobros}
        tc={datos.tc}
        onGuardado={onCobroGuardado}
      />
      <AporteDialog
        key={`aporte-${aporteKey}`}
        open={aporteOpen}
        onOpenChange={(o) => { setAporteOpen(o); if (!o) { setPrefill(undefined); limpiarQuery() } }}
        posiciones={datos.posiciones}
        destino={resumen.destino}
        tc={datos.tc}
        prefill={prefill}
      />
      <PosicionesDialog key={`pos-${dialogKey}`} open={posicionesOpen} onOpenChange={setPosicionesOpen} posiciones={datos.posiciones} />
      <ValuacionesDialog key={`val-${dialogKey}`} open={valuacionesOpen} onOpenChange={setValuacionesOpen} porPosicion={resumen.cartera.porPosicion} />
    </div>
  )
}
