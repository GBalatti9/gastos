'use client'

import { Suspense, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Plus, Settings2, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { OpcionesToggle } from '@/components/gastos/opciones-toggle'
import type {
  Alerta, DestinoAporte, EtapaDesriesgo, Fase, MesInversion, Sugerencia, ValorCartera,
} from '@/lib/inversion'
import type { Precio } from '@/lib/precios'
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
  metas: InvMeta[]
  /** Meta seleccionada (la primera por defecto). */
  meta: InvMeta | null
  cobros: InvCobro[]
  /** Aportes, posiciones y valuaciones de la meta seleccionada. */
  aportes: InvAporte[]
  posiciones: InvPosicion[]
  valuaciones: InvValuacion[]
  /** Cotización actual por id de posición (solo las que tienen precio automático). */
  precios: Record<string, Precio>
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
  const { metas, meta, resumen } = datos

  const tabInicial = (searchParams.get('tab') as Tab) || 'resumen'
  const [tab, setTab] = useState<Tab>(TABS.includes(tabInicial) ? tabInicial : 'resumen')

  // Dialogs. Las `key` fuerzan un remount al abrir, así el estado inicial sale fresco de las props.
  const [metaOpen, setMetaOpen] = useState(false)
  const [metaNueva, setMetaNueva] = useState(false)
  const [cobroOpen, setCobroOpen] = useState(() => !!meta && searchParams.get('cobro') === '1')
  const [aporteOpen, setAporteOpen] = useState(() => !!meta && searchParams.get('aporte') === '1')
  const [posicionesOpen, setPosicionesOpen] = useState(false)
  const [valuacionesOpen, setValuacionesOpen] = useState(false)
  const [aporteKey, setAporteKey] = useState(0)
  const [prefill, setPrefill] = useState<PrefillAporte | undefined>(undefined)
  const [aporteEditando, setAporteEditando] = useState<InvAporte | undefined>(undefined)
  const [dialogKey, setDialogKey] = useState(0)
  const bump = () => setDialogKey((k) => k + 1)

  function irAMeta(id: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('meta', id)
    router.push(`${pathname}?${params.toString()}`)
  }

  function limpiarQuery() {
    if (!searchParams.get('cobro') && !searchParams.get('aporte')) return
    const params = new URLSearchParams(searchParams.toString())
    params.delete('cobro')
    params.delete('aporte')
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname)
  }

  function abrirAporte({ prefill, editar }: { prefill?: PrefillAporte; editar?: InvAporte } = {}) {
    setPrefill(prefill)
    setAporteEditando(editar)
    setAporteKey((k) => k + 1)
    setAporteOpen(true)
  }

  function onCobroGuardado(cobro: InvCobro, sugerencias: { meta_id: string; sugerencia: Sugerencia }[], registrarAporte: boolean) {
    const deEsta = sugerencias.find((s) => s.meta_id === meta?.id)?.sugerencia
    if (registrarAporte && deEsta && deEsta.total_usd > 0) {
      abrirAporte({ prefill: { monto_usd: deEsta.total_usd, cobro_id: cobro.id } })
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
              Definí una meta en dólares con fecha, cuánto aportás por mes y qué parte de los extras invertís.
              Después armás tu cartera con tus instrumentos (CEDEARs, bonos, FCI, cripto, dólares…) y cada vez
              que cargues un cobro la app te dice cuánto te toca invertir y cuándo llegás.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button size="lg" onClick={() => { bump(); setMetaNueva(true); setMetaOpen(true) }}>Configurar mi meta</Button>
          </EmptyContent>
        </Empty>
        <MetaDialog
          key={`meta-${dialogKey}`}
          open={metaOpen}
          onOpenChange={setMetaOpen}
          meta={null}
          onGuardada={(m) => { irAMeta(m.id); bump(); setPosicionesOpen(true) }}
        />
        {/* Tras crear la meta se abre el armado de la cartera */}
        <PosicionesDialog key={`pos-${dialogKey}`} open={posicionesOpen} onOpenChange={setPosicionesOpen} posiciones={[]} metaId={metas[0]?.id ?? ''} primeraVez />
      </>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Selector de meta */}
      {(
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1 overflow-x-auto">
            <OpcionesToggle
              aria-label="Meta"
              value={meta.id}
              onChange={irAMeta}
              opciones={metas.map((m) => ({ value: m.id, label: m.nombre }))}
              layout="wrap"
              className="w-max"
              itemClassName="h-9 px-3"
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => { bump(); setMetaNueva(true); setMetaOpen(true) }}>
            <Plus data-icon="inline-start" />
            Meta
          </Button>
          <Button variant="ghost" size="icon" aria-label="Editar meta" onClick={() => { bump(); setMetaNueva(false); setMetaOpen(true) }}>
            <Settings2 />
          </Button>
        </div>
      )}

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <div className="overflow-x-auto">
          <TabsList className="w-max">
            <TabsTrigger value="resumen">Resumen</TabsTrigger>
            <TabsTrigger value="cartera">Cartera</TabsTrigger>
            <TabsTrigger value="historial">Historial</TabsTrigger>
            <TabsTrigger value="escenarios">Escenarios</TabsTrigger>
            <TabsTrigger value="desriesgo">Desriesgo</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="resumen">
          <ResumenInversion
            meta={meta}
            resumen={resumen}
            tc={datos.tc}
            mesActual={datos.mesActual}
            onCobro={() => { bump(); setCobroOpen(true) }}
            onAporte={() => abrirAporte()}
            onValuar={() => { bump(); setValuacionesOpen(true) }}
            onPosiciones={() => { bump(); setPosicionesOpen(true) }}
          />
        </TabsContent>
        <TabsContent value="cartera">
          <Cartera
            cartera={resumen.cartera}
            tc={datos.tc}
            onValuar={() => { bump(); setValuacionesOpen(true) }}
            onPosiciones={() => { bump(); setPosicionesOpen(true) }}
          />
        </TabsContent>
        <TabsContent value="historial">
          <HistorialChart serie={resumen.serie} cobros={datos.cobros} aportes={datos.aportes} posiciones={datos.posiciones} onEditarAporte={(a) => abrirAporte({ editar: a })} />
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

      <MetaDialog
        key={`meta-${dialogKey}`}
        open={metaOpen}
        onOpenChange={setMetaOpen}
        meta={metaNueva ? null : meta}
        puedeBorrar={metas.length > 1}
        onGuardada={(m) => { if (metaNueva) { irAMeta(m.id); bump(); setPosicionesOpen(true) } }}
      />
      <CobroDialog
        key={`cobro-${dialogKey}`}
        open={cobroOpen}
        onOpenChange={(o) => { setCobroOpen(o); if (!o) limpiarQuery() }}
        metas={metas}
        metaActual={meta}
        cobros={datos.cobros}
        tc={datos.tc}
        onGuardado={onCobroGuardado}
      />
      <AporteDialog
        key={`aporte-${aporteKey}`}
        open={aporteOpen}
        onOpenChange={(o) => { setAporteOpen(o); if (!o) { setPrefill(undefined); limpiarQuery() } }}
        metaId={meta.id}
        posiciones={datos.posiciones}
        destino={resumen.destino}
        precios={datos.precios}
        tc={datos.tc}
        prefill={prefill}
        aporte={aporteEditando}
      />
      <PosicionesDialog key={`pos-${dialogKey}`} open={posicionesOpen} onOpenChange={setPosicionesOpen} posiciones={datos.posiciones} metaId={meta.id} />
      <ValuacionesDialog key={`val-${dialogKey}`} open={valuacionesOpen} onOpenChange={setValuacionesOpen} porPosicion={resumen.cartera.porPosicion} />
    </div>
  )
}
