import { NextResponse } from 'next/server'
import { getGastos, getPagos } from '@/lib/google-sheets'
import { enviarEmailRecordatorio } from '@/lib/email'
import { getUsers } from '@/lib/users'
import { ProximoVencimiento } from '@/lib/types'
import { differenceInDays, parseISO } from 'date-fns'

export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const [gastos, pagos] = await Promise.all([getGastos(), getPagos()])
  const hoy = new Date()

  const vencimientosProximos: ProximoVencimiento[] = pagos
    .filter(p => p.estado === 'pendiente')
    .map(p => {
      const gasto = gastos.find(g => g.id === p.gasto_id)
      if (!gasto || gasto.estado === 'cancelado') return null
      const dias = differenceInDays(parseISO(p.fecha_vencimiento), hoy)
      if (dias < 0 || dias > 7) return null
      return { pago: p, gasto, dias_restantes: dias }
    })
    .filter(Boolean) as ProximoVencimiento[]

  if (vencimientosProximos.length === 0) {
    return NextResponse.json({ ok: true, mensaje: 'Sin vencimientos próximos' })
  }

  const [u1, u2] = getUsers()
  await Promise.all([
    enviarEmailRecordatorio(u1, vencimientosProximos),
    enviarEmailRecordatorio(u2, vencimientosProximos),
  ])

  return NextResponse.json({ ok: true, enviados: vencimientosProximos.length })
}
