import { NextRequest, NextResponse } from 'next/server'
import { getInvCobros, createInvCobro, getInvMeta } from '@/lib/google-sheets'
import { getTipoCambioHoy } from '@/lib/tipo-cambio'
import { sugerenciaParaCobro } from '@/lib/inversion'
import { hoyAR } from '@/lib/dates'
import { emailDeSesion, num } from '../_auth'

export async function GET() {
  const s = await emailDeSesion()
  if ('error' in s) return s.error
  return NextResponse.json(await getInvCobros(s.email))
}

/** Guarda el cobro con el TC del día y devuelve cuánto te toca invertir. */
export async function POST(req: NextRequest) {
  const s = await emailDeSesion()
  if ('error' in s) return s.error
  const b = await req.json()
  const monto_ars = num(b.monto_ars)
  if (monto_ars <= 0) return NextResponse.json({ error: 'Monto inválido' }, { status: 400 })

  const [meta, cobros, tcHoy] = await Promise.all([getInvMeta(s.email), getInvCobros(s.email), getTipoCambioHoy()])
  if (!meta) return NextResponse.json({ error: 'Primero configurá tu meta' }, { status: 400 })
  const tipo_cambio = num(b.tipo_cambio) > 0 ? num(b.tipo_cambio) : tcHoy
  if (tipo_cambio <= 0) return NextResponse.json({ error: 'No se pudo obtener el tipo de cambio; cargalo a mano' }, { status: 400 })

  const cobro = await createInvCobro({
    email: s.email,
    fecha: String(b.fecha || hoyAR()).slice(0, 10),
    monto_ars,
    tipo: b.tipo === 'extra' ? 'extra' : 'base',
    tipo_cambio,
    notas: String(b.notas || ''),
  })
  const sugerencia = sugerenciaParaCobro(cobro, meta, cobros)
  return NextResponse.json({ cobro, sugerencia }, { status: 201 })
}
