import { auth } from '@/lib/auth'
import { getTarjetas } from '@/lib/google-sheets'
import { TarjetasConfig } from '@/components/configuracion/tarjetas-config'

export default async function ConfiguracionPage() {
  const session = await auth()
  const tarjetas = await getTarjetas()

  const misTarjetas = tarjetas.filter(t => t.owner_email === session?.user?.email)

  return (
    <div className="py-6 space-y-6">
      <div>
        <h1 className="text-lg font-display italic text-foreground">Ajustes</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Configurá tus tarjetas de crédito para trackear cuotas por ciclo de facturación.
        </p>
      </div>

      <TarjetasConfig tarjetas={misTarjetas} />
    </div>
  )
}
