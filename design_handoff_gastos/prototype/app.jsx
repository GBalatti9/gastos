// Gastos — prototipo rediseñado

// ── Paleta (respetando la app original) ─────────────────────
const C = {
  bg: '#F5F1E8',        // fondo crema
  card: '#FFFFFF',
  cardSoft: '#EFE8D7',  // tono secundario (chip fondo)
  line: 'rgba(77, 52, 38, 0.12)',
  ink: '#2A1F17',       // texto principal marrón muy oscuro
  ink2: '#5C4A3E',      // secundario
  ink3: '#8A7565',      // terciario / muted
  brown: '#8B5E3C',     // marrón acento (logo / tabs activas)
  brownSoft: '#B8876B',
  red: '#C23B2A',       // debés
  green: '#5E7A3C',     // a favor
  orange: '#D97A4E',    // alertas cuotas
};

// ── Helpers ─────────────────────────────────────────────────
const fmtARS = (n) => '$ ' + Math.round(n).toLocaleString('es-AR');
const Serif = { fontFamily: '"Cormorant Garamond", "Playfair Display", Georgia, serif', fontStyle: 'italic' };
const Sans  = { fontFamily: '"Inter", -apple-system, system-ui, sans-serif' };

// ── Iconos (línea simple, mismo peso) ───────────────────────
const Icon = {
  home: (c = C.ink) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-7h-6v7H4a1 1 0 01-1-1v-9.5z" stroke={c} strokeWidth="1.6" strokeLinejoin="round"/></svg>,
  list: (c = C.ink) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h16" stroke={c} strokeWidth="1.6" strokeLinecap="round"/></svg>,
  plus: (c = C.ink) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke={c} strokeWidth="1.6"/><path d="M12 8v8M8 12h8" stroke={c} strokeWidth="1.6" strokeLinecap="round"/></svg>,
  gear: (c = C.ink) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke={c} strokeWidth="1.6"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke={c} strokeWidth="1.6" strokeLinecap="round"/></svg>,
  chevL: (c = C.ink2) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 6l-6 6 6 6" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  chevR: (c = C.ink2) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  search: (c = C.ink3) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke={c} strokeWidth="1.6"/><path d="M20 20l-3.5-3.5" stroke={c} strokeWidth="1.6" strokeLinecap="round"/></svg>,
  caret: (c = C.ink2) => <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  arrowDown: (c = C.red) => <svg width="18" height="22" viewBox="0 0 18 22" fill="none"><path d="M9 3v16M3 13l6 6 6-6" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  x: (c = C.ink2) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>,
  filter: (c = C.ink2) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 5h18M6 12h12M10 19h4" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>,
};

// ── Data de ejemplo ─────────────────────────────────────────
const CATEGORIES = [
  { id: 'casa', label: 'Casa', emoji: '🏠', color: '#B8876B' },
  { id: 'super', label: 'Supermercado', emoji: '🛒', color: '#7A8C4A' },
  { id: 'comida', label: 'Comida', emoji: '🍽️', color: '#C97B4A' },
  { id: 'transporte', label: 'Transporte', emoji: '🚕', color: '#5C7A8B' },
  { id: 'ocio', label: 'Ocio', emoji: '🎭', color: '#8B5E9C' },
  { id: 'salud', label: 'Salud', emoji: '⚕️', color: '#B8545E' },
  { id: 'servicios', label: 'Servicios', emoji: '💡', color: '#C89B4E' },
  { id: 'otros', label: 'Otros', emoji: '•', color: '#8A7565' },
];

const GASTOS = [
  { id: 1, title: 'Calm (colchón + almohadas)', cat: 'casa',    total: 815146, cuotaAct: 1, cuotas: 12, monto: 67928 },
  { id: 2, title: 'Mesa Living',                cat: 'casa',    total: 271910, cuotaAct: 1, cuotas: 3,  monto: 90637 },
  { id: 3, title: 'Cama',                        cat: 'casa',    total: 871843, cuotaAct: 1, cuotas: 3,  monto: 290614 },
  { id: 4, title: 'Expensas abril',              cat: 'casa',    total: 627376, cuotaAct: 1, cuotas: 1,  monto: 627376 },
  { id: 5, title: 'Coto semanal',                cat: 'super',   total: 48200,  cuotaAct: 1, cuotas: 1,  monto: 48200 },
  { id: 6, title: 'Jumbo',                       cat: 'super',   total: 63400,  cuotaAct: 1, cuotas: 1,  monto: 63400 },
  { id: 7, title: 'Netflix',                     cat: 'servicios', total: 8500,  cuotaAct: 1, cuotas: 1,  monto: 8500 },
  { id: 8, title: 'Edenor',                      cat: 'servicios', total: 34200, cuotaAct: 1, cuotas: 1,  monto: 34200 },
];

// ── Layout base del teléfono (frame propio, más limpio que iOS) ────
function Phone({ children }) {
  return (
    <div style={{
      width: 390, height: 844, borderRadius: 44,
      background: C.bg, position: 'relative', overflow: 'hidden',
      boxShadow: '0 30px 80px rgba(42,31,23,0.18), 0 0 0 10px #1a1410, 0 0 0 11px #2a1f17',
      fontFamily: Sans.fontFamily,
      color: C.ink,
    }}>
      {/* notch */}
      <div style={{
        position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
        width: 110, height: 32, borderRadius: 20, background: '#000', zIndex: 50,
      }}/>
      {/* status bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 52,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 32px 0', fontSize: 15, fontWeight: 600, zIndex: 40,
        color: C.ink,
      }}>
        <span>9:41</span>
        <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}>
          <svg width="18" height="11" viewBox="0 0 18 11"><rect x="0" y="7" width="3" height="4" rx="0.5" fill={C.ink}/><rect x="5" y="4" width="3" height="7" rx="0.5" fill={C.ink}/><rect x="10" y="1" width="3" height="10" rx="0.5" fill={C.ink}/><rect x="15" y="0" width="3" height="11" rx="0.5" fill={C.ink} opacity="0.35"/></svg>
          <svg width="25" height="12" viewBox="0 0 25 12"><rect x="0.5" y="0.5" width="21" height="11" rx="2.5" stroke={C.ink} fill="none"/><rect x="2" y="2" width="16" height="8" rx="1.2" fill={C.ink}/><rect x="22.5" y="3.5" width="1.5" height="5" rx="0.5" fill={C.ink}/></svg>
        </span>
      </div>
      {children}
      {/* home indicator */}
      <div style={{
        position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
        width: 134, height: 5, borderRadius: 100, background: 'rgba(42,31,23,0.35)', zIndex: 60,
      }}/>
    </div>
  );
}

// ── Header común (logo + avatar) ────────────────────────────
function AppHeader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '62px 20px 14px',
      borderBottom: `1px solid ${C.line}`,
    }}>
      <div style={{ ...Serif, fontSize: 28, color: C.brown, fontWeight: 500, letterSpacing: 0.2 }}>
        gastos
      </div>
      <div style={{
        width: 38, height: 38, borderRadius: '50%',
        background: 'linear-gradient(135deg, #C89B6E, #8B5E3C)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontSize: 14, fontWeight: 600, letterSpacing: 0.3,
        border: `1.5px solid ${C.bg}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}>GB</div>
    </div>
  );
}

// ── Tab bar inferior ─────────────────────────────────────────
function TabBar({ active, onTab }) {
  const tabs = [
    { id: 'home',  label: 'Inicio',   icon: Icon.home },
    { id: 'list',  label: 'Gastos',   icon: Icon.list },
    { id: 'new',   label: 'Nuevo',    icon: Icon.plus },
    { id: 'cfg',   label: 'Ajustes',  icon: Icon.gear },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      background: C.bg,
      borderTop: `1px solid ${C.line}`,
      padding: '10px 16px 28px',
      display: 'flex', justifyContent: 'space-around',
      zIndex: 30,
    }}>
      {tabs.map(t => {
        const on = active === t.id;
        const color = on ? C.brown : C.ink3;
        return (
          <button key={t.id} onClick={() => onTab(t.id)} style={{
            border: 'none', background: 'transparent', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            padding: '4px 10px',
            color, fontSize: 11, fontWeight: on ? 600 : 500, letterSpacing: 0.1,
            position: 'relative',
          }}>
            {on && <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', width: 22, height: 2, borderRadius: 2, background: C.brown }}/>}
            {t.icon(color)}
            <span>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── PANTALLA: HOME ──────────────────────────────────────────
function Home({ onNav }) {
  const [tab, setTab] = React.useState('mes'); // 'mes' | 'total'
  const [monthIdx, setMonthIdx] = React.useState(0); // 0 = Abril 2026
  const months = ['Abril 2026', 'Marzo 2026', 'Febrero 2026', 'Enero 2026'];

  return (
    <div style={{ height: '100%', overflow: 'auto', paddingBottom: 100 }}>
      <AppHeader/>

      {/* ── Tabs superiores: Mes actual / Histórico ─────── */}
      <div style={{ padding: '18px 20px 0' }}>
        <div style={{
          display: 'flex', gap: 4,
          background: 'rgba(42,31,23,0.06)',
          padding: 4, borderRadius: 12,
        }}>
          {[
            { id: 'mes', label: 'Mes actual' },
            { id: 'total', label: 'Histórico' },
          ].map(t => {
            const on = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                flex: 1, border: 'none', cursor: 'pointer',
                padding: '10px 12px', borderRadius: 9,
                background: on ? C.card : 'transparent',
                boxShadow: on ? '0 1px 3px rgba(42,31,23,0.08)' : 'none',
                color: on ? C.ink : C.ink3,
                fontSize: 14, fontWeight: on ? 600 : 500,
                fontFamily: Sans.fontFamily,
                transition: 'all 0.15s',
              }}>{t.label}</button>
            );
          })}
        </div>
      </div>

      {/* ── Si 'mes actual': selector de mes (con flechas) ── */}
      {tab === 'mes' && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '22px 24px 4px',
        }}>
          <button onClick={() => setMonthIdx(Math.min(monthIdx + 1, months.length - 1))} style={{
            border: 'none', background: 'transparent', cursor: 'pointer', padding: 8,
            opacity: monthIdx < months.length - 1 ? 1 : 0.3,
          }}>{Icon.chevL()}</button>
          <div style={{ fontSize: 17, fontWeight: 600, color: C.ink, letterSpacing: -0.2 }}>
            {months[monthIdx]}
          </div>
          <button onClick={() => setMonthIdx(Math.max(monthIdx - 1, 0))} style={{
            border: 'none', background: 'transparent', cursor: 'pointer', padding: 8,
            opacity: monthIdx > 0 ? 1 : 0.3,
          }}>{Icon.chevR()}</button>
        </div>
      )}

      {/* ── Card principal: Saldo ─────────────────────────── */}
      <div style={{ padding: '14px 20px 0' }}>
        {tab === 'mes' ? <SaldoMes month={months[monthIdx]}/> : <SaldoTotal/>}
      </div>

      {/* ── Cuotas del mes (solo 'mes') ───────────────────── */}
      {tab === 'mes' && (
        <div style={{ padding: '16px 20px 0' }}>
          <CuotasCard onNav={onNav}/>
        </div>
      )}

      {/* ── Lista reciente (solo 'total') ─────────────────── */}
      {tab === 'total' && (
        <div style={{ padding: '16px 20px 0' }}>
          <HistoricoCard/>
        </div>
      )}
    </div>
  );
}

function SaldoMes({ month }) {
  return (
    <div style={{
      background: C.card, borderRadius: 20, padding: '20px 22px',
      boxShadow: '0 1px 2px rgba(42,31,23,0.04)',
      border: `1px solid ${C.line}`,
    }}>
      {/* Header: saldo del mes / mes */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ fontSize: 11, letterSpacing: 1.4, color: C.ink3, fontWeight: 600 }}>SALDO DEL MES</div>
        <div style={{ fontSize: 12, color: C.ink3 }}>{month}</div>
      </div>

      {/* Número grande centrado */}
      <div style={{ padding: '18px 0 6px', display: 'flex', alignItems: 'center', gap: 10 }}>
        {Icon.arrowDown(C.red)}
        <div style={{
          ...Serif, fontSize: 48, fontWeight: 500, color: C.red,
          letterSpacing: -0.5, lineHeight: 1,
        }}>$ 52.716</div>
      </div>

      {/* Descripción */}
      <div style={{ fontSize: 14, color: C.ink2, marginTop: 4 }}>
        Le debés a <span style={{ fontWeight: 600, color: C.ink }}>Guadalupe</span>
      </div>

      {/* Separador */}
      <div style={{ height: 1, background: C.line, margin: '18px -22px' }}/>

      {/* Desglose en dos columnas, con barra comparativa sutil */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.ink3, letterSpacing: 1.2, fontWeight: 600, marginBottom: 8 }}>
          <span>GASTON</span>
          <span>GUADALUPE</span>
        </div>
        <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', background: C.cardSoft }}>
          <div style={{ width: '47.7%', background: C.brownSoft }}/>
          <div style={{ width: '52.3%', background: C.brown }}/>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 16, fontWeight: 600, color: C.ink }}>
          <span>$1.086.554</span>
          <span>$1.191.986</span>
        </div>
      </div>

      {/* USD nota al pie */}
      <div style={{
        marginTop: 14, padding: '10px 12px',
        background: C.cardSoft, borderRadius: 10,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontSize: 13, color: C.ink2,
      }}>
        <span>USD</span>
        <span style={{ ...Serif, fontStyle: 'italic', color: C.ink3 }}>— al día</span>
      </div>
    </div>
  );
}

function SaldoTotal() {
  return (
    <div style={{
      background: C.card, borderRadius: 20, padding: '20px 22px',
      boxShadow: '0 1px 2px rgba(42,31,23,0.04)',
      border: `1px solid ${C.line}`,
    }}>
      <div style={{ fontSize: 11, letterSpacing: 1.4, color: C.ink3, fontWeight: 600 }}>BALANCE HISTÓRICO</div>
      <div style={{ fontSize: 12, color: C.ink3, marginTop: 2 }}>Desde enero 2024</div>

      <div style={{ padding: '18px 0 6px' }}>
        <div style={{
          ...Serif, fontSize: 48, fontWeight: 500, color: C.green,
          letterSpacing: -0.5, lineHeight: 1,
        }}>$ 284.120</div>
      </div>
      <div style={{ fontSize: 14, color: C.ink2, marginTop: 4 }}>
        <span style={{ fontWeight: 600, color: C.ink }}>Guadalupe</span> te debe en total
      </div>

      <div style={{ height: 1, background: C.line, margin: '18px -22px' }}/>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
        <div>
          <div style={{ color: C.ink3, fontSize: 11, letterSpacing: 1.2, fontWeight: 600, marginBottom: 4 }}>GASTON</div>
          <div style={{ fontSize: 17, fontWeight: 600 }}>$12.480.320</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: C.ink3, fontSize: 11, letterSpacing: 1.2, fontWeight: 600, marginBottom: 4 }}>GUADALUPE</div>
          <div style={{ fontSize: 17, fontWeight: 600 }}>$12.196.200</div>
        </div>
      </div>
    </div>
  );
}

function CuotasCard({ onNav }) {
  return (
    <div style={{
      background: C.card, borderRadius: 20, padding: '20px 22px',
      border: `1px solid ${C.line}`,
      boxShadow: '0 1px 2px rgba(42,31,23,0.04)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 11, letterSpacing: 1.4, color: C.ink3, fontWeight: 600 }}>CUOTAS DEL MES</div>
        <button onClick={() => onNav('list')} style={{
          border: 'none', background: 'transparent', cursor: 'pointer',
          fontSize: 12, color: C.brown, fontWeight: 600,
        }}>Ver todas</button>
      </div>
      <div style={{ fontSize: 14, color: C.orange, marginTop: 6, marginBottom: 14, fontWeight: 600 }}>
        14 pendientes · $3.278.420
      </div>

      {[
        { t: 'Calm (colchón + almohadas)', sub: 'Cuota 1/12 · Vence 1 abr', monto: 67928, done: false },
        { t: 'Mesa Living',                sub: 'Cuota 1/3 · Vence 5 abr',   monto: 90637, done: false },
        { t: 'Edenor',                      sub: 'Vence 12 abr',               monto: 34200, done: true  },
      ].map((c, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 0',
          borderBottom: i < 2 ? `1px solid ${C.line}` : 'none',
        }}>
          <div style={{
            width: 22, height: 22, borderRadius: '50%',
            border: `2px solid ${c.done ? C.green : C.orange}`,
            background: c.done ? C.green : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>{c.done && <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 6l3 3 5-6" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.ink, textDecoration: c.done ? 'line-through' : 'none', opacity: c.done ? 0.5 : 1 }}>{c.t}</div>
            <div style={{ fontSize: 12, color: C.ink3, marginTop: 2 }}>{c.sub}</div>
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: C.ink, opacity: c.done ? 0.5 : 1 }}>{fmtARS(c.monto)}</div>
        </div>
      ))}
    </div>
  );
}

function HistoricoCard() {
  const months = [
    { m: 'Abr 26', v: 52716, neg: true },
    { m: 'Mar 26', v: 128400, neg: false },
    { m: 'Feb 26', v: 84200, neg: false },
    { m: 'Ene 26', v: 42000, neg: true },
    { m: 'Dic 25', v: 196300, neg: false },
    { m: 'Nov 25', v: 38400, neg: true },
  ];
  const max = Math.max(...months.map(m => m.v));
  return (
    <div style={{
      background: C.card, borderRadius: 20, padding: '20px 22px',
      border: `1px solid ${C.line}`,
    }}>
      <div style={{ fontSize: 11, letterSpacing: 1.4, color: C.ink3, fontWeight: 600, marginBottom: 18 }}>POR MES</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 140 }}>
        {months.map((m, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ fontSize: 10, color: C.ink3, fontWeight: 600 }}>{Math.round(m.v/1000)}k</div>
            <div style={{
              width: '100%',
              height: (m.v / max) * 100 + '%',
              background: m.neg ? C.red : C.green,
              opacity: 0.85,
              borderRadius: 4,
              minHeight: 4,
            }}/>
            <div style={{ fontSize: 10, color: C.ink3 }}>{m.m.split(' ')[0]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── PANTALLA: LISTA DE GASTOS ───────────────────────────────
function GastosList() {
  const [q, setQ] = React.useState('');
  const [catFilter, setCatFilter] = React.useState('todas');
  const [showFilters, setShowFilters] = React.useState(false);

  const filtered = GASTOS.filter(g =>
    (catFilter === 'todas' || g.cat === catFilter) &&
    (q === '' || g.title.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div style={{ height: '100%', overflow: 'auto', paddingBottom: 100 }}>
      <AppHeader/>
      <div style={{ padding: '22px 20px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div style={{ ...Serif, fontSize: 34, fontWeight: 500, color: C.ink, lineHeight: 1 }}>Gastos</div>
          <div style={{ fontSize: 13, color: C.ink3 }}>{filtered.length} resultados</div>
        </div>
      </div>

      {/* Buscador */}
      <div style={{ padding: '16px 20px 0' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: C.card, border: `1px solid ${C.line}`,
          borderRadius: 12, padding: '11px 14px',
        }}>
          {Icon.search()}
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar gastos..." style={{
            border: 'none', outline: 'none', background: 'transparent',
            flex: 1, fontSize: 14, color: C.ink, fontFamily: Sans.fontFamily,
          }}/>
          {q && <button onClick={() => setQ('')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}>{Icon.x()}</button>}
          <button onClick={() => setShowFilters(!showFilters)} style={{
            border: 'none', background: showFilters ? C.cardSoft : 'transparent',
            cursor: 'pointer', padding: '4px 8px', borderRadius: 6,
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 12, color: C.ink2, fontWeight: 600,
          }}>
            {Icon.filter()} Filtros
          </button>
        </div>
      </div>

      {/* Chips de categoría (filtro principal, más visual que 5 dropdowns) */}
      <div style={{
        display: 'flex', gap: 8, padding: '14px 20px 0',
        overflowX: 'auto', scrollbarWidth: 'none',
      }}>
        <FilterChip label="Todas" active={catFilter === 'todas'} onClick={() => setCatFilter('todas')}/>
        {CATEGORIES.filter(c => GASTOS.some(g => g.cat === c.id)).map(c => (
          <FilterChip key={c.id} label={c.label} emoji={c.emoji}
            active={catFilter === c.id} onClick={() => setCatFilter(c.id)}/>
        ))}
      </div>

      {/* Panel de filtros avanzados (colapsable) */}
      {showFilters && (
        <div style={{ padding: '14px 20px 0' }}>
          <div style={{
            background: C.card, borderRadius: 14, padding: '14px 16px',
            border: `1px solid ${C.line}`,
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
          }}>
            <FilterDropdown label="Estado" value="Activo"/>
            <FilterDropdown label="Moneda" value="Todas"/>
            <FilterDropdown label="Pagado por" value="Todos"/>
            <FilterDropdown label="Mes" value="Este mes"/>
          </div>
        </div>
      )}

      {/* Lista */}
      <div style={{ padding: '16px 20px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(g => <GastoRow key={g.id} g={g}/>)}
      </div>
    </div>
  );
}

function FilterChip({ label, emoji, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      flexShrink: 0,
      padding: '8px 14px', borderRadius: 20,
      background: active ? C.ink : C.card,
      color: active ? C.bg : C.ink2,
      border: `1px solid ${active ? C.ink : C.line}`,
      fontSize: 13, fontWeight: active ? 600 : 500,
      fontFamily: Sans.fontFamily,
      cursor: 'pointer',
      display: 'inline-flex', alignItems: 'center', gap: 6,
      transition: 'all 0.15s',
    }}>
      {emoji && <span style={{ fontSize: 13 }}>{emoji}</span>}
      {label}
    </button>
  );
}

function FilterDropdown({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 10, letterSpacing: 1.2, color: C.ink3, fontWeight: 600, marginBottom: 5 }}>{label.toUpperCase()}</div>
      <button style={{
        width: '100%', padding: '8px 12px',
        background: C.cardSoft, border: 'none', borderRadius: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: 13, color: C.ink, fontFamily: Sans.fontFamily, cursor: 'pointer',
      }}>
        <span>{value}</span>
        {Icon.caret()}
      </button>
    </div>
  );
}

function GastoRow({ g }) {
  const cat = CATEGORIES.find(c => c.id === g.cat);
  const progress = g.cuotaAct / g.cuotas;
  return (
    <div style={{
      background: C.card, borderRadius: 14, padding: '14px 16px',
      border: `1px solid ${C.line}`,
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
        background: cat.color + '22',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18,
      }}>{cat.emoji}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.title}</div>
        <div style={{ fontSize: 11, color: C.ink3, letterSpacing: 0.5, marginTop: 2, textTransform: 'uppercase', fontWeight: 500 }}>{cat.label}</div>
        {g.cuotas > 1 && (
          <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 3, borderRadius: 2, background: C.cardSoft, overflow: 'hidden' }}>
              <div style={{ width: progress * 100 + '%', height: '100%', background: cat.color }}/>
            </div>
            <div style={{ fontSize: 10, color: C.ink3, fontWeight: 600, flexShrink: 0 }}>{g.cuotaAct}/{g.cuotas}</div>
          </div>
        )}
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>{fmtARS(g.total)}</div>
        {g.cuotas > 1 && <div style={{ fontSize: 11, color: C.ink3, marginTop: 2 }}>{fmtARS(g.monto)}/mes</div>}
      </div>
    </div>
  );
}

// ── PANTALLA: NUEVO GASTO ───────────────────────────────────
function NuevoGasto({ onNav }) {
  const [desc, setDesc] = React.useState('');
  const [monto, setMonto] = React.useState('');
  const [moneda, setMoneda] = React.useState('ARS');
  const [cat, setCat] = React.useState(null);
  const [cuotas, setCuotas] = React.useState(1);
  const [split, setSplit] = React.useState('50/50');
  const [pago, setPago] = React.useState('efectivo');
  const [pagadoPor, setPagadoPor] = React.useState('gas');

  const valid = desc.trim() && monto && cat;

  return (
    <div style={{ height: '100%', overflow: 'auto', paddingBottom: 120, background: C.bg }}>
      {/* Header propio (más simple, sin logo gigante) */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '62px 20px 14px',
        borderBottom: `1px solid ${C.line}`,
        background: C.bg,
      }}>
        <button onClick={() => onNav('home')} style={{
          border: 'none', background: 'transparent', cursor: 'pointer',
          fontSize: 15, color: C.ink2, display: 'flex', alignItems: 'center', gap: 4,
          padding: 0,
        }}>
          {Icon.chevL()} Cancelar
        </button>
        <div style={{ ...Serif, fontSize: 17, color: C.ink, fontWeight: 600, whiteSpace: 'nowrap' }}>Nuevo gasto</div>
        <div style={{ width: 72 }}/>
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        {/* ── Hero: monto + moneda (lo más importante primero) ── */}
        <div style={{
          background: C.card, borderRadius: 20,
          border: `1px solid ${C.line}`,
          padding: '22px 22px 24px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 11, letterSpacing: 1.4, color: C.ink3, fontWeight: 600, marginBottom: 12 }}>MONTO</div>

          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 10 }}>
            {/* moneda pill */}
            <CurrencyPill value={moneda} onChange={setMoneda}/>
            <input
              value={monto}
              onChange={e => setMonto(e.target.value.replace(/[^\d.,]/g, ''))}
              placeholder="0"
              inputMode="decimal"
              style={{
                border: 'none', outline: 'none', background: 'transparent',
                ...Serif, fontSize: 44, fontWeight: 500, color: C.ink,
                width: 170, textAlign: 'left',
                caretColor: C.brown,
              }}
            />
          </div>

          {/* Descripción inline */}
          <input
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder="Descripción (ej. Netflix)"
            style={{
              marginTop: 14, width: '100%',
              border: 'none', outline: 'none',
              background: C.cardSoft, borderRadius: 10,
              padding: '11px 14px', textAlign: 'center',
              fontSize: 14, color: C.ink, fontFamily: Sans.fontFamily,
            }}
          />
        </div>

        {/* ── Sección: Categoría (chips visuales) ── */}
        <Section title="Categoría" required>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 8,
          }}>
            {CATEGORIES.map(c => {
              const on = cat === c.id;
              return (
                <button key={c.id} onClick={() => setCat(c.id)} style={{
                  padding: '12px 4px 10px',
                  background: on ? c.color + '20' : C.card,
                  border: `1.5px solid ${on ? c.color : C.line}`,
                  borderRadius: 12,
                  cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  transition: 'all 0.15s',
                }}>
                  <span style={{ fontSize: 20 }}>{c.emoji}</span>
                  <span style={{ fontSize: 10.5, color: on ? C.ink : C.ink2, fontWeight: on ? 600 : 500 }}>{c.label}</span>
                </button>
              );
            })}
          </div>
        </Section>

        {/* ── Sección: Cuotas ── */}
        <Section title="Cuotas">
          <div style={{ display: 'flex', gap: 8 }}>
            {[1, 3, 6, 12].map(n => (
              <button key={n} onClick={() => setCuotas(n)} style={{
                flex: 1, padding: '10px 0',
                background: cuotas === n ? C.ink : C.card,
                color: cuotas === n ? C.bg : C.ink2,
                border: `1px solid ${cuotas === n ? C.ink : C.line}`,
                borderRadius: 10,
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                fontFamily: Sans.fontFamily,
              }}>{n === 1 ? '1 pago' : `${n}×`}</button>
            ))}
          </div>
          {cuotas > 1 && monto && (
            <div style={{
              marginTop: 10, padding: '10px 14px',
              background: C.cardSoft, borderRadius: 10,
              fontSize: 13, color: C.ink2,
              display: 'flex', justifyContent: 'space-between',
            }}>
              <span>{cuotas} cuotas de</span>
              <span style={{ fontWeight: 600, color: C.ink }}>{fmtARS((parseFloat(monto.replace(',', '.')) || 0) / cuotas)}</span>
            </div>
          )}
        </Section>

        {/* ── Sección: Pago ── */}
        <Section title="Pago">
          <Row label="Pagado por">
            <InlineSelect
              value={pagadoPor}
              options={[
                { v: 'gas', label: 'Gaston' },
                { v: 'gua', label: 'Guadalupe' },
              ]}
              onChange={setPagadoPor}
            />
          </Row>
          <Row label="Método">
            <InlineSelect
              value={pago}
              options={[
                { v: 'efectivo', label: 'Efectivo' },
                { v: 'debito', label: 'Débito' },
                { v: 'credito', label: 'Crédito' },
                { v: 'transf', label: 'Transferencia' },
              ]}
              onChange={setPago}
            />
          </Row>
          <Row label="División" last>
            <InlineSelect
              value={split}
              options={[
                { v: '50/50', label: '50/50' },
                { v: '100/0', label: '100% Gaston' },
                { v: '0/100', label: '100% Guadalupe' },
                { v: 'custom', label: 'Personalizada' },
              ]}
              onChange={setSplit}
            />
          </Row>
        </Section>
      </div>

      {/* Barra de guardado sticky */}
      <div style={{
        position: 'absolute', bottom: 84, left: 0, right: 0,
        padding: '12px 20px',
        background: `linear-gradient(to bottom, transparent, ${C.bg} 40%)`,
        zIndex: 20,
      }}>
        <button
          disabled={!valid}
          onClick={() => { if (valid) onNav('home'); }}
          style={{
            width: '100%', padding: '15px 0',
            background: valid ? C.ink : C.ink3,
            color: C.bg,
            border: 'none', borderRadius: 14,
            fontSize: 15, fontWeight: 600,
            cursor: valid ? 'pointer' : 'not-allowed',
            fontFamily: Sans.fontFamily,
            boxShadow: valid ? '0 4px 12px rgba(42,31,23,0.25)' : 'none',
            transition: 'all 0.15s',
          }}
        >Guardar gasto</button>
      </div>
    </div>
  );
}

function Section({ title, required, children }) {
  return (
    <div style={{ marginTop: 20 }}>
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: 6,
        fontSize: 11, letterSpacing: 1.4, color: C.ink3, fontWeight: 600,
        padding: '0 6px 8px',
      }}>
        <span>{title.toUpperCase()}</span>
        {required && <span style={{ color: C.red }}>*</span>}
      </div>
      <div style={{
        background: C.card, borderRadius: 14,
        border: `1px solid ${C.line}`,
        padding: '12px 14px',
      }}>{children}</div>
    </div>
  );
}

function Row({ label, children, last }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 2px',
      borderBottom: last ? 'none' : `1px solid ${C.line}`,
    }}>
      <span style={{ fontSize: 14, color: C.ink2 }}>{label}</span>
      {children}
    </div>
  );
}

function InlineSelect({ value, options, onChange }) {
  const [open, setOpen] = React.useState(false);
  const cur = options.find(o => o.v === value);
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} style={{
        display: 'flex', alignItems: 'center', gap: 6,
        border: 'none', background: 'transparent', cursor: 'pointer',
        fontSize: 14, fontWeight: 600, color: C.ink, fontFamily: Sans.fontFamily,
        padding: '4px 0',
      }}>
        {cur?.label}
        {Icon.caret()}
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 10 }}/>
          <div style={{
            position: 'absolute', right: 0, top: '100%', marginTop: 4,
            background: C.card, borderRadius: 10,
            border: `1px solid ${C.line}`,
            boxShadow: '0 8px 24px rgba(42,31,23,0.12)',
            minWidth: 180, zIndex: 20,
            overflow: 'hidden',
          }}>
            {options.map(o => (
              <button key={o.v} onClick={() => { onChange(o.v); setOpen(false); }} style={{
                display: 'block', width: '100%', textAlign: 'left',
                border: 'none', background: o.v === value ? C.cardSoft : 'transparent',
                padding: '10px 14px', cursor: 'pointer',
                fontSize: 14, color: C.ink, fontFamily: Sans.fontFamily,
              }}>{o.label}</button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function CurrencyPill({ value, onChange }) {
  return (
    <div style={{
      display: 'inline-flex', background: C.cardSoft, borderRadius: 8,
      padding: 2,
    }}>
      {['ARS', 'USD'].map(m => (
        <button key={m} onClick={() => onChange(m)} style={{
          padding: '6px 12px', border: 'none',
          background: value === m ? C.card : 'transparent',
          color: value === m ? C.ink : C.ink3,
          borderRadius: 6, fontSize: 12, fontWeight: 600,
          cursor: 'pointer', fontFamily: Sans.fontFamily,
          boxShadow: value === m ? '0 1px 2px rgba(42,31,23,0.08)' : 'none',
        }}>{m}</button>
      ))}
    </div>
  );
}

// ── PANTALLA: AJUSTES (stub) ────────────────────────────────
function Ajustes() {
  return (
    <div style={{ padding: '62px 20px 120px', height: '100%', overflow: 'auto' }}>
      <div style={{ ...Serif, fontSize: 34, fontWeight: 500, padding: '14px 0 20px' }}>Ajustes</div>
      {['Cuenta', 'Categorías', 'Cotización USD', 'Exportar datos', 'Notificaciones'].map((t, i) => (
        <div key={i} style={{
          padding: '16px 18px', background: C.card, borderRadius: 14,
          border: `1px solid ${C.line}`, marginBottom: 10,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontSize: 15, color: C.ink,
        }}>
          {t} {Icon.chevR(C.ink3)}
        </div>
      ))}
    </div>
  );
}

// ── App principal ───────────────────────────────────────────
function App({ onScreenChange }) {
  const [screen, setScreen] = React.useState(() => localStorage.getItem('gastos.screen') || 'home');
  const onNav = (s) => {
    setScreen(s);
    localStorage.setItem('gastos.screen', s);
    if (onScreenChange) onScreenChange();
  };

  let content;
  if (screen === 'home') content = <Home onNav={onNav}/>;
  else if (screen === 'list') content = <GastosList/>;
  else if (screen === 'new') content = <NuevoGasto onNav={onNav}/>;
  else content = <Ajustes/>;

  return (
    <Phone>
      {content}
      <TabBar active={screen} onTab={onNav}/>
    </Phone>
  );
}

Object.assign(window, { App });
