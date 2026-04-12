import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getPagos, getGastos, marcarPagoComoPagado, getTipoCambioByFecha, saveTipoCambio } from '@/lib/google-sheets'
import { fetchTipoCambioActual } from '@/lib/tipo-cambio'
import { format } from 'date-fns'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const userEmail = session.user?.email!
  const fechaPago = format(new Date(), 'yyyy-MM-dd')

  // Si el gasto es en USD, guardar el TC del día automáticamente
  const [pagos, gastos] = await Promise.all([getPagos(), getGastos()])
  const pago = pagos.find(p => p.id === id)
  if (pago) {
    const gasto = gastos.find(g => g.id === pago.gasto_id)
    if (gasto?.moneda === 'USD') {
      const tcExistente = await getTipoCambioByFecha(fechaPago)
      if (!tcExistente) {
        try {
          const valor = await fetchTipoCambioActual()
          await saveTipoCambio(fechaPago, valor, 'bna')
        } catch {
          // No bloquear el pago si falla la API de TC
        }
      }
    }
  }

  await marcarPagoComoPagado(id, userEmail, fechaPago)
  return NextResponse.json({ ok: true, fecha_pago: fechaPago, pagado_por: userEmail })
}
