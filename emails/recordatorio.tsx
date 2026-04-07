import {
  Html, Head, Body, Container, Heading, Text, Section, Hr, Preview
} from '@react-email/components'
import { ProximoVencimiento } from '@/lib/types'
import { AppUser } from '@/lib/users'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Props {
  destinatario: AppUser
  vencimientos: ProximoVencimiento[]
}

export function RecordatorioEmail({ destinatario, vencimientos }: Props) {
  const totalMonto = vencimientos.reduce((sum, v) => sum + v.pago.monto, 0)

  return (
    <Html>
      <Head />
      <Preview>{`${vencimientos.length} cuota(s) vencen en los próximos 7 días`}</Preview>
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f9fafb' }}>
        <Container style={{ maxWidth: 600, margin: '40px auto', backgroundColor: '#fff', borderRadius: 8, padding: 32 }}>
          <Heading style={{ color: '#111827', fontSize: 24 }}>⏰ Próximos vencimientos</Heading>
          <Text style={{ color: '#6b7280' }}>
            Hola {destinatario.nombre}, estas son las cuotas que vencen en los próximos 7 días:
          </Text>

          {vencimientos.map((v, i) => (
            <Section
              key={i}
              style={{
                backgroundColor: v.dias_restantes <= 2 ? '#fef2f2' : '#f3f4f6',
                borderRadius: 8,
                padding: 12,
                margin: '8px 0',
                borderLeft: `4px solid ${v.dias_restantes <= 2 ? '#ef4444' : '#6366f1'}`,
              }}
            >
              <Text style={{ margin: 0, fontWeight: 'bold', color: '#111827' }}>
                {v.gasto.descripcion}
              </Text>
              <Text style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 13 }}>
                Cuota {v.pago.numero_cuota}/{v.gasto.cuotas} •{' '}
                <strong style={{ color: '#111827' }}>${v.pago.monto.toLocaleString('es-AR')}</strong> •{' '}
                Vence: {format(new Date(v.pago.fecha_vencimiento), "d 'de' MMMM", { locale: es })}
                {v.dias_restantes === 0
                  ? ' (HOY)'
                  : v.dias_restantes === 1
                  ? ' (mañana)'
                  : ` (en ${v.dias_restantes} días)`}
              </Text>
            </Section>
          ))}

          <Section style={{ backgroundColor: '#eff6ff', borderRadius: 8, padding: 16, margin: '16px 0' }}>
            <Text style={{ margin: 0, textAlign: 'center' as const, fontSize: 16 }}>
              Total a pagar esta semana:{' '}
              <strong style={{ color: '#1d4ed8', fontSize: 20 }}>
                ${totalMonto.toLocaleString('es-AR')}
              </strong>
            </Text>
          </Section>

          <Hr style={{ margin: '24px 0', borderColor: '#e5e7eb' }} />
          <Text style={{ color: '#9ca3af', fontSize: 12 }}>Gastos Compartidos — recordatorio automático diario</Text>
        </Container>
      </Body>
    </Html>
  )
}

export default RecordatorioEmail
