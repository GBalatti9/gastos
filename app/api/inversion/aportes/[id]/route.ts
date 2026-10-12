import { NextRequest, NextResponse } from 'next/server'
import { getInvAportes, deleteInvAporte } from '@/lib/google-sheets'
import { emailDeSesion } from '../../_auth'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await emailDeSesion()
  if ('error' in s) return s.error
  const { id } = await params
  const propio = (await getInvAportes(s.email)).some(a => a.id === id)
  if (!propio) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  await deleteInvAporte(id)
  return NextResponse.json({ ok: true })
}
