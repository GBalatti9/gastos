'use client'

import * as React from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { Spinner } from '@/components/ui/spinner'
import { useIsMobile } from '@/hooks/use-mobile'
import { NuevoGastoForm } from '@/components/gastos/nuevo-gasto-form'
import type { Categoria, TarjetaCredito } from '@/lib/types'

interface Props {
  usuarioEmail: string
  usuarioNombre: string
  otroUsuarioEmail: string
  otroUsuarioNombre: string
  /** Elemento que abre el dialog. Si no se pasa, el dialog es controlado por `open`. */
  trigger?: React.ReactElement
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

interface FormData {
  categorias: Categoria[]
  tarjetas: TarjetaCredito[]
}

/**
 * Alta de gasto. En desktop es un Dialog; en mobile un Drawer de abajo a
 * casi pantalla completa (más cómodo con una mano y con el teclado abierto).
 */
export function NuevoGastoDialog({
  usuarioEmail,
  usuarioNombre,
  otroUsuarioEmail,
  otroUsuarioNombre,
  trigger,
  open: openProp,
  onOpenChange,
}: Props) {
  const isMobile = useIsMobile()
  const [openState, setOpenState] = React.useState(false)
  const open = openProp ?? openState
  const setOpen = React.useCallback(
    (o: boolean) => {
      setOpenState(o)
      onOpenChange?.(o)
    },
    [onOpenChange]
  )
  const [data, setData] = React.useState<FormData | null>(null)

  React.useEffect(() => {
    if (!open) {
      setData(null) // descartar cache para refetchear al reabrir
      return
    }
    let cancelled = false
    Promise.all([fetch('/api/categorias'), fetch('/api/tarjetas')])
      .then(async ([resCat, resTar]) => {
        if (!resCat.ok || !resTar.ok) throw new Error()
        const [categorias, tarjetas] = await Promise.all([
          resCat.json() as Promise<Categoria[]>,
          resTar.json() as Promise<TarjetaCredito[]>,
        ])
        if (cancelled) return
        setData({
          categorias,
          tarjetas: tarjetas.filter((t) => t.owner_email === usuarioEmail),
        })
      })
      .catch(() => {
        if (!cancelled) toast.error('No se pudieron cargar las categorías')
      })
    return () => {
      cancelled = true
    }
  }, [open, usuarioEmail])

  const form = data ? (
    <NuevoGastoForm
      categorias={data.categorias}
      tarjetas={data.tarjetas}
      usuarioEmail={usuarioEmail}
      usuarioNombre={usuarioNombre}
      otroUsuarioEmail={otroUsuarioEmail}
      otroUsuarioNombre={otroUsuarioNombre}
      onSuccess={() => setOpen(false)}
    />
  ) : (
    <div className="flex h-40 items-center justify-center">
      <Spinner className="size-5 text-muted-foreground" />
    </div>
  )

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen} showSwipeHandle>
        {trigger && <DrawerTrigger render={trigger} />}
        <DrawerContent className="[--drawer-content-max-height:calc(100dvh-2.5rem)]">
          <DrawerHeader className="pb-2">
            <DrawerTitle>Nuevo gasto</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-4 pb-2">{form}</div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nuevo gasto</DialogTitle>
        </DialogHeader>
        {form}
      </DialogContent>
    </Dialog>
  )
}
