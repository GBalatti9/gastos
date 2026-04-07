import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getPagos } from '@/lib/google-sheets'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const pagos = await getPagos()
  return NextResponse.json(pagos)
}
