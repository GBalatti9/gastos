import { auth } from '@/lib/auth'
import {
  getInvMeta, getInvCobros, getInvAportes, getInvPosiciones, getInvValuaciones,
  asegurarHojas, HOJAS_INVERSION,
} from '@/lib/google-sheets'
import { getTipoCambioHoy } from '@/lib/tipo-cambio'
import { hoyAR, mesActualAR, mesAnterior } from '@/lib/dates'
import {
  debidoDelMes, puestoDelMes, resumenMensual, acumulado, valorCartera, progresoMeta,
  ritmoReal, fechaEstimada, fase, etapasDesriesgo, proximoAporteVa, alertas,
} from '@/lib/inversion'
import { InversionView, type DatosInversion } from '@/components/inversion/inversion-view'

export const dynamic = 'force-dynamic'

export default async function InversionPage() {
  const session = await auth()
  const email = session?.user?.email || ''

  // Primera vez: crea las hojas inv_* en la planilla si no existen
  await asegurarHojas(HOJAS_INVERSION)

  const [meta, cobros, aportes, posiciones, valuaciones, tc] = await Promise.all([
    getInvMeta(email),
    getInvCobros(email),
    getInvAportes(email),
    getInvPosiciones(email),
    getInvValuaciones(email),
    getTipoCambioHoy(),
  ])

  const hoy = hoyAR()
  const mesActual = mesActualAR()

  if (!meta) {
    return <InversionView datos={{ meta: null, cobros, aportes, posiciones, valuaciones, tc, hoy, mesActual, resumen: null }} />
  }

  const cartera = valorCartera(posiciones, aportes, valuaciones)
  const serie = resumenMensual(meta, cobros, aportes, posiciones, valuaciones, mesActual)
  const f = fase(meta, hoy)
  const ritmo = ritmoReal(aportes, meta, mesAnterior(mesActual), 6)
  const debido = debidoDelMes(meta, cobros, mesActual)
  const puesto = puestoDelMes(aportes, mesActual)

  const datos: DatosInversion = {
    meta,
    cobros,
    aportes,
    posiciones,
    valuaciones,
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
      alertas: alertas({ meta, cobros, aportes, posiciones, valuaciones, hoy, tc }),
    },
  }

  return <InversionView datos={datos} />
}
