import { NextResponse } from 'next/server'
import { getGastos, getPagos, createPagos, getTarjetaById } from '@/lib/google-sheets'
import { addMonths, setDate, getDaysInMonth, format, startOfMonth, endOfMonth } from 'date-fns'

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const [gastos, pagos] = await Promise.all([getGastos(), getPagos()])
  const hoy = new Date()
  const proximoMes = addMonths(hoy, 1)
  const inicioProximo = startOfMonth(proximoMes)
  const finProximo = endOfMonth(proximoMes)

  const gastosRecurrentes = gastos.filter(g => g.recurrente && g.estado === 'activo')
  const pagosCreados: string[] = []

  for (const gasto of gastosRecurrentes) {
    let diaVenc: number
    if (gasto.metodo_pago === 'credito' && gasto.tarjeta_id) {
      const tarjeta = await getTarjetaById(gasto.tarjeta_id)
      diaVenc = tarjeta?.fecha_vencimiento ?? new Date(gasto.fecha_inicio).getDate()
    } else {
      diaVenc = new Date(gasto.fecha_inicio).getDate()
    }
    const diaMax = getDaysInMonth(proximoMes)
    const fechaVenc = setDate(proximoMes, Math.min(diaVenc, diaMax))

    // Verificar que no exista ya un pago para el próximo mes
    const yaExiste = pagos.some(p => {
      if (p.gasto_id !== gasto.id) return false
      const fv = new Date(p.fecha_vencimiento)
      return fv >= inicioProximo && fv <= finProximo
    })

    if (yaExiste) continue

    const numeroCuotaActual = pagos.filter(p => p.gasto_id === gasto.id).length + 1

    await createPagos([{
      gasto_id: gasto.id,
      numero_cuota: numeroCuotaActual,
      monto: gasto.monto_total,
      fecha_vencimiento: format(fechaVenc, 'yyyy-MM-dd'),
      fecha_pago: null,
      pagado_por: null,
      estado: 'pendiente',
    }])

    pagosCreados.push(gasto.descripcion)
  }

  return NextResponse.json({ ok: true, generados: pagosCreados })
}
