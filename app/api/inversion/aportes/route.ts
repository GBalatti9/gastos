import { NextRequest, NextResponse } from 'next/server'
import { getInvAportes, createInvAporte, getInvPosiciones, getInvMetas } from '@/lib/google-sheets'
import { getTipoCambioHoy } from '@/lib/tipo-cambio'
import { getPrecios, tienePrecioAuto, unidadesPorMonto } from '@/lib/precios'
import { hoyAR } from '@/lib/dates'
import { emailDeSesion, num } from '../_auth'

export async function GET() {
  const s = await emailDeSesion()
  if ('error' in s) return s.error
  return NextResponse.json(await getInvAportes(s.email))
}

/**
 * Acepta monto_usd o monto_ars (+ tipo_cambio). Siempre guarda ambos.
 * Si la posición tiene precio automático y no mandan `unidades`, las calcula
 * con la cotización de hoy; así después la cartera se valúa sola.
 */
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

  const [metas, posiciones] = await Promise.all([getInvMetas(s.email), getInvPosiciones(s.email)])
  const meta_id = String(b.meta_id || metas[0]?.id || '')
  if (!metas.some(m => m.id === meta_id)) return NextResponse.json({ error: 'Meta inválida' }, { status: 400 })
  const posicion = posiciones.find(p => p.id === String(b.posicion_id || '') && p.activo)
  if (!posicion) return NextResponse.json({ error: 'Posición inválida' }, { status: 400 })

  let unidades = num(b.unidades)
  let precio = num(b.precio)
  if (unidades <= 0 && tienePrecioAuto(posicion)) {
    const p = (await getPrecios([posicion])).get(posicion.id)
    if (p) {
      unidades = unidadesPorMonto(monto_usd, p, tipo_cambio)
      precio = p.precio
    }
  }

  const aporte = await createInvAporte({
    email: s.email,
    fecha: String(b.fecha || hoyAR()).slice(0, 10),
    monto_usd: Math.round(monto_usd * 100) / 100,
    monto_ars: Math.round(monto_ars),
    tipo_cambio,
    posicion_id: posicion.id,
    cobro_id: String(b.cobro_id || ''),
    notas: String(b.notas || ''),
    unidades: Math.round(unidades * 1e6) / 1e6,
    precio,
    meta_id,
  })
  return NextResponse.json(aporte, { status: 201 })
}
