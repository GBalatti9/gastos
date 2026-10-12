import { NextRequest, NextResponse } from 'next/server'
import { getInvAportes, createInvAporte, getInvPosiciones } from '@/lib/google-sheets'
import { getTipoCambioHoy } from '@/lib/tipo-cambio'
import { hoyAR } from '@/lib/dates'
import { emailDeSesion, num } from '../_auth'

export async function GET() {
  const s = await emailDeSesion()
  if ('error' in s) return s.error
  return NextResponse.json(await getInvAportes(s.email))
}

/** Acepta monto_usd o monto_ars (+ tipo_cambio). Siempre guarda ambos. */
export async function POST(req: NextRequest) {
  const s = await emailDeSesion()
  if ('error' in s) return s.error
  const b = await req.json()

  const tipo_cambio = num(b.tipo_cambio) > 0 ? num(b.tipo_cambio) : await getTipoCambioHoy()
  let monto_usd = num(b.monto_usd)
  let monto_ars = num(b.monto_ars)
  if (monto_usd <= 0 && monto_ars > 0 && tipo_cambio > 0) monto_usd = monto_ars / tipo_cambio
  if (monto_ars <= 0 && monto_usd > 0) monto_ars = monto_usd * tipo_cambio
  if (monto_usd <= 0) return NextResponse.json({ error: 'Monto inválido' }, { status: 400 })

  const posiciones = await getInvPosiciones(s.email)
  const posicion_id = String(b.posicion_id || '')
  if (!posiciones.some(p => p.id === posicion_id && p.activo)) {
    return NextResponse.json({ error: 'Posición inválida' }, { status: 400 })
  }

  const aporte = await createInvAporte({
    email: s.email,
    fecha: String(b.fecha || hoyAR()).slice(0, 10),
    monto_usd: Math.round(monto_usd * 100) / 100,
    monto_ars: Math.round(monto_ars),
    tipo_cambio,
    posicion_id,
    cobro_id: String(b.cobro_id || ''),
    notas: String(b.notas || ''),
  })
  return NextResponse.json(aporte, { status: 201 })
}
