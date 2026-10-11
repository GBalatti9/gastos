'use client'

import { Share, SquarePlus, Smartphone, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { usePwa } from '@/hooks/use-pwa'

/**
 * Explica cómo instalar la app en la pantalla de inicio. Se oculta cuando ya
 * está instalada (modo standalone).
 */
export function InstallCard() {
  const { ready, standalone, isIOS, canPrompt, promptInstall } = usePwa()

  if (!ready) return null

  if (standalone) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="size-4" />
            App instalada
          </CardTitle>
          <CardDescription>
            Estás usando Gastos desde la pantalla de inicio. Los recordatorios se
            activan en la sección Notificaciones.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="size-4" />
          Instalar en el celular
          <Badge variant="secondary">PWA</Badge>
        </CardTitle>
        <CardDescription>
          Agregala a la pantalla de inicio para abrirla como una app y cargar
          gastos en dos toques. En iPhone, además, es necesario para recibir
          recordatorios.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isIOS ? (
          <ol className="flex flex-col gap-2 text-sm">
            <li className="flex items-center gap-2">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">1</span>
              Abrí esta página en <strong>Safari</strong>.
            </li>
            <li className="flex items-center gap-2">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">2</span>
              Tocá el botón <strong>Compartir</strong>
              <Share className="size-4 text-muted-foreground" />
            </li>
            <li className="flex items-center gap-2">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">3</span>
              Elegí <strong>Agregar a inicio</strong>
              <SquarePlus className="size-4 text-muted-foreground" />
            </li>
          </ol>
        ) : canPrompt ? (
          <p className="text-sm text-muted-foreground">
            Tu navegador permite instalarla directamente.
          </p>
        ) : (
          <ol className="flex flex-col gap-2 text-sm">
            <li className="flex items-center gap-2">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">1</span>
              Abrí el menú del navegador
              <MoreVertical className="size-4 text-muted-foreground" />
            </li>
            <li className="flex items-center gap-2">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">2</span>
              Tocá <strong>Instalar app</strong> o <strong>Agregar a pantalla de inicio</strong>.
            </li>
          </ol>
        )}
      </CardContent>
      {canPrompt && (
        <CardFooter>
          <Button onClick={() => promptInstall()} className="w-full sm:w-auto">
            <SquarePlus data-icon="inline-start" />
            Instalar
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
