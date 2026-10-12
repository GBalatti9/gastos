import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { savePushSub, deletePushSub, asegurarHojas, HOJA_PUSH_SUBS } from '@/lib/google-sheets'
import { pushConfigurado } from '@/lib/push'

/** GET: estado de configuración (si hay claves VAPID en el server). */
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  return NextResponse.json({ configurado: pushConfigurado() })
}

/** POST: guarda (upsert) la suscripción del dispositivo actual. */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  await asegurarHojas(HOJA_PUSH_SUBS)
  const body = await req.json()
  const endpoint: string | undefined = body?.endpoint
  const p256dh: string | undefined = body?.keys?.p256dh
  const authKey: string | undefined = body?.keys?.auth
  if (!endpoint || !p256dh || !authKey) {
    return NextResponse.json({ error: 'Suscripción inválida' }, { status: 400 })
  }

  await savePushSub({
    email: session.user.email,
    endpoint,
    p256dh,
    auth: authKey,
    user_agent: req.headers.get('user-agent') || '',
    created_at: new Date().toISOString(),
  })
  return NextResponse.json({ ok: true })
}

/** DELETE: borra la suscripción del dispositivo actual. */
export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { endpoint } = await req.json()
  if (!endpoint) return NextResponse.json({ error: 'Falta endpoint' }, { status: 400 })
  await deletePushSub(endpoint)
  return NextResponse.json({ ok: true })
}
