import {
  Html, Head, Body, Container, Heading, Text, Button, Section, Hr, Preview
} from '@react-email/components'
import { AppUser } from '@/lib/users'

export interface AlertaEmail {
  titulo: string
  cuerpo: string
  url: string
}

interface Props {
  destinatario: AppUser
  alertas: AlertaEmail[]
}

export function InversionAlertaEmail({ destinatario, alertas }: Props) {
  return (
    <Html>
      <Head />
      <Preview>{alertas[0]?.titulo || 'Alerta de inversión'}</Preview>
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f9fafb' }}>
        <Container style={{ maxWidth: 480, margin: '40px auto', backgroundColor: '#fff', borderRadius: 8, padding: 32 }}>
          <Heading style={{ color: '#111827', fontSize: 22 }}>📈 Tu inversión</Heading>
          <Text style={{ color: '#374151' }}>Hola {destinatario.nombre}, un aviso del módulo de inversión:</Text>
          {alertas.map((a, i) => (
            <Section key={i} style={{ backgroundColor: '#eff6ff', borderRadius: 8, padding: 16, margin: '12px 0', borderLeft: '4px solid #2E86C1' }}>
              <Text style={{ margin: 0, fontWeight: 'bold', color: '#111827' }}>{a.titulo}</Text>
              <Text style={{ margin: '4px 0 12px', color: '#374151', fontSize: 14 }}>{a.cuerpo}</Text>
              <Button href={a.url} style={{ backgroundColor: '#2E86C1', color: '#fff', padding: '10px 16px', borderRadius: 8, fontWeight: 600, display: 'inline-block' }}>
                Abrir
              </Button>
            </Section>
          ))}
          <Hr style={{ margin: '24px 0', borderColor: '#e5e7eb' }} />
          <Text style={{ color: '#9ca3af', fontSize: 12 }}>
            Gastos — alertas de inversión. Si instalás la app en el celular y activás los recordatorios, esto te llega como notificación.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default InversionAlertaEmail
