'use client'

import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { NuevoGastoForm } from '@/components/gastos/nuevo-gasto-form'
import type { Categoria, TarjetaCredito } from '@/lib/types'

interface Props {
  usuarioEmail: string
  usuarioNombre: string
  otroUsuarioEmail: string
  otroUsuarioNombre: string
  /** Elemento que abre el dialog (se usa como DialogTrigger via render). */
  trigger: React.ReactElement
}

interface FormData {
  categorias: Categoria[]
  tarjetas: TarjetaCredito[]
}

export function NuevoGastoDialog({
  usuarioEmail,
  usuarioNombre,
  otroUsuarioEmail,
  otroUsuarioNombre,
  trigger,
}: Props) {
  const [open, setOpen] = React.useState(false)
  const [data, setData] = React.useState<FormData | null>(null)

  React.useEffect(() => {
    if (!open || data) return
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
  }, [open, data, usuarioEmail])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nuevo gasto</DialogTitle>
        </DialogHeader>
        {data ? (
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
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
