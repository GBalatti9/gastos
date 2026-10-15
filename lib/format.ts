import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { primerDiaDelMes } from './dates'

export const fmtUSD = (n: number, decimales = 0) =>
  `US$ ${n.toLocaleString('es-AR', { minimumFractionDigits: decimales, maximumFractionDigits: decimales })}`

export const fmtARS = (n: number) => `$ ${Math.round(n).toLocaleString('es-AR')}`

export const fmtPct = (n: number, decimales = 0) => `${n.toFixed(decimales)} %`

/** `2030-06` → "junio 2030" */
export const fmtMes = (mes: string, patron = 'MMMM yyyy') =>
  mes ? format(primerDiaDelMes(mes), patron, { locale: es }) : ''

/** `2026-10-11` → "11 oct 2026" */
export const fmtFecha = (ymd: string) => {
  if (!ymd) return ''
  const [y, m, d] = ymd.split('-').map(Number)
  return format(new Date(y, m - 1, d), 'd MMM yyyy', { locale: es })
}

/** Parsea lo que tipea el usuario: "1.234,56", "460.000" o "1234.56" → número */
export function parseMonto(s: string): number {
  const limpio = s.replace(/[^\d.,-]/g, '')
  if (!limpio) return 0
  // Con coma, o con puntos agrupando de a tres ("460.000"), es formato es-AR: punto = miles
  const esAR = limpio.includes(',') || /^-?\d{1,3}(\.\d{3})+$/.test(limpio)
  const normal = esAR ? limpio.replace(/\./g, '').replace(',', '.') : limpio
  const n = parseFloat(normal)
  return Number.isFinite(n) ? n : 0
}
