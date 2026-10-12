import { NextResponse } from 'next/server'
import { getGastos, getPushSubs } from '@/lib/google-sheets'
import { enviarPush } from '@/lib/push'
import { enviarEmailRecordatorioCarga } from '@/lib/email'
import { getUsers } from '@/lib/users'
import { hoyAR, fechaARDeTimestamp } from '@/lib/dates'

/**
 * Recordatorio de carga. Corre a las 21:00 ART (00:00 UTC, ver vercel.json).
 * Para cada usuario: si hoy no cargó ningún gasto, le manda push a sus
 * dispositivos; si no tiene ninguno suscripto, email.
 *
 * "Cargó hoy" = existe un gasto con creado_por = su email cuyo id (que es
 * Date.now() al crearlo) cae en el día de hoy en Argentina.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const [gastos, subs] = await Promise.all([getGastos(), getPushSubs()])
  const hoy = hoyAR()
  const baseUrl = process.env.NEXTAUTH_URL || 'https://localhost:3000'
  const url = `${baseUrl.replace(/\/$/, '')}/dashboard?nuevo=1`

  const resultado: Record<string, string> = {}

  for (const user of getUsers()) {
    const cargoHoy = gastos.some(g => {
      if (g.creado_por !== user.email) return false
      const ms = Number(g.id)
      return Number.isFinite(ms) && fechaARDeTimestamp(ms) === hoy
    })
    if (cargoHoy) {
      resultado[user.email] = 'cargó hoy, sin aviso'
      continue
    }

    const tieneSubs = subs.some(s => s.email === user.email)
    if (tieneSubs) {
      const enviados = await enviarPush(user.email, {
        title: '¿Gastaste algo hoy?',
        body: 'Todavía no cargaste nada. Tocá para anotarlo antes de que se te olvide.',
        url: '/dashboard?nuevo=1',
        tag: 'recordatorio-carga',
      })
      if (enviados > 0) {
        resultado[user.email] = `push a ${enviados} dispositivo(s)`
        continue
      }
    }

    try {
      await enviarEmailRecordatorioCarga(user, url)
      resultado[user.email] = 'email'
    } catch (err) {
      console.error('Error enviando email de recordatorio de carga:', err)
      resultado[user.email] = 'error email'
    }
  }

  return NextResponse.json({ ok: true, hoy, resultado })
}
