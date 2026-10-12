import { test } from 'node:test'
import assert from 'node:assert/strict'

process.env.USER_1_EMAIL = 'a@test.com'
process.env.USER_1_NAME = 'A'
process.env.USER_2_EMAIL = 'b@test.com'
process.env.USER_2_NAME = 'B'

import { calcularSaldo, calcularResponsabilidad, responsabilidadTotal, calcularSplitCuota } from '../lib/saldo'
import { hoyAR, parseLocalDate, mesAnterior, mesSiguiente } from '../lib/dates'
import type { Gasto, Pago } from '../lib/types'

function gasto(over: Partial<Gasto>): Gasto {
  return {
    id: '1', descripcion: 'x', monto_total: 1000, pagado_por: 'a@test.com', cuotas: 1, cuota_actual: 0,
    fecha_inicio: '2026-09-10', categoria: 'Otros', notas: '', estado: 'activo', moneda: 'ARS',
    tipo_division: '50/50', division_valor: '', recurrente: false, metodo_pago: 'efectivo', tarjeta_id: '',
    ...over,
  }
}
function pago(over: Partial<Pago>): Pago {
  return {
    id: 'p1', gasto_id: '1', numero_cuota: 1, monto: 1000, fecha_vencimiento: '2026-09-10',
    fecha_pago: '2026-09-10', pagado_por: 'a@test.com', estado: 'pagado', ...over,
  }
}

test('50/50: A paga 1000 → B le debe 500', () => {
  const s = calcularSaldo([pago({})], [gasto({})], 'ARS')
  assert.equal(s.monto_deuda, 500)
  assert.equal(s.deudor, 'b@test.com')
})

test('liquidación con porcentaje 0 reduce la deuda en el 100 % (bug del || 50)', () => {
  const g1 = gasto({ id: '1' })
  const liq = gasto({ id: '2', descripcion: 'Liquidacion de deuda', categoria: 'Liquidacion', pagado_por: 'b@test.com', tipo_division: 'porcentaje', division_valor: '0', monto_total: 500 })
  const pagos = [pago({}), pago({ id: 'p2', gasto_id: '2', monto: 500, pagado_por: 'b@test.com' })]
  const s = calcularSaldo(pagos, [g1, liq], 'ARS')
  assert.ok(s.monto_deuda < 0.001, `deuda debería ser 0, es ${s.monto_deuda}`)
})

test('porcentaje: el % es la parte del pagador', () => {
  const round = (r: { u1: number; u2: number }) => ({ u1: Math.round(r.u1), u2: Math.round(r.u2) })
  const g = gasto({ tipo_division: 'porcentaje', division_valor: '70' })
  assert.deepEqual(round(calcularResponsabilidad(g, 1000)), { u1: 700, u2: 300 })
  const g2 = gasto({ tipo_division: 'porcentaje', division_valor: '70', pagado_por: 'b@test.com' })
  assert.deepEqual(round(calcularResponsabilidad(g2, 1000)), { u1: 300, u2: 700 })
})

test('split del form coincide con la responsabilidad del server', () => {
  assert.deepEqual(calcularSplitCuota(1000, 'porcentaje', '0', true), { yo: 0, otro: 1000 })
  assert.deepEqual(calcularSplitCuota(1000, 'monto_fijo', '200', false), { yo: 200, otro: 800 })
})

test('monto fijo con 3 cuotas: el fijo se aplica por cuota', () => {
  const g = gasto({ tipo_division: 'monto_fijo', division_valor: '100', monto_total: 3000, cuotas: 3 })
  const pagos = [1, 2, 3].map(n => pago({ id: `p${n}`, numero_cuota: n, monto: 1000 }))
  assert.deepEqual(responsabilidadTotal(g, pagos), { u1: 2700, u2: 300 })
})

test('gastos personales y cancelados no entran al saldo', () => {
  const gs = [gasto({ id: '1', tipo_division: 'personal' }), gasto({ id: '2', estado: 'cancelado' })]
  const ps = [pago({ gasto_id: '1' }), pago({ id: 'p2', gasto_id: '2' })]
  assert.equal(calcularSaldo(ps, gs, 'ARS').monto_deuda, 0)
})

test('hoyAR devuelve el día de Argentina aunque en UTC ya sea mañana', () => {
  // 2026-10-11 23:30 UTC = 2026-10-11 20:30 ART
  assert.equal(hoyAR(new Date('2026-10-11T23:30:00Z')), '2026-10-11')
  // 2026-10-12 02:30 UTC = 2026-10-11 23:30 ART
  assert.equal(hoyAR(new Date('2026-10-12T02:30:00Z')), '2026-10-11')
})

test('helpers de mes', () => {
  assert.equal(parseLocalDate('2026-03-01').getDate(), 1)
  assert.equal(mesAnterior('2026-01'), '2025-12')
  assert.equal(mesSiguiente('2026-12'), '2027-01')
})
