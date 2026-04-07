import { auth } from '@/lib/auth'
import { getGastoById, getPagosByGastoId, getCategorias } from '@/lib/google-sheets'
import { notFound } from 'next/navigation'
import { GastoDetalle } from '@/components/gastos/gasto-detalle'
import { getUserByEmail } from '@/lib/users'

export const revalidate = 0

export default async function GastoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  const [gasto, categorias] = await Promise.all([
    getGastoById(id),
    getCategorias(),
  ])

  if (!gasto) notFound()

  const pagos = await getPagosByGastoId(id)
  const usuario = getUserByEmail(session?.user?.email || '')

  return (
    <div className="py-6">
      <GastoDetalle
        gasto={gasto}
        pagos={pagos}
        categorias={categorias}
        usuarioEmail={session?.user?.email || ''}
        usuarioNombre={usuario?.nombre || session?.user?.name || ''}
      />
    </div>
  )
}
