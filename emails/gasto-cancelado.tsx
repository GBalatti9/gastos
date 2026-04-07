import {
  Html, Head, Body, Container, Heading, Text, Section, Hr, Preview
} from '@react-email/components'
import { Gasto } from '@/lib/types'
import { AppUser } from '@/lib/users'

interface Props {
  destinatario: AppUser
  autor: AppUser
  gasto: Gasto
}

export function GastoCanceladoEmail({ destinatario, autor, gasto }: Props) {
  return (
    <Html>
      <Head />
      <Preview>Gasto cancelado: {gasto.descripcion}</Preview>
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f9fafb' }}>
        <Container style={{ maxWidth: 600, margin: '40px auto', backgroundColor: '#fff', borderRadius: 8, padding: 32 }}>
          <Heading style={{ color: '#111827', fontSize: 24 }}>❌ Gasto cancelado</Heading>
          <Text style={{ color: '#6b7280' }}>Hola {destinatario.nombre}, {autor.nombre} canceló el siguiente gasto:</Text>

          <Section style={{ backgroundColor: '#fef2f2', borderRadius: 8, padding: 16, margin: '16px 0', borderLeft: '4px solid #ef4444' }}>
            <Text style={{ margin: 0, fontSize: 20, fontWeight: 'bold', color: '#111827' }}>{gasto.descripcion}</Text>
            <Text style={{ margin: '4px 0 0', color: '#dc2626' }}>CANCELADO</Text>
          </Section>

          <Section>
            <Row label="Monto total" value={`$${gasto.monto_total.toLocaleString('es-AR')}`} />
            <Row label="Cuotas" value={`${gasto.cuotas} cuota(s)`} />
            <Row label="Categoría" value={gasto.categoria} />
            {gasto.notas && <Row label="Notas" value={gasto.notas} />}
          </Section>

          <Hr style={{ margin: '24px 0', borderColor: '#e5e7eb' }} />
          <Text style={{ color: '#9ca3af', fontSize: 12 }}>Gastos Compartidos — solo vos y {autor.nombre}</Text>
        </Container>
      </Body>
    </Html>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}>
      <Text style={{ margin: 0, color: '#6b7280', fontSize: 14 }}>{label}</Text>
      <Text style={{ margin: 0, color: '#111827', fontSize: 14, fontWeight: 'bold' }}>{value}</Text>
    </div>
  )
}

export default GastoCanceladoEmail
