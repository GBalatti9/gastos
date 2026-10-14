import { google } from 'googleapis'
import { Gasto, Pago, Categoria, Moneda, TipoDivision, TipoCambio, MetodoPago, TarjetaCredito, PushSub } from './types'

function getAuth() {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n')
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
}

function getSheets() {
  const auth = getAuth()
  return google.sheets({ version: 'v4', auth })
}

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID!

/**
 * Lee celdas como texto SIN el formato de la planilla: con locale es-AR,
 * `values.get` por defecto devuelve "1896,75" y parseFloat se queda en 1896.
 * UNFORMATTED_VALUE devuelve el número crudo; lo pasamos a string con punto.
 */
async function leerFilas(range: string): Promise<string[][]> {
  const res = await getSheets().spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range,
    valueRenderOption: 'UNFORMATTED_VALUE',
  })
  return ((res.data.values || []) as unknown[][]).map(r => r.map(c => (c === null || c === undefined ? '' : String(c))))
}


// ─── Gastos ───────────────────────────────────────────────────────────────────

export async function getGastos(): Promise<Gasto[]> {
  const rows = await leerFilas('gastos!A2:Q')
  return rows.map(rowToGasto).filter(Boolean) as Gasto[]
}

export async function getGastoById(id: string): Promise<Gasto | null> {
  const gastos = await getGastos()
  return gastos.find(g => g.id === id) || null
}

export async function createGasto(data: Omit<Gasto, 'id'>): Promise<Gasto> {
  const sheets = getSheets()
  const nextId = Date.now().toString()

  const row = [
    nextId,
    data.descripcion,
    data.monto_total,
    data.pagado_por,
    data.cuotas,
    data.cuota_actual,
    data.fecha_inicio,
    data.categoria,
    data.notas,
    data.estado,
    data.moneda || 'ARS',
    data.tipo_division || '50/50',
    data.division_valor || '',
    data.recurrente ? 'si' : 'no',
    data.metodo_pago || 'efectivo',
    data.tarjeta_id || '',
    data.creado_por || '',
  ]

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'gastos!A:Q',
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [row] },
  })

  return { ...data, id: nextId }
}

export async function updateGasto(id: string, data: Partial<Omit<Gasto, 'id' | 'estado' | 'cuota_actual'>>): Promise<void> {
  const sheets = getSheets()
  const rows = await leerFilas('gastos!A:Q')
  const rowIndex = rows.findIndex(r => r[0] === id)
  if (rowIndex === -1) throw new Error(`Gasto ${id} no encontrado`)

  const c = rows[rowIndex]
  const updated = [
    id,
    data.descripcion ?? c[1],
    data.monto_total ?? c[2],
    data.pagado_por ?? c[3],
    c[4], // cuotas — inmutable
    c[5], // cuota_actual — inmutable
    data.fecha_inicio ?? c[6],
    data.categoria ?? c[7],
    data.notas ?? c[8],
    c[9], // estado — usar endpoint cancelar
    data.moneda ?? c[10],
    data.tipo_division ?? c[11],
    data.division_valor ?? c[12],
    data.recurrente !== undefined ? (data.recurrente ? 'si' : 'no') : c[13],
    data.metodo_pago ?? c[14],
    data.tarjeta_id ?? c[15],
  ]

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `gastos!A${rowIndex + 1}:P${rowIndex + 1}`,
    valueInputOption: 'RAW',
    requestBody: { values: [updated] },
  })
}

export async function updatePago(id: string, data: { monto?: number; fecha_vencimiento?: string }): Promise<void> {
  const sheets = getSheets()
  const rows = await leerFilas('pagos!A:H')
  const rowIndex = rows.findIndex(r => r[0] === id)
  if (rowIndex === -1) throw new Error(`Pago ${id} no encontrado`)

  const c = rows[rowIndex]
  const updated = [
    c[0], c[1], c[2],
    data.monto ?? c[3],
    data.fecha_vencimiento ?? c[4],
    c[5], c[6], c[7],
  ]

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `pagos!A${rowIndex + 1}:H${rowIndex + 1}`,
    valueInputOption: 'RAW',
    requestBody: { values: [updated] },
  })
}

export async function updateGastoEstado(id: string, estado: 'activo' | 'cancelado'): Promise<void> {
  const sheets = getSheets()
  const rows = await leerFilas('gastos!A:A')
  const rowIndex = rows.findIndex(r => r[0] === id)
  if (rowIndex === -1) throw new Error(`Gasto ${id} no encontrado`)

  // rowIndex ya es 1-based porque A:A incluye el header en rows[0]
  const sheetRow = rowIndex + 1
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `gastos!J${sheetRow}`,
    valueInputOption: 'RAW',
    requestBody: { values: [[estado]] },
  })
}

// ─── Pagos ────────────────────────────────────────────────────────────────────

export async function getPagos(): Promise<Pago[]> {
  const rows = await leerFilas('pagos!A2:H')
  return rows.map(rowToPago).filter(Boolean) as Pago[]
}

export async function getPagosByGastoId(gastoId: string): Promise<Pago[]> {
  const pagos = await getPagos()
  return pagos.filter(p => p.gasto_id === gastoId)
}

export async function createPagos(pagos: Omit<Pago, 'id'>[]): Promise<void> {
  if (pagos.length === 0) return
  const sheets = getSheets()
  let nextId = Date.now()

  const rows = pagos.map(p => [
    String(nextId++),
    p.gasto_id,
    p.numero_cuota,
    p.monto,
    p.fecha_vencimiento,
    p.fecha_pago || '',
    p.pagado_por || '',
    p.estado,
  ])

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'pagos!A:H',
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: rows },
  })
}

export async function marcarPagoComoPagado(
  pagoId: string,
  pagadoPor: string,
  fechaPago: string
): Promise<void> {
  const sheets = getSheets()
  const rows = await leerFilas('pagos!A:A')
  const rowIndex = rows.findIndex(r => r[0] === pagoId)
  if (rowIndex === -1) throw new Error(`Pago ${pagoId} no encontrado`)

  // rowIndex ya es 1-based porque A:A incluye el header en rows[0]
  const sheetRow = rowIndex + 1
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      valueInputOption: 'RAW',
      data: [
        { range: `pagos!F${sheetRow}`, values: [[fechaPago]] },
        { range: `pagos!G${sheetRow}`, values: [[pagadoPor]] },
        { range: `pagos!H${sheetRow}`, values: [['pagado']] },
      ],
    },
  })
}

// ─── Categorias ───────────────────────────────────────────────────────────────

export async function getCategorias(): Promise<Categoria[]> {
  const rows = await leerFilas('categorias!A2:D')
  return rows.map(r => ({
    id: r[0] || '',
    nombre: r[1] || '',
    color: r[2] || '#6366f1',
    icono: r[3] || '📦',
  }))
}

export async function initCategorias(): Promise<void> {
  const sheets = getSheets()
  const categorias = await getCategorias()
  if (categorias.length > 0) return

  const defaultCats = [
    ['1', 'Alquiler', '#ef4444', '🏠'],
    ['2', 'Supermercado', '#22c55e', '🛒'],
    ['3', 'Servicios', '#3b82f6', '💡'],
    ['4', 'Restaurantes', '#f97316', '🍽️'],
    ['5', 'Transporte', '#8b5cf6', '🚗'],
    ['6', 'Salud', '#ec4899', '💊'],
    ['7', 'Entretenimiento', '#14b8a6', '🎬'],
    ['8', 'Ropa', '#f59e0b', '👕'],
    ['9', 'Viajes', '#06b6d4', '✈️'],
    ['10', 'Otros', '#6b7280', '📦'],
  ]

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'categorias!A:D',
    valueInputOption: 'RAW',
    requestBody: { values: defaultCats },
  })
}

export async function createCategoria(data: Omit<Categoria, 'id'>): Promise<Categoria> {
  const sheets = getSheets()
  const categorias = await getCategorias()
  const nextId = categorias.length > 0
    ? String(Math.max(...categorias.map(c => parseInt(c.id) || 0)) + 1)
    : '1'

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'categorias!A:D',
    valueInputOption: 'RAW',
    requestBody: { values: [[nextId, data.nombre, data.color, data.icono]] },
  })

  return { ...data, id: nextId }
}

// ─── Tipo de Cambio ───────────────────────────────────────────────────────────

export async function getTipoCambios(): Promise<TipoCambio[]> {
  const rows = await leerFilas('tipo_cambio!A2:C')
  return rows.map(r => ({
    fecha: r[0] || '',
    valor: parseFloat(r[1]) || 0,
    fuente: (r[2] as 'bna' | 'manual') || 'bna',
  })).filter(r => r.fecha)
}

export async function getTipoCambioByFecha(fecha: string): Promise<TipoCambio | null> {
  const todos = await getTipoCambios()
  return todos.find(t => t.fecha === fecha) || null
}

export async function saveTipoCambio(fecha: string, valor: number, fuente: 'bna' | 'manual'): Promise<TipoCambio> {
  const sheets = getSheets()

  // Si ya existe para esa fecha, no sobreescribir (respetar edición manual)
  const existente = await getTipoCambioByFecha(fecha)
  if (existente) return existente

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'tipo_cambio!A:C',
    valueInputOption: 'RAW',
    requestBody: { values: [[fecha, valor, fuente]] },
  })

  return { fecha, valor, fuente }
}

// ─── Tarjetas de Crédito ──────────────────────────────────────────────────────

export async function getTarjetas(): Promise<TarjetaCredito[]> {
  const rows = await leerFilas('tarjetas!A2:F')
  return rows.map(rowToTarjeta).filter(Boolean) as TarjetaCredito[]
}

export async function getTarjetaById(id: string): Promise<TarjetaCredito | null> {
  const tarjetas = await getTarjetas()
  return tarjetas.find(t => t.id === id) || null
}

export async function createTarjeta(data: Omit<TarjetaCredito, 'id'>): Promise<TarjetaCredito> {
  const sheets = getSheets()
  const tarjetas = await getTarjetas()
  const nextId = tarjetas.length > 0
    ? String(Math.max(...tarjetas.map(t => parseInt(t.id) || 0)) + 1)
    : '1'

  const row = [
    nextId,
    data.nombre,
    data.ultimos_4,
    data.fecha_cierre,
    data.fecha_vencimiento,
    data.owner_email,
  ]

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'tarjetas!A:F',
    valueInputOption: 'RAW',
    requestBody: { values: [row] },
  })

  return { ...data, id: nextId }
}

export async function updateTarjeta(id: string, data: Partial<Omit<TarjetaCredito, 'id'>>): Promise<void> {
  const sheets = getSheets()
  const rows = await leerFilas('tarjetas!A:F')
  const rowIndex = rows.findIndex(r => r[0] === id)
  if (rowIndex === -1) throw new Error(`Tarjeta ${id} no encontrada`)

  const current = rows[rowIndex]
  const updated = [
    id,
    data.nombre ?? current[1],
    data.ultimos_4 ?? current[2],
    data.fecha_cierre ?? current[3],
    data.fecha_vencimiento ?? current[4],
    data.owner_email ?? current[5],
  ]

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `tarjetas!A${rowIndex + 1}:F${rowIndex + 1}`,
    valueInputOption: 'RAW',
    requestBody: { values: [updated] },
  })
}

export async function deleteTarjeta(id: string): Promise<void> {
  const sheets = getSheets()
  const rows = await leerFilas('tarjetas!A:A')
  const rowIndex = rows.findIndex(r => r[0] === id)
  if (rowIndex === -1) throw new Error(`Tarjeta ${id} no encontrada`)

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `tarjetas!A${rowIndex + 1}:F${rowIndex + 1}`,
    valueInputOption: 'RAW',
    requestBody: { values: [['', '', '', '', '', '']] },
  })
}

// ─── Push subscriptions ───────────────────────────────────────────────────────
// Hoja "push_subs": email | endpoint | p256dh | auth | user_agent | created_at

export async function getPushSubs(): Promise<PushSub[]> {
  const rows = await leerFilas('push_subs!A2:F')
  return rows
    .filter(r => r[0] && r[1])
    .map(r => ({
      email: r[0],
      endpoint: r[1],
      p256dh: r[2] || '',
      auth: r[3] || '',
      user_agent: r[4] || '',
      created_at: r[5] || '',
    }))
}

/** Upsert por endpoint (un dispositivo = una fila). */
export async function savePushSub(sub: PushSub): Promise<void> {
  const sheets = getSheets()
  const rows = await leerFilas('push_subs!A:F')
  const row = [sub.email, sub.endpoint, sub.p256dh, sub.auth, sub.user_agent, sub.created_at]
  const rowIndex = rows.findIndex(r => r[1] === sub.endpoint)

  if (rowIndex === -1) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'push_subs!A:F',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [row] },
    })
    return
  }
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `push_subs!A${rowIndex + 1}:F${rowIndex + 1}`,
    valueInputOption: 'RAW',
    requestBody: { values: [row] },
  })
}

export async function deletePushSub(endpoint: string): Promise<void> {
  const sheets = getSheets()
  const rows = await leerFilas('push_subs!B:B')
  const rowIndex = rows.findIndex(r => r[0] === endpoint)
  if (rowIndex === -1) return
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `push_subs!A${rowIndex + 1}:F${rowIndex + 1}`,
    valueInputOption: 'RAW',
    requestBody: { values: [['', '', '', '', '', '']] },
  })
}

// ─── Row mappers ──────────────────────────────────────────────────────────────

function rowToGasto(row: string[]): Gasto | null {
  if (!row[0]) return null
  return {
    id: row[0],
    descripcion: row[1] || '',
    monto_total: parseFloat(row[2]) || 0,
    pagado_por: row[3] || '',
    cuotas: parseInt(row[4]) || 1,
    cuota_actual: parseInt(row[5]) || 0,
    fecha_inicio: row[6] || '',
    categoria: row[7] || '',
    notas: row[8] || '',
    estado: (row[9] as 'activo' | 'cancelado') || 'activo',
    moneda: (row[10] as Moneda) || 'ARS',
    tipo_division: (row[11] as TipoDivision) || '50/50',
    division_valor: row[12] || '',
    recurrente: row[13] === 'si',
    metodo_pago: (row[14] as MetodoPago) || 'efectivo',
    tarjeta_id: row[15] || '',
    creado_por: row[16] || '',
  }
}

function rowToTarjeta(row: string[]): TarjetaCredito | null {
  if (!row[0]) return null
  return {
    id: row[0],
    nombre: row[1] || '',
    ultimos_4: row[2] || '',
    fecha_cierre: parseInt(row[3]) || 1,
    fecha_vencimiento: parseInt(row[4]) || 1,
    owner_email: row[5] || '',
  }
}

function rowToPago(row: string[]): Pago | null {
  if (!row[0]) return null
  return {
    id: row[0],
    gasto_id: row[1] || '',
    numero_cuota: parseInt(row[2]) || 1,
    monto: parseFloat(row[3]) || 0,
    fecha_vencimiento: row[4] || '',
    fecha_pago: row[5] || null,
    pagado_por: row[6] || null,
    estado: (row[7] as 'pendiente' | 'pagado') || 'pendiente',
  }
}

// ─── Inversión con objetivo ───────────────────────────────────────────────────
// Hojas: inv_metas, inv_cobros, inv_aportes, inv_posiciones, inv_valuaciones.
// Todas tienen `email`; las lecturas filtran por el usuario.

import type { InvMeta, InvCobro, InvAporte, InvPosicion, InvValuacion, InvRol, InvTipoCobro, InvTipoActivo } from './types'

async function agregarFilas(range: string, rows: (string | number)[][]): Promise<void> {
  if (rows.length === 0) return
  await getSheets().spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: rows },
  })
}

/** Reemplaza la fila cuya columna `colClave` vale `key` (o la borra si `row` es null). */
async function escribirFilaPorClave(hoja: string, ultimaCol: string, key: string, row: (string | number)[] | null, colClave = 'A'): Promise<boolean> {
  const rows = await leerFilas(`${hoja}!${colClave}:${colClave}`)
  const rowIndex = rows.findIndex(r => r[0] === key)
  if (rowIndex === -1) return false
  const ancho = ultimaCol.charCodeAt(0) - 'A'.charCodeAt(0) + 1
  await getSheets().spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${hoja}!A${rowIndex + 1}:${ultimaCol}${rowIndex + 1}`,
    valueInputOption: 'RAW',
    requestBody: { values: [row ?? Array(ancho).fill('')] },
  })
  return true
}

// inv_metas: email | monto_objetivo_usd | fecha_objetivo | aporte_base_usd | ingreso_base_ars | pct_extra | fecha_inicio | desriesgo_etapas | id | nombre
// (id y nombre se agregaron después: una fila vieja sin id usa el email como id)
function rowToInvMeta(r: string[]): InvMeta {
  const etapas = (r[7] || '30,60,90').split(',').map(n => parseFloat(n) || 0)
  return {
    id: r[8] || r[0],
    email: r[0],
    nombre: r[9] || 'Mi meta',
    monto_objetivo_usd: parseFloat(r[1]) || 0,
    fecha_objetivo: r[2] || '',
    aporte_base_usd: parseFloat(r[3]) || 0,
    ingreso_base_ars: parseFloat(r[4]) || 0,
    pct_extra: parseFloat(r[5]) || 0,
    fecha_inicio: r[6] || '',
    desriesgo_etapas: [etapas[0] ?? 30, etapas[1] ?? 60, etapas[2] ?? 90],
  }
}

function invMetaToRow(m: InvMeta): (string | number)[] {
  return [
    m.email, m.monto_objetivo_usd, m.fecha_objetivo, m.aporte_base_usd, m.ingreso_base_ars,
    m.pct_extra, m.fecha_inicio, m.desriesgo_etapas.join(','), m.id, m.nombre,
  ]
}

/** Todas las metas del usuario, en orden de creación. */
export async function getInvMetas(email: string): Promise<InvMeta[]> {
  const rows = await leerFilas('inv_metas!A2:J')
  return rows.filter(r => r[0] === email).map(rowToInvMeta)
}

export async function getInvMeta(email: string, id?: string): Promise<InvMeta | null> {
  const metas = await getInvMetas(email)
  if (!id) return metas[0] ?? null
  return metas.find(m => m.id === id) ?? null
}

/** Crea o actualiza por id. Las filas viejas (sin id) se reconocen por email. */
export async function upsertInvMeta(meta: InvMeta): Promise<void> {
  const rows = await leerFilas('inv_metas!A:J')
  const rowIndex = rows.findIndex(r => (r[8] && r[8] === meta.id) || (!r[8] && r[0] === meta.email && meta.id === meta.email))
  const row = invMetaToRow(meta)
  if (rowIndex === -1) {
    await agregarFilas('inv_metas!A:J', [row])
    return
  }
  await getSheets().spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `inv_metas!A${rowIndex + 1}:J${rowIndex + 1}`,
    valueInputOption: 'RAW',
    requestBody: { values: [row] },
  })
}

export async function deleteInvMeta(id: string): Promise<void> {
  await escribirFilaPorClave('inv_metas', 'J', id, null, 'I')
}

// inv_cobros: id | email | fecha | monto_ars | tipo | tipo_cambio | notas
export async function getInvCobros(email: string): Promise<InvCobro[]> {
  const rows = await leerFilas('inv_cobros!A2:G')
  return rows
    .filter(r => r[0] && r[1] === email)
    .map(r => ({
      id: r[0], email: r[1], fecha: r[2] || '', monto_ars: parseFloat(r[3]) || 0,
      tipo: (r[4] as InvTipoCobro) || 'base', tipo_cambio: parseFloat(r[5]) || 0, notas: r[6] || '',
    }))
}

export async function createInvCobro(data: Omit<InvCobro, 'id'>): Promise<InvCobro> {
  const id = Date.now().toString()
  await agregarFilas('inv_cobros!A:G', [[id, data.email, data.fecha, data.monto_ars, data.tipo, data.tipo_cambio, data.notas]])
  return { ...data, id }
}

export async function deleteInvCobro(id: string): Promise<void> {
  await escribirFilaPorClave('inv_cobros', 'G', id, null)
}

// inv_aportes: id | email | fecha | monto_usd | monto_ars | tipo_cambio | posicion_id | cobro_id | notas | unidades | precio | meta_id
export async function getInvAportes(email: string): Promise<InvAporte[]> {
  const rows = await leerFilas('inv_aportes!A2:L')
  return rows
    .filter(r => r[0] && r[1] === email)
    .map(r => ({
      id: r[0], email: r[1], fecha: r[2] || '', monto_usd: parseFloat(r[3]) || 0, monto_ars: parseFloat(r[4]) || 0,
      tipo_cambio: parseFloat(r[5]) || 0, posicion_id: r[6] || '', cobro_id: r[7] || '', notas: r[8] || '',
      unidades: parseFloat(r[9]) || 0, precio: parseFloat(r[10]) || 0, meta_id: r[11] || '',
    }))
}

const invAporteToRow = (a: InvAporte) => [
  a.id, a.email, a.fecha, a.monto_usd, a.monto_ars, a.tipo_cambio, a.posicion_id, a.cobro_id, a.notas,
  a.unidades, a.precio, a.meta_id,
]

export async function createInvAporte(data: Omit<InvAporte, 'id'>): Promise<InvAporte> {
  const aporte = { ...data, id: Date.now().toString() }
  await agregarFilas('inv_aportes!A:L', [invAporteToRow(aporte)])
  return aporte
}

export async function updateInvAporte(a: InvAporte): Promise<boolean> {
  return escribirFilaPorClave('inv_aportes', 'L', a.id, invAporteToRow(a))
}

export async function deleteInvAporte(id: string): Promise<void> {
  await escribirFilaPorClave('inv_aportes', 'L', id, null)
}

// inv_posiciones: id | email | ticker | nombre | peso_objetivo | rol | activo | tipo | moneda | meta_id
export async function getInvPosiciones(email: string): Promise<InvPosicion[]> {
  const rows = await leerFilas('inv_posiciones!A2:J')
  return rows
    .filter(r => r[0] && r[1] === email)
    .map(r => ({
      id: r[0], email: r[1], ticker: r[2] || '', nombre: r[3] || '', peso_objetivo: parseFloat(r[4]) || 0,
      rol: (r[5] as InvRol) || 'core', activo: (r[6] || 'si') !== 'no',
      tipo: (r[7] as InvTipoActivo) || 'otro', moneda: r[8] === 'USD' ? 'USD' : 'ARS', meta_id: r[9] || '',
    }))
}

export async function createInvPosiciones(datos: Omit<InvPosicion, 'id'>[]): Promise<InvPosicion[]> {
  let next = Date.now()
  const creadas = datos.map(d => ({ ...d, id: String(next++) }))
  await agregarFilas('inv_posiciones!A:J', creadas.map(p => [
    p.id, p.email, p.ticker, p.nombre, p.peso_objetivo, p.rol, p.activo ? 'si' : 'no', p.tipo, p.moneda, p.meta_id,
  ]))
  return creadas
}

export async function updateInvPosicion(p: InvPosicion): Promise<void> {
  await escribirFilaPorClave('inv_posiciones', 'J', p.id, [
    p.id, p.email, p.ticker, p.nombre, p.peso_objetivo, p.rol, p.activo ? 'si' : 'no', p.tipo, p.moneda, p.meta_id,
  ])
}

// inv_valuaciones: id | email | fecha | posicion_id | valor_usd | meta_id
export async function getInvValuaciones(email: string): Promise<InvValuacion[]> {
  const rows = await leerFilas('inv_valuaciones!A2:F')
  return rows
    .filter(r => r[0] && r[1] === email)
    .map(r => ({ id: r[0], email: r[1], fecha: r[2] || '', posicion_id: r[3] || '', valor_usd: parseFloat(r[4]) || 0, meta_id: r[5] || '' }))
}

export async function createInvValuaciones(datos: Omit<InvValuacion, 'id'>[]): Promise<void> {
  let next = Date.now()
  await agregarFilas('inv_valuaciones!A:F', datos.map(v => [String(next++), v.email, v.fecha, v.posicion_id, v.valor_usd, v.meta_id]))
}

// ─── Hojas: crear las que falten ──────────────────────────────────────────────

export const HOJAS_INVERSION: Record<string, string[]> = {
  inv_metas: ['email', 'monto_objetivo_usd', 'fecha_objetivo', 'aporte_base_usd', 'ingreso_base_ars', 'pct_extra', 'fecha_inicio', 'desriesgo_etapas', 'id', 'nombre'],
  inv_cobros: ['id', 'email', 'fecha', 'monto_ars', 'tipo', 'tipo_cambio', 'notas'],
  inv_aportes: ['id', 'email', 'fecha', 'monto_usd', 'monto_ars', 'tipo_cambio', 'posicion_id', 'cobro_id', 'notas', 'unidades', 'precio', 'meta_id'],
  inv_posiciones: ['id', 'email', 'ticker', 'nombre', 'peso_objetivo', 'rol', 'activo', 'tipo', 'moneda', 'meta_id'],
  inv_valuaciones: ['id', 'email', 'fecha', 'posicion_id', 'valor_usd', 'meta_id'],
}

export const HOJA_PUSH_SUBS: Record<string, string[]> = {
  push_subs: ['email', 'endpoint', 'p256dh', 'auth', 'user_agent', 'created_at'],
}

// Evita repetir la verificación en cada request del mismo proceso
const hojasVerificadas = new Set<string>()

/**
 * Crea en la planilla las hojas que falten, con su fila de headers.
 * Idempotente y barata (una lectura de metadatos por proceso).
 */
export async function asegurarHojas(hojas: Record<string, string[]>): Promise<string[]> {
  const pendientes = Object.keys(hojas).filter(h => !hojasVerificadas.has(h))
  if (pendientes.length === 0) return []

  const sheets = getSheets()
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID, fields: 'sheets.properties.title' })
  const existentes = new Set((meta.data.sheets || []).map(s => s.properties?.title || ''))
  const faltantes = pendientes.filter(h => !existentes.has(h))

  if (faltantes.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { requests: faltantes.map(title => ({ addSheet: { properties: { title } } })) },
    })
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        valueInputOption: 'RAW',
        data: faltantes.map(h => ({ range: `${h}!A1`, values: [hojas[h]] })),
      },
    })
  }
  // Hojas que ya existían: completar headers que falten al final (columnas agregadas después)
  const existentesPendientes = pendientes.filter(h => !faltantes.includes(h))
  if (existentesPendientes.length > 0) {
    const res = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: SPREADSHEET_ID,
      ranges: existentesPendientes.map(h => `${h}!1:1`),
    })
    const updates: { range: string; values: string[][] }[] = []
    res.data.valueRanges?.forEach((vr, i) => {
      const hoja = existentesPendientes[i]
      const actuales = (vr.values?.[0] || []) as string[]
      const faltan = hojas[hoja].filter(c => !actuales.includes(c))
      if (faltan.length > 0) {
        const col = String.fromCharCode('A'.charCodeAt(0) + actuales.length)
        updates.push({ range: `${hoja}!${col}1`, values: [faltan] })
      }
    })
    if (updates.length > 0) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: { valueInputOption: 'RAW', data: updates },
      })
    }
  }
  for (const h of pendientes) hojasVerificadas.add(h)
  return faltantes
}
