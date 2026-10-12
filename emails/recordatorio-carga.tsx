import {
  Html, Head, Body, Container, Heading, Text, Button, Hr, Preview
} from '@react-email/components'
import { AppUser } from '@/lib/users'

interface Props {
  destinatario: AppUser
  url: string
}

export function RecordatorioCargaEmail({ destinatario, url }: Props) {
  return (
    <Html>
      <Head />
      <Preview>Hoy no cargaste ningún gasto. ¿Se te pasó alguno?</Preview>
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f9fafb' }}>
        <Container style={{ maxWidth: 480, margin: '40px auto', backgroundColor: '#fff', borderRadius: 8, padding: 32 }}>
          <Heading style={{ color: '#111827', fontSize: 22 }}>📝 ¿Gastaste algo hoy?</Heading>
          <Text style={{ color: '#374151' }}>
            Hola {destinatario.nombre}, hoy no cargaste ningún gasto. Si compraste
            algo, anotalo ahora así no se pierde y el promedio del mes queda bien.
          </Text>
          <Button
            href={url}
            style={{
              backgroundColor: '#2E86C1',
              color: '#fff',
              padding: '12px 20px',
              borderRadius: 8,
              fontWeight: 600,
              display: 'inline-block',
            }}
          >
            Cargar un gasto
          </Button>
          <Text style={{ color: '#6b7280', fontSize: 13, marginTop: 24 }}>
            Tip: si instalás la app en el celular y activás los recordatorios en Ajustes,
            este aviso te llega como notificación en vez de email.
          </Text>
          <Hr style={{ margin: '24px 0', borderColor: '#e5e7eb' }} />
          <Text style={{ color: '#9ca3af', fontSize: 12 }}>
            Gastos Compartidos — recordatorio automático. Solo se envía los días en que no cargaste nada.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default RecordatorioCargaEmail
