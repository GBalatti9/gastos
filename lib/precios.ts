import type { InvPosicion, InvTipoActivo } from './types'
import { TIPOS_CON_PRECIO_AUTO } from './activos'

/**
 * Precios automáticos para valuar la cartera sin cargar nada a mano.
 *
 * Fuentes (gratis, sin clave):
 * - CEDEARs, acciones, bonos y letras argentinas: data912.com (precio en ARS,
 *   bonos y letras cotizan cada 100 nominales)
 * - Cripto: CoinGecko (USD)
 * - FCI, plazo fijo, "otro": no hay fuente → valuación manual
 * - Dólares quietos: valen lo aportado
 *
 * Cache en memoria de 15 minutos por fuente; si una fuente falla se devuelve
 * lo que haya y la posición cae a valuación manual / costo.
 */

export interface Precio {
  /** Precio unitario en la moneda de cotización de la posición. */
  precio: number
  moneda: 'ARS' | 'USD'
  /** Bonos/letras: el precio es cada 100 nominales. */
  cada100: boolean
  fuente: string
}

const TTL_MS = 15 * 60 * 1000
const cache = new Map<string, { at: number; data: Map<string, number> }>()

async function conCache(clave: string, cargar: () => Promise<Map<string, number>>): Promise<Map<string, number>> {
  const hit = cache.get(clave)
  if (hit && Date.now() - hit.at < TTL_MS) return hit.data
  try {
    const data = await cargar()
    cache.set(clave, { at: Date.now(), data })
    return data
  } catch (err) {
    console.warn(`precios: no se pudo cargar ${clave}`, err)
    return hit?.data ?? new Map()
  }
}

async function data912(endpoint: string): Promise<Map<string, number>> {
  return conCache(`data912:${endpoint}`, async () => {
    const res = await fetch(`https://data912.com/live/${endpoint}`, { cache: 'no-store', signal: AbortSignal.timeout(8000) })
    if (!res.ok) throw new Error(`data912 ${endpoint} ${res.status}`)
    const rows = (await res.json()) as { symbol: string; c: number; px_bid?: number; px_ask?: number }[]
    const m = new Map<string, number>()
    for (const r of rows) {
      // Último precio; si no hay, punta media
      const p = r.c > 0 ? r.c : r.px_bid && r.px_ask ? (r.px_bid + r.px_ask) / 2 : 0
      if (p > 0) m.set(r.symbol.toUpperCase(), p)
    }
    return m
  })
}

/** Tickers de cripto habituales → id de CoinGecko. Si no está, se prueba el ticker en minúscula. */
const COINGECKO_IDS: Record<string, string> = {
  BTC: 'bitcoin', ETH: 'ethereum', USDT: 'tether', USDC: 'usd-coin', DAI: 'dai', SOL: 'solana',
  BNB: 'binancecoin', XRP: 'ripple', ADA: 'cardano', DOGE: 'dogecoin', DOT: 'polkadot', MATIC: 'matic-network',
  LTC: 'litecoin', AVAX: 'avalanche-2', LINK: 'chainlink', TRX: 'tron',
}

async function coingecko(tickers: string[]): Promise<Map<string, number>> {
  const ids = [...new Set(tickers.map(t => COINGECKO_IDS[t.toUpperCase()] ?? t.toLowerCase()))]
  if (ids.length === 0) return new Map()
  return conCache(`coingecko:${ids.sort().join(',')}`, async () => {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(ids.join(','))}&vs_currencies=usd`
    const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(8000) })
    if (!res.ok) throw new Error(`coingecko ${res.status}`)
    const data = (await res.json()) as Record<string, { usd?: number }>
    const m = new Map<string, number>()
    for (const t of tickers) {
      const id = COINGECKO_IDS[t.toUpperCase()] ?? t.toLowerCase()
      const p = data[id]?.usd
      if (p && p > 0) m.set(t.toUpperCase(), p)
    }
    return m
  })
}

export function tienePrecioAuto(p: Pick<InvPosicion, 'tipo' | 'ticker'>): boolean {
  return TIPOS_CON_PRECIO_AUTO.includes(p.tipo) && !!p.ticker
}

/** Precio actual de cada posición con precio automático. Clave: id de posición. */
export async function getPrecios(posiciones: InvPosicion[]): Promise<Map<string, Precio>> {
  const out = new Map<string, Precio>()
  const con = posiciones.filter(tienePrecioAuto)
  if (con.length === 0) return out

  const necesita = (tipo: InvTipoActivo) => con.some(p => p.tipo === tipo)
  const [cedears, acciones, bonos, letras, cripto] = await Promise.all([
    necesita('cedear') ? data912('arg_cedears') : new Map<string, number>(),
    necesita('accion') ? data912('arg_stocks') : new Map<string, number>(),
    necesita('bono') ? data912('arg_bonds') : new Map<string, number>(),
    necesita('letra') ? data912('arg_notes') : new Map<string, number>(),
    necesita('cripto') ? coingecko(con.filter(p => p.tipo === 'cripto').map(p => p.ticker)) : new Map<string, number>(),
  ])

  for (const p of con) {
    const t = p.ticker.toUpperCase()
    let precio: number | undefined
    let fuente = ''
    let moneda: 'ARS' | 'USD' = 'ARS'
    let cada100 = false
    switch (p.tipo) {
      case 'cedear': precio = cedears.get(t); fuente = 'data912 (CEDEARs)'; break
      case 'accion': precio = acciones.get(t); fuente = 'data912 (acciones)'; break
      case 'bono': precio = bonos.get(t); fuente = 'data912 (bonos)'; cada100 = true; break
      case 'letra': precio = letras.get(t); fuente = 'data912 (letras)'; cada100 = true; break
      case 'cripto': precio = cripto.get(t); fuente = 'CoinGecko'; moneda = 'USD'; break
    }
    if (precio && precio > 0) out.set(p.id, { precio, moneda, cada100, fuente })
  }
  return out
}

/** Valor en USD de `unidades` de una posición a un precio dado. */
export function valorUnidades(unidades: number, precio: Precio, tc: number): number {
  const bruto = precio.cada100 ? (unidades * precio.precio) / 100 : unidades * precio.precio
  if (precio.moneda === 'USD') return bruto
  return tc > 0 ? bruto / tc : 0
}

/** Unidades que se compran con `montoUsd` a un precio dado. */
export function unidadesPorMonto(montoUsd: number, precio: Precio, tc: number): number {
  const montoLocal = precio.moneda === 'USD' ? montoUsd : montoUsd * tc
  const porUnidad = precio.cada100 ? precio.precio / 100 : precio.precio
  return porUnidad > 0 ? montoLocal / porUnidad : 0
}
