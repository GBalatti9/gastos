'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Gasto, Pago, Categoria } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { CheckCircle2, Circle, Loader2, Trash2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Props {
  gasto: Gasto
  pagos: Pago[]
  categorias: Categoria[]
  usuarioEmail: string
  usuarioNombre: string
}

export function GastoDetalle({ gasto, pagos: initialPagos, categorias, usuarioEmail, usuarioNombre }: Props) {
  const router = useRouter()
  const [pagos, setPagos] = useState(initialPagos)
  const [loadingPago, setLoadingPago] = useState<string | null>(null)
  const [loadingCancelar, setLoadingCancelar] = useState(false)

  const cat = categorias.find(c => c.nombre === gasto.categoria)
  const pagados = pagos.filter(p => p.estado === 'pagado').length
  const total = pagos.length || gasto.cuotas
  const progreso = total > 0 ? (pagados / total) * 100 : 0
  const pagosPendientes = pagos.filter(p => p.estado === 'pendiente')
  const pagosPagados = pagos.filter(p => p.estado === 'pagado')

  async function marcarComoPagado(pago: Pago) {
    setLoadingPago(pago.id)
    try {
      const res = await fetch(`/api/pagos/${pago.id}/pagar`, { method: 'POST' })
      if (!res.ok) throw new Error()
      const data = await res.json()

      setPagos(prev =>
        prev.map(p =>
          p.id === pago.id
            ? { ...p, estado: 'pagado', fecha_pago: data.fecha_pago, pagado_por: data.pagado_por }
            : p
        )
      )

      // Send notification
      try {
        await fetch('/api/notificaciones', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tipo: 'cuota_pagada',
            gasto,
            pago: { ...pago, estado: 'pagado', fecha_pago: data.fecha_pago, pagado_por: data.pagado_por },
            autor_email: usuarioEmail,
            autor_nombre: usuarioNombre,
          }),
        })
      } catch {}

      toast.success(`Cuota ${pago.numero_cuota} marcada como pagada`)
    } catch {
      toast.error('Error al marcar el pago')
    } finally {
      setLoadingPago(null)
    }
  }

  async function cancelarGasto() {
    setLoadingCancelar(true)
    try {
      const res = await fetch(`/api/gastos/${gasto.id}/cancelar`, { method: 'POST' })
      if (!res.ok) throw new Error()

      // Send notification
      try {
        await fetch('/api/notificaciones', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tipo: 'gasto_cancelado',
            gasto,
            autor_email: usuarioEmail,
            autor_nombre: usuarioNombre,
          }),
        })
      } catch {}

      toast.success('Gasto cancelado')
      router.push('/gastos')
      router.refresh()
    } catch {
      toast.error('Error al cancelar el gasto')
    } finally {
      setLoadingCancelar(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/gastos">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">{cat?.icono || '📦'}</span>
            <h1 className="text-xl font-bold">{gasto.descripcion}</h1>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline">{gasto.categoria}</Badge>
            {gasto.estado === 'cancelado' && <Badge variant="destructive">Cancelado</Badge>}
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Monto total</p>
              <p className="text-2xl font-bold">${gasto.monto_total.toLocaleString('es-AR')}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Por cuota</p>
              <p className="text-2xl font-bold">
                ${(gasto.monto_total / gasto.cuotas).toLocaleString('es-AR', { maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {gasto.cuotas > 1 && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Progreso</span>
                <span className="font-medium">{pagados}/{total} cuotas</span>
              </div>
              <Progress value={progreso} className="h-2" />
            </div>
          )}

          <Separator />

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Cuotas</p>
              <p className="font-medium">{gasto.cuotas}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Vence el día</p>
              <p className="font-medium">{gasto.dia_vencimiento} de cada mes</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Fecha inicio</p>
              <p className="font-medium">
                {format(new Date(gasto.fecha_inicio), "d MMM yyyy", { locale: es })}
              </p>
            </div>
          </div>

          {gasto.notas && (
            <>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground mb-1">Notas</p>
                <p className="text-sm">{gasto.notas}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Cuotas pendientes */}
      {pagosPendientes.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Cuotas pendientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pagosPendientes
              .sort((a, b) => a.numero_cuota - b.numero_cuota)
              .map(pago => (
                <div
                  key={pago.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-orange-50 border border-orange-100"
                >
                  <div className="flex items-center gap-3">
                    <Circle className="h-5 w-5 text-orange-400" />
                    <div>
                      <p className="text-sm font-medium">
                        Cuota {pago.numero_cuota}/{gasto.cuotas}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Vence: {format(new Date(pago.fecha_vencimiento), "d MMM yyyy", { locale: es })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">${pago.monto.toLocaleString('es-AR')}</span>
                    {gasto.estado === 'activo' && (
                      usuarioEmail === gasto.pagado_por ? (
                        <span className="text-xs text-muted-foreground italic">esperando pago</span>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => marcarComoPagado(pago)}
                          disabled={loadingPago === pago.id}
                          className="h-8"
                        >
                          {loadingPago === pago.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            'Pagué mi parte'
                          )}
                        </Button>
                      )
                    )}
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      {/* Cuotas pagadas */}
      {pagosPagados.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-muted-foreground">Cuotas pagadas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pagosPagados
              .sort((a, b) => b.numero_cuota - a.numero_cuota)
              .map(pago => (
                <div
                  key={pago.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-100"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">
                        Cuota {pago.numero_cuota}/{gasto.cuotas}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Pagado{' '}
                        {pago.fecha_pago
                          ? format(new Date(pago.fecha_pago), "d MMM yyyy", { locale: es })
                          : ''}
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold text-sm text-green-700">
                    ${pago.monto.toLocaleString('es-AR')}
                  </span>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      {gasto.estado === 'activo' && (
        <AlertDialog>
          <AlertDialogTrigger className="w-full rounded-md bg-destructive text-white px-4 py-2 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
            {loadingCancelar ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Cancelar gasto
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Cancelar este gasto?</AlertDialogTitle>
              <AlertDialogDescription>
                Se cancelará "{gasto.descripcion}" y se notificará a la otra persona. No se pueden deshacer los pagos ya registrados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>No, mantener</AlertDialogCancel>
              <AlertDialogAction onClick={cancelarGasto} className="bg-destructive hover:bg-destructive/90">
                Sí, cancelar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
