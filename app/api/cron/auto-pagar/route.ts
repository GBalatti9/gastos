import { NextResponse } from 'next/server'
import { getGastos, getPagos, marcarPagoComoPagado } from '@/lib/google-sheets'
import { format } from 'date-fns'

/**
 * Marca como pagadas las cuotas vencidas de gastos con débito automático o tarjeta de crédito.
 * Estos métodos de pago se cobran automáticamente, no requieren acción manual.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const [gastos, pagos] = await Promise.all([getGastos(), getPagos()])
  const hoy = format(new Date(), 'yyyy-MM-dd')

  const metodosAutomaticos = new Set(['debito', 'credito'])

  const pendientesVencidos = pagos.filter(p => {
    if (p.estado !== 'pendiente') return false
    if (p.fecha_vencimiento > hoy) return false
    const gasto = gastos.find(g => g.id === p.gasto_id)
    if (!gasto || gasto.estado !== 'activo') return false
    return metodosAutomaticos.has(gasto.metodo_pago)
  })

  const marcados: string[] = []

  for (const pago of pendientesVencidos) {
    const gasto = gastos.find(g => g.id === pago.gasto_id)!
    await marcarPagoComoPagado(pago.id, gasto.pagado_por, pago.fecha_vencimiento)
    marcados.push(`${gasto.descripcion} - cuota ${pago.numero_cuota}`)
  }

  return NextResponse.json({ ok: true, marcados })
}
