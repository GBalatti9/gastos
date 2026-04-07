import { Resend } from 'resend'
import { render } from '@react-email/render'
import { NuevoGastoEmail } from '@/emails/nuevo-gasto'
import { CuotaPagadaEmail } from '@/emails/cuota-pagada'
import { GastoCanceladoEmail } from '@/emails/gasto-cancelado'
import { RecordatorioEmail } from '@/emails/recordatorio'
import { Gasto, Pago, ProximoVencimiento } from './types'
import { AppUser } from './users'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

const FROM = process.env.EMAIL_FROM || 'Gastos Compartidos <noreply@gastos.app>'

export async function enviarEmailNuevoGasto(
  destinatario: AppUser,
  autor: AppUser,
  gasto: Gasto,
  primerPago: Pago | undefined
) {
  const html = await render(
    NuevoGastoEmail({ destinatario, autor, gasto, primerPago }) as any
  )
  await getResend().emails.send({
    from: FROM,
    to: destinatario.email,
    subject: `💸 Nuevo gasto: ${gasto.descripcion}`,
    html,
  })
}

export async function enviarEmailCuotaPagada(
  destinatario: AppUser,
  autor: AppUser,
  gasto: Gasto,
  pago: Pago
) {
  const html = await render(
    CuotaPagadaEmail({ destinatario, autor, gasto, pago }) as any
  )
  await getResend().emails.send({
    from: FROM,
    to: destinatario.email,
    subject: `✅ Cuota pagada: ${gasto.descripcion} (${pago.numero_cuota}/${gasto.cuotas})`,
    html,
  })
}

export async function enviarEmailGastoCancelado(
  destinatario: AppUser,
  autor: AppUser,
  gasto: Gasto
) {
  const html = await render(
    GastoCanceladoEmail({ destinatario, autor, gasto }) as any
  )
  await getResend().emails.send({
    from: FROM,
    to: destinatario.email,
    subject: `❌ Gasto cancelado: ${gasto.descripcion}`,
    html,
  })
}

export async function enviarEmailRecordatorio(
  destinatario: AppUser,
  vencimientos: ProximoVencimiento[]
) {
  const html = await render(
    RecordatorioEmail({ destinatario, vencimientos }) as any
  )
  await getResend().emails.send({
    from: FROM,
    to: destinatario.email,
    subject: `⏰ Recordatorio: ${vencimientos.length} cuota(s) vencen esta semana`,
    html,
  })
}
