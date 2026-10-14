import { NextRequest, NextResponse } from 'next/server'
import { getInvAportes, deleteInvAporte, updateInvAporte, getInvPosiciones } from '@/lib/google-sheets'
import { getPrecios, tienePrecioAuto, unidadesPorMonto } from '@/lib/precios'
import { emailDeSesion, num } from '../../_auth'

/**
 * Corrige un aporte (monto, moneda, dólar, fecha, posición, unidades).
 * Si no mandan `unidades`: en la misma posición se escalan las que había con
 * el nuevo monto (respeta el precio de compra); si cambió la posición se
 * recalculan con la cotización de hoy, igual que al crear.
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await emailDeSesion()
  if ('error' in s) return s.error
  const { id } = await params
  const actual = (await getInvAportes(s.email)).find(a => a.id === id)
  if (!actual) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  const b = await req.json()

  const tipo_cambio = num(b.tipo_cambio) > 0 ? num(b.tipo_cambio) : actual.tipo_cambio
  let monto_usd = num(b.monto_usd)
  let monto_ars = num(b.monto_ars)
  if (monto_usd <= 0 && monto_ars > 0 && tipo_cambio > 0) monto_usd = monto_ars / tipo_cambio
  if (monto_ars <= 0 && monto_usd > 0) monto_ars = monto_usd * tipo_cambio
  if (monto_usd <= 0) return NextResponse.json({ error: 'Monto inválido' }, { status: 400 })

  const posicion_id = String(b.posicion_id || actual.posicion_id)
  const posicion = (await getInvPosiciones(s.email)).find(p => p.id === posicion_id)
  if (!posicion) return NextResponse.json({ error: 'Posición inválida' }, { status: 400 })

  let unidades = num(b.unidades)
  let precio = num(b.precio) || actual.precio
  if (unidades <= 0) {
    if (posicion_id === actual.posicion_id && actual.unidades > 0 && actual.monto_usd > 0) {
      unidades = actual.unidades * (monto_usd / actual.monto_usd)
      precio = actual.precio
    } else if (tienePrecioAuto(posicion)) {
      const p = (await getPrecios([posicion])).get(posicion.id)
      if (p) {
        unidades = unidadesPorMonto(monto_usd, p, tipo_cambio)
        precio = p.precio
      }
    }
  }

  const aporte = {
    ...actual,
    fecha: String(b.fecha || actual.fecha).slice(0, 10),
    monto_usd: Math.round(monto_usd * 100) / 100,
    monto_ars: Math.round(monto_ars),
    tipo_cambio,
    posicion_id,
    unidades: Math.round(unidades * 1e6) / 1e6,
    precio,
  }
  await updateInvAporte(aporte)
  return NextResponse.json(aporte)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await emailDeSesion()
  if ('error' in s) return s.error
  const { id } = await params
  const propio = (await getInvAportes(s.email)).some(a => a.id === id)
  if (!propio) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  await deleteInvAporte(id)
  return NextResponse.json({ ok: true })
}
