import { NextRequest, NextResponse } from 'next/server'
import { getInvPosiciones, createInvPosiciones, getInvMetas } from '@/lib/google-sheets'
import { emailDeSesion, num } from '../_auth'
import { ROLES, TIPOS, MONEDA_POR_TIPO } from '@/lib/activos'
import type { InvTipoActivo } from '@/lib/types'

export async function GET() {
  const s = await emailDeSesion()
  if ('error' in s) return s.error
  return NextResponse.json(await getInvPosiciones(s.email))
}

export async function POST(req: NextRequest) {
  const s = await emailDeSesion()
  if ('error' in s) return s.error
  const b = await req.json()
  const tipo: InvTipoActivo = TIPOS.includes(b.tipo) ? b.tipo : 'otro'
  const ticker = String(b.ticker || '').trim().toUpperCase()
  const nombre = String(b.nombre || '').trim() || ticker
  if (!nombre) return NextResponse.json({ error: 'Falta el nombre o el ticker' }, { status: 400 })
  const metas = await getInvMetas(s.email)
  const meta_id = String(b.meta_id || metas[0]?.id || '')
  if (!metas.some(m => m.id === meta_id)) return NextResponse.json({ error: 'Meta inválida' }, { status: 400 })

  const [p] = await createInvPosiciones([{
    email: s.email,
    ticker,
    nombre,
    peso_objetivo: Math.min(100, Math.max(0, num(b.peso_objetivo))),
    rol: ROLES.includes(b.rol) ? b.rol : 'satelite',
    activo: true,
    tipo,
    moneda: b.moneda === 'USD' || b.moneda === 'ARS' ? b.moneda : MONEDA_POR_TIPO[tipo],
    meta_id,
  }])
  return NextResponse.json(p, { status: 201 })
}
