import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getTarjetas, createTarjeta } from '@/lib/google-sheets'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const tarjetas = await getTarjetas()
  return NextResponse.json(tarjetas)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const { nombre, ultimos_4, fecha_cierre, fecha_vencimiento } = body

  if (!nombre || !ultimos_4 || !fecha_cierre || !fecha_vencimiento) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  if (!/^\d{4}$/.test(ultimos_4)) {
    return NextResponse.json({ error: 'Últimos 4 dígitos inválidos' }, { status: 400 })
  }

  const cierre = parseInt(fecha_cierre)
  const venc = parseInt(fecha_vencimiento)
  if (cierre < 1 || cierre > 31 || venc < 1 || venc > 31) {
    return NextResponse.json({ error: 'Día de cierre/vencimiento inválido' }, { status: 400 })
  }

  const tarjeta = await createTarjeta({
    nombre,
    ultimos_4,
    fecha_cierre: cierre,
    fecha_vencimiento: venc,
    owner_email: session.user?.email || '',
  })

  return NextResponse.json(tarjeta, { status: 201 })
}
