import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getCategorias, initCategorias } from '@/lib/google-sheets'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  await initCategorias()
  const categorias = await getCategorias()
  return NextResponse.json(categorias)
}
