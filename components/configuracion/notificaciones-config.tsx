'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { BellRing, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Spinner } from '@/components/ui/spinner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Field, FieldContent, FieldDescription, FieldLabel } from '@/components/ui/field'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { usePwa } from '@/hooks/use-pwa'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(base64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

type Estado = 'cargando' | 'no-soportado' | 'sin-claves' | 'bloqueado' | 'off' | 'on'

/**
 * Activa/desactiva los recordatorios push en ESTE dispositivo.
 * La suscripción se guarda en la hoja push_subs asociada al email.
 */
export function NotificacionesConfig() {
  const { ready, standalone, isIOS } = usePwa()
  const [estado, setEstado] = useState<Estado>('cargando')
  const [sub, setSub] = useState<PushSubscription | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function init() {
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
        setEstado('no-soportado')
        return
      }
      if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
        setEstado('sin-claves')
        return
      }
      if (Notification.permission === 'denied') {
        setEstado('bloqueado')
        return
      }
      const reg = await navigator.serviceWorker.ready
      const actual = await reg.pushManager.getSubscription()
      if (cancelled) return
      setSub(actual)
      setEstado(actual ? 'on' : 'off')
    }
    init().catch(() => setEstado('no-soportado'))
    return () => {
      cancelled = true
    }
  }, [])

  async function activar() {
    setBusy(true)
    try {
      const permiso = await Notification.requestPermission()
      if (permiso !== 'granted') {
        setEstado(permiso === 'denied' ? 'bloqueado' : 'off')
        toast.error('No se dieron permisos de notificación')
        return
      }
      const reg = await navigator.serviceWorker.ready
      const nueva = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      })
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nueva.toJSON()),
      })
      if (!res.ok) throw new Error()
      setSub(nueva)
      setEstado('on')
      toast.success('Recordatorios activados en este dispositivo')
    } catch {
      toast.error('No se pudieron activar los recordatorios')
    } finally {
      setBusy(false)
    }
  }

  async function desactivar() {
    setBusy(true)
    try {
      const endpoint = sub?.endpoint
      await sub?.unsubscribe()
      if (endpoint) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint }),
        })
      }
      setSub(null)
      setEstado('off')
      toast.success('Recordatorios desactivados')
    } catch {
      toast.error('No se pudieron desactivar')
    } finally {
      setBusy(false)
    }
  }

  async function probar() {
    setBusy(true)
    try {
      const res = await fetch('/api/push/test', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error()
      toast.success(data.enviados > 0 ? 'Notificación enviada' : 'No hay dispositivos suscriptos')
    } catch {
      toast.error('No se pudo enviar la prueba')
    } finally {
      setBusy(false)
    }
  }

  const iosSinInstalar = ready && isIOS && !standalone
  const puedeActivar = estado === 'off' || estado === 'on'

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BellRing className="size-4" />
          Recordatorios
        </CardTitle>
        <CardDescription>
          Todas las noches a las 21:00, si ese día no cargaste ningún gasto, te
          avisamos con una notificación en el celular. Si no tenés push activo,
          te llega por email.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {iosSinInstalar && (
          <Alert>
            <AlertTitle>Primero instalá la app</AlertTitle>
            <AlertDescription>
              En iPhone las notificaciones solo funcionan con la app agregada a la
              pantalla de inicio. Instalala y volvé a esta pantalla desde ahí.
            </AlertDescription>
          </Alert>
        )}
        {estado === 'no-soportado' && !iosSinInstalar && (
          <Alert>
            <AlertDescription>Este navegador no soporta notificaciones push.</AlertDescription>
          </Alert>
        )}
        {estado === 'sin-claves' && (
          <Alert variant="destructive">
            <AlertDescription>
              Faltan las claves VAPID en el servidor (ver SETUP.md). Mientras tanto los
              recordatorios llegan por email.
            </AlertDescription>
          </Alert>
        )}
        {estado === 'bloqueado' && (
          <Alert variant="destructive">
            <AlertDescription>
              Bloqueaste las notificaciones para este sitio. Habilitalas desde los
              ajustes del navegador o del sistema.
            </AlertDescription>
          </Alert>
        )}

        <Field orientation="horizontal">
          <FieldContent>
            <FieldLabel htmlFor="push-switch">Recordatorio en este dispositivo</FieldLabel>
            <FieldDescription>
              {estado === 'on' ? 'Activado' : 'Desactivado'}
              {estado === 'cargando' && '…'}
            </FieldDescription>
          </FieldContent>
          {busy ? (
            <Spinner />
          ) : (
            <Switch
              id="push-switch"
              checked={estado === 'on'}
              disabled={!puedeActivar || iosSinInstalar}
              onCheckedChange={(checked) => (checked ? activar() : desactivar())}
            />
          )}
        </Field>
      </CardContent>
      {estado === 'on' && (
        <CardFooter>
          <Button variant="outline" size="sm" onClick={probar} disabled={busy}>
            <Send data-icon="inline-start" />
            Enviar prueba
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
