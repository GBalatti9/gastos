import { Pago, SaldoData } from './types'
import { getUsers } from './users'

export function calcularSaldo(pagos: Pago[]): SaldoData {
  const [u1, u2] = getUsers()
  const pagados = pagos.filter(p => p.estado === 'pagado')

  let totalU1 = 0
  let totalU2 = 0

  for (const pago of pagados) {
    if (pago.pagado_por === u1.email) totalU1 += pago.monto
    else if (pago.pagado_por === u2.email) totalU2 += pago.monto
  }

  // Cada uno debería haber pagado 50% del total
  const totalGeneral = totalU1 + totalU2
  const mitad = totalGeneral / 2

  const diferencia = totalU1 - mitad // positivo = U1 pagó más, U2 debe

  const deudor = diferencia > 0 ? u2.email : u1.email
  const acreedor = diferencia > 0 ? u1.email : u2.email
  const monto_deuda = Math.abs(diferencia)

  return {
    user1: { email: u1.email, nombre: u1.nombre, total_pagado: totalU1 },
    user2: { email: u2.email, nombre: u2.nombre, total_pagado: totalU2 },
    diferencia,
    deudor,
    acreedor,
    monto_deuda,
  }
}
