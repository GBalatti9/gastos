import { test } from 'node:test'
import assert from 'node:assert/strict'

process.env.USER_1_EMAIL = 'a@test.com'
process.env.USER_1_NAME = 'A'
process.env.USER_2_EMAIL = 'b@test.com'
process.env.USER_2_NAME = 'B'

import { resumenPorMes, promedioMensual } from '../lib/metricas'
import type { Gasto, Pago } from '../lib/types'

function gasto(over: Partial<Gasto>): Gasto {
  return {
    id: '1', descripcion: 'x', monto_total: 1000, pagado_por: 'a@test.com', cuotas: 1, cuota_actual: 0,
    fecha_inicio: '2026-07-10', categoria: 'Otros', notas: '', estado: 'activo', moneda: 'ARS',
    tipo_division: '50/50', division_valor: '', recurrente: false, metodo_pago: 'efectivo', tarjeta_id: '',
    ...over,
  }
}
function pago(over: Partial<Pago>): Pago {
  return {
    id: 'p', gasto_id: '1', numero_cuota: 1, monto: 1000, fecha_vencimiento: '2026-07-10',
    fecha_pago: null, pagado_por: null, estado: 'pendiente', ...over,
  }
}

const gastos = [
  gasto({ id: 'casa' }),                                                      // 50/50, 1000 → 500/500
  gasto({ id: 'persA', tipo_division: 'personal', monto_total: 300 }),       // personal de A
  gasto({ id: 'persB', tipo_division: 'personal', pagado_por: 'b@test.com', monto_total: 200 }),
  gasto({ id: 'liq', categoria: 'Liquidacion', tipo_division: 'porcentaje', division_valor: '0', pagado_por: 'b@test.com' }),
  gasto({ id: 'cancel', estado: 'cancelado' }),
  gasto({ id: 'usd', moneda: 'USD' }),
]
const pagos = [
  pago({ id: '1', gasto_id: 'casa', fecha_vencimiento: '2026-07-10' }),
  pago({ id: '2', gasto_id: 'casa', fecha_vencimiento: '2026-08-10', monto: 2000 }),
  pago({ id: '3', gasto_id: 'persA', fecha_vencimiento: '2026-07-15', monto: 300 }),
  pago({ id: '4', gasto_id: 'persB', fecha_vencimiento: '2026-08-15', monto: 200 }),
  pago({ id: '5', gasto_id: 'liq', fecha_vencimiento: '2026-07-20', monto: 5000 }),
  pago({ id: '6', gasto_id: 'cancel', fecha_vencimiento: '2026-07-20', monto: 9999 }),
  pago({ id: '7', gasto_id: 'usd', fecha_vencimiento: '2026-07-20', monto: 100 }),
  pago({ id: '8', gasto_id: 'casa', fecha_vencimiento: '2026-10-10', monto: 4000 }), // mes "actual" en el test
]

test('resumenPorMes agrupa por vencimiento y excluye liquidaciones, cancelados y USD', () => {
  const r = resumenPorMes(pagos, gastos, 'ARS')
  assert.deepEqual(r.map(x => x.mes), ['2026-07', '2026-08', '2026-10'])
  const jul = r[0]
  assert.equal(jul.pareja, 1000)
  assert.equal(jul.casaU1, 500)
  assert.equal(jul.personalU1, 300)
  assert.equal(jul.u1, 800)
  assert.equal(jul.u2, 500)
  const ago = r[1]
  assert.equal(ago.pareja, 2000)
  assert.equal(ago.u2, 1200)
})

test('promedioMensual solo usa meses completos y los últimos N', () => {
  const r = resumenPorMes(pagos, gastos, 'ARS')
  const p = promedioMensual(r, { hastaMes: '2026-09', ultimos: 6 })
  assert.deepEqual(p.meses, ['2026-07', '2026-08'])
  assert.equal(p.pareja, 1500)
  assert.equal(p.u1, (800 + 1000) / 2)
  assert.equal(p.u2, (500 + 1200) / 2)

  const p1 = promedioMensual(r, { hastaMes: '2026-09', ultimos: 1 })
  assert.deepEqual(p1.meses, ['2026-08'])
  assert.equal(p1.pareja, 2000)
})

test('sin meses completos el promedio es 0 y no NaN', () => {
  const p = promedioMensual([], {})
  assert.equal(p.pareja, 0)
  assert.deepEqual(p.meses, [])
})
