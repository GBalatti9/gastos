/**
 * Helpers de fecha. Todo el proyecto guarda fechas como strings `YYYY-MM-DD`
 * y meses como `YYYY-MM`. Estas funciones evitan dos bugs recurrentes:
 *
 * - `new Date('2026-03-01')` se interpreta en UTC: en Argentina (UTC-3) da
 *   28 de febrero. Usar `parseLocalDate`.
 * - En Vercel el server corre en UTC: `format(new Date(), 'yyyy-MM-dd')` a las
 *   22:00 ART devuelve el día siguiente. Usar `hoyAR()`.
 */

export const TZ_AR = 'America/Argentina/Buenos_Aires'

/** Parsea `YYYY-MM-DD` como fecha local (sin desfase por timezone). */
export function parseLocalDate(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

/** Fecha de hoy en Argentina como `YYYY-MM-DD`, independiente del TZ del server. */
export function hoyAR(ahora: Date = new Date()): string {
  // 'en-CA' formatea como YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ_AR,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(ahora)
}

/** Mes actual en Argentina como `YYYY-MM`. */
export function mesActualAR(ahora: Date = new Date()): string {
  return hoyAR(ahora).slice(0, 7)
}

/** `YYYY-MM-DD` → `YYYY-MM`. */
export function yyyyMm(ymd: string): string {
  return ymd.slice(0, 7)
}

export function mesAnterior(mes: string): string {
  const [y, m] = mes.split('-').map(Number)
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`
}

export function mesSiguiente(mes: string): string {
  const [y, m] = mes.split('-').map(Number)
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`
}

/** Convierte un `YYYY-MM` en fecha local del día 1 de ese mes. */
export function primerDiaDelMes(mes: string): Date {
  const [y, m] = mes.split('-').map(Number)
  return new Date(y, m - 1, 1)
}

/** Fecha del timestamp (ms) en Argentina como `YYYY-MM-DD`. */
export function fechaARDeTimestamp(ms: number): string {
  return hoyAR(new Date(ms))
}
