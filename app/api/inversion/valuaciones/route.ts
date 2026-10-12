import { NextRequest, NextResponse } from 'next/server'
import { getInvValuaciones, createInvValuaciones, getInvPosiciones } from '@/lib/google-sheets'
import { hoyAR } from '@/lib/dates'
import { emailDeSesion, num } from '../_auth'

export async function GET() {
  const s = await emailDeSesion()
  if ('error' in s) return s.error
  return NextResponse.json(await getInvValuaciones(s.email))
}

/** Batch: { fecha, valores: { [posicion_id]: valor_usd } }. Una fila por posición, con la meta de cada una. */
export async function POST(req: NextRequest) {
  const s = await emailDeSesion()
  if ('error' in s) return s.error
  const b = await req.json()
  const fecha = String(b.fecha || hoyAR()).slice(0, 10)
  const valores: Record<string, unknown> = b.valores || {}
  const posiciones = await getInvPosiciones(s.email)
  const filas = Object.entries(valores)
    .map(([id, v]) => ({ pos: posiciones.find(p => p.id === id), v }))
    .filter(({ pos, v }) => pos && num(v, -1) >= 0)
    .map(({ pos, v }) => ({ email: s.email, fecha, posicion_id: pos!.id, valor_usd: Math.round(num(v) * 100) / 100, meta_id: pos!.meta_id }))
  if (filas.length === 0) return NextResponse.json({ error: 'Sin valores válidos' }, { status: 400 })
  await createInvValuaciones(filas)
  return NextResponse.json({ ok: true, guardadas: filas.length }, { status: 201 })
}
