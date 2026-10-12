'use client'

import * as React from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { NuevoGastoDialog } from '@/components/gastos/nuevo-gasto-dialog'

interface Props {
  usuarioEmail: string
  usuarioNombre: string
  otroUsuarioEmail: string
  otroUsuarioNombre: string
}

/**
 * Abre el alta de gasto cuando la URL trae `?nuevo=1` (atajo del ícono de la
 * PWA y link de las notificaciones). Al cerrar limpia el query.
 * Debe montarse dentro de <Suspense> por useSearchParams.
 */
export function NuevoGastoDeepLink(props: Props) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const quiereAbrir = searchParams.get('nuevo') === '1'
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    if (quiereAbrir) setOpen(true)
  }, [quiereAbrir])

  if (!quiereAbrir && !open) return null

  return (
    <NuevoGastoDialog
      {...props}
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) {
          const params = new URLSearchParams(searchParams.toString())
          params.delete('nuevo')
          const qs = params.toString()
          router.replace(qs ? `${pathname}?${qs}` : pathname)
        }
      }}
    />
  )
}
