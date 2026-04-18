import { auth } from '@/lib/auth'
import { getCategorias, getTarjetas } from '@/lib/google-sheets'
import { NuevoGastoForm } from '@/components/gastos/nuevo-gasto-form'
import { getUserByEmail, getOtherUser } from '@/lib/users'

export default async function NuevoGastoPage() {
  const session = await auth()
  const [categorias, allTarjetas] = await Promise.all([getCategorias(), getTarjetas()])
  const email = session?.user?.email || ''
  const usuario = getUserByEmail(email)
  const otroUsuario = getOtherUser(email)

  return (
    <div className="py-6">
      <h1 className="text-xl font-bold mb-6">Nuevo gasto</h1>
      <NuevoGastoForm
        categorias={categorias}
        tarjetas={allTarjetas.filter(t => t.owner_email === email)}
        usuarioEmail={email}
        usuarioNombre={usuario?.nombre || session?.user?.name || ''}
        otroUsuarioNombre={otroUsuario?.nombre || ''}
      />
    </div>
  )
}
