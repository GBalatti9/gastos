import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getCierres, createCierre, getPagos, getGastos } from '@/lib/google-sheets'
import { calcularSaldo } from '@/lib/saldo'
import { Moneda } from '@/lib/types'
import { format } from 'date-fns'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const cierres = await getCierres()
  return NextResponse.json(cierres)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const moneda: Moneda = body.moneda || 'ARS'
  const mes: string = body.mes || format(new Date(), 'yyyy-MM')

  // Verificar que no existe cierre para este mes/moneda
  const cierresExistentes = await getCierres()
  const yaExiste = cierresExistentes.some(c => c.mes === mes && c.moneda === moneda)
  if (yaExiste) {
    return NextResponse.json({ error: 'Ya existe un cierre para este mes y moneda' }, { status: 409 })
  }

  const [pagos, gastos] = await Promise.all([getPagos(), getGastos()])
  const saldo = calcularSaldo(pagos, gastos, moneda)

  const cierre = await createCierre({
    mes,
    saldo_user1: saldo.user1.total_pagado,
    saldo_user2: saldo.user2.total_pagado,
    deuda_final: saldo.monto_deuda,
    deudor: saldo.deudor,
    acreedor: saldo.acreedor,
    fecha_cierre: format(new Date(), 'yyyy-MM-dd'),
    moneda,
  })

  return NextResponse.json(cierre, { status: 201 })
}
