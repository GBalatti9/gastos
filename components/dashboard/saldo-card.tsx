import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SaldoData } from '@/lib/types'
import { getUserByEmail } from '@/lib/users'
import { ArrowRight } from 'lucide-react'

interface Props {
  saldo: SaldoData
}

export function SaldoCard({ saldo }: Props) {
  const deudorNombre = saldo.deudor === saldo.user1.email
    ? saldo.user1.nombre
    : saldo.user2.nombre
  const acreedorNombre = saldo.acreedor === saldo.user1.email
    ? saldo.user1.nombre
    : saldo.user2.nombre

  const esEquilibrado = saldo.monto_deuda < 1

  return (
    <Card className="border-0 shadow-md bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-white/80 text-sm font-medium uppercase tracking-wide">
          Saldo actual
        </CardTitle>
      </CardHeader>
      <CardContent>
        {esEquilibrado ? (
          <div className="text-center py-2">
            <div className="text-3xl font-bold">✅ Estamos al día</div>
            <p className="text-white/70 text-sm mt-1">No hay deudas pendientes</p>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg font-semibold">{deudorNombre}</span>
              <ArrowRight className="h-4 w-4 text-white/70" />
              <span className="text-lg font-semibold">{acreedorNombre}</span>
            </div>
            <div className="text-4xl font-bold">
              ${saldo.monto_deuda.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-white/70 text-sm mt-1">
              {deudorNombre} le debe a {acreedorNombre}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/20">
          <div>
            <p className="text-white/60 text-xs">{saldo.user1.nombre} pagó</p>
            <p className="font-semibold">${saldo.user1.total_pagado.toLocaleString('es-AR')}</p>
          </div>
          <div>
            <p className="text-white/60 text-xs">{saldo.user2.nombre} pagó</p>
            <p className="font-semibold">${saldo.user2.total_pagado.toLocaleString('es-AR')}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
