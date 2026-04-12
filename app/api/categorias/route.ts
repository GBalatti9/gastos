import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getCategorias, initCategorias, createCategoria } from '@/lib/google-sheets'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  await initCategorias()
  const categorias = await getCategorias()
  return NextResponse.json(categorias)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { nombre, color, icono } = await req.json()
  if (!nombre || !color || !icono) {
    return NextResponse.json({ error: 'nombre, color e icono son requeridos' }, { status: 400 })
  }

  const categoria = await createCategoria({ nombre, color, icono })
  return NextResponse.json(categoria, { status: 201 })
}
