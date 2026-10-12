/**
 * Imprime la tabla mes a mes y los promedios (pareja e individual) leyendo
 * directo de la planilla. No toca la UI ni escribe nada.
 *
 *   npm run promedios
 *   npm run promedios -- --ultimos=12
 *   npm run promedios -- --ultimos=todos
 */
import { loadEnvConfig } from '@next/env'

const arg = process.argv.find(a => a.startsWith('--ultimos='))?.split('=')[1]
const ultimos: number | 'todos' = arg === 'todos' ? 'todos' : parseInt(arg || '6') || 6

const ars = (n: number) => `$ ${Math.round(n).toLocaleString('es-AR').padStart(12)}`

async function main() {
// Mismo loader de env que usa Next (.env, .env.local, claves multilínea, etc.)
loadEnvConfig(process.cwd())
// Imports dinámicos: google-sheets lee process.env al evaluarse
const [{ getGastos, getPagos }, { resumenPorMes, promedioMensual }, { getUsers }] = await Promise.all([
  import('../lib/google-sheets'),
  import('../lib/metricas'),
  import('../lib/users'),
])
const [u1, u2] = getUsers()
const [gastos, pagos] = await Promise.all([getGastos(), getPagos()])
const resumen = resumenPorMes(pagos, gastos, 'ARS')
const promedio = promedioMensual(resumen, { ultimos })

console.log(`\nGastos activos: ${gastos.filter(g => g.estado === 'activo').length} · pagos: ${pagos.length}\n`)
console.log(
  'Mes      ' +
    'Pareja'.padStart(14) +
    `${u1.nombre} (casa)`.padStart(18) +
    `${u1.nombre} (pers.)`.padStart(18) +
    `${u1.nombre} total`.padStart(18) +
    `${u2.nombre} (casa)`.padStart(18) +
    `${u2.nombre} (pers.)`.padStart(18) +
    `${u2.nombre} total`.padStart(18)
)
for (const r of resumen) {
  const enPromedio = promedio.meses.includes(r.mes) ? '*' : ' '
  console.log(
    `${r.mes} ${enPromedio}` +
      ars(r.pareja) +
      ars(r.casaU1).padStart(18) +
      ars(r.personalU1).padStart(18) +
      ars(r.u1).padStart(18) +
      ars(r.casaU2).padStart(18) +
      ars(r.personalU2).padStart(18) +
      ars(r.u2).padStart(18)
  )
}

console.log(`\n* meses que entran en el promedio (${promedio.meses.length}): ${promedio.meses.join(', ')}\n`)
console.log(`Promedio mensual PAREJA (compartidos):      ${ars(promedio.pareja)}`)
console.log(`Promedio mensual ${u1.nombre}: casa ${ars(promedio.casaU1)} + personal ${ars(promedio.personalU1)} = ${ars(promedio.u1)}`)
console.log(`Promedio mensual ${u2.nombre}: casa ${ars(promedio.casaU2)} + personal ${ars(promedio.personalU2)} = ${ars(promedio.u2)}`)
console.log('\nConvención: cada cuota cuenta en el mes de su vencimiento; sin cancelados ni liquidaciones; solo ARS.\n')
}

main().catch(err => { console.error(err); process.exit(1) })
