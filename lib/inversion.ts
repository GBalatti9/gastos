import type { InvMeta, InvCobro, InvAporte, InvPosicion, InvValuacion } from './types'
import { mesAnterior, mesSiguiente, hoyAR, mesActualAR } from './dates'
import { valorUnidades, type Precio } from './precios'

/**
 * Lógica del módulo de inversión con objetivo. Todo es puro: recibe los
 * datos del usuario y calcula. Nada de esto se guarda en la planilla.
 *
 * Convenciones:
 * - meses `YYYY-MM`; un cobro/aporte pertenece al mes de su `fecha`
 * - montos en USD salvo que el nombre diga `ars`
 * - "este mes" compara debido vs puesto (solo aportes); la meta y la fecha
 *   estimada usan el valor de la cartera (aportes + rendimiento)
 */

export const ETAPAS_MESES = [24, 12, 6] as const

const mes = (fecha: string) => fecha.slice(0, 7)

/** Cantidad de meses entre dos `YYYY-MM` (b − a). */
export function mesesEntre(a: string, b: string): number {
  const [ay, am] = a.split('-').map(Number)
  const [by, bm] = b.split('-').map(Number)
  return (by - ay) * 12 + (bm - am)
}

export function sumarMeses(m: string, n: number): string {
  let cur = m
  for (let i = 0; i < Math.abs(n); i++) cur = n > 0 ? mesSiguiente(cur) : mesAnterior(cur)
  return cur
}

// ─── Cobros → cuánto te toca ─────────────────────────────────────────────────

/** Parte "extra" de un cobro: lo que excede el ingreso base (o todo, si es extra) × % a invertir. */
export function extraDeCobro(cobro: Pick<InvCobro, 'monto_ars' | 'tipo' | 'tipo_cambio'>, meta: InvMeta): { ars: number; usd: number } {
  const pct = Math.min(100, Math.max(0, meta.pct_extra)) / 100
  const excedente = cobro.tipo === 'extra' ? cobro.monto_ars : Math.max(0, cobro.monto_ars - meta.ingreso_base_ars)
  const ars = excedente * pct
  const usd = cobro.tipo_cambio > 0 ? ars / cobro.tipo_cambio : 0
  return { ars, usd }
}

export interface Sugerencia {
  incluye_base: boolean
  base_usd: number
  base_ars: number
  extra_usd: number
  extra_ars: number
  total_usd: number
  total_ars: number
}

/**
 * "De este cobro te toca invertir ARS X". La base (US$ 500) se asigna al
 * primer cobro base del mes; los extras siempre suman.
 */
export function sugerenciaParaCobro(
  cobro: Pick<InvCobro, 'monto_ars' | 'tipo' | 'tipo_cambio' | 'fecha'> & { id?: string },
  meta: InvMeta,
  otrosCobros: InvCobro[]
): Sugerencia {
  const yaHayBase = otrosCobros.some(
    c => c.id !== cobro.id && c.tipo === 'base' && mes(c.fecha) === mes(cobro.fecha)
  )
  const incluye_base = cobro.tipo === 'base' && !yaHayBase
  const base_usd = incluye_base ? meta.aporte_base_usd : 0
  const base_ars = base_usd * cobro.tipo_cambio
  const extra = extraDeCobro(cobro, meta)
  return {
    incluye_base,
    base_usd,
    base_ars,
    extra_usd: extra.usd,
    extra_ars: extra.ars,
    total_usd: base_usd + extra.usd,
    total_ars: base_ars + extra.ars,
  }
}

// ─── Mes a mes ───────────────────────────────────────────────────────────────

/** Debido del mes = base + extras de los cobros del mes (cada extra al TC de su cobro). */
export function debidoDelMes(meta: InvMeta, cobros: InvCobro[], m: string): number {
  if (m < meta.fecha_inicio) return 0
  const extras = cobros.filter(c => mes(c.fecha) === m).reduce((s, c) => s + extraDeCobro(c, meta).usd, 0)
  return meta.aporte_base_usd + extras
}

export function puestoDelMes(aportes: InvAporte[], m: string): number {
  return aportes.filter(a => mes(a.fecha) === m).reduce((s, a) => s + a.monto_usd, 0)
}

export interface ValorPosicion {
  posicion: InvPosicion
  valor: number
  /** precio = cotización automática; valuacion = cargada a mano; dolares = vale lo aportado; costo = sin dato. */
  fuente: 'precio' | 'valuacion' | 'dolares' | 'costo'
  fecha_valuacion: string | null
  aportado: number
  unidades: number
  precio: Precio | null
}

export interface ValorCartera {
  total: number
  aportado: number
  porPosicion: ValorPosicion[]
}

/**
 * Valor de la cartera a una fecha, por posición y en este orden:
 * 1. dólares quietos → valen lo aportado
 * 2. precio automático (si hay cotización y unidades) → unidades × precio de hoy
 * 3. última valuación manual hasta esa fecha + aportes posteriores
 * 4. costo (suma de aportes)
 * Solo posiciones activas. `precios` se pasa solo para "hoy" (no para meses pasados).
 */
export function valorCartera(
  posiciones: InvPosicion[],
  aportes: InvAporte[],
  valuaciones: InvValuacion[],
  hastaFecha: string = '9999-12-31',
  precios?: Map<string, Precio>,
  tc = 0
): ValorCartera {
  const porPosicion: ValorPosicion[] = posiciones
    .filter(p => p.activo)
    .map(p => {
      const aportesPos = aportes.filter(a => a.posicion_id === p.id && a.fecha <= hastaFecha)
      const aportado = aportesPos.reduce((s, a) => s + a.monto_usd, 0)
      const unidades = aportesPos.reduce((s, a) => s + (a.unidades || 0), 0)
      const base = { posicion: p, aportado, unidades, precio: null as Precio | null }

      if (p.tipo === 'dolares') return { ...base, valor: aportado, fuente: 'dolares', fecha_valuacion: null }

      const precio = precios?.get(p.id)
      if (precio && unidades > 0 && (precio.moneda === 'USD' || tc > 0)) {
        return { ...base, valor: valorUnidades(unidades, precio, tc), fuente: 'precio', fecha_valuacion: null, precio }
      }

      const ultima = valuaciones
        .filter(v => v.posicion_id === p.id && v.fecha <= hastaFecha)
        .sort((a, b) => b.fecha.localeCompare(a.fecha))[0]
      if (!ultima) return { ...base, valor: aportado, fuente: 'costo', fecha_valuacion: null }
      const posteriores = aportesPos.filter(a => a.fecha > ultima.fecha).reduce((s, a) => s + a.monto_usd, 0)
      return { ...base, valor: ultima.valor_usd + posteriores, fuente: 'valuacion', fecha_valuacion: ultima.fecha }
    })
  return {
    total: porPosicion.reduce((s, v) => s + v.valor, 0),
    aportado: porPosicion.reduce((s, v) => s + v.aportado, 0),
    porPosicion,
  }
}

export interface MesInversion {
  mes: string
  debido: number
  puesto: number
  desvio: number
  aportadoAcumulado: number
  valorCartera: number
}

/** Serie mensual desde `fecha_inicio` hasta `hastaMes` (inclusive). */
export function resumenMensual(
  meta: InvMeta,
  cobros: InvCobro[],
  aportes: InvAporte[],
  posiciones: InvPosicion[],
  valuaciones: InvValuacion[],
  hastaMes: string,
  precios?: Map<string, Precio>,
  tc = 0
): MesInversion[] {
  const out: MesInversion[] = []
  if (!meta.fecha_inicio || hastaMes < meta.fecha_inicio) return out
  let acumulado = 0
  for (let m = meta.fecha_inicio; m <= hastaMes; m = mesSiguiente(m)) {
    const debido = debidoDelMes(meta, cobros, m)
    const puesto = puestoDelMes(aportes, m)
    acumulado += puesto
    out.push({
      mes: m,
      debido,
      puesto,
      desvio: puesto - debido,
      aportadoAcumulado: acumulado,
      valorCartera: valorCartera(posiciones, aportes, valuaciones, `${m}-31`, m === hastaMes ? precios : undefined, tc).total,
    })
    if (out.length > 600) break
  }
  return out
}

/** Acumulado contra el plan desde que empezaste (meses completos + el actual). */
export function acumulado(serie: MesInversion[]): { debido: number; puesto: number; desvio: number } {
  const debido = serie.reduce((s, r) => s + r.debido, 0)
  const puesto = serie.reduce((s, r) => s + r.puesto, 0)
  return { debido, puesto, desvio: puesto - debido }
}

// ─── Meta y fecha ────────────────────────────────────────────────────────────

export function progresoMeta(valor: number, meta: InvMeta): { pct: number; faltante: number } {
  const objetivo = meta.monto_objetivo_usd
  if (objetivo <= 0) return { pct: 0, faltante: 0 }
  return { pct: Math.min(100, (valor / objetivo) * 100), faltante: Math.max(0, objetivo - valor) }
}

/** Promedio USD/mes aportado en los últimos N meses completos (los meses sin aportes cuentan 0). */
export function ritmoReal(aportes: InvAporte[], meta: InvMeta, hastaMesCompleto: string, ultimos = 6): number {
  if (!meta.fecha_inicio || hastaMesCompleto < meta.fecha_inicio) return 0
  const meses: string[] = []
  for (let m = hastaMesCompleto; meses.length < ultimos && m >= meta.fecha_inicio; m = mesAnterior(m)) meses.push(m)
  if (meses.length === 0) return 0
  const total = meses.reduce((s, m) => s + puestoDelMes(aportes, m), 0)
  return total / meses.length
}

/**
 * Mes en que se alcanza el objetivo aportando `aporteMensual` con rendimiento
 * anual `rendimientoAnual` (0.08 = 8 %), partiendo de `valor` en `desdeMes`.
 * null si no se alcanza en 50 años.
 */
export function fechaEstimada(
  valor: number,
  objetivo: number,
  aporteMensual: number,
  rendimientoAnual = 0,
  desdeMes: string = mesActualAR()
): string | null {
  if (objetivo <= 0) return null
  if (valor >= objetivo) return desdeMes
  const r = Math.pow(1 + rendimientoAnual, 1 / 12) - 1
  let v = valor
  let m = desdeMes
  for (let i = 0; i < 600; i++) {
    m = mesSiguiente(m)
    v = v * (1 + r) + aporteMensual
    if (v >= objetivo) return m
    if (aporteMensual <= 0 && r <= 0) return null
  }
  return null
}

// ─── Fases y desriesgo ───────────────────────────────────────────────────────

export interface Fase {
  nombre: 'acumulacion' | 'desriesgo'
  /** 0 = acumulación; 1, 2, 3 = etapas a 24, 12 y 6 meses. */
  etapa: 0 | 1 | 2 | 3
  mesesRestantes: number
  /** % objetivo de la cartera en el balde seguro en la etapa actual. */
  pctSeguro: number
  /** Mes en que arranca el desriesgo (24 meses antes de la fecha objetivo). */
  inicioDesriesgo: string
}

export function fase(meta: InvMeta, hoy: string = hoyAR()): Fase {
  const mesesRestantes = mesesEntre(mes(hoy), meta.fecha_objetivo)
  const inicioDesriesgo = sumarMeses(meta.fecha_objetivo, -ETAPAS_MESES[0])
  let etapa: Fase['etapa'] = 0
  if (mesesRestantes <= ETAPAS_MESES[2]) etapa = 3
  else if (mesesRestantes <= ETAPAS_MESES[1]) etapa = 2
  else if (mesesRestantes <= ETAPAS_MESES[0]) etapa = 1
  return {
    nombre: etapa === 0 ? 'acumulacion' : 'desriesgo',
    etapa,
    mesesRestantes,
    pctSeguro: etapa === 0 ? 0 : meta.desriesgo_etapas[etapa - 1],
    inicioDesriesgo,
  }
}

export interface EtapaDesriesgo {
  etapa: 1 | 2 | 3
  mesesAntes: number
  mes: string
  pctSeguro: number
  usdObjetivoSeguro: number
  usdAMover: number
  actual: boolean
  pasada: boolean
}

export function etapasDesriesgo(meta: InvMeta, cartera: ValorCartera, hoy: string = hoyAR()): EtapaDesriesgo[] {
  const f = fase(meta, hoy)
  const valorSeguro = cartera.porPosicion.filter(v => v.posicion.rol === 'seguro').reduce((s, v) => s + v.valor, 0)
  return ETAPAS_MESES.map((mesesAntes, i) => {
    const etapa = (i + 1) as 1 | 2 | 3
    const pct = meta.desriesgo_etapas[i]
    const usdObjetivoSeguro = (pct / 100) * cartera.total
    return {
      etapa,
      mesesAntes,
      mes: sumarMeses(meta.fecha_objetivo, -mesesAntes),
      pctSeguro: pct,
      usdObjetivoSeguro,
      usdAMover: Math.max(0, usdObjetivoSeguro - valorSeguro),
      actual: f.etapa === etapa,
      pasada: f.etapa > etapa,
    }
  })
}

// ─── Próximo aporte ──────────────────────────────────────────────────────────

export interface DestinoAporte {
  posicion: InvPosicion
  faltante: number
  motivo: 'rebalanceo' | 'desriesgo'
}

/**
 * Core-satellite: la posición activa con mayor faltante contra su peso objetivo
 * (considerando el monto que se va a aportar). En desriesgo, si al balde
 * seguro le falta para su % de etapa, va ahí.
 */
export function proximoAporteVa(
  cartera: ValorCartera,
  f: Fase,
  montoProximo = 0
): DestinoAporte | null {
  const activas = cartera.porPosicion
  if (activas.length === 0) return null
  const totalFuturo = cartera.total + montoProximo

  if (f.etapa > 0) {
    const seguro = activas.find(v => v.posicion.rol === 'seguro')
    if (seguro) {
      const valorSeguro = activas.filter(v => v.posicion.rol === 'seguro').reduce((s, v) => s + v.valor, 0)
      const faltante = (f.pctSeguro / 100) * totalFuturo - valorSeguro
      if (faltante > 0) return { posicion: seguro.posicion, faltante, motivo: 'desriesgo' }
    }
  }

  let mejor: DestinoAporte | null = null
  for (const v of activas) {
    const faltante = (v.posicion.peso_objetivo / 100) * totalFuturo - v.valor
    if (!mejor || faltante > mejor.faltante) mejor = { posicion: v.posicion, faltante, motivo: 'rebalanceo' }
  }
  return mejor
}

// ─── Alertas ─────────────────────────────────────────────────────────────────

export type TipoAlerta = 'sin_aporte_mes' | 'extra_sin_invertir' | 'dolar_movio' | 'caida_desriesgo'

export interface Alerta {
  tipo: TipoAlerta
  titulo: string
  cuerpo: string
  url: string
  /** Las "diarias" las manda el cron; las demás solo se muestran en pantalla. */
  diaria: boolean
}

export interface ContextoAlertas {
  meta: InvMeta
  cobros: InvCobro[]
  aportes: InvAporte[]
  posiciones: InvPosicion[]
  valuaciones: InvValuacion[]
  hoy: string
  tc: number
  precios?: Map<string, Precio>
}

const usd = (n: number) => `US$ ${Math.round(n).toLocaleString('es-AR')}`
const ars = (n: number) => `ARS ${Math.round(n).toLocaleString('es-AR')}`

export function alertas(ctx: ContextoAlertas): Alerta[] {
  const { meta, cobros, aportes, posiciones, valuaciones, hoy, tc } = ctx
  const out: Alerta[] = []
  const m = mes(hoy)
  const dia = parseInt(hoy.slice(8, 10)) || 1
  const puesto = puestoDelMes(aportes, m)
  const debido = debidoDelMes(meta, cobros, m)

  // 1. Fin de mes y no registraste aporte
  if (dia >= 25 && puesto === 0 && m >= meta.fecha_inicio) {
    out.push({
      tipo: 'sin_aporte_mes',
      titulo: 'Este mes todavía no aportaste',
      cuerpo: `Te tocan ${usd(debido)}${tc > 0 ? ` (${ars(debido * tc)})` : ''}. Quedan pocos días.`,
      url: '/inversion?aporte=1',
      diaria: true,
    })
  }

  // 2. Cobro extra reciente sin el aporte correspondiente
  const hace7 = sumarDias(hoy, -7)
  for (const c of cobros.filter(c => c.tipo === 'extra' && c.fecha >= hace7 && c.fecha <= hoy)) {
    const sugerido = extraDeCobro(c, meta).usd
    const aportadoDespues = aportes.filter(a => a.fecha >= c.fecha).reduce((s, a) => s + a.monto_usd, 0)
    if (sugerido > 0 && aportadoDespues + 1 < sugerido) {
      out.push({
        tipo: 'extra_sin_invertir',
        titulo: 'Cobraste un extra y falta invertirlo',
        cuerpo: `Del cobro del ${c.fecha} te tocaba invertir ${usd(sugerido)} y llevás ${usd(aportadoDespues)}.`,
        url: '/inversion?aporte=1',
        diaria: true,
      })
      break
    }
  }

  // 3. El dólar se movió: los pesos que pusiste ya no cubren la base
  const aportesMes = aportes.filter(a => mes(a.fecha) === m)
  if (aportesMes.length > 0 && tc > 0) {
    const arsMes = aportesMes.reduce((s, a) => s + a.monto_ars, 0)
    if (arsMes / tc < meta.aporte_base_usd && puesto >= meta.aporte_base_usd) {
      out.push({
        tipo: 'dolar_movio',
        titulo: 'El dólar se movió',
        cuerpo: `Con el CCL de hoy, los ${ars(arsMes)} que aportaste equivalen a ${usd(arsMes / tc)}, menos que la base de ${usd(meta.aporte_base_usd)}.`,
        url: '/inversion',
        diaria: false,
      })
    }
  }

  // 4. En desriesgo y la cartera cayó más de 20 % desde su máximo valuado
  const f = fase(meta, hoy)
  if (f.etapa > 0) {
    const cartera = valorCartera(posiciones, aportes, valuaciones, hoy, ctx.precios, tc)
    const maximo = maximoValuado(posiciones, aportes, valuaciones)
    if (maximo > 0 && cartera.total < maximo * 0.8) {
      out.push({
        tipo: 'caida_desriesgo',
        titulo: 'La cartera cayó más de 20 % en desriesgo',
        cuerpo: `Vale ${usd(cartera.total)} contra un máximo de ${usd(maximo)}. Revisá la fecha objetivo o el precio al que vendés.`,
        url: '/inversion?tab=desriesgo',
        diaria: false,
      })
    }
  }

  return out
}

/** Máximo valor de la cartera en las fechas en que hubo valuación. */
function maximoValuado(posiciones: InvPosicion[], aportes: InvAporte[], valuaciones: InvValuacion[]): number {
  const fechas = [...new Set(valuaciones.map(v => v.fecha))]
  return fechas.reduce((max, f) => Math.max(max, valorCartera(posiciones, aportes, valuaciones, f).total), 0)
}

export function sumarDias(ymd: string, n: number): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + n))
  return dt.toISOString().slice(0, 10)
}
