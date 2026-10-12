import { NextRequest, NextResponse } from 'next/server'
import { getInvPosiciones, createInvPosiciones } from '@/lib/google-sheets'
import { emailDeSesion, num } from '../_auth'
import type { InvRol } from '@/lib/types'

const ROLES: InvRol[] = ['core', 'satelite', 'seguro']

export async function GET() {
  const s = await emailDeSesion()
  if ('error' in s) return s.error
  return NextResponse.json(await getInvPosiciones(s.email))
}

export async function POST(req: NextRequest) {
  const s = await emailDeSesion()
  if ('error' in s) return s.error
  const b = await req.json()
  const ticker = String(b.ticker || '').trim().toUpperCase()
  if (!ticker) return NextResponse.json({ error: 'Falta el ticker' }, { status: 400 })
  const [p] = await createInvPosiciones([{
    email: s.email,
    ticker,
    nombre: String(b.nombre || ticker).trim(),
    peso_objetivo: Math.min(100, Math.max(0, num(b.peso_objetivo))),
    rol: ROLES.includes(b.rol) ? b.rol : 'satelite',
    activo: true,
  }])
  return NextResponse.json(p, { status: 201 })
}
