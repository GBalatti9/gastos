import { auth } from '@/lib/auth'
import {
  getInvMetas, getInvCobros, getInvAportes, getInvPosiciones, getInvValuaciones,
  asegurarHojas, HOJAS_INVERSION,
} from '@/lib/google-sheets'
import { getTipoCambioHoy } from '@/lib/tipo-cambio'
import { getPrecios } from '@/lib/precios'
import { hoyAR, mesActualAR, mesAnterior } from '@/lib/dates'
import {
  debidoDelMes, puestoDelMes, resumenMensual, acumulado, valorCartera, progresoMeta,
  ritmoReal, fechaEstimada, fase, etapasDesriesgo, proximoAporteVa, alertas,
} from '@/lib/inversion'
import { InversionView, type DatosInversion } from '@/components/inversion/inversion-view'

export const dynamic = 'force-dynamic'

export default async function InversionPage({ searchParams }: { searchParams: Promise<{ meta?: string }> }) {
  const session = await auth()
  const email = session?.user?.email || ''
  const { meta: metaParam } = await searchParams

  // Primera vez: crea las hojas inv_* (y las columnas nuevas) en la planilla
  await asegurarHojas(HOJAS_INVERSION)

  const [metas, cobros, todosAportes, todasPosiciones, todasValuaciones, tc] = await Promise.all([
    getInvMetas(email),
    getInvCobros(email),
    getInvAportes(email),
    getInvPosiciones(email),
    getInvValuaciones(email),
    getTipoCambioHoy(),
  ])

  const hoy = hoyAR()
  const mesActual = mesActualAR()
  const meta = metas.find(m => m.id === metaParam) ?? metas[0] ?? null

  if (!meta) {
    return (
      <InversionView
        datos={{ metas, meta: null, cobros, aportes: [], posiciones: [], valuaciones: [], precios: {}, tc, hoy, mesActual, resumen: null }}
      />
    )
  }

  // Filas viejas sin meta_id pertenecen a la primera meta
  const esDefault = meta.id === metas[0].id
  const deMeta = <T extends { meta_id: string }>(x: T) => x.meta_id === meta.id || (esDefault && !x.meta_id)
  const posiciones = todasPosiciones.filter(deMeta)
  const aportes = todosAportes.filter(deMeta)
  const valuaciones = todasValuaciones.filter(deMeta)

  const precios = await getPrecios(posiciones)
  const cartera = valorCartera(posiciones, aportes, valuaciones, '9999-12-31', precios, tc)
  const serie = resumenMensual(meta, cobros, aportes, posiciones, valuaciones, mesActual, precios, tc)
  const f = fase(meta, hoy)
  const ritmo = ritmoReal(aportes, meta, mesAnterior(mesActual), 6)
  const debido = debidoDelMes(meta, cobros, mesActual)
  const puesto = puestoDelMes(aportes, mesActual)

  const datos: DatosInversion = {
    metas,
    meta,
    cobros,
    aportes,
    posiciones,
    valuaciones,
    precios: Object.fromEntries(precios),
    tc,
    hoy,
    mesActual,
    resumen: {
      esteMes: { debido, puesto, desvio: puesto - debido },
      acumulado: acumulado(serie),
      cartera,
      progreso: progresoMeta(cartera.total, meta),
      ritmo,
      fechaEstimada: fechaEstimada(cartera.total, meta.monto_objetivo_usd, ritmo, 0, mesActual),
      destino: proximoAporteVa(cartera, f, meta.aporte_base_usd),
      fase: f,
      etapas: etapasDesriesgo(meta, cartera, hoy),
      serie,
      alertas: alertas({ meta, cobros, aportes, posiciones, valuaciones, hoy, tc, precios }),
    },
  }

  return <InversionView datos={datos} />
}
