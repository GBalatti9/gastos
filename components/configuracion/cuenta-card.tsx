'use client'

import { useSession, signOut } from 'next-auth/react'
import { LogOut } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  nombre: string
  otroNombre: string
}

/** Datos de la sesión + cerrar sesión. En mobile el footer del sidebar no se ve. */
export function CuentaCard({ nombre, otroNombre }: Props) {
  const { data: session } = useSession()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cuenta</CardTitle>
        <CardDescription>Compartís los gastos con {otroNombre}.</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center gap-3">
        <Avatar className="size-10 rounded-lg">
          <AvatarImage src={session?.user?.image || ''} />
          <AvatarFallback className="rounded-lg bg-muted text-foreground">
            {nombre.charAt(0).toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{nombre}</p>
          <p className="truncate text-xs text-muted-foreground">{session?.user?.email}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: '/login' })}>
          <LogOut data-icon="inline-start" />
          Salir
        </Button>
      </CardContent>
    </Card>
  )
}
