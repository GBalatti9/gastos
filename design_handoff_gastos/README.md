# Handoff: Gastos — Rediseño UI

## Overview
Rediseño de tres pantallas clave de una app de control de gastos compartidos (entre dos personas, ej. Gaston y Guadalupe):

1. **Inicio (Home)** — saldo del mes, cuotas pendientes, balance histórico.
2. **Lista de Gastos** — búsqueda, filtros y listado de gastos con progreso de cuotas.
3. **Nuevo gasto** — formulario compacto para cargar un gasto.

Los cambios resuelven tres problemas de la UI original:
- El toggle "Este Mes / Total" era confuso: "Total" quedaba sobre el selector de mes aunque es un estado global sin mes. Se reemplazó por tabs superiores **"Mes actual" / "Histórico"**, y el selector de mes sólo aparece en "Mes actual".
- La lista de filtros en la pantalla de Gastos tenía 5 dropdowns anónimos ("activo / todas / todos / todos / todas"). Se reemplazó por **chips de categoría con emoji** + un botón "Filtros" que abre el panel avanzado.
- El form de Nuevo Gasto era vertical, uniforme y poco jerarquizado. Se reorganizó con **monto como hero** (moneda + número grande), **categoría como grid de chips visuales**, **cuotas como presets con preview del monto mensual**, y el resto agrupado en una sección "Pago" compacta. Barra "Guardar gasto" sticky.

## About the Design Files
Los archivos en `prototype/` son **referencias de diseño creadas en HTML** — prototipos que muestran la apariencia e interacciones deseadas, **no código de producción para copiar tal cual**. La tarea es **recrear estos diseños en el entorno existente del codebase** (React Native, Flutter, SwiftUI, Next.js, lo que sea) usando los patrones y librerías del proyecto. Si todavía no hay un entorno, elegí el framework más apropiado.

Las pantallas del prototipo se corresponden con las de la app real — el objetivo es que el usuario final no note diferencia de comportamiento, sólo de diseño.

## Fidelity
**High-fidelity (hifi)** — medidas, colores, tipografía y jerarquía son las finales. Recrear pixel-perfect dentro de lo que permita el framework destino.

## Design Tokens

### Colores (paleta original, no modificar)
| Token | Valor | Uso |
|---|---|---|
| `bg` | `#F5F1E8` | Fondo principal (crema cálido) |
| `card` | `#FFFFFF` | Fondo de tarjetas |
| `cardSoft` | `#EFE8D7` | Fondo secundario (chips, inputs soft, pills inactivas) |
| `line` | `rgba(77, 52, 38, 0.12)` | Bordes y separadores |
| `ink` | `#2A1F17` | Texto principal (marrón muy oscuro) |
| `ink2` | `#5C4A3E` | Texto secundario |
| `ink3` | `#8A7565` | Texto terciario / muted / labels |
| `brown` | `#8B5E3C` | Marrón acento (logo, tab activa) |
| `brownSoft` | `#B8876B` | Marrón claro (barras, variantes) |
| `red` | `#C23B2A` | Monto en rojo (debés) |
| `green` | `#5E7A3C` | Monto en verde (a favor) / cuotas pagadas |
| `orange` | `#D97A4E` | Alertas (cuotas pendientes) |

Colores por categoría (usados para chips/icon backgrounds al 13% de opacidad):
- Casa `#B8876B`, Supermercado `#7A8C4A`, Comida `#C97B4A`, Transporte `#5C7A8B`, Ocio `#8B5E9C`, Salud `#B8545E`, Servicios `#C89B4E`, Otros `#8A7565`.

### Tipografía
- **Serif display** (montos grandes, logo, títulos grandes): `Cormorant Garamond`, italic, weight 500. Fallback: `Playfair Display`, `Georgia`, serif.
- **Sans UI**: `Inter`, weights 400/500/600/700. Fallback: `-apple-system, system-ui, sans-serif`.

Tamaños usados:
| Uso | Size | Weight | Estilo |
|---|---|---|---|
| Monto hero (saldo, form) | 44–48px | 500 | Cormorant italic |
| Título pantalla "Gastos" | 34px | 500 | Cormorant italic |
| Logo "gastos" | 28px | 500 | Cormorant italic |
| Título header modal ("Nuevo gasto") | 17px | 600 | Cormorant italic |
| Selector mes ("Abril 2026") | 17px | 600 | Inter |
| Row title (gasto, cuota) | 15px | 600 | Inter |
| Body / labels | 14px | 500–600 | Inter |
| Section labels UPPERCASE | 11px | 600 | Inter, letter-spacing 1.4 |
| Micro labels / captions | 10–12px | 500–600 | Inter |
| Tab bar labels | 11px | 500–600 | Inter |

### Spacing
- Padding de tarjeta: `20px 22px` (saldo, cuotas) · `14px 16px` (row compacta) · `12px 14px` (sección form).
- Gap entre tarjetas verticales: `16px`.
- Padding lateral del scroll: `20px`.
- Padding interno del phone content: top `62px` (status bar), bottom `100–120px` (tab bar + safe area).

### Radios
- Tarjetas grandes (saldo, cuotas, histórico, hero del form): `20px`.
- Tarjetas medianas (row de gasto, sección de form): `14px`.
- Inputs / buttons: `10–12px`.
- Chips / pills: `20px` (pill) · `8px` (pill pequeña como moneda ARS/USD).
- Phone frame: `44px` (interior) + dos rings (bezel).

### Shadows
- Tarjetas: `0 1px 2px rgba(42,31,23,0.04)` + borde `1px solid line`.
- CTA principal ("Guardar gasto") con estado válido: `0 4px 12px rgba(42,31,23,0.25)`.
- Avatar: `0 1px 3px rgba(0,0,0,0.08)`.
- Dropdown menu: `0 8px 24px rgba(42,31,23,0.12)`.

---

## Screens

### 1) Home (`screen === 'home'`)

**Layout** (top → bottom):
1. `AppHeader` — logo "gastos" en serif italic marrón + avatar 38×38 (gradiente `#C89B6E → #8B5E3C`, iniciales "GB"). Separador inferior.
2. **Tabs de período** (reemplazan el toggle original):
   - Container: `rgba(42,31,23,0.06)` fondo, `padding: 4`, `radius: 12`.
   - Dos tabs flex 1: "Mes actual" / "Histórico".
   - Tab activa: fondo `card`, sombra `0 1px 3px rgba(42,31,23,0.08)`, weight 600.
3. **Si tab = "Mes actual"**:
   - **Selector de mes** (sólo acá): `‹ Abril 2026 ›`, font 17/600, centrado. Flechas con opacidad 0.3 cuando están en el extremo.
   - **Card "Saldo del mes"**:
     - Header: label "SALDO DEL MES" (11px uppercase, letter-spacing 1.4, ink3) + mes a la derecha.
     - Monto hero: flecha (↓ roja si debe) + `$ 52.716` en serif italic 48/500, color `red`.
     - Descripción: "Le debés a **Guadalupe**" (14px ink2, "Guadalupe" bold ink).
     - Separador full-bleed.
     - Desglose: labels "GASTON" / "GUADALUPE", barra comparativa (6px de alto, `cardSoft` de fondo, fill proporcional con `brownSoft` / `brown`), montos bold debajo.
     - Footer USD: pill `cardSoft` con "USD" izq. y "— al día" en italic serif derecha.
   - **Card "Cuotas del mes"**: header label + "Ver todas" (brown, 12/600); subtítulo naranja "14 pendientes · $3.278.420"; lista de 3 cuotas con checkbox circular (outlined orange o filled green), título, meta ("Cuota 1/12 · Vence 1 abr"), monto a la derecha. Pagadas con line-through + opacity 0.5.
4. **Si tab = "Histórico"**:
   - **Card "Balance histórico"**: label "BALANCE HISTÓRICO", sublabel "Desde enero 2024", monto hero verde `$ 284.120` en serif italic 48, descripción "**Guadalupe** te debe en total", separador, dos columnas con totales acumulados por persona.
   - **Card "Por mes"**: chart de barras verticales (6 meses), etiquetas top con valor en `k`, etiquetas bottom con mes abreviado. Color por mes: `red` si el usuario debe, `green` si le deben, opacity 0.85.

### 2) Lista de Gastos (`screen === 'list'`)

**Layout**:
1. `AppHeader`.
2. Título: "Gastos" en serif italic 34/500 + contador "N resultados" (13, ink3) alineado a la derecha (baseline).
3. **Buscador**: row pill con ícono lupa, input "Buscar gastos…", botón "×" (aparece con texto), botón "Filtros" (activo con fondo `cardSoft`, incluye ícono + label).
4. **Chips de categoría** (scroll horizontal): "Todas" + uno por categoría presente en el dataset (emoji + label). Activo: fondo `ink`, texto `bg`.
5. **Panel de filtros avanzados** (colapsable, sólo cuando botón "Filtros" está activo): grid 2×2 de FilterDropdown (Estado / Moneda / Pagado por / Mes) con micro-labels uppercase y un botón pill `cardSoft` con ícono caret.
6. **Lista** (gap 10):
   - Row: tarjeta `card`, radius 14, border `line`, padding `14 16`.
   - Izq: icon box 40×40, radius 10, fondo `catColor + 22` (13% alpha), emoji centrado 18.
   - Medio: título (15/600), categoría uppercase (11, ink3, letter-spacing 0.5), **si cuotas > 1**: barra de progreso 3px (`cardSoft` + fill `catColor`) y "`n/total`" al lado.
   - Der: monto total (15/600), y "`monto/mes`" (11, ink3) si hay cuotas.

### 3) Nuevo Gasto (`screen === 'new'`)

**Layout**:
1. **Header**: botón "‹ Cancelar" izq. (15, ink2), título "Nuevo gasto" centro (Cormorant italic 17/600, nowrap), spacer der. para balancear.
2. **Hero del monto**: tarjeta blanca 20-radius. Label "MONTO" uppercase. En una fila: pill segmentado ARS/USD + input de monto (Cormorant italic 44/500, 170px, alineado izq, caret `brown`). Debajo: input de descripción full-width con fondo `cardSoft`, radius 10, center-aligned, placeholder "Descripción (ej. Netflix)".
3. **Sección "Categoría *"**: grid 4 columnas × 2 filas de chips. Cada chip: emoji 20 + label 10.5. Activo: borde y fondo teñidos con el color de la categoría.
4. **Sección "Cuotas"**: fila de 4 presets (1 pago, 3×, 6×, 12×). Activo: fondo `ink`, texto `bg`. **Preview**: cuando cuotas > 1 y hay monto, aparece una pill `cardSoft` "N cuotas de — $X" con el monto calculado.
5. **Sección "Pago"** (row-based dentro de una tarjeta, separadores 1px `line`):
   - Row "Pagado por" → `InlineSelect` (Gaston / Guadalupe).
   - Row "Método" → `InlineSelect` (Efectivo / Débito / Crédito / Transferencia).
   - Row "División" → `InlineSelect` (50/50 / 100% Gaston / 100% Guadalupe / Personalizada).
   - `InlineSelect` = botón con label actual bold + ícono caret; al click abre un dropdown flotante sobre overlay invisible.
6. **CTA sticky "Guardar gasto"**: `position: absolute, bottom: 84, left/right: 0`, padding 12/20, con máscara `linear-gradient(to bottom, transparent, bg 40%)` para fundir con el fondo. Botón full-width, `ink` bg, `bg` text, radius 14, font 15/600. Deshabilitado (`ink3`) hasta que descripción + monto + categoría estén completos.

### Tab bar (persistente, absolute bottom)
- 4 tabs: Inicio / Gastos / Nuevo / Ajustes.
- Tab activa: ícono y label en `brown`, y una barra sutil de 22×2px `brown` arriba del ícono.
- Padding inferior 28px para la safe area.

---

## Interactions & Behavior

- **Tabs de período** (home): cambia el render entre `SaldoMes`/`CuotasCard` y `SaldoTotal`/`HistoricoCard`. Sin transición (instantáneo).
- **Selector de mes**: flechas `‹` / `›`, opacidad 0.3 cuando no hay más mes en esa dirección. Local state (array `months`).
- **Filtros (lista)**: chips de categoría mutan `catFilter`; botón "Filtros" toggle del panel avanzado. Buscador filtra por `title.toLowerCase().includes(q.toLowerCase())`.
- **Form Nuevo Gasto**:
  - Regex en input monto: `replace(/[^\d.,]/g, '')`.
  - Validación del CTA: `desc.trim() && monto && cat`.
  - Preview de cuotas: `monto / cuotas` formateado como ARS.
  - `InlineSelect`: overlay `position: fixed, inset: 0, zIndex: 10` para cerrar al click-out.
- **Persistencia**: `screen` actual en `localStorage.gastos.screen` — rerefresh vuelve al mismo tab.
- **Transiciones**: `all 0.15s` en chips, tabs y botones que cambian de estado.

## State Management

```ts
// App-level
screen: 'home' | 'list' | 'new' | 'cfg'  // persisted in localStorage

// Home
tab: 'mes' | 'total'
monthIdx: number   // 0 = current month

// Lista
q: string
catFilter: 'todas' | categoryId
showFilters: boolean

// Nuevo Gasto
desc: string
monto: string
moneda: 'ARS' | 'USD'
cat: categoryId | null
cuotas: 1 | 3 | 6 | 12
split: '50/50' | '100/0' | '0/100' | 'custom'
pago: 'efectivo' | 'debito' | 'credito' | 'transf'
pagadoPor: 'gas' | 'gua'
```

## Categories (fuente de verdad)
```ts
const CATEGORIES = [
  { id: 'casa',       label: 'Casa',          emoji: '🏠', color: '#B8876B' },
  { id: 'super',      label: 'Supermercado',  emoji: '🛒', color: '#7A8C4A' },
  { id: 'comida',     label: 'Comida',        emoji: '🍽️', color: '#C97B4A' },
  { id: 'transporte', label: 'Transporte',    emoji: '🚕', color: '#5C7A8B' },
  { id: 'ocio',       label: 'Ocio',          emoji: '🎭', color: '#8B5E9C' },
  { id: 'salud',      label: 'Salud',         emoji: '⚕️', color: '#B8545E' },
  { id: 'servicios',  label: 'Servicios',     emoji: '💡', color: '#C89B4E' },
  { id: 'otros',      label: 'Otros',         emoji: '•',  color: '#8A7565' },
];
```

## Formatters
```ts
const fmtARS = (n) => '$ ' + Math.round(n).toLocaleString('es-AR');
// ej. fmtARS(67928) → "$ 67.928"
```

## Assets
- **Tipografía**: Google Fonts (`Cormorant Garamond` + `Inter`). En RN/móvil nativo, importar los TTFs equivalentes o reemplazar por la serif italic más cercana disponible.
- **Íconos**: SVG inline de trazo 1.6–2 (home, list, plus, gear, chevron, search, caret, arrowDown, x, filter). Se pueden reemplazar por `lucide-react` / `@tabler/icons` / `Phosphor` si el proyecto ya tiene un set.
- **Emojis**: se usan como íconos de categoría. Si el destino es nativo, usar el emoji del sistema.
- **Avatar**: placeholder con gradiente + iniciales "GB". Reemplazar por foto del usuario real cuando exista.

## Files
- `prototype/index.html` — shell con el phone centrado y navegación externa de demo.
- `prototype/app.jsx` — implementación completa de las tres pantallas + componentes compartidos (`Phone`, `AppHeader`, `TabBar`, `Section`, `Row`, `InlineSelect`, `CurrencyPill`, `FilterChip`, `FilterDropdown`, `GastoRow`, `CuotasCard`, `SaldoMes`, `SaldoTotal`, `HistoricoCard`).

## Notas para Claude Code
- **Mantener la paleta existente** de la app original — no introducir colores nuevos, sólo los listados acá.
- **El toggle "Este Mes / Total" original debe eliminarse** y reemplazarse por tabs superiores "Mes actual / Histórico". Cuando la tab activa es "Histórico", **ocultar el selector de mes** — es un estado global.
- **En el form**: priorizar el monto como hero y la categoría como grid de chips, no volver a un dropdown. Cuotas como presets con preview en vivo.
- Si el codebase ya tiene un design system (theme file, tokens), **mapear** los tokens de arriba a los existentes; no duplicar.
- El prototipo está pensado para móvil 390×844 (iPhone 14). Adaptar al breakpoint real del proyecto.
