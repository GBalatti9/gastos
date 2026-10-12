import { NextRequest, NextResponse } from 'next/server'
import { getInvCobros, deleteInvCobro } from '@/lib/google-sheets'
import { emailDeSesion } from '../../_auth'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await emailDeSesion()
  if ('error' in s) return s.error
  const { id } = await params
  const propio = (await getInvCobros(s.email)).some(c => c.id === id)
  if (!propio) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  await deleteInvCobro(id)
  return NextResponse.json({ ok: true })
}
