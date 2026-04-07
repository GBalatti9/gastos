import { auth } from '@/lib/auth'
import { getCategorias } from '@/lib/google-sheets'
import { NuevoGastoForm } from '@/components/gastos/nuevo-gasto-form'
import { getUserByEmail } from '@/lib/users'

export default async function NuevoGastoPage() {
  const session = await auth()
  const [categorias] = await Promise.all([getCategorias()])
  const usuario = getUserByEmail(session?.user?.email || '')

  return (
    <div className="py-6">
      <h1 className="text-xl font-bold mb-6">Nuevo gasto</h1>
      <NuevoGastoForm
        categorias={categorias}
        usuarioEmail={session?.user?.email || ''}
        usuarioNombre={usuario?.nombre || session?.user?.name || ''}
      />
    </div>
  )
}
