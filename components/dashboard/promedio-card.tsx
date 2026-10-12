'use client'

import { useState } from 'react'
import { CalendarRange } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { primerDiaDelMes } from '@/lib/dates'

export interface FilaMes {
  mes: string // YYYY-MM
  valores: number[]
}

interface Props {
  titulo: string
  monto: number
  /** Texto chico debajo del monto (ej. "vos $X · Cory $Y"). */
  detalle?: React.ReactNode
  /** Meses incluidos en el promedio. */
  meses: string[]
  /** Columnas de la tabla del dialog (sin la columna "Mes"). */
  columnas: string[]
  /** Una fila por mes, en el mismo orden que `columnas`. */
  filas: FilaMes[]
  /** Índice de la columna que se promedia en la última fila. */
  descripcion?: string
}

const ars = (n: number) => `$ ${Math.round(n).toLocaleString('es-AR')}`
const mesLabel = (mes: string) => format(primerDiaDelMes(mes), 'MMM yyyy', { locale: es })

export function PromedioDialog({
  open, onOpenChange, titulo, meses, columnas, filas, descripcion,
}: Pick<Props, 'titulo' | 'meses' | 'columnas' | 'filas' | 'descripcion'> & { open: boolean; onOpenChange: (o: boolean) => void }) {
  const n = meses.length
  const promedios = columnas.map((_, i) =>
    n === 0 ? 0 : filas.reduce((s, f) => s + (f.valores[i] ?? 0), 0) / n
  )
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>
            {descripcion ??
              'Promedio sobre meses completos (el mes en curso no cuenta). Cada cuota se asigna al mes de su vencimiento. Las liquidaciones de deuda no cuentan.'}
          </DialogDescription>
        </DialogHeader>
        {filas.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Todavía no hay meses completos para promediar.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[420px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Mes</TableHead>
                  {columnas.map((c) => (
                    <TableHead key={c} className="text-right">
                      {c}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...filas].reverse().map((f) => (
                  <TableRow key={f.mes}>
                    <TableCell className="font-medium capitalize">{mesLabel(f.mes)}</TableCell>
                    {f.valores.map((v, i) => (
                      <TableCell key={i} className="text-right tabular-nums">
                        {ars(v)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-semibold">
                  <TableCell>Promedio</TableCell>
                  {promedios.map((v, i) => (
                    <TableCell key={i} className="text-right tabular-nums">
                      {ars(v)}
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export function PromedioCard({ titulo, monto, detalle, meses, columnas, filas, descripcion }: Props) {
  const [open, setOpen] = useState(false)
  const n = meses.length

  return (
    <>
      <Card
        className="@container/card cursor-pointer transition-colors hover:border-primary/30"
        onClick={() => setOpen(true)}
      >
        <CardHeader>
          <CardDescription>{titulo}</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {n === 0 ? '—' : ars(monto)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <CalendarRange />
              {n === 0 ? 'Sin meses' : `${n} ${n === 1 ? 'mes' : 'meses'}`}
            </Badge>
          </CardAction>
        </CardHeader>
        {detalle && (
          <CardFooter className="text-xs text-muted-foreground">{detalle}</CardFooter>
        )}
      </Card>

      <PromedioDialog open={open} onOpenChange={setOpen} titulo={titulo} meses={meses} columnas={columnas} filas={filas} descripcion={descripcion} />
    </>
  )
}
