import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { updateTarjeta, deleteTarjeta, getGastos } from '@/lib/google-sheets'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const updates: Record<string, unknown> = {}
  if (body.nombre) updates.nombre = body.nombre
  if (body.ultimos_4) {
    if (!/^\d{4}$/.test(body.ultimos_4)) {
      return NextResponse.json({ error: 'Últimos 4 dígitos inválidos' }, { status: 400 })
    }
    updates.ultimos_4 = body.ultimos_4
  }
  if (body.fecha_cierre) {
    const cierre = parseInt(body.fecha_cierre)
    if (cierre < 1 || cierre > 31) return NextResponse.json({ error: 'Día inválido' }, { status: 400 })
    updates.fecha_cierre = cierre
  }
  if (body.fecha_vencimiento) {
    const venc = parseInt(body.fecha_vencimiento)
    if (venc < 1 || venc > 31) return NextResponse.json({ error: 'Día inválido' }, { status: 400 })
    updates.fecha_vencimiento = venc
  }

  await updateTarjeta(id, updates)
  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params

  const gastos = await getGastos()
  const gastosConTarjeta = gastos.filter(g => g.tarjeta_id === id && g.estado === 'activo')
  if (gastosConTarjeta.length > 0) {
    return NextResponse.json(
      { error: `No se puede eliminar: ${gastosConTarjeta.length} gasto(s) activo(s) usan esta tarjeta` },
      { status: 409 }
    )
  }

  await deleteTarjeta(id)
  return NextResponse.json({ ok: true })
}
