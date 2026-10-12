import webpush from 'web-push'
import { getPushSubs, deletePushSub, asegurarHojas, HOJA_PUSH_SUBS } from './google-sheets'

export interface PushPayload {
  title: string
  body: string
  /** Ruta a abrir al tocar la notificación (ej. /dashboard?nuevo=1). */
  url?: string
  tag?: string
}

function configurar() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  if (!publicKey || !privateKey) return false
  // El subject tiene que ser una URL: si cargaron el email pelado, le ponemos mailto:
  const raw = (process.env.VAPID_SUBJECT || 'gastos@example.com').trim()
  const subject = /^(mailto:|https?:\/\/)/i.test(raw) ? raw : `mailto:${raw}`
  webpush.setVapidDetails(subject, publicKey, privateKey)
  return true
}

export function pushConfigurado(): boolean {
  return !!(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY)
}

/**
 * Envía la notificación a todos los dispositivos suscriptos de un email.
 * Devuelve cuántos recibieron. Las suscripciones vencidas (404/410) se borran.
 */
export async function enviarPush(email: string, payload: PushPayload): Promise<number> {
  if (!configurar()) return 0
  await asegurarHojas(HOJA_PUSH_SUBS)
  const subs = (await getPushSubs()).filter(s => s.email === email)
  if (subs.length === 0) return 0

  let enviados = 0
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload),
        { TTL: 60 * 60 * 12 }
      )
      enviados++
    } catch (err) {
      const status = (err as { statusCode?: number }).statusCode
      if (status === 404 || status === 410) {
        await deletePushSub(sub.endpoint)
      } else {
        console.error('Error enviando push:', err)
      }
    }
  }
  return enviados
}
