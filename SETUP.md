# Gastos Compartidos — Guía de Setup

## Requisitos previos
- Node.js 18+
- Cuenta de Google Cloud
- Cuenta de Vercel
- Cuenta de Resend

---

## 1. Google Cloud: Service Account y Sheets API

### 1.1 Crear un proyecto en Google Cloud
1. Ir a [console.cloud.google.com](https://console.cloud.google.com)
2. Crear nuevo proyecto (ej: `gastos-compartidos`)

### 1.2 Habilitar Google Sheets API
1. APIs & Services → Enable APIs → buscar "Google Sheets API" → Habilitar

### 1.3 Crear Service Account
1. APIs & Services → Credentials → Create Credentials → Service Account
2. Darle un nombre (ej: `gastos-sheets`)
3. Rol: **Editor**
4. Guardar el email del service account (ej: `gastos-sheets@tu-proyecto.iam.gserviceaccount.com`)

### 1.4 Crear clave JSON
1. En el service account creado → Keys → Add Key → JSON
2. Descargar el archivo JSON
3. Del JSON vas a necesitar:
   - `client_email` → `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `private_key` → `GOOGLE_PRIVATE_KEY`

---

## 2. Google Sheets: Crear la planilla

### 2.1 Crear spreadsheet
1. Ir a [sheets.google.com](https://sheets.google.com) y crear una nueva hoja
2. Copiar el ID de la URL: `https://docs.google.com/spreadsheets/d/**TU_ID**/edit`
3. Compartir la planilla con el email del service account (dar permiso de Editor)

### 2.2 Crear las hojas con los headers

**Hoja "gastos"** — Fila 1 con estas columnas:
```
id | descripcion | monto_total | pagado_por | cuotas | cuota_actual | fecha_inicio | dia_vencimiento | categoria | notas | estado
```

**Hoja "pagos"** — Fila 1:
```
id | gasto_id | numero_cuota | monto | fecha_vencimiento | fecha_pago | pagado_por | estado
```

**Hoja "categorias"** — Fila 1:
```
id | nombre | color | icono
```

> **Tip:** La primera vez que cargues `/api/categorias`, la app crea automáticamente las categorías por defecto si la hoja está vacía.

---

## 3. Google OAuth (para el login)

1. Google Cloud → APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client IDs
2. Application type: **Web application**
3. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (desarrollo)
   - `https://tu-dominio.vercel.app/api/auth/callback/google` (producción)
4. Guardar `Client ID` y `Client Secret`

---

## 4. Resend (emails)

1. Crear cuenta en [resend.com](https://resend.com)
2. Crear API Key con permiso de envío
3. Configurar un dominio (o usar `onboarding@resend.dev` para testing)
4. Actualizar `EMAIL_FROM` en las variables de entorno

---

## 5. Variables de entorno

Copiar `.env.local.example` a `.env.local` y completar:

```bash
cp .env.local.example .env.local
```

```env
# Google Sheets
GOOGLE_SHEETS_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms
GOOGLE_SERVICE_ACCOUNT_EMAIL=gastos-sheets@tu-proyecto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIEo...\n-----END RSA PRIVATE KEY-----"

# Google OAuth
GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123

# NextAuth
NEXTAUTH_SECRET=   # generalo con: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_ALLOWED_EMAILS=vos@gmail.com,pareja@gmail.com

# Resend
RESEND_API_KEY=re_abc123
EMAIL_FROM=Gastos Compartidos <gastos@tudominio.com>

# Usuarios
USER_1_NAME=Tu Nombre
USER_1_EMAIL=vos@gmail.com
USER_2_NAME=Nombre Pareja
USER_2_EMAIL=pareja@gmail.com

# Cron (solo producción)
CRON_SECRET=   # generalo con: openssl rand -base64 32
```

**Importante con `GOOGLE_PRIVATE_KEY`:** La clave tiene saltos de línea. Cuando la copies del JSON, los `\n` deben quedar como `\n` literales dentro de las comillas dobles, NO como saltos de línea reales.

---

## 6. Desarrollo local

```bash
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

---

## 7. Deploy en Vercel

### 7.1 Subir a GitHub y conectar con Vercel
```bash
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/tu-usuario/gastos
git push -u origin main
```

### 7.2 En Vercel
1. Import project desde GitHub
2. Agregar todas las variables de entorno (las mismas del `.env.local`, pero con `NEXTAUTH_URL=https://tu-app.vercel.app`)
3. Deploy

### 7.3 Cron job
El archivo `vercel.json` ya tiene configurado el cron para ejecutarse todos los días a las 9am UTC (6am Argentina):
```json
{
  "crons": [{ "path": "/api/cron/recordatorios", "schedule": "0 12 * * *" }]
}
```
Vercel llama automáticamente a ese endpoint con el header `Authorization: Bearer $CRON_SECRET`.

---

## Estructura de archivos

```
app/
  (app)/               # Rutas protegidas (requieren login)
    dashboard/         # Pantalla principal
    gastos/
      page.tsx         # Lista de gastos
      nuevo/           # Formulario nuevo gasto
      [id]/            # Detalle + gestión de cuotas
  api/
    auth/              # NextAuth handlers
    gastos/            # CRUD gastos
    pagos/             # Marcar cuotas como pagadas
    categorias/        # Listar categorías
    saldo/             # Calcular saldo
    notificaciones/    # Enviar emails
    cron/              # Recordatorios automáticos
  login/               # Página de login
emails/                # Templates de React Email
lib/
  auth.ts              # NextAuth config
  google-sheets.ts     # Todas las operaciones con Sheets API
  email.ts             # Funciones de envío con Resend
  saldo.ts             # Lógica de cálculo de deuda
  users.ts             # Helpers para los dos usuarios
  types.ts             # Tipos TypeScript
components/
  dashboard/           # Componentes del dashboard
  gastos/              # Componentes de gastos
  nav.tsx              # Navegación
```
