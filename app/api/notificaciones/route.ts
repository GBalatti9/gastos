import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getGastoById, getPagosByGastoId, getPagos } from '@/lib/google-sheets'
import {
  enviarEmailNuevoGasto,
  enviarEmailCuotaPagada,
  enviarEmailGastoCancelado,
} from '@/lib/email'
import { getOtherUser, getUserByEmail } from '@/lib/users'
import { NotificacionPayload } from '@/lib/types'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const payload: NotificacionPayload = await req.json()
  const { tipo, gasto, pago, autor_email, autor_nombre } = payload

  const autor = getUserByEmail(autor_email) || { email: autor_email, nombre: autor_nombre }
  const destinatario = getOtherUser(autor_email)

  try {
    if (tipo === 'nuevo_gasto') {
      const pagos = await getPagosByGastoId(gasto.id)
      const primerPago = pagos.sort((a, b) => a.numero_cuota - b.numero_cuota)[0]
      await enviarEmailNuevoGasto(destinatario, autor, gasto, primerPago)
    } else if (tipo === 'cuota_pagada' && pago) {
      await enviarEmailCuotaPagada(destinatario, autor, gasto, pago)
    } else if (tipo === 'gasto_cancelado') {
      await enviarEmailGastoCancelado(destinatario, autor, gasto)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Error enviando email:', err)
    return NextResponse.json({ error: 'Error al enviar email' }, { status: 500 })
  }
}
