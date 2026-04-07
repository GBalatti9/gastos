import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getGastoById, updateGastoEstado } from '@/lib/google-sheets'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const gasto = await getGastoById(id)
  if (!gasto) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  await updateGastoEstado(id, 'cancelado')
  return NextResponse.json({ ok: true })
}
