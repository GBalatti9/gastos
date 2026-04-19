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
  if (!pago) return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 })

  // Validar orden secuencial: no se puede pagar cuota N si hay cuotas anteriores pendientes
  const pagosDelGasto = pagos.filter(p => p.gasto_id === pago.gasto_id)
  const cuotasPendientesAnteriores = pagosDelGasto.filter(
    p => p.estado === 'pendiente' && p.numero_cuota < pago.numero_cuota
  )
  if (cuotasPendientesAnteriores.length > 0) {
    return NextResponse.json(
      { error: `Primero tenés que pagar la cuota ${cuotasPendientesAnteriores[0].numero_cuota}` },
      { status: 400 }
    )
  }

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

  await marcarPagoComoPagado(id, userEmail, fechaPago)
  return NextResponse.json({ ok: true, fecha_pago: fechaPago, pagado_por: userEmail })
}
