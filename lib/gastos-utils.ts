import { Gasto, Moneda } from './types'

/** Categoría reservada que usa "Saldar deuda" para registrar transferencias. */
export const CATEGORIA_LIQUIDACION = 'Liquidacion'

/**
 * Una liquidación es una transferencia entre los dos para saldar deuda.
 * Entra en el cálculo del saldo pero NO es un gasto: hay que excluirla de
 * cualquier métrica de "cuánto gastamos".
 */
export function esLiquidacion(g: Gasto): boolean {
  return g.categoria === CATEGORIA_LIQUIDACION
}

export function esActivo(g: Gasto): boolean {
  return g.estado === 'activo'
}

export function esPersonal(g: Gasto): boolean {
  return g.tipo_division === 'personal'
}

export function esCompartido(g: Gasto): boolean {
  return !esPersonal(g)
}

export function monedaDe(g: Gasto): Moneda {
  return g.moneda || 'ARS'
}

/** Gasto activo, no liquidación, en la moneda pedida. Base de todas las métricas. */
export function cuentaComoGasto(g: Gasto, moneda: Moneda = 'ARS'): boolean {
  return esActivo(g) && !esLiquidacion(g) && monedaDe(g) === moneda
}
