import { Gasto, Pago, Moneda } from './types'
import { getUsers } from './users'
import { calcularResponsabilidad } from './saldo'
import { cuentaComoGasto, esPersonal } from './gastos-utils'
import { mesAnterior, mesActualAR } from './dates'

/**
 * Métricas mensuales. Convención: un pago "pertenece" al mes de su
 * `fecha_vencimiento` (igual que el chart, "Cuotas del mes" y "Costo real").
 * Se excluyen gastos cancelados y liquidaciones.
 */

export interface MesResumen {
  mes: string // YYYY-MM
  /** Total de gastos compartidos (lo que gastó la pareja como unidad). */
  pareja: number
  /** Lo que le toca a cada uno: su parte de los compartidos + sus personales. */
  u1: number
  u2: number
  /** Desglose. */
  casaU1: number
  casaU2: number
  personalU1: number
  personalU2: number
  cantidadPagos: number
}

export interface Promedio {
  meses: string[]
  pareja: number
  u1: number
  u2: number
  casaU1: number
  casaU2: number
  personalU1: number
  personalU2: number
}

function vacio(mes: string): MesResumen {
  return { mes, pareja: 0, u1: 0, u2: 0, casaU1: 0, casaU2: 0, personalU1: 0, personalU2: 0, cantidadPagos: 0 }
}

/** Agrupa pagos por mes de vencimiento. Devuelve solo meses con algún pago, ordenados asc. */
export function resumenPorMes(pagos: Pago[], gastos: Gasto[], moneda: Moneda = 'ARS'): MesResumen[] {
  const [u1] = getUsers()
  const porId = new Map(gastos.filter(g => cuentaComoGasto(g, moneda)).map(g => [g.id, g]))
  const meses = new Map<string, MesResumen>()

  for (const p of pagos) {
    const g = porId.get(p.gasto_id)
    if (!g) continue
    const mes = p.fecha_vencimiento.slice(0, 7)
    if (!mes) continue
    const r = meses.get(mes) ?? vacio(mes)

    const resp = calcularResponsabilidad(g, p.monto)
    if (esPersonal(g)) {
      if (g.pagado_por === u1.email) r.personalU1 += p.monto
      else r.personalU2 += p.monto
    } else {
      r.pareja += p.monto
      r.casaU1 += resp.u1
      r.casaU2 += resp.u2
    }
    r.u1 = r.casaU1 + r.personalU1
    r.u2 = r.casaU2 + r.personalU2
    r.cantidadPagos += 1
    meses.set(mes, r)
  }

  return [...meses.values()].sort((a, b) => a.mes.localeCompare(b.mes))
}

/**
 * Promedio sobre meses COMPLETOS (por defecto hasta el mes anterior al actual),
 * tomando los últimos N meses con datos.
 */
export function promedioMensual(
  resumen: MesResumen[],
  opts: { hastaMes?: string; ultimos?: number | 'todos' } = {}
): Promedio {
  const hastaMes = opts.hastaMes ?? mesAnterior(mesActualAR())
  const ultimos = opts.ultimos ?? 6

  let completos = resumen.filter(r => r.mes <= hastaMes)
  if (ultimos !== 'todos') completos = completos.slice(-ultimos)

  const n = completos.length
  const avg = (sel: (r: MesResumen) => number) =>
    n === 0 ? 0 : completos.reduce((s, r) => s + sel(r), 0) / n

  return {
    meses: completos.map(r => r.mes),
    pareja: avg(r => r.pareja),
    u1: avg(r => r.u1),
    u2: avg(r => r.u2),
    casaU1: avg(r => r.casaU1),
    casaU2: avg(r => r.casaU2),
    personalU1: avg(r => r.personalU1),
    personalU2: avg(r => r.personalU2),
  }
}
