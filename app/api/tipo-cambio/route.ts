import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getTipoCambios, getTipoCambioByFecha, saveTipoCambio } from '@/lib/google-sheets'
import { fetchTipoCambioActual } from '@/lib/tipo-cambio'

// GET /api/tipo-cambio          → lista todos
// GET /api/tipo-cambio?fecha=X  → TC de una fecha específica
// GET /api/tipo-cambio?actual=1 → TC actual de BNA (sin guardar)
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const fecha = req.nextUrl.searchParams.get('fecha')
  const actual = req.nextUrl.searchParams.get('actual')

  if (actual) {
    const valor = await fetchTipoCambioActual()
    return NextResponse.json({ valor })
  }

  if (fecha) {
    const tc = await getTipoCambioByFecha(fecha)
    return NextResponse.json(tc || null)
  }

  const todos = await getTipoCambios()
  return NextResponse.json(todos)
}

// POST /api/tipo-cambio → guardar TC manual para una fecha
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { fecha, valor } = await req.json()
  if (!fecha || !valor) {
    return NextResponse.json({ error: 'fecha y valor son requeridos' }, { status: 400 })
  }

  const tc = await saveTipoCambio(fecha, parseFloat(valor), 'manual')
  return NextResponse.json(tc, { status: 201 })
}
