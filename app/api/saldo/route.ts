import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getPagos, getGastos } from '@/lib/google-sheets'
import { calcularSaldo } from '@/lib/saldo'
import { Moneda } from '@/lib/types'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const moneda = (req.nextUrl.searchParams.get('moneda') as Moneda) || 'ARS'
  const [pagos, gastos] = await Promise.all([getPagos(), getGastos()])
  const saldo = calcularSaldo(pagos, gastos, moneda)
  return NextResponse.json(saldo)
}
