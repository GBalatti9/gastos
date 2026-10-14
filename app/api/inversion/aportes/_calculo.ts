import { getPrecios, tienePrecioAuto, unidadesPorMonto } from '@/lib/precios'
import type { InvPosicion } from '@/lib/types'
import { num } from '../_auth'

/**
 * Acepta monto_usd o monto_ars y completa el otro con el tipo de cambio.
 * Devuelve null si no queda un monto positivo. Ya redondeados para guardar.
 */
export function normalizarMontos(b: { monto_usd?: unknown; monto_ars?: unknown }, tipo_cambio: number) {
  let monto_usd = num(b.monto_usd)
  let monto_ars = num(b.monto_ars)
  if (monto_usd <= 0 && monto_ars > 0 && tipo_cambio > 0) monto_usd = monto_ars / tipo_cambio
  if (monto_ars <= 0 && monto_usd > 0) monto_ars = monto_usd * tipo_cambio
  if (monto_usd <= 0) return null
  return { monto_usd: Math.round(monto_usd * 100) / 100, monto_ars: Math.round(monto_ars) }
}

/** Unidades compradas con `monto_usd` a la cotización de hoy, si la posición tiene precio automático. */
export async function unidadesAuto(posicion: InvPosicion, monto_usd: number, tipo_cambio: number) {
  if (!tienePrecioAuto(posicion)) return null
  const p = (await getPrecios([posicion])).get(posicion.id)
  return p ? { unidades: unidadesPorMonto(monto_usd, p, tipo_cambio), precio: p.precio } : null
}

export const redondearUnidades = (u: number) => Math.round(u * 1e6) / 1e6
