import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { marcarPagoComoPagado } from '@/lib/google-sheets'
import { format } from 'date-fns'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const userEmail = session.user?.email!
  const fechaPago = format(new Date(), 'yyyy-MM-dd')

  await marcarPagoComoPagado(id, userEmail, fechaPago)
  return NextResponse.json({ ok: true, fecha_pago: fechaPago, pagado_por: userEmail })
}
