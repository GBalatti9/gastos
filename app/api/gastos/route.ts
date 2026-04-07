import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getGastos, createGasto, createPagos } from '@/lib/google-sheets'
import { addMonths, setDate, format } from 'date-fns'

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
    fecha_inicio, dia_vencimiento, categoria, notas
  } = body

  const gasto = await createGasto({
    descripcion,
    monto_total: parseFloat(monto_total),
    pagado_por,
    cuotas: parseInt(cuotas) || 1,
    cuota_actual: 0,
    fecha_inicio,
    dia_vencimiento: parseInt(dia_vencimiento) || 1,
    categoria,
    notas: notas || '',
    estado: 'activo',
  })

  // Generate payment rows
  const numCuotas = parseInt(cuotas) || 1
  const montoPorCuota = parseFloat(monto_total) / numCuotas
  const diaVenc = parseInt(dia_vencimiento) || 1
  const fechaBase = new Date(fecha_inicio)

  const pagos = Array.from({ length: numCuotas }, (_, i) => {
    const fechaVenc = setDate(addMonths(fechaBase, i), diaVenc)
    return {
      gasto_id: gasto.id,
      numero_cuota: i + 1,
      monto: Math.round(montoPorCuota * 100) / 100,
      fecha_vencimiento: format(fechaVenc, 'yyyy-MM-dd'),
      fecha_pago: null,
      pagado_por: null,
      estado: 'pendiente' as const,
    }
  })

  await createPagos(pagos)

  return NextResponse.json({ gasto, pagos }, { status: 201 })
}
