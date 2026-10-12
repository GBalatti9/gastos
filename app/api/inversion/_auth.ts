import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

/** Email de la sesión o una respuesta 401 lista para devolver. */
export async function emailDeSesion(): Promise<{ email: string } | { error: NextResponse }> {
  const session = await auth()
  const email = session?.user?.email
  if (!email) return { error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) }
  return { email }
}

export const num = (v: unknown, def = 0) => {
  const n = typeof v === 'string' ? parseFloat(v.replace(',', '.')) : Number(v)
  return Number.isFinite(n) ? n : def
}
