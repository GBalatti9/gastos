import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  getGastoById, getPagosByGastoId, updateGasto, updatePago, getTarjetaById,
} from '@/lib/google-sheets'
import { addMonths, setDate, format } from 'date-fns'
import { calcularFechaVencimientoCuota } from '@/lib/billing-cycle'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const gasto = await getGastoById(id)
  if (!gasto) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const pagos = await getPagosByGastoId(id)
  return NextResponse.json({ gasto, pagos })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const gasto = await getGastoById(id)
  if (!gasto) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const body = await req.json()

  const montoNuevo = parseFloat(body.monto_total)
  const montoAnterior = gasto.monto_total
  const montoChanged = montoNuevo !== montoAnterior
  const tarjetaChanged = (body.tarjeta_id ?? gasto.tarjeta_id) !== gasto.tarjeta_id
  const fechaChanged = (body.fecha_inicio ?? gasto.fecha_inicio) !== gasto.fecha_inicio
  const esCredito = body.metodo_pago === 'credito' && body.tarjeta_id
  const recalcFechas = tarjetaChanged || fechaChanged || body.recalcular_fechas || esCredito

  await updateGasto(id, {
    descripcion: body.descripcion,
    monto_total: montoNuevo,
    pagado_por: body.pagado_por,
    fecha_inicio: body.fecha_inicio,
    categoria: body.categoria,
    notas: body.notas ?? '',
    moneda: body.moneda,
    tipo_division: body.tipo_division,
    division_valor: body.division_valor ?? '',
    recurrente: body.recurrente === 'si',
    metodo_pago: body.metodo_pago,
    tarjeta_id: body.tarjeta_id ?? '',
  })

  if (montoChanged || recalcFechas) {
    const pagos = await getPagosByGastoId(id)

    let tarjeta = null
    if (body.metodo_pago === 'credito' && body.tarjeta_id) {
      tarjeta = await getTarjetaById(body.tarjeta_id)
    }

    const nuevoCuotas = gasto.cuotas
    const nuevaMontoCuota = montoNuevo / nuevoCuotas
    const fechaInicioStr = body.fecha_inicio ?? gasto.fecha_inicio
    const [anio, mes, dia] = fechaInicioStr.split('-').map(Number)
    const fechaCompra = new Date(anio, mes - 1, dia)

    for (const pago of pagos) {
      const updates: { monto?: number; fecha_vencimiento?: string } = {}

      // Solo actualizar monto en cuotas pendientes
      if (montoChanged && pago.estado === 'pendiente') {
        updates.monto = Math.round(nuevaMontoCuota * 100) / 100
      }

      // Recalcular fecha_vencimiento en TODAS las cuotas (pagadas y pendientes)
      if (recalcFechas) {
        const cuotaIdx = pago.numero_cuota - 1
        let fechaVenc: Date
        if (tarjeta) {
          fechaVenc = calcularFechaVencimientoCuota(fechaCompra, cuotaIdx, tarjeta)
        } else {
          fechaVenc = setDate(addMonths(fechaCompra, cuotaIdx), 1)
        }
        updates.fecha_vencimiento = format(fechaVenc, 'yyyy-MM-dd')
      }

      if (Object.keys(updates).length > 0) {
        await updatePago(pago.id, updates)
      }
    }
  }

  const gastoActualizado = await getGastoById(id)
  return NextResponse.json({ gasto: gastoActualizado })
}
