import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { primerDiaDelMes } from './dates'

export const fmtUSD = (n: number, decimales = 0) =>
  `US$ ${n.toLocaleString('es-AR', { minimumFractionDigits: decimales, maximumFractionDigits: decimales })}`

export const fmtARS = (n: number) => `$ ${Math.round(n).toLocaleString('es-AR')}`

export const fmtPct = (n: number, decimales = 0) => `${n.toFixed(decimales)} %`

/** `2029-04` → "abril 2029" */
export const fmtMes = (mes: string, patron = 'MMMM yyyy') =>
  mes ? format(primerDiaDelMes(mes), patron, { locale: es }) : ''

/** `2026-10-11` → "11 oct 2026" */
export const fmtFecha = (ymd: string) => {
  if (!ymd) return ''
  const [y, m, d] = ymd.split('-').map(Number)
  return format(new Date(y, m - 1, d), 'd MMM yyyy', { locale: es })
}

/** Parsea lo que tipea el usuario: "1.234,56" o "1234.56" → 1234.56 */
export function parseMonto(s: string): number {
  const limpio = s.replace(/[^\d.,-]/g, '')
  if (!limpio) return 0
  // Si tiene coma, asumimos formato es-AR (punto = miles, coma = decimal)
  const normal = limpio.includes(',') ? limpio.replace(/\./g, '').replace(',', '.') : limpio
  const n = parseFloat(normal)
  return Number.isFinite(n) ? n : 0
}
