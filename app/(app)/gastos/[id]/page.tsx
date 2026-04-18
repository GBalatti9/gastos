import { auth } from '@/lib/auth'
import { getGastoById, getPagosByGastoId, getCategorias, getTarjetaById, getTarjetas } from '@/lib/google-sheets'
import { notFound } from 'next/navigation'
import { GastoDetalle } from '@/components/gastos/gasto-detalle'
import { getUserByEmail, getOtherUser } from '@/lib/users'

export const revalidate = 0

export default async function GastoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  const email = session?.user?.email || ''

  const [gasto, categorias, todasTarjetas] = await Promise.all([
    getGastoById(id),
    getCategorias(),
    getTarjetas(),
  ])

  if (!gasto) notFound()

  const pagos = await getPagosByGastoId(id)
  const tarjeta = gasto.tarjeta_id ? await getTarjetaById(gasto.tarjeta_id) : null
  const usuario = getUserByEmail(email)
  const otroUsuario = getOtherUser(email)

  return (
    <div className="py-6">
      <GastoDetalle
        gasto={gasto}
        pagos={pagos}
        categorias={categorias}
        tarjetas={todasTarjetas}
        tarjeta={tarjeta}
        usuarioEmail={email}
        usuarioNombre={usuario?.nombre || session?.user?.name || ''}
        otroUsuarioEmail={otroUsuario?.email || ''}
        otroUsuarioNombre={otroUsuario?.nombre || ''}
      />
    </div>
  )
}
