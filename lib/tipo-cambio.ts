export async function fetchTipoCambioActual(): Promise<number> {
  // Sin cache de fetch: el valor del día ya se persiste en la hoja tipo_cambio,
  // y el cache de Next falla con Node 24 (ArrayBuffer no detachable).
  const res = await fetch('https://dolarapi.com/v1/dolares/contadoconliqui', { cache: 'no-store' })
  if (!res.ok) throw new Error('No se pudo obtener el tipo de cambio de BNA')
  const data = await res.json()
  return data.venta as number
}
