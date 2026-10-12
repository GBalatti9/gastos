/**
 * Importa una cartera desde un CSV (formato de la planilla "Inversiones")
 * como saldo inicial del módulo de inversión.
 *
 *   npm run importar-cartera -- "/ruta/al/archivo.csv" [--email=...] [--meta=<id>] [--fecha=YYYY-MM-DD] [--dry]
 *
 * Columnas esperadas (con encabezado): Ticker, Tipo (Core/Satélite/Seguro),
 * Cedears (unidades), Invertido (USD), Objetivo (peso %). Las demás se ignoran.
 * Los números pueden venir en formato es-AR ("1.896,75").
 *
 * - Si el usuario no tiene meta, crea una (editable después).
 * - Crea una posición CEDEAR por fila (si no existe ya ese ticker en la meta).
 * - Crea un aporte "saldo inicial" por fila con el USD invertido y las unidades,
 *   fechado antes del inicio de la meta para que no cuente como aporte del mes.
 */
import { loadEnvConfig } from '@next/env'
import { readFileSync } from 'node:fs'

async function main() {
  loadEnvConfig(process.cwd())
  const gs = await import('../lib/google-sheets')
  const { mesActualAR, mesAnterior } = await import('../lib/dates')

  const args = process.argv.slice(2)
  const archivo = args.find(a => !a.startsWith('--'))
  if (!archivo) throw new Error('Falta la ruta del CSV')
  const opt = (k: string) => args.find(a => a.startsWith(`--${k}=`))?.split('=')[1]
  const dry = args.includes('--dry')
  const email = opt('email') || process.env.USER_1_EMAIL!
  const mesActual = mesActualAR()
  const fechaSaldo = opt('fecha') || `${mesAnterior(mesActual)}-28`

  // ── Parsear CSV ─────────────────────────────────────────────────────────
  const texto = readFileSync(archivo, 'utf8')
  const filas = texto.split(/\r?\n/).filter(l => l.trim()).map(parsearLinea)
  const header = filas[0].map(h => h.trim().toLowerCase())
  const col = (nombre: string) => header.findIndex(h => h.startsWith(nombre))
  const iTicker = col('ticker'), iTipo = col('tipo'), iUnid = col('cedears'), iInv = col('invertido'), iObj = col('objetivo')
  if (iTicker < 0 || iInv < 0) throw new Error(`No encuentro las columnas Ticker/Invertido. Header: ${header.join(' | ')}`)

  const items = filas.slice(1)
    .filter(f => f[iTicker] && !/^total$/i.test(f[iTicker]) && !/aporte va a/i.test(f[iTicker]))
    .map(f => ({
      ticker: f[iTicker].trim().toUpperCase(),
      rol: /sat/i.test(f[iTipo] || '') ? 'satelite' as const : /seg/i.test(f[iTipo] || '') ? 'seguro' as const : 'core' as const,
      unidades: num(f[iUnid]),
      invertido: num(f[iInv]),
      peso: num((f[iObj] || '').replace('%', '')),
    }))
    .filter(i => i.invertido > 0)

  console.log(`\nCSV: ${items.length} posiciones · invertido total US$ ${items.reduce((s, i) => s + i.invertido, 0).toFixed(2)} · pesos suman ${items.reduce((s, i) => s + i.peso, 0)} %`)
  for (const i of items) console.log(`  ${i.ticker.padEnd(5)} ${i.rol.padEnd(8)} ${String(i.unidades).padStart(5)} u.  US$ ${i.invertido.toFixed(2).padStart(9)}  objetivo ${i.peso} %`)
  if (dry) { console.log('\n--dry: no se escribió nada'); return }

  // ── Meta ────────────────────────────────────────────────────────────────
  await gs.asegurarHojas(gs.HOJAS_INVERSION)
  const metas = await gs.getInvMetas(email)
  let meta = opt('meta') ? metas.find(m => m.id === opt('meta')) : metas[0]
  if (!meta) {
    meta = {
      id: Date.now().toString(), email, nombre: 'Meta US$ 50.000',
      monto_objetivo_usd: 50000, fecha_objetivo: '2029-04', aporte_base_usd: 500, ingreso_base_ars: 3_500_000,
      pct_extra: 100, fecha_inicio: mesActual, desriesgo_etapas: [30, 60, 90],
    }
    await gs.upsertInvMeta(meta)
    console.log(`\nMeta creada: "${meta.nombre}" (US$ 50.000 para abril 2029, base US$ 500, empieza ${mesActual}). Editala desde la app si querés otros valores.`)
  } else {
    console.log(`\nUsando la meta "${meta.nombre}" (${meta.id})`)
  }

  // ── Posiciones ──────────────────────────────────────────────────────────
  const existentes = (await gs.getInvPosiciones(email)).filter(p => p.meta_id === meta!.id || (!p.meta_id && meta!.id === metas[0]?.id))
  const nuevas = items.filter(i => !existentes.some(p => p.ticker === i.ticker && p.activo))
  const creadas = nuevas.length
    ? await gs.createInvPosiciones(nuevas.map(i => ({
        email, ticker: i.ticker, nombre: i.ticker, peso_objetivo: i.peso, rol: i.rol, activo: true,
        tipo: 'cedear' as const, moneda: 'ARS' as const, meta_id: meta!.id,
      })))
    : []
  const posiciones = [...existentes, ...creadas]
  console.log(`Posiciones: ${creadas.length} creadas, ${existentes.length} ya existían`)

  // ── Aportes de saldo inicial ─────────────────────────────────────────────
  const aportesExistentes = await gs.getInvAportes(email)
  let n = 0
  for (const i of items) {
    const pos = posiciones.find(p => p.ticker === i.ticker && p.activo)
    if (!pos) continue
    if (aportesExistentes.some(a => a.posicion_id === pos.id && /saldo inicial/i.test(a.notas))) continue
    await gs.createInvAporte({
      email, fecha: fechaSaldo, monto_usd: Math.round(i.invertido * 100) / 100, monto_ars: 0, tipo_cambio: 0,
      posicion_id: pos.id, cobro_id: '', notas: `Saldo inicial importado de ${archivo.split('/').pop()}`,
      unidades: i.unidades, precio: 0, meta_id: meta.id,
    })
    n++
    // ids por Date.now(): separar para que no se pisen
    await new Promise(r => setTimeout(r, 5))
  }
  console.log(`Aportes de saldo inicial: ${n} creados con fecha ${fechaSaldo}\n`)
}

function parsearLinea(linea: string): string[] {
  const out: string[] = []
  let cur = ''
  let enComillas = false
  for (let i = 0; i < linea.length; i++) {
    const c = linea[i]
    if (c === '"') {
      if (enComillas && linea[i + 1] === '"') { cur += '"'; i++ } else enComillas = !enComillas
    } else if (c === ',' && !enComillas) {
      out.push(cur); cur = ''
    } else cur += c
  }
  out.push(cur)
  return out
}

/** "1.896,75" → 1896.75 ; "11,25" → 11.25 ; "345" → 345 */
function num(s: string | undefined): number {
  if (!s) return 0
  const t = s.trim().replace(/\s/g, '')
  const normal = t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : t
  const n = parseFloat(normal)
  return Number.isFinite(n) ? n : 0
}

main().catch(err => { console.error(err); process.exit(1) })
