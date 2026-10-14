import { NextRequest, NextResponse } from 'next/server'
import { getInvAportes, deleteInvAporte, updateInvAporte, getInvPosiciones } from '@/lib/google-sheets'
import { emailDeSesion, num } from '../../_auth'
import { normalizarMontos, redondearUnidades, unidadesAuto } from '../_calculo'

/**
 * Corrige un aporte (monto, moneda, dólar, fecha, posición, unidades).
 * Si no mandan `unidades`: en la misma posición se escalan las que había con
 * el nuevo monto (respeta el precio de compra); si cambió la posición se
 * recalculan con la cotización de hoy, igual que al crear.
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await emailDeSesion()
  if ('error' in s) return s.error
  const [{ id }, b, aportes, posiciones] = await Promise.all([
    params, req.json(), getInvAportes(s.email), getInvPosiciones(s.email),
  ])
  const actual = aportes.find(a => a.id === id)
  if (!actual) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const tipo_cambio = num(b.tipo_cambio) > 0 ? num(b.tipo_cambio) : actual.tipo_cambio
  const montos = normalizarMontos(b, tipo_cambio)
  if (!montos) return NextResponse.json({ error: 'Monto inválido' }, { status: 400 })

  const posicion_id = String(b.posicion_id || actual.posicion_id)
  const posicion = posiciones.find(p => p.id === posicion_id)
  if (!posicion) return NextResponse.json({ error: 'Posición inválida' }, { status: 400 })

  // El precio de compra solo sigue valiendo si el aporte queda en la misma posición.
  const mismaPosicion = posicion_id === actual.posicion_id
  let unidades = num(b.unidades)
  let precio = mismaPosicion ? actual.precio : 0
  if (unidades <= 0) {
    // Escala en la moneda en que cotiza la posición: corregir solo el dólar no cambia lo comprado.
    const enArs = posicion.moneda === 'ARS' && actual.monto_ars > 0
    const antes = enArs ? actual.monto_ars : actual.monto_usd
    if (mismaPosicion && actual.unidades > 0 && antes > 0) {
      unidades = actual.unidades * ((enArs ? montos.monto_ars : montos.monto_usd) / antes)
    } else {
      const auto = await unidadesAuto(posicion, montos.monto_usd, tipo_cambio)
      if (auto) ({ unidades, precio } = auto)
    }
  }

  const aporte = {
    ...actual,
    ...montos,
    fecha: String(b.fecha || actual.fecha).slice(0, 10),
    tipo_cambio,
    posicion_id,
    unidades: redondearUnidades(unidades),
    precio,
  }
  if (!(await updateInvAporte(aporte))) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
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
