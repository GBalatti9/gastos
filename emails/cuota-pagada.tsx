import {
  Html, Head, Body, Container, Heading, Text, Section, Hr, Preview
} from '@react-email/components'
import { Gasto, Pago } from '@/lib/types'
import { AppUser } from '@/lib/users'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Props {
  destinatario: AppUser
  autor: AppUser
  gasto: Gasto
  pago: Pago
}

export function CuotaPagadaEmail({ destinatario, autor, gasto, pago }: Props) {
  return (
    <Html>
      <Head />
      <Preview>{`Cuota pagada: ${gasto.descripcion} (${pago.numero_cuota}/${gasto.cuotas})`}</Preview>
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f9fafb' }}>
        <Container style={{ maxWidth: 600, margin: '40px auto', backgroundColor: '#fff', borderRadius: 8, padding: 32 }}>
          <Heading style={{ color: '#111827', fontSize: 24 }}>✅ Cuota marcada como pagada</Heading>
          <Text style={{ color: '#6b7280' }}>Hola {destinatario.nombre}, {autor.nombre} marcó una cuota como pagada:</Text>

          <Section style={{ backgroundColor: '#f0fdf4', borderRadius: 8, padding: 16, margin: '16px 0', borderLeft: '4px solid #22c55e' }}>
            <Text style={{ margin: 0, fontSize: 20, fontWeight: 'bold', color: '#111827' }}>{gasto.descripcion}</Text>
            <Text style={{ margin: '4px 0 0', color: '#16a34a', fontSize: 18, fontWeight: 'bold' }}>
              Cuota {pago.numero_cuota} de {gasto.cuotas}
            </Text>
          </Section>

          <Section>
            <Row label="Monto pagado" value={`$${pago.monto.toLocaleString('es-AR')}`} />
            <Row label="Pagado por" value={autor.nombre} />
            <Row
              label="Fecha de pago"
              value={pago.fecha_pago ? format(new Date(pago.fecha_pago), "d 'de' MMMM yyyy", { locale: es }) : '-'}
            />
            <Row
              label="Progreso"
              value={`${pago.numero_cuota}/${gasto.cuotas} cuotas`}
            />
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

export default CuotaPagadaEmail
