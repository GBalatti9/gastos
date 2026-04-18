'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { format, addMonths, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  mes: string // "2026-04"
}

export function MonthNavigator({ mes }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [anio, mesNum] = mes.split('-').map(Number)
  const fecha = new Date(anio, mesNum - 1, 1)

  function navegar(dir: 'prev' | 'next') {
    const nueva = dir === 'prev' ? subMonths(fecha, 1) : addMonths(fecha, 1)
    const params = new URLSearchParams(searchParams.toString())
    params.set('mes', format(nueva, 'yyyy-MM'))
    router.push(`/dashboard?${params.toString()}`)
  }

  const label = format(fecha, 'MMMM yyyy', { locale: es })

  return (
    <div className="flex items-center justify-between">
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navegar('prev')}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <p className="text-sm font-medium text-foreground capitalize">{label}</p>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navegar('next')}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
