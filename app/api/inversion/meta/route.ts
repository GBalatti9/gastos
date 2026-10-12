import { NextRequest, NextResponse } from 'next/server'
import { getInvMetas, upsertInvMeta } from '@/lib/google-sheets'
import { mesActualAR } from '@/lib/dates'
import { emailDeSesion, num } from '../_auth'

/** Todas las metas del usuario. */
export async function GET() {
  const s = await emailDeSesion()
  if ('error' in s) return s.error
  return NextResponse.json(await getInvMetas(s.email))
}

/** Crea (sin `id`) o actualiza (con `id`) una meta. No siembra posiciones: las define el usuario. */
export async function PUT(req: NextRequest) {
  const s = await emailDeSesion()
  if ('error' in s) return s.error
  const b = await req.json()

  const fecha_objetivo = String(b.fecha_objetivo || '').slice(0, 7)
  if (!/^\d{4}-\d{2}$/.test(fecha_objetivo)) {
    return NextResponse.json({ error: 'fecha_objetivo inválida (YYYY-MM)' }, { status: 400 })
  }
  const metas = await getInvMetas(s.email)
  const id = String(b.id || '')
  if (id && !metas.some(m => m.id === id)) return NextResponse.json({ error: 'Meta no encontrada' }, { status: 404 })

  const etapas = String(b.desriesgo_etapas || '30,60,90').split(',').map((n: string) => num(n))
  const meta = {
    id: id || Date.now().toString(),
    email: s.email,
    nombre: String(b.nombre || '').trim() || (metas.length === 0 ? 'Mi meta' : `Meta ${metas.length + 1}`),
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
  return NextResponse.json(meta, { status: id ? 200 : 201 })
}
