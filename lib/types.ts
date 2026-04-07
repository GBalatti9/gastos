export interface Gasto {
  id: string
  descripcion: string
  monto_total: number
  pagado_por: string // email
  cuotas: number
  cuota_actual: number
  fecha_inicio: string // ISO date
  dia_vencimiento: number
  categoria: string
  notas: string
  estado: 'activo' | 'cancelado'
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
}

export interface ProximoVencimiento {
  pago: Pago
  gasto: Gasto
  dias_restantes: number
}

export interface ResumenMes {
  total: number
  por_categoria: { categoria: string; total: number; color: string }[]
  user1_pago: number
  user2_pago: number
}

export interface GastoConPagos extends Gasto {
  pagos: Pago[]
  categoria_info?: Categoria
}

export interface NotificacionPayload {
  tipo: 'nuevo_gasto' | 'cuota_pagada' | 'gasto_cancelado'
  gasto: Gasto
  pago?: Pago
  autor_email: string
  autor_nombre: string
}
