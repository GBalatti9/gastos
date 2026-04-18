import { TarjetaCredito } from './types'
import { addMonths, setDate, getDaysInMonth } from 'date-fns'

/**
 * Determina en qué mes de facturación cae una compra según la fecha de cierre de la tarjeta.
 * Si la compra es después del cierre, va al mes siguiente.
 * Retorna el 1ro del mes de facturación.
 */
export function calcularMesBilling(fechaCompra: Date, tarjeta: TarjetaCredito): Date {
  const diaCompra = fechaCompra.getDate()
  const anio = fechaCompra.getFullYear()
  const mes = fechaCompra.getMonth()

  if (diaCompra > tarjeta.fecha_cierre) {
    // Va al próximo mes de facturación
    const next = addMonths(new Date(anio, mes, 1), 1)
    return new Date(next.getFullYear(), next.getMonth(), 1)
  }

  // Va al mes actual de facturación
  return new Date(anio, mes, 1)
}

/**
 * Calcula la fecha de vencimiento de una cuota específica.
 * - Determina el mes base de billing
 * - Si el día de vencimiento de la tarjeta es menor que el día de cierre,
 *   el vencimiento cae en el mes siguiente al billing (ej: cierra 20, vence 5 del mes siguiente)
 * - Suma el número de cuota en meses
 */
export function calcularFechaVencimientoCuota(
  fechaCompra: Date,
  numeroCuota: number, // 0-indexed (0 = primera cuota)
  tarjeta: TarjetaCredito
): Date {
  const mesBilling = calcularMesBilling(fechaCompra, tarjeta)

  // Si el vencimiento es antes del cierre, cae en el mes siguiente al billing
  const offset = tarjeta.fecha_vencimiento < tarjeta.fecha_cierre ? 1 : 0

  const mesTarget = addMonths(mesBilling, numeroCuota + offset)

  // Clampear el día al máximo del mes (ej: día 31 en febrero → 28/29)
  const diaMax = getDaysInMonth(mesTarget)
  const dia = Math.min(tarjeta.fecha_vencimiento, diaMax)

  return setDate(mesTarget, dia)
}
