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
