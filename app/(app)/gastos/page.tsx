import { auth } from '@/lib/auth'
import { getGastos, getPagos, getCategorias } from '@/lib/google-sheets'
import { GastosList } from '@/components/gastos/gastos-list'
import { GastosPorPersona } from '@/components/gastos/gastos-por-persona'
import { GastosTabs } from '@/components/gastos/gastos-tabs'
import { getUserByEmail, getOtherUser } from '@/lib/users'

export const revalidate = 60

export default async function GastosPage() {
  const session = await auth()
  const email = session?.user?.email || ''
  const usuario = getUserByEmail(email)
  const otroUsuario = getOtherUser(email)

  const [gastos, pagos, categorias] = await Promise.all([
    getGastos(),
    getPagos(),
    getCategorias(),
  ])

  return (
    <div className="py-6">
      <GastosTabs
        listContent={
          <GastosList
            gastos={gastos}
            pagos={pagos}
            categorias={categorias}
            usuarioEmail={email}
            otroUsuarioEmail={otroUsuario?.email || ''}
            otroUsuarioNombre={otroUsuario?.nombre || ''}
          />
        }
        porPersonaContent={
          <GastosPorPersona
            gastos={gastos}
            pagos={pagos}
            categorias={categorias}
            usuarioEmail={email}
            usuarioNombre={usuario?.nombre || ''}
            otroUsuarioEmail={otroUsuario?.email || ''}
            otroUsuarioNombre={otroUsuario?.nombre || ''}
          />
        }
      />
    </div>
  )
}
