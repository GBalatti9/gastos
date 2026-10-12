import { Gasto, Pago, SaldoData, Moneda } from './types'
import { getUsers } from './users'

/**
 * Porcentaje que le corresponde al PAGADOR en una división "porcentaje".
 * Ojo: `parseFloat('0') || 50` daba 50 y rompía las liquidaciones (que usan 0 %).
 */
export function porcentajePagador(divisionValor: string): number {
  const raw = parseFloat(divisionValor)
  if (!Number.isFinite(raw)) return 50
  return Math.min(100, Math.max(0, raw))
}

/**
 * Split de una cuota desde el punto de vista del usuario actual.
 * Lo usan los forms para el preview. Misma lógica que `calcularResponsabilidad`.
 */
export function calcularSplitCuota(
  montoCuota: number,
  tipoDivision: string,
  divisionValor: string,
  yoSoyPagador: boolean
): { yo: number; otro: number } {
  switch (tipoDivision) {
    case 'porcentaje': {
      const pct = porcentajePagador(divisionValor) / 100
      const yo = yoSoyPagador ? montoCuota * pct : montoCuota * (1 - pct)
      return { yo, otro: montoCuota - yo }
    }
    case 'monto_fijo': {
      const fijo = parseFloat(divisionValor) || 0
      const resto = Math.max(0, montoCuota - fijo)
      if (yoSoyPagador) return { yo: resto, otro: fijo }
      return { yo: fijo, otro: resto }
    }
    case 'personal':
      return yoSoyPagador ? { yo: montoCuota, otro: 0 } : { yo: 0, otro: montoCuota }
    default:
      return { yo: montoCuota / 2, otro: montoCuota / 2 }
  }
}

// Calcula cuánto debería haber pagado cada usuario para un gasto dado
export function calcularResponsabilidad(gasto: Gasto, montoPago: number): { u1: number; u2: number } {
  const [u1] = getUsers()
  const pagadorEsU1 = gasto.pagado_por === u1.email

  switch (gasto.tipo_division) {
    case 'porcentaje': {
      const pctPagador = porcentajePagador(gasto.division_valor) / 100
      const pctOtro = 1 - pctPagador
      return pagadorEsU1
        ? { u1: montoPago * pctPagador, u2: montoPago * pctOtro }
        : { u1: montoPago * pctOtro, u2: montoPago * pctPagador }
    }
    case 'monto_fijo': {
      // El otro usuario debe un monto fijo por cuota, el pagador asume el resto
      const montoFijo = parseFloat(gasto.division_valor) || 0
      const resto = Math.max(0, montoPago - montoFijo)
      return pagadorEsU1
        ? { u1: resto, u2: montoFijo }
        : { u1: montoFijo, u2: resto }
    }
    case 'personal':
      // Gasto personal: el pagador asume el 100%, no genera deuda
      return pagadorEsU1 ? { u1: montoPago, u2: 0 } : { u1: 0, u2: montoPago }
    case '50/50':
    default:
      return { u1: montoPago / 2, u2: montoPago / 2 }
  }
}

/**
 * Responsabilidad de cada usuario sobre el TOTAL de un gasto, sumando cuota
 * por cuota. Importa para `monto_fijo`, donde el fijo es por cuota: aplicar
 * `calcularResponsabilidad(g, g.monto_total)` lo contaría una sola vez.
 */
export function responsabilidadTotal(gasto: Gasto, pagos: Pago[]): { u1: number; u2: number } {
  const propios = pagos.filter(p => p.gasto_id === gasto.id)
  if (propios.length === 0) return calcularResponsabilidad(gasto, gasto.monto_total)
  return propios.reduce(
    (acc, p) => {
      const r = calcularResponsabilidad(gasto, p.monto)
      return { u1: acc.u1 + r.u1, u2: acc.u2 + r.u2 }
    },
    { u1: 0, u2: 0 }
  )
}

export function calcularSaldo(pagos: Pago[], gastos: Gasto[], moneda: Moneda = 'ARS'): SaldoData {
  const [u1, u2] = getUsers()

  // Incluir todos los pagos activos (pendientes y pagados)
  // Para pendientes, el pagador es quien figura en el gasto (gasto.pagado_por)
  // Para pagados, el pagador es quien realmente lo abonó (pago.pagado_por)
  const gastosFiltrados = gastos.filter(
    g => (g.moneda || 'ARS') === moneda && g.estado === 'activo' && g.tipo_division !== 'personal'
  )
  const porId = new Map(gastosFiltrados.map(g => [g.id, g]))

  let debeU1 = 0
  let pagoU1 = 0
  let pagoU2 = 0

  for (const pago of pagos) {
    const gasto = porId.get(pago.gasto_id)
    if (!gasto) continue

    const { u1: resp1 } = calcularResponsabilidad(gasto, pago.monto)
    debeU1 += resp1

    const pagador = pago.pagado_por || gasto.pagado_por
    if (pagador === u1.email) pagoU1 += pago.monto
    else if (pagador === u2.email) pagoU2 += pago.monto
  }

  // diferencia = cuánto pagó U1 vs cuánto debía pagar
  // positivo = U1 pagó de más → U2 le debe
  const diferencia = pagoU1 - debeU1

  const deudor = diferencia > 0 ? u2.email : u1.email
  const acreedor = diferencia > 0 ? u1.email : u2.email
  const monto_deuda = Math.abs(diferencia)

  return {
    user1: { email: u1.email, nombre: u1.nombre, total_pagado: pagoU1 },
    user2: { email: u2.email, nombre: u2.nombre, total_pagado: pagoU2 },
    diferencia,
    deudor,
    acreedor,
    monto_deuda,
    moneda,
  }
}

/**
 * Calcula el saldo solo para los pagos cuya fecha_vencimiento cae en el mes indicado.
 * Funciona tanto para gastos con tarjeta (billing cycle) como sin tarjeta (calendario).
 */
export function calcularSaldoMensual(
  pagos: Pago[],
  gastos: Gasto[],
  moneda: Moneda,
  mes: string // formato: "2026-04"
): SaldoData {
  // Comparar por string evita bugs de timezone con new Date("2026-03-01")
  const pagosMes = pagos.filter(p => p.fecha_vencimiento.slice(0, 7) === mes)
  return calcularSaldo(pagosMes, gastos, moneda)
}

/**
 * Calcula el saldo solo con pagos cuya fecha_vencimiento > fin del mes indicado (futuro).
 */
export function calcularSaldoFuturo(
  pagos: Pago[],
  gastos: Gasto[],
  moneda: Moneda,
  mes: string // formato: "2026-06"
): SaldoData {
  const pagosFuturos = pagos.filter(p => p.fecha_vencimiento.slice(0, 7) > mes)
  return calcularSaldo(pagosFuturos, gastos, moneda)
}

/**
 * Calcula el saldo acumulado hasta el final del mes indicado (inclusive).
 * Incluye todos los pagos con fecha_vencimiento <= último día del mes.
 * Esto da el comportamiento "Splitwise" donde deudas impagas se arrastran.
 */
export function calcularSaldoAcumulado(
  pagos: Pago[],
  gastos: Gasto[],
  moneda: Moneda,
  mes: string // formato: "2026-04"
): SaldoData {
  const pagosHastaMes = pagos.filter(p => p.fecha_vencimiento.slice(0, 7) <= mes)
  return calcularSaldo(pagosHastaMes, gastos, moneda)
}
