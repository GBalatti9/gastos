export type TipoDivision = '50/50' | 'porcentaje' | 'monto_fijo' | 'personal'
export type Moneda = 'ARS' | 'USD'
export type MetodoPago = 'efectivo' | 'debito' | 'mercadopago' | 'credito'

export interface Gasto {
  id: string
  descripcion: string
  monto_total: number
  pagado_por: string // email
  cuotas: number
  cuota_actual: number
  fecha_inicio: string // ISO date
  categoria: string
  notas: string
  estado: 'activo' | 'cancelado'
  moneda: Moneda
  tipo_division: TipoDivision
  division_valor: string // vacío para 50/50, "70" para porcentaje, "15000" para monto_fijo
  recurrente: boolean
  metodo_pago: MetodoPago
  tarjeta_id: string
  /** Email de quien cargó el gasto (columna Q, puede faltar en filas viejas). */
  creado_por?: string
}

export interface PushSub {
  email: string
  endpoint: string
  p256dh: string
  auth: string
  user_agent: string
  created_at: string
}

export interface Pago {
  id: string
  gasto_id: string
  numero_cuota: number
  monto: number
  fecha_vencimiento: string // ISO date
  fecha_pago: string | null
  pagado_por: string | null // email
  estado: 'pendiente' | 'pagado'
}

export interface Categoria {
  id: string
  nombre: string
  color: string
  icono: string
}

export interface SaldoData {
  user1: { email: string; nombre: string; total_pagado: number }
  user2: { email: string; nombre: string; total_pagado: number }
  diferencia: number
  deudor: string // email
  acreedor: string // email
  monto_deuda: number
  moneda: Moneda
}

export interface ProximoVencimiento {
  pago: Pago
  gasto: Gasto
  dias_restantes: number
}

export interface GastoConPagos extends Gasto {
  pagos: Pago[]
  categoria_info?: Categoria
}

export interface TipoCambio {
  fecha: string // YYYY-MM-DD
  valor: number
  fuente: 'bna' | 'manual'
}

export interface TarjetaCredito {
  id: string
  nombre: string
  ultimos_4: string
  fecha_cierre: number    // dia del mes (1-31)
  fecha_vencimiento: number // dia del mes (1-31)
  owner_email: string
}

export interface NotificacionPayload {
  tipo: 'nuevo_gasto' | 'cuota_pagada' | 'gasto_cancelado'
  gasto: Gasto
  pago?: Pago
  autor_email: string
  autor_nombre: string
}

// ─── Inversión con objetivo ───────────────────────────────────────────────────

export type InvTipoCobro = 'base' | 'extra'
export type InvRol = 'core' | 'satelite' | 'seguro'
/** Tipo de activo de una posición. Define moneda de cotización y si hay precio automático. */
export type InvTipoActivo = 'cedear' | 'accion' | 'bono' | 'letra' | 'fci' | 'plazo_fijo' | 'cripto' | 'dolares' | 'otro'

export interface InvMeta {
  id: string
  email: string
  nombre: string
  monto_objetivo_usd: number
  fecha_objetivo: string // YYYY-MM
  aporte_base_usd: number
  ingreso_base_ars: number
  pct_extra: number // 0-100
  fecha_inicio: string // YYYY-MM
  /** % de la cartera que debe estar en el balde "seguro" a 24, 12 y 6 meses de la fecha objetivo. */
  desriesgo_etapas: [number, number, number]
}

export interface InvCobro {
  id: string
  email: string
  fecha: string // YYYY-MM-DD
  monto_ars: number
  tipo: InvTipoCobro
  tipo_cambio: number
  notas: string
}

export interface InvAporte {
  id: string
  email: string
  fecha: string // YYYY-MM-DD
  monto_usd: number
  monto_ars: number
  tipo_cambio: number
  posicion_id: string
  cobro_id: string
  notas: string
  /** Unidades compradas (acciones, nominales, cripto). 0 si no aplica. */
  unidades: number
  /** Precio unitario en la moneda de cotización al momento del aporte. */
  precio: number
  meta_id: string
}

export interface InvPosicion {
  id: string
  email: string
  ticker: string
  nombre: string
  peso_objetivo: number // 0-100
  rol: InvRol
  activo: boolean
  tipo: InvTipoActivo
  /** Moneda en la que cotiza (CEDEAR/bono/FCI → ARS; cripto/dólares → USD). */
  moneda: 'ARS' | 'USD'
  meta_id: string
}

export interface InvValuacion {
  id: string
  email: string
  fecha: string // YYYY-MM-DD
  posicion_id: string
  valor_usd: number
  meta_id: string
}
