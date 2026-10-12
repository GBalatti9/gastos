import { NextRequest, NextResponse } from 'next/server'
import { getInvPosiciones } from '@/lib/google-sheets'
import { getPrecios } from '@/lib/precios'
import { getTipoCambioHoy } from '@/lib/tipo-cambio'
import { emailDeSesion } from '../_auth'

/** Cotización actual de las posiciones del usuario (con precio automático) + TC del día. */
export async function GET(req: NextRequest) {
  const s = await emailDeSesion()
  if ('error' in s) return s.error
  const ids = req.nextUrl.searchParams.get('ids')?.split(',').filter(Boolean)
  const posiciones = (await getInvPosiciones(s.email)).filter(p => !ids || ids.includes(p.id))
  const [precios, tc] = await Promise.all([getPrecios(posiciones), getTipoCambioHoy()])
  return NextResponse.json({ tc, precios: Object.fromEntries(precios) })
}
