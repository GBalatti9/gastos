import { google } from 'googleapis'
import { Gasto, Pago, Categoria, Cierre, Moneda, TipoDivision, TipoCambio } from './types'

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

// ─── Gastos ───────────────────────────────────────────────────────────────────

export async function getGastos(): Promise<Gasto[]> {
  const sheets = getSheets()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'gastos!A2:O',
  })
  const rows = res.data.values || []
  return rows.map(rowToGasto).filter(Boolean) as Gasto[]
}

export async function getGastoById(id: string): Promise<Gasto | null> {
  const gastos = await getGastos()
  return gastos.find(g => g.id === id) || null
}

export async function createGasto(data: Omit<Gasto, 'id'>): Promise<Gasto> {
  const sheets = getSheets()
  const gastos = await getGastos()
  const nextId = gastos.length > 0
    ? String(Math.max(...gastos.map(g => parseInt(g.id) || 0)) + 1)
    : '1'

  const row = [
    nextId,
    data.descripcion,
    data.monto_total,
    data.pagado_por,
    data.cuotas,
    data.cuota_actual,
    data.fecha_inicio,
    data.dia_vencimiento,
    data.categoria,
    data.notas,
    data.estado,
    data.moneda || 'ARS',
    data.tipo_division || '50/50',
    data.division_valor || '',
    data.recurrente ? 'si' : 'no',
  ]

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'gastos!A:O',
    valueInputOption: 'RAW',
    requestBody: { values: [row] },
  })

  return { ...data, id: nextId }
}

export async function updateGastoEstado(id: string, estado: 'activo' | 'cancelado'): Promise<void> {
  const sheets = getSheets()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'gastos!A:A',
  })
  const rows = res.data.values || []
  const rowIndex = rows.findIndex(r => r[0] === id)
  if (rowIndex === -1) throw new Error(`Gasto ${id} no encontrado`)

  const rowNum = rowIndex + 1 // 1-indexed, but row 1 is header so +1 already included
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `gastos!K${rowNum + 1}`,
    valueInputOption: 'RAW',
    requestBody: { values: [[estado]] },
  })
}

// ─── Pagos ────────────────────────────────────────────────────────────────────

export async function getPagos(): Promise<Pago[]> {
  const sheets = getSheets()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'pagos!A2:H',
  })
  const rows = res.data.values || []
  return rows.map(rowToPago).filter(Boolean) as Pago[]
}

export async function getPagosByGastoId(gastoId: string): Promise<Pago[]> {
  const pagos = await getPagos()
  return pagos.filter(p => p.gasto_id === gastoId)
}

export async function createPagos(pagos: Omit<Pago, 'id'>[]): Promise<void> {
  if (pagos.length === 0) return
  const sheets = getSheets()
  const existing = await getPagos()
  let nextId = existing.length > 0
    ? Math.max(...existing.map(p => parseInt(p.id) || 0)) + 1
    : 1

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
    requestBody: { values: rows },
  })
}

export async function marcarPagoComoPagado(
  pagoId: string,
  pagadoPor: string,
  fechaPago: string
): Promise<void> {
  const sheets = getSheets()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'pagos!A:A',
  })
  const rows = res.data.values || []
  const rowIndex = rows.findIndex(r => r[0] === pagoId)
  if (rowIndex === -1) throw new Error(`Pago ${pagoId} no encontrado`)

  const rowNum = rowIndex + 2 // 1-indexed + header row offset
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      valueInputOption: 'RAW',
      data: [
        { range: `pagos!F${rowNum}`, values: [[fechaPago]] },
        { range: `pagos!G${rowNum}`, values: [[pagadoPor]] },
        { range: `pagos!H${rowNum}`, values: [['pagado']] },
      ],
    },
  })
}

// ─── Cierres ──────────────────────────────────────────────────────────────────

export async function getCierres(): Promise<Cierre[]> {
  const sheets = getSheets()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'cierres!A2:I',
  })
  const rows = res.data.values || []
  return rows.map(rowToCierre).filter(Boolean) as Cierre[]
}

export async function createCierre(data: Omit<Cierre, 'id'>): Promise<Cierre> {
  const sheets = getSheets()
  const cierres = await getCierres()
  const nextId = cierres.length > 0
    ? String(Math.max(...cierres.map(c => parseInt(c.id) || 0)) + 1)
    : '1'

  const row = [
    nextId,
    data.mes,
    data.saldo_user1,
    data.saldo_user2,
    data.deuda_final,
    data.deudor,
    data.acreedor,
    data.fecha_cierre,
    data.moneda,
  ]

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'cierres!A:I',
    valueInputOption: 'RAW',
    requestBody: { values: [row] },
  })

  return { ...data, id: nextId }
}

// ─── Categorias ───────────────────────────────────────────────────────────────

export async function getCategorias(): Promise<Categoria[]> {
  const sheets = getSheets()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'categorias!A2:D',
  })
  const rows = res.data.values || []
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
  const sheets = getSheets()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'tipo_cambio!A2:C',
  })
  const rows = res.data.values || []
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
    dia_vencimiento: parseInt(row[7]) || 1,
    categoria: row[8] || '',
    notas: row[9] || '',
    estado: (row[10] as 'activo' | 'cancelado') || 'activo',
    moneda: (row[11] as Moneda) || 'ARS',
    tipo_division: (row[12] as TipoDivision) || '50/50',
    division_valor: row[13] || '',
    recurrente: row[14] === 'si',
  }
}

function rowToCierre(row: string[]): Cierre | null {
  if (!row[0]) return null
  return {
    id: row[0],
    mes: row[1] || '',
    saldo_user1: parseFloat(row[2]) || 0,
    saldo_user2: parseFloat(row[3]) || 0,
    deuda_final: parseFloat(row[4]) || 0,
    deudor: row[5] || '',
    acreedor: row[6] || '',
    fecha_cierre: row[7] || '',
    moneda: (row[8] as Moneda) || 'ARS',
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
