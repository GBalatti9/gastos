import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  extraDeCobro, sugerenciaParaCobro, debidoDelMes, puestoDelMes, resumenMensual, acumulado,
  valorCartera, progresoMeta, ritmoReal, fechaEstimada, fase, etapasDesriesgo, proximoAporteVa,
  alertas, mesesEntre, sumarMeses,
} from '../lib/inversion'
import type { InvMeta, InvCobro, InvAporte, InvPosicion, InvValuacion } from '../lib/types'

const EMAIL = 'a@test.com'
const meta: InvMeta = {
  id: 'm1', nombre: 'Meta', email: EMAIL, monto_objetivo_usd: 50000, fecha_objetivo: '2029-04', aporte_base_usd: 500,
  ingreso_base_ars: 3_500_000, pct_extra: 100, fecha_inicio: '2026-07', desriesgo_etapas: [30, 60, 90],
}
const TC = 1400
const cobro = (o: Partial<InvCobro>): InvCobro => ({ id: 'c1', email: EMAIL, fecha: '2026-10-05', monto_ars: 3_500_000, tipo: 'base', tipo_cambio: TC, notas: '', ...o })
const aporte = (o: Partial<InvAporte>): InvAporte => ({ id: 'a1', email: EMAIL, fecha: '2026-10-06', monto_usd: 500, monto_ars: 500 * TC, tipo_cambio: TC, posicion_id: 'spy', cobro_id: '', notas: '', unidades: 0, precio: 0, meta_id: 'm1', ...o })
const pos = (o: Partial<InvPosicion>): InvPosicion => ({ id: 'x', email: EMAIL, ticker: '', nombre: '', peso_objetivo: 0, rol: 'core', activo: true, tipo: 'cedear', moneda: 'ARS', meta_id: 'm1', ...o })
const posiciones: InvPosicion[] = [
  pos({ id: 'spy', ticker: 'SPY', nombre: 'S&P 500', peso_objetivo: 60, rol: 'core' }),
  pos({ id: 'qqq', ticker: 'QQQ', nombre: 'Nasdaq', peso_objetivo: 25, rol: 'satelite' }),
  pos({ id: 'bono', ticker: 'AL30', nombre: 'Seguro', peso_objetivo: 15, rol: 'seguro', tipo: 'bono' }),
  pos({ id: 'old', ticker: 'OLD', nombre: 'Baja', peso_objetivo: 0, rol: 'satelite', activo: false }),
]

test('extra: cobro extra va entero; cobro base solo el excedente sobre el ingreso base', () => {
  assert.equal(extraDeCobro(cobro({ tipo: 'extra', monto_ars: 700_000 }), meta).ars, 700_000)
  assert.equal(extraDeCobro(cobro({ monto_ars: 4_200_000 }), meta).ars, 700_000)
  assert.equal(extraDeCobro(cobro({ monto_ars: 3_000_000 }), meta).ars, 0)
  assert.equal(extraDeCobro(cobro({ tipo: 'extra', monto_ars: 1000 }), { ...meta, pct_extra: 70 }).ars, 700)
})

test('sugerencia: base 500 al primer cobro base del mes, no al segundo', () => {
  const s1 = sugerenciaParaCobro(cobro({ monto_ars: 4_200_000 }), meta, [])
  assert.equal(s1.incluye_base, true)
  assert.equal(s1.base_ars, 500 * TC)
  assert.equal(Math.round(s1.total_ars), 700_000 + 500 * TC)
  const s2 = sugerenciaParaCobro(cobro({ id: 'c2', fecha: '2026-10-20', monto_ars: 3_500_000 }), meta, [cobro({})])
  assert.equal(s2.incluye_base, false)
  assert.equal(s2.total_usd, 0)
  const s3 = sugerenciaParaCobro(cobro({ id: 'c3', tipo: 'extra', monto_ars: 140_000 }), meta, [cobro({})])
  assert.equal(s3.total_usd, 100)
})

test('debido y puesto del mes', () => {
  const cobros = [cobro({}), cobro({ id: 'c2', tipo: 'extra', monto_ars: 140_000, fecha: '2026-10-15' })]
  assert.equal(debidoDelMes(meta, cobros, '2026-10'), 600)
  assert.equal(debidoDelMes(meta, cobros, '2026-06'), 0) // antes de empezar
  assert.equal(puestoDelMes([aporte({}), aporte({ id: 'a2', monto_usd: 120 })], '2026-10'), 620)
})

test('serie mensual y acumulado', () => {
  const aportes = [aporte({ fecha: '2026-07-10' }), aporte({ id: 'a2', fecha: '2026-08-10', monto_usd: 300 }), aporte({ id: 'a3', fecha: '2026-10-01' })]
  const serie = resumenMensual(meta, [], aportes, posiciones, [], '2026-10')
  assert.deepEqual(serie.map(r => r.mes), ['2026-07', '2026-08', '2026-09', '2026-10'])
  assert.deepEqual(serie.map(r => r.desvio), [0, -200, -500, 0])
  const acc = acumulado(serie)
  assert.equal(acc.debido, 2000)
  assert.equal(acc.puesto, 1300)
  assert.equal(acc.desvio, -700)
  assert.equal(serie[3].aportadoAcumulado, 1300)
})

test('valor de cartera: costo sin valuación, valuación + aportes posteriores con valuación', () => {
  const aportes = [aporte({ fecha: '2026-07-10', monto_usd: 1000 }), aporte({ id: 'a2', fecha: '2026-09-10', monto_usd: 200 }), aporte({ id: 'a3', fecha: '2026-08-01', monto_usd: 300, posicion_id: 'qqq' }), aporte({ id: 'a4', fecha: '2026-08-01', monto_usd: 50, posicion_id: 'old' })]
  const sinVal = valorCartera(posiciones, aportes, [])
  assert.equal(sinVal.total, 1500) // la posición inactiva no cuenta
  assert.equal(sinVal.porPosicion.find(v => v.posicion.id === 'spy')?.fuente, 'costo')
  const vals: InvValuacion[] = [{ id: 'v1', email: EMAIL, fecha: '2026-08-31', posicion_id: 'spy', valor_usd: 1100, meta_id: 'm1' }]
  const conVal = valorCartera(posiciones, aportes, vals)
  const spy = conVal.porPosicion.find(v => v.posicion.id === 'spy')!
  assert.equal(spy.fuente, 'valuacion')
  assert.equal(spy.valor, 1300) // 1100 valuado + 200 aportados después
  assert.equal(conVal.total, 1600)
  assert.equal(conVal.aportado, 1500)
  // a una fecha anterior a la valuación, usa costo
  assert.equal(valorCartera(posiciones, aportes, vals, '2026-07-31').total, 1000)
})

test('progreso, ritmo real y fecha estimada', () => {
  assert.deepEqual(progresoMeta(25594, meta), { pct: 51.188, faltante: 24406 })
  const aportes = [aporte({ fecha: '2026-07-10', monto_usd: 600 }), aporte({ id: 'a2', fecha: '2026-09-10', monto_usd: 300 })]
  // jul, ago, sep completos: (600 + 0 + 300) / 3
  assert.equal(ritmoReal(aportes, meta, '2026-09', 6), 300)
  assert.equal(fechaEstimada(0, 1200, 100, 0, '2026-10'), '2027-10')
  assert.equal(fechaEstimada(1200, 1200, 100, 0, '2026-10'), '2026-10')
  assert.equal(fechaEstimada(0, 1000, 0, 0, '2026-10'), null)
  const con8 = fechaEstimada(25000, 50000, 500, 0.08, '2026-10')!
  const sin = fechaEstimada(25000, 50000, 500, 0, '2026-10')!
  assert.ok(con8 < sin, `con rendimiento llega antes: ${con8} < ${sin}`)
  assert.equal(sin, '2030-12') // 50 meses de 500
})

test('fases por meses restantes', () => {
  assert.equal(mesesEntre('2026-10', '2029-04'), 30)
  assert.equal(sumarMeses('2029-04', -24), '2027-04')
  assert.equal(fase(meta, '2026-10-11').etapa, 0)
  assert.equal(fase(meta, '2027-04-01').etapa, 1)
  assert.equal(fase(meta, '2028-04-01').etapa, 2)
  assert.equal(fase(meta, '2028-10-01').etapa, 3)
  assert.equal(fase(meta, '2027-04-01').pctSeguro, 30)
  assert.equal(fase(meta, '2026-10-11').inicioDesriesgo, '2027-04')
})

test('etapas de desriesgo con montos', () => {
  const aportes = [aporte({ monto_usd: 8500 }), aporte({ id: 'a2', monto_usd: 1500, posicion_id: 'bono' })]
  const cartera = valorCartera(posiciones, aportes, [])
  const etapas = etapasDesriesgo(meta, cartera, '2026-10-11')
  assert.deepEqual(etapas.map(e => e.mes), ['2027-04', '2028-04', '2028-10'])
  assert.deepEqual(etapas.map(e => e.usdAMover), [1500, 4500, 7500]) // 30/60/90 % de 10000 menos 1500 en seguro
  assert.equal(etapas.some(e => e.actual), false)
})

test('próximo aporte: rebalanceo en acumulación, balde seguro en desriesgo', () => {
  const aportes = [aporte({ monto_usd: 7000 }), aporte({ id: 'a2', monto_usd: 1000, posicion_id: 'qqq' }), aporte({ id: 'a3', monto_usd: 1000, posicion_id: 'bono' })]
  const cartera = valorCartera(posiciones, aportes, [])
  // total 9000: objetivos 5400 / 2250 / 1350 → faltantes -1600 / 1250 / 350 → QQQ
  const d = proximoAporteVa(cartera, fase(meta, '2026-10-11'), 500)!
  assert.equal(d.posicion.ticker, 'QQQ')
  assert.equal(d.motivo, 'rebalanceo')
  const dd = proximoAporteVa(cartera, fase(meta, '2028-05-01'), 500)!
  assert.equal(dd.posicion.ticker, 'AL30')
  assert.equal(dd.motivo, 'desriesgo')
  assert.equal(proximoAporteVa({ total: 0, aportado: 0, porPosicion: [] }, fase(meta), 0), null)
})

test('alertas', () => {
  const base = { meta, posiciones, valuaciones: [] as InvValuacion[], tc: TC }
  // 1: día 26 sin aportes
  const a1 = alertas({ ...base, cobros: [], aportes: [], hoy: '2026-10-26' })
  assert.ok(a1.some(a => a.tipo === 'sin_aporte_mes'))
  assert.ok(!alertas({ ...base, cobros: [], aportes: [], hoy: '2026-10-10' }).some(a => a.tipo === 'sin_aporte_mes'))
  // 2: cobro extra hace 3 días sin aporte
  const a2 = alertas({ ...base, cobros: [cobro({ tipo: 'extra', monto_ars: 700_000, fecha: '2026-10-08' })], aportes: [], hoy: '2026-10-11' })
  assert.ok(a2.some(a => a.tipo === 'extra_sin_invertir'))
  const a2ok = alertas({ ...base, cobros: [cobro({ tipo: 'extra', monto_ars: 700_000, fecha: '2026-10-08' })], aportes: [aporte({ fecha: '2026-10-09' })], hoy: '2026-10-11' })
  assert.ok(!a2ok.some(a => a.tipo === 'extra_sin_invertir'))
  // 3: dólar se movió: aportó 500 USD a 1400 pero hoy el TC es 1600
  const a3 = alertas({ ...base, tc: 1600, cobros: [], aportes: [aporte({})], hoy: '2026-10-11' })
  assert.ok(a3.some(a => a.tipo === 'dolar_movio'))
  // 4: en desriesgo con caída > 20 %
  const vals: InvValuacion[] = [
    { id: 'v1', email: EMAIL, fecha: '2028-01-31', posicion_id: 'spy', valor_usd: 10000, meta_id: 'm1' },
    { id: 'v2', email: EMAIL, fecha: '2028-04-30', posicion_id: 'spy', valor_usd: 7000, meta_id: 'm1' },
  ]
  const a4 = alertas({ ...base, valuaciones: vals, cobros: [], aportes: [aporte({ fecha: '2027-01-01', monto_usd: 9000 })], hoy: '2028-05-01' })
  assert.ok(a4.some(a => a.tipo === 'caida_desriesgo'))
})

test('valor con precio automático: unidades × precio, bonos cada 100, dólares = aportado', () => {
  const ps = [
    pos({ id: 'aapl', ticker: 'AAPL', tipo: 'cedear', moneda: 'ARS', peso_objetivo: 50 }),
    pos({ id: 'al30', ticker: 'AL30', tipo: 'bono', moneda: 'ARS', peso_objetivo: 30, rol: 'seguro' }),
    pos({ id: 'usd', ticker: '', tipo: 'dolares', moneda: 'USD', peso_objetivo: 20, rol: 'seguro' }),
  ]
  const aps = [
    aporte({ id: '1', posicion_id: 'aapl', monto_usd: 100, unidades: 10, precio: 14000 }),
    aporte({ id: '2', posicion_id: 'al30', monto_usd: 100, unidades: 200, precio: 70000 }), // 200 nominales
    aporte({ id: '3', posicion_id: 'usd', monto_usd: 300 }),
  ]
  const precios = new Map([
    ['aapl', { precio: 28000, moneda: 'ARS' as const, cada100: false, fuente: 'test' }],
    ['al30', { precio: 86570, moneda: 'ARS' as const, cada100: true, fuente: 'test' }],
  ])
  const c = valorCartera(ps, aps, [], '9999-12-31', precios, 1400)
  const por = Object.fromEntries(c.porPosicion.map(v => [v.posicion.id, v]))
  assert.equal(por.aapl.fuente, 'precio')
  assert.equal(Math.round(por.aapl.valor), 200) // 10 × 28000 / 1400
  assert.equal(por.al30.fuente, 'precio')
  assert.equal(Math.round(por.al30.valor), Math.round((200 * 86570) / 100 / 1400))
  assert.equal(por.usd.fuente, 'dolares')
  assert.equal(por.usd.valor, 300)
  // sin precios ni unidades → costo
  const sin = valorCartera(ps, aps, [])
  assert.equal(Object.fromEntries(sin.porPosicion.map(v => [v.posicion.id, v.fuente])).aapl, 'costo')
})
