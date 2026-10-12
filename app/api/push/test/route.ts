import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { enviarPush } from '@/lib/push'

/** Manda una notificación de prueba a los dispositivos del usuario actual. */
export async function POST() {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const enviados = await enviarPush(session.user.email, {
    title: 'Gastos',
    body: 'Así se ven los recordatorios. Tocá para cargar un gasto.',
    url: '/dashboard?nuevo=1',
    tag: 'prueba',
  })
  return NextResponse.json({ ok: true, enviados })
}
