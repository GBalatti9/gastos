import { NextResponse } from 'next/server'
import {
  getInvMeta, getInvCobros, getInvAportes, getInvPosiciones, getInvValuaciones, getPushSubs, asegurarHojas, HOJA_PUSH_SUBS, HOJAS_INVERSION,
} from '@/lib/google-sheets'
import { getTipoCambioHoy } from '@/lib/tipo-cambio'
import { alertas } from '@/lib/inversion'
import { enviarPush } from '@/lib/push'
import { enviarEmailInversionAlerta } from '@/lib/email'
import { getUsers } from '@/lib/users'
import { hoyAR } from '@/lib/dates'

/**
 * Alertas del módulo de inversión. Corre a las 21:30 ART (00:30 UTC).
 * Solo manda las alertas "diarias" (fin de mes sin aporte, cobro extra sin
 * invertir); las demás se ven en pantalla. Push a los dispositivos del
 * usuario; si no tiene, email.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const hoy = hoyAR()
  await asegurarHojas({ ...HOJAS_INVERSION, ...HOJA_PUSH_SUBS })
  const [tc, subs] = await Promise.all([getTipoCambioHoy(), getPushSubs()])
  const baseUrl = (process.env.NEXTAUTH_URL || 'https://localhost:3000').replace(/\/$/, '')
  const resultado: Record<string, string> = {}

  for (const user of getUsers()) {
    const meta = await getInvMeta(user.email)
    if (!meta) {
      resultado[user.email] = 'sin meta'
      continue
    }
    const [cobros, aportes, posiciones, valuaciones] = await Promise.all([
      getInvCobros(user.email), getInvAportes(user.email), getInvPosiciones(user.email), getInvValuaciones(user.email),
    ])
    const diarias = alertas({ meta, cobros, aportes, posiciones, valuaciones, hoy, tc }).filter(a => a.diaria)
    if (diarias.length === 0) {
      resultado[user.email] = 'sin alertas'
      continue
    }

    let enviados = 0
    if (subs.some(s => s.email === user.email)) {
      for (const a of diarias) {
        enviados += await enviarPush(user.email, { title: a.titulo, body: a.cuerpo, url: a.url, tag: `inv-${a.tipo}` })
      }
    }
    if (enviados > 0) {
      resultado[user.email] = `push: ${diarias.map(a => a.tipo).join(', ')}`
      continue
    }
    try {
      await enviarEmailInversionAlerta(user, diarias.map(a => ({ ...a, url: baseUrl + a.url })))
      resultado[user.email] = `email: ${diarias.map(a => a.tipo).join(', ')}`
    } catch (err) {
      console.error('Error enviando email de alertas de inversión:', err)
      resultado[user.email] = 'error email'
    }
  }

  return NextResponse.json({ ok: true, hoy, resultado })
}
