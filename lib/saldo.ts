import { Gasto, Pago, SaldoData, Moneda } from './types'
import { getUsers } from './users'

// Calcula cuánto debería haber pagado cada usuario para un gasto dado
function calcularResponsabilidad(gasto: Gasto, montoPago: number): { u1: number; u2: number } {
  const [u1] = getUsers()
  const pagadorEsU1 = gasto.pagado_por === u1.email

  switch (gasto.tipo_division) {
    case 'porcentaje': {
      const pct = parseFloat(gasto.division_valor) || 50
      const pctPagador = pct / 100
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
    case '50/50':
    default:
      return { u1: montoPago / 2, u2: montoPago / 2 }
  }
}

export function calcularSaldo(pagos: Pago[], gastos: Gasto[], moneda: Moneda = 'ARS'): SaldoData {
  const [u1, u2] = getUsers()

  // Incluir todos los pagos activos (pendientes y pagados)
  // Para pendientes, el pagador es quien figura en el gasto (gasto.pagado_por)
  // Para pagados, el pagador es quien realmente lo abonó (pago.pagado_por)
  const gastosFiltrados = gastos.filter(g => (g.moneda || 'ARS') === moneda && g.estado === 'activo')
  const gastoIds = new Set(gastosFiltrados.map(g => g.id))

  let debeU1 = 0
  let debeU2 = 0
  let pagoU1 = 0
  let pagoU2 = 0

  for (const pago of pagos) {
    const gasto = gastos.find(g => g.id === pago.gasto_id)
    if (!gasto || !gastoIds.has(gasto.id)) continue

    const { u1: resp1, u2: resp2 } = calcularResponsabilidad(gasto, pago.monto)
    debeU1 += resp1
    debeU2 += resp2

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
