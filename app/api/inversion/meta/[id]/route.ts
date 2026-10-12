import { NextRequest, NextResponse } from 'next/server'
import { getInvMetas, deleteInvMeta } from '@/lib/google-sheets'
import { emailDeSesion } from '../../_auth'

/** Borra la meta. Sus cobros/aportes/posiciones quedan en la planilla pero dejan de verse. */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await emailDeSesion()
  if ('error' in s) return s.error
  const { id } = await params
  const metas = await getInvMetas(s.email)
  if (!metas.some(m => m.id === id)) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  await deleteInvMeta(id)
  return NextResponse.json({ ok: true })
}
