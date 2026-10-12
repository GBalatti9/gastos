import { NextRequest, NextResponse } from 'next/server'
import { getInvPosiciones, updateInvPosicion } from '@/lib/google-sheets'
import { emailDeSesion, num } from '../../_auth'
import type { InvRol } from '@/lib/types'

const ROLES: InvRol[] = ['core', 'satelite', 'seguro']

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await emailDeSesion()
  if ('error' in s) return s.error
  const { id } = await params
  const actual = (await getInvPosiciones(s.email)).find(p => p.id === id)
  if (!actual) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  const b = await req.json()
  const p = {
    ...actual,
    ticker: b.ticker !== undefined ? String(b.ticker).trim().toUpperCase() : actual.ticker,
    nombre: b.nombre !== undefined ? String(b.nombre).trim() : actual.nombre,
    peso_objetivo: b.peso_objetivo !== undefined ? Math.min(100, Math.max(0, num(b.peso_objetivo))) : actual.peso_objetivo,
    rol: ROLES.includes(b.rol) ? (b.rol as InvRol) : actual.rol,
    activo: b.activo !== undefined ? !!b.activo : actual.activo,
  }
  await updateInvPosicion(p)
  return NextResponse.json(p)
}

/** Baja lógica: queda inactiva (sus aportes históricos se conservan). */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await emailDeSesion()
  if ('error' in s) return s.error
  const { id } = await params
  const actual = (await getInvPosiciones(s.email)).find(p => p.id === id)
  if (!actual) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  await updateInvPosicion({ ...actual, activo: false })
  return NextResponse.json({ ok: true })
}
