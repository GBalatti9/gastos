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
  if (searchParams.get('nuevo') !== '1') return null
  // key: cada vez que vuelve a aparecer ?nuevo=1 se monta un dialog nuevo (abierto)
  return <DialogDesdeQuery key={searchParams.toString()} {...props} />
}

function DialogDesdeQuery(props: Props) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = React.useState(true)

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
