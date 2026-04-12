export async function fetchTipoCambioActual(): Promise<number> {
  const res = await fetch('https://dolarapi.com/v1/dolares/contadoconliqui', {
    next: { revalidate: 3600 }, // cache 1 hora
  })
  if (!res.ok) throw new Error('No se pudo obtener el tipo de cambio de BNA')
  const data = await res.json()
  return data.venta as number
}
