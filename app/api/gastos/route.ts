import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getGastos, createGasto, createPagos, getTarjetaById } from '@/lib/google-sheets'
import { addMonths, setDate, format } from 'date-fns'
import { calcularFechaVencimientoCuota } from '@/lib/billing-cycle'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const gastos = await getGastos()
  return NextResponse.json(gastos)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const {
    descripcion, monto_total, pagado_por, cuotas,
    fecha_inicio, categoria, notas,
    moneda, tipo_division, division_valor, recurrente, carga_inmediata
  } = body

  const esCargaInmediata = carga_inmediata === 'si'
  const numCuotas = esCargaInmediata ? 1 : (parseInt(cuotas) || 1)
  const fechaBase = new Date(fecha_inicio)
  const fechaCarga = format(fechaBase, 'yyyy-MM-dd')

  const gasto = await createGasto({
    descripcion,
    monto_total: parseFloat(monto_total),
    pagado_por,
    cuotas: numCuotas,
    cuota_actual: 0,
    fecha_inicio,
    dia_vencimiento: 1,
    categoria,
    notas: notas || '',
    estado: 'activo',
    moneda: moneda || 'ARS',
    tipo_division: tipo_division || '50/50',
    division_valor: division_valor || '',
    recurrente: recurrente === 'si',
    metodo_pago: body.metodo_pago || 'efectivo',
    tarjeta_id: body.tarjeta_id || '',
  })

  // Generate payment rows
  const montoPorCuota = parseFloat(monto_total) / numCuotas
  const esCredito = (body.metodo_pago === 'credito') && body.tarjeta_id
  const tarjeta = esCredito ? await getTarjetaById(body.tarjeta_id) : null

  const pagos = Array.from({ length: numCuotas }, (_, i) => {
    let fechaVenc: Date
    if (esCargaInmediata) {
      fechaVenc = fechaBase
    } else if (tarjeta) {
      fechaVenc = calcularFechaVencimientoCuota(fechaBase, i, tarjeta)
    } else {
      fechaVenc = setDate(addMonths(fechaBase, i), 1)
    }
    return {
      gasto_id: gasto.id,
      numero_cuota: i + 1,
      monto: Math.round(montoPorCuota * 100) / 100,
      fecha_vencimiento: format(fechaVenc, 'yyyy-MM-dd'),
      fecha_pago: esCargaInmediata ? fechaCarga : null,
      pagado_por: esCargaInmediata ? pagado_por : null,
      estado: esCargaInmediata ? 'pagado' as const : 'pendiente' as const,
    }
  })

  await createPagos(pagos)

  return NextResponse.json({ gasto, pagos }, { status: 201 })
}
