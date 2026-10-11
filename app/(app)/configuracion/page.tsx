import { auth } from '@/lib/auth'
import { getTarjetas } from '@/lib/google-sheets'
import { getUserByEmail, getOtherUser } from '@/lib/users'
import { TarjetasConfig } from '@/components/configuracion/tarjetas-config'
import { CuentaCard } from '@/components/configuracion/cuenta-card'
import { InstallCard } from '@/components/pwa/install-card'

export default async function ConfiguracionPage() {
  const session = await auth()
  const email = session?.user?.email || ''
  const usuario = getUserByEmail(email)
  const otro = getOtherUser(email)
  const tarjetas = await getTarjetas()

  const misTarjetas = tarjetas.filter(t => t.owner_email === email)

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <InstallCard />

      <div className="flex flex-col gap-1">
        <h2 className="text-base font-medium text-foreground">Tarjetas de crédito</h2>
        <p className="text-xs text-muted-foreground">
          Configurá tus tarjetas para trackear cuotas por ciclo de facturación.
        </p>
      </div>
      <TarjetasConfig tarjetas={misTarjetas} />

      <CuentaCard nombre={usuario?.nombre || session?.user?.name || ''} otroNombre={otro?.nombre || ''} />
    </div>
  )
}
