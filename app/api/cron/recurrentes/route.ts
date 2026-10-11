import { NextResponse } from 'next/server'
import { getGastos, getPagos, createPagos, getTarjetaById } from '@/lib/google-sheets'
import { getDaysInMonth } from 'date-fns'
import { hoyAR, mesSiguiente, primerDiaDelMes } from '@/lib/dates'

/**
 * Genera las cuotas de los gastos recurrentes.
 *
 * Es idempotente y cubre el mes actual Y el siguiente, así puede correr todos
 * los días: un recurrente creado el 28 no se queda sin cuota el mes que viene
 * (antes solo se generaba "el próximo mes" el día 25).
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const [gastos, pagos] = await Promise.all([getGastos(), getPagos()])
  const mesActual = hoyAR().slice(0, 7)
  const targets = [mesActual, mesSiguiente(mesActual)]

  const gastosRecurrentes = gastos.filter(g => g.recurrente && g.estado === 'activo')
  const pagosCreados: string[] = []

  for (const gasto of gastosRecurrentes) {
    const mesInicio = gasto.fecha_inicio.slice(0, 7)
    const pagosGasto = pagos.filter(p => p.gasto_id === gasto.id)

    let diaVenc = parseInt(gasto.fecha_inicio.slice(8, 10)) || 1
    if (gasto.metodo_pago === 'credito' && gasto.tarjeta_id) {
      const tarjeta = await getTarjetaById(gasto.tarjeta_id)
      if (tarjeta) diaVenc = tarjeta.fecha_vencimiento
    }

    let creados = 0
    for (const target of targets) {
      // El mes de inicio ya tiene su cuota (creada al cargar el gasto)
      if (target <= mesInicio) continue
      if (pagosGasto.some(p => p.fecha_vencimiento.startsWith(target))) continue

      const diaMax = getDaysInMonth(primerDiaDelMes(target))
      const dia = String(Math.min(diaVenc, diaMax)).padStart(2, '0')

      await createPagos([{
        gasto_id: gasto.id,
        numero_cuota: pagosGasto.length + creados + 1,
        monto: gasto.monto_total,
        fecha_vencimiento: `${target}-${dia}`,
        fecha_pago: null,
        pagado_por: null,
        estado: 'pendiente',
      }])
      creados++
      pagosCreados.push(`${gasto.descripcion} (${target})`)
    }
  }

  return NextResponse.json({ ok: true, generados: pagosCreados })
}
