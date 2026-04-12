import { auth } from '@/lib/auth'
import { getGastos, getPagos, getCategorias } from '@/lib/google-sheets'
import { GastosList } from '@/components/gastos/gastos-list'
import { getUserByEmail, getOtherUser } from '@/lib/users'

export const revalidate = 60

export default async function GastosPage() {
  const session = await auth()
  const email = session?.user?.email || ''
  const otroUsuario = getOtherUser(email)

  const [gastos, pagos, categorias] = await Promise.all([
    getGastos(),
    getPagos(),
    getCategorias(),
  ])

  return (
    <div className="py-6">
      <GastosList
        gastos={gastos}
        pagos={pagos}
        categorias={categorias}
        usuarioEmail={email}
        otroUsuarioEmail={otroUsuario?.email || ''}
        otroUsuarioNombre={otroUsuario?.nombre || ''}
      />
    </div>
  )
}
