export async function fetchTipoCambioActual(): Promise<number> {
  // Sin cache de fetch: el valor del día ya se persiste en la hoja tipo_cambio,
  // y el cache de Next falla con Node 24 (ArrayBuffer no detachable).
  const res = await fetch('https://dolarapi.com/v1/dolares/contadoconliqui', { cache: 'no-store' })
  if (!res.ok) throw new Error('No se pudo obtener el tipo de cambio de BNA')
  const data = await res.json()
  return data.venta as number
}

import { getTipoCambioByFecha, saveTipoCambio } from './google-sheets'
import { hoyAR } from './dates'

/**
 * Tipo de cambio (CCL) de hoy: el guardado en la hoja `tipo_cambio` o, si no
 * hay, el de dolarapi (y lo guarda). Devuelve 0 si nada funciona.
 */
export async function getTipoCambioHoy(): Promise<number> {
  const hoy = hoyAR()
  const guardado = await getTipoCambioByFecha(hoy)
  if (guardado) return guardado.valor
  try {
    const valor = await fetchTipoCambioActual()
    await saveTipoCambio(hoy, valor, 'bna')
    return valor
  } catch {
    return 0
  }
}
