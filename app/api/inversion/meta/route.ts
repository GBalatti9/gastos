import { NextRequest, NextResponse } from 'next/server'
import { getInvMeta, upsertInvMeta, getInvPosiciones, createInvPosiciones } from '@/lib/google-sheets'
import { mesActualAR } from '@/lib/dates'
import { emailDeSesion, num } from '../_auth'

export async function GET() {
  const s = await emailDeSesion()
  if ('error' in s) return s.error
  return NextResponse.json(await getInvMeta(s.email))
}

/** Crea o actualiza la meta. Si es la primera vez y no hay posiciones, siembra tres por defecto. */
export async function PUT(req: NextRequest) {
  const s = await emailDeSesion()
  if ('error' in s) return s.error
  const b = await req.json()

  const fecha_objetivo = String(b.fecha_objetivo || '').slice(0, 7)
  if (!/^\d{4}-\d{2}$/.test(fecha_objetivo)) {
    return NextResponse.json({ error: 'fecha_objetivo inválida (YYYY-MM)' }, { status: 400 })
  }
  const etapas = String(b.desriesgo_etapas || '30,60,90').split(',').map((n: string) => num(n))
  const meta = {
    email: s.email,
    monto_objetivo_usd: num(b.monto_objetivo_usd),
    fecha_objetivo,
    aporte_base_usd: num(b.aporte_base_usd),
    ingreso_base_ars: num(b.ingreso_base_ars),
    pct_extra: Math.min(100, Math.max(0, num(b.pct_extra, 100))),
    fecha_inicio: String(b.fecha_inicio || mesActualAR()).slice(0, 7),
    desriesgo_etapas: [etapas[0] ?? 30, etapas[1] ?? 60, etapas[2] ?? 90] as [number, number, number],
  }
  if (meta.monto_objetivo_usd <= 0 || meta.aporte_base_usd < 0) {
    return NextResponse.json({ error: 'Revisá el monto objetivo y el aporte base' }, { status: 400 })
  }
  await upsertInvMeta(meta)

  const posiciones = await getInvPosiciones(s.email)
  if (posiciones.length === 0) {
    await createInvPosiciones([
      { email: s.email, ticker: 'SPY', nombre: 'S&P 500', peso_objetivo: 60, rol: 'core', activo: true },
      { email: s.email, ticker: 'QQQ', nombre: 'Nasdaq 100', peso_objetivo: 25, rol: 'satelite', activo: true },
      { email: s.email, ticker: 'SEGURO', nombre: 'Bonos / money market', peso_objetivo: 15, rol: 'seguro', activo: true },
    ])
  }
  return NextResponse.json(meta)
}
