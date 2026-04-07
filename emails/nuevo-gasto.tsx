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
  primerPago?: Pago
}

export function NuevoGastoEmail({ destinatario, autor, gasto, primerPago }: Props) {
  return (
    <Html>
      <Head />
      <Preview>Nuevo gasto cargado: {gasto.descripcion}</Preview>
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f9fafb' }}>
        <Container style={{ maxWidth: 600, margin: '40px auto', backgroundColor: '#fff', borderRadius: 8, padding: 32 }}>
          <Heading style={{ color: '#111827', fontSize: 24 }}>💸 Nuevo gasto cargado</Heading>
          <Text style={{ color: '#6b7280' }}>Hola {destinatario.nombre}, {autor.nombre} acaba de cargar un nuevo gasto:</Text>

          <Section style={{ backgroundColor: '#f3f4f6', borderRadius: 8, padding: 16, margin: '16px 0' }}>
            <Text style={{ margin: 0, fontSize: 20, fontWeight: 'bold', color: '#111827' }}>{gasto.descripcion}</Text>
            <Text style={{ margin: '8px 0 0', color: '#6b7280' }}>Categoría: {gasto.categoria}</Text>
          </Section>

          <Section>
            <Row label="Monto total" value={`$${gasto.monto_total.toLocaleString('es-AR')}`} />
            <Row label="Cuotas" value={`${gasto.cuotas} cuota(s)`} />
            <Row label="Monto por cuota" value={`$${(gasto.monto_total / gasto.cuotas).toLocaleString('es-AR')}`} />
            <Row label="Pagado por" value={autor.nombre} />
            {primerPago && (
              <Row
                label="Próximo vencimiento"
                value={format(new Date(primerPago.fecha_vencimiento), "d 'de' MMMM yyyy", { locale: es })}
              />
            )}
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

export default NuevoGastoEmail
