import type { InvRol, InvTipoActivo } from './types'

/** Catálogo de tipos de activo, usable en server y cliente. */

export const ROLES: InvRol[] = ['core', 'satelite', 'seguro']
export const ROL_LABEL: Record<InvRol, string> = { core: 'Core', satelite: 'Satélite', seguro: 'Seguro' }

export const TIPOS: InvTipoActivo[] = ['cedear', 'accion', 'bono', 'letra', 'fci', 'plazo_fijo', 'cripto', 'dolares', 'otro']

export const TIPO_LABEL: Record<InvTipoActivo, string> = {
  cedear: 'CEDEAR',
  accion: 'Acción argentina',
  bono: 'Bono',
  letra: 'Letra del Tesoro',
  fci: 'Fondo común (FCI)',
  plazo_fijo: 'Plazo fijo',
  cripto: 'Cripto',
  dolares: 'Dólares quietos',
  otro: 'Otro',
}

/** Moneda de cotización por defecto según el tipo. */
export const MONEDA_POR_TIPO: Record<InvTipoActivo, 'ARS' | 'USD'> = {
  cedear: 'ARS', accion: 'ARS', bono: 'ARS', letra: 'ARS', fci: 'ARS', plazo_fijo: 'ARS', cripto: 'USD', dolares: 'USD', otro: 'USD',
}

/** Cómo se valúa cada tipo, para explicarlo en la UI. */
export const TIPO_AYUDA: Record<InvTipoActivo, string> = {
  cedear: 'Precio automático (BYMA, en pesos → dólar CCL). Ticker como en el broker: AAPL, MSFT, SPY.',
  accion: 'Precio automático (BYMA). Ticker: GGAL, YPFD, PAMP.',
  bono: 'Precio automático cada 100 nominales. Ticker: AL30, GD35, AE38.',
  letra: 'Precio automático cada 100 nominales. Ticker: S31O5, T15D5.',
  fci: 'Sin precio automático: cargás el valor una vez por mes.',
  plazo_fijo: 'Sin precio automático: cargás el valor (capital + interés) cuando quieras.',
  cripto: 'Precio automático en USD (CoinGecko). Ticker: BTC, ETH, USDT.',
  dolares: 'Dólares sin invertir. Valen exactamente lo que aportaste.',
  otro: 'Sin precio automático: cargás el valor a mano.',
}

export const TIPOS_CON_PRECIO_AUTO: InvTipoActivo[] = ['cedear', 'accion', 'bono', 'letra', 'cripto']
export const TIPOS_CADA_100: InvTipoActivo[] = ['bono', 'letra']

export const UNIDAD_LABEL: Record<InvTipoActivo, string> = {
  cedear: 'CEDEARs', accion: 'acciones', bono: 'nominales', letra: 'nominales', fci: 'cuotapartes',
  plazo_fijo: '', cripto: 'unidades', dolares: '', otro: 'unidades',
}
