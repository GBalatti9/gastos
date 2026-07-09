import { SaldoData } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { SaldarDeuda } from './saldar-deuda'

interface Props {
  saldoARS: SaldoData
  saldoUSD: SaldoData
  usuarioEmail: string
}

const fmt = (n: number, simbolo = '$') =>
  `${simbolo} ${Math.round(n).toLocaleString('es-AR')}`

export function DeudaCard({ saldoARS, saldoUSD, usuarioEmail }: Props) {
  const alDia = saldoARS.monto_deuda < 1 && saldoUSD.monto_deuda < 1
  const nombreDe = (email: string) =>
    email === saldoARS.user1.email ? saldoARS.user1.nombre : saldoARS.user2.nombre

  const deudorNombre = nombreDe(saldoARS.deudor)
  const acreedorNombre = nombreDe(saldoARS.acreedor)
  const usuarioEsDeudor = saldoARS.deudor === usuarioEmail

  return (
    <Card className="bg-gradient-to-t from-primary/5 to-card shadow-xs dark:bg-card">
      <CardContent className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            Balance entre ustedes
            {!alDia && (
              <Badge variant="outline">
                {usuarioEsDeudor ? 'Debés' : 'Te deben'}
              </Badge>
            )}
          </div>
          <div className="text-3xl font-semibold tabular-nums sm:text-4xl">
            {alDia ? 'Están al día' : fmt(saldoARS.monto_deuda)}
          </div>
          <p className="text-sm text-muted-foreground">
            {alDia ? (
              'No hay deudas pendientes entre ustedes'
            ) : (
              <>
                <span className="font-medium text-foreground">{deudorNombre}</span> le
                debe a{' '}
                <span className="font-medium text-foreground">{acreedorNombre}</span>
                {saldoUSD.monto_deuda >= 1 && (
                  <> · {fmt(saldoUSD.monto_deuda, 'U$S')} en dólares</>
                )}
              </>
            )}
          </p>
        </div>

        <div className="flex shrink-0 gap-2">
          <Dialog>
            <DialogTrigger render={<Button variant="outline" size="lg" />}>
              Ver detalle
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Detalle del saldo</DialogTitle>
                <DialogDescription>
                  Neto acumulado de todas las cuotas vencidas hasta hoy
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    {saldoARS.user1.nombre} pagó
                  </span>
                  <span className="font-medium tabular-nums">
                    {fmt(saldoARS.user1.total_pagado)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    {saldoARS.user2.nombre} pagó
                  </span>
                  <span className="font-medium tabular-nums">
                    {fmt(saldoARS.user2.total_pagado)}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Deuda en pesos</span>
                  <span className="font-semibold tabular-nums">
                    {saldoARS.monto_deuda < 1 ? 'Al día' : fmt(saldoARS.monto_deuda)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Deuda en dólares</span>
                  <span className="font-semibold tabular-nums">
                    {saldoUSD.monto_deuda < 1 ? 'Al día' : fmt(saldoUSD.monto_deuda, 'U$S')}
                  </span>
                </div>
                {!alDia && (
                  <>
                    <Separator />
                    <p className="text-sm text-muted-foreground">
                      {deudorNombre} le debe a {acreedorNombre} porque pagó menos de lo
                      que le correspondía según la división de cada gasto.
                    </p>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
          {!alDia && (
            <SaldarDeuda
              montoDeudaARS={saldoARS.monto_deuda}
              montoDeudaUSD={saldoUSD.monto_deuda}
              deudorEmail={saldoARS.deudor}
              deudorNombre={deudorNombre}
              acreedorNombre={acreedorNombre}
              usuarioEmail={usuarioEmail}
            />
          )}
        </div>
      </CardContent>
    </Card>
  )
}
