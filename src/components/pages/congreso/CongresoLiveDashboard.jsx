import React, { useState, useEffect, useRef, useCallback } from 'react';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../../../firebaseControlFile';
import { useAuth } from '@/components/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Filler);

// ─── Tema visual ───────────────────────────────────────────────────────────────
const T = {
  bg:      '#0a0f1a',
  bgCard:  'rgba(255,255,255,0.04)',
  border:  'rgba(255,255,255,0.08)',
  blue:    '#3b82f6',
  green:   '#22c55e',
  amber:   '#f59e0b',
  red:     '#ef4444',
  gray:    '#6b7280',
  text:    '#e2e8f0',
  textDim: '#94a3b8',
  fontSans: "'Space Grotesk', sans-serif",
  fontMono: "'JetBrains Mono', monospace",
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
const getNombreFormulario = (r) =>
  r.formularioNombre ||
  r.nombreForm ||
  (typeof r.formulario === 'object' ? r.formulario?.nombre : r.formulario) ||
  null;

const getNombreAuditor = (r) =>
  r.nombreInspector || r.auditorNombre || r.auditorEmail || 'Auditor';

const getNombreEmpresa = (r) =>
  r.empresaNombre ||
  (typeof r.empresa === 'object' ? r.empresa?.nombre : r.empresa) ||
  'Empresa';

const getIniciales = (nombre = '') =>
  nombre.split(' ').slice(0, 2).map(p => p[0] || '').join('').toUpperCase() || '?';

const formatHora = (ts) => {
  if (!ts) return '';
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
};

const colorScore = (s) => {
  if (s === null || s === undefined || s === '') return T.textDim;
  const n = parseFloat(s);
  if (n >= 80) return T.green;
  if (n >= 65) return T.amber;
  return T.red;
};

// ─── Extractor de preguntas (idéntico a ReportesPage) ─────────────────────────
const extraerPreguntas = (secciones) => {
  const preguntas = [];
  if (!secciones || !Array.isArray(secciones)) return preguntas;
  secciones.forEach((sec, sIdx) => {
    if (sec.preguntas && Array.isArray(sec.preguntas)) {
      sec.preguntas.forEach((p, pIdx) => {
        const texto = typeof p === 'string' ? p : p?.texto || p?.text || `Pregunta ${pIdx + 1}`;
        preguntas.push({
          id: `preg-${sIdx + 1}-${pIdx + 1}`,
          texto,
          seccion: sec.nombre || `Sección ${sIdx + 1}`,
          seccionIndex: sIdx,
          preguntaIndex: pIdx,
        });
      });
    }
  });
  return preguntas;
};

// ─── Cálculo de análisis ──────────────────────────────────────────────────────
const calcularAnalisis = (reportes, preguntas) => {
  let totalConformes = 0, totalNoConformes = 0, totalPuntaje = 0, conteoPuntaje = 0;
  let distConforme = 0, distMejora = 0, distNoConf = 0, distNoAplica = 0;
  const empresaCounts = {};

  reportes.forEach((r) => {
    let conf = 0, noConf = 0, puntajeR = 0;
    if (r.respuestas && Object.keys(r.respuestas).length > 0) {
      Object.values(r.respuestas).forEach((resp) => {
        if (typeof resp !== 'string') return;
        const v = resp.trim();
        if (v === 'Conforme') conf++;
        else if (v === 'No conforme') noConf++;
        else if (v === 'Necesita mejora') distMejora++;
        else if (v === 'No aplica') distNoAplica++;
      });
      const total = conf + noConf;
      if (total > 0) puntajeR = Math.round((conf / total) * 100);
    }
    totalConformes += r.respuestasConformes || conf;
    totalNoConformes += r.respuestasNoConformes || noConf;
    if (r.puntaje != null) { totalPuntaje += r.puntaje; conteoPuntaje++; }
    else if (puntajeR > 0) { totalPuntaje += puntajeR; conteoPuntaje++; }

    const empresa = getNombreEmpresa(r);
    empresaCounts[empresa] = (empresaCounts[empresa] || 0) + 1;
  });

  distConforme = totalConformes;
  distNoConf = totalNoConformes;

  // Análisis por pregunta
  const analisisPorPregunta = preguntas.map((preg) => {
    const conteo = { Conforme: 0, 'No conforme': 0, 'Necesita mejora': 0, 'No aplica': 0, 'Sin responder': 0 };
    reportes.forEach((r) => {
      if (!r.respuestas) { conteo['Sin responder']++; return; }
      const altKeys = [
        preg.id,
        `preg-${preg.seccionIndex + 1}-${preg.preguntaIndex + 1}`,
        `pregunta_${preg.seccionIndex + 1}_${preg.preguntaIndex + 1}`,
        `${preg.seccionIndex + 1}-${preg.preguntaIndex + 1}`,
      ];
      let found = null;
      for (const k of altKeys) { if (r.respuestas[k]) { found = r.respuestas[k]; break; } }
      if (found && typeof found === 'string' && conteo.hasOwnProperty(found.trim())) {
        conteo[found.trim()]++;
      } else {
        conteo['Sin responder']++;
      }
    });
    const totalR = Object.values(conteo).reduce((s, v) => s + v, 0);
    return {
      ...preg,
      conteo,
      totalRespuestas: totalR,
      porcentajes: Object.fromEntries(
        Object.entries(conteo).map(([k, v]) => [k, totalR > 0 ? (v / totalR * 100) : 0])
      ),
    };
  });

  // Tendencia de puntaje acumulado
  let acum = 0;
  const tendencia = reportes.map((r, i) => {
    const p = r.puntaje ?? 0;
    acum += p;
    return parseFloat((acum / (i + 1)).toFixed(1));
  });

  return {
    totalAuditorias: reportes.length,
    puntajePromedio: conteoPuntaje > 0 ? (totalPuntaje / conteoPuntaje).toFixed(1) : 0,
    totalConformes,
    totalNoConformes,
    analisisPorPregunta,
    distribucion: { Conforme: distConforme, 'Necesita mejora': distMejora, 'No conforme': distNoConf, 'No aplica': distNoAplica },
    empresaCounts,
    tendencia,
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
//  COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════
export default function CongresoLiveDashboard() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const unsubRef = useRef(null);

  const [formularioSeleccionado, setFormularioSeleccionado] = useState(null);
  const [formularioTmp, setFormularioTmp] = useState('');
  const [formulariosDisponibles, setFormulariosDisponibles] = useState([]);
  const [loadingForms, setLoadingForms] = useState(true);
  const [reportes, setReportes] = useState([]);
  const [analisis, setAnalisis] = useState(null);
  const [preguntas, setPreguntas] = useState([]);
  const [reloj, setReloj] = useState('');

  // ── Reloj ──
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setReloj(now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // ── Cargar lista de formularios disponibles ──
  useEffect(() => {
    if (!userProfile?.ownerId) return;
    const fetchForms = async () => {
      try {
        const col = collection(db, 'apps', 'auditoria', 'owners', userProfile.ownerId, 'reportes');
        const snap = await getDocs(col);
        const nombres = new Set();
        snap.forEach((doc) => {
          const n = getNombreFormulario(doc.data());
          if (n) nombres.add(n);
        });
        setFormulariosDisponibles([...nombres].sort());
      } catch (e) {
        console.error('Error cargando formularios:', e);
      } finally {
        setLoadingForms(false);
      }
    };
    fetchForms();
  }, [userProfile?.ownerId]);

  // ── Listener en tiempo real para el formulario seleccionado ──
  useEffect(() => {
    if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
    if (!formularioSeleccionado || !userProfile?.ownerId) return;

    const col = collection(db, 'apps', 'auditoria', 'owners', userProfile.ownerId, 'reportes');
    const campos = ['formularioNombre', 'nombreForm', 'formulario'];

    let active = true;

    const tryQuery = (campo) =>
      new Promise((resolve, reject) => {
        const q = query(col, where(campo, '==', formularioSeleccionado));
        const unsub = onSnapshot(q, (snap) => { resolve({ snap, unsub, campo }); }, (err) => { unsub(); reject(err); });
      });

    (async () => {
      let resultado = null;
      for (const campo of campos) {
        try {
          resultado = await tryQuery(campo);
          if (resultado.snap.size > 0) break;
          resultado.unsub();
          resultado = null;
        } catch (_) { /* probar siguiente */ }
      }

      if (!active) return;

      if (!resultado) {
        // Sin resultados con ningún campo — escuchar con el primero de todas formas
        resultado = await tryQuery('formularioNombre').catch(() => null);
        if (!active || !resultado) return;
      }

      resultado.unsub();

      const q = query(col, where(resultado.campo, '==', formularioSeleccionado));
      const unsub = onSnapshot(q, (snap) => {
        if (!active) return;
        const docs = [];
        let pregs = [];
        snap.forEach((d) => {
          const r = { id: d.id, ...d.data() };
          docs.push(r);
          if (pregs.length === 0 && r.secciones) pregs = extraerPreguntas(r.secciones);
        });
        setReportes(docs);
        setPreguntas(pregs);
        if (docs.length > 0 && pregs.length > 0) {
          setAnalisis(calcularAnalisis(docs, pregs));
        } else {
          setAnalisis(null);
        }
      });
      unsubRef.current = unsub;
    })();

    return () => {
      active = false;
      if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
    };
  }, [formularioSeleccionado, userProfile?.ownerId]);

  // ── Pantalla de selección ──
  if (!formularioSeleccionado) {
    return (
      <SelectorScreen
        formularios={formulariosDisponibles}
        loading={loadingForms}
        value={formularioTmp}
        onChange={setFormularioTmp}
        onStart={() => { if (formularioTmp) setFormularioSeleccionado(formularioTmp); }}
        onBack={() => navigate('/reporte')}
      />
    );
  }

  // ── Dashboard ──
  return (
    <DashboardScreen
      formulario={formularioSeleccionado}
      reportes={reportes}
      analisis={analisis}
      preguntas={preguntas}
      reloj={reloj}
      onVolver={() => { setFormularioSeleccionado(null); setFormularioTmp(''); setReportes([]); setAnalisis(null); }}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PANTALLA DE SELECCIÓN
// ═══════════════════════════════════════════════════════════════════════════════
function SelectorScreen({ formularios, loading, value, onChange, onStart, onBack }) {
  return (
    <>
      <style>{`
        @keyframes fadeInUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        .congreso-fadein { animation: fadeInUp 0.5s ease both; }
      `}</style>
      <div style={{
        minHeight: '100vh', background: T.bg, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', fontFamily: T.fontSans, padding: '32px',
      }}>
        <div className="congreso-fadein" style={{ textAlign: 'center', maxWidth: 480, width: '100%' }}>
          {/* Logo */}
          <div style={{
            width: 80, height: 80, borderRadius: 20, background: `linear-gradient(135deg, ${T.blue}, #6366f1)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px', boxShadow: `0 0 40px rgba(59,130,246,0.4)`,
          }}>
            <span style={{ color: '#fff', fontSize: 36, fontWeight: 700 }}>CA</span>
          </div>

          <h1 style={{ color: T.text, fontFamily: T.fontSans, fontSize: 28, fontWeight: 700, margin: '0 0 8px' }}>
            ControlAudit
          </h1>
          <p style={{ color: T.textDim, fontSize: 16, margin: '0 0 40px' }}>
            Seleccioná el formulario del congreso
          </p>

          {/* Select */}
          <div style={{ marginBottom: 24 }}>
            {loading ? (
              <p style={{ color: T.textDim }}>Cargando formularios...</p>
            ) : (
              <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                style={{
                  width: '100%', padding: '14px 16px', borderRadius: 10,
                  background: T.bgCard, border: `1px solid ${T.border}`,
                  color: value ? T.text : T.textDim, fontSize: 15,
                  fontFamily: T.fontSans, outline: 'none', cursor: 'pointer',
                  appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2394a3b8' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center',
                }}
              >
                <option value="" style={{ background: '#1e293b' }}>— Elegí un formulario —</option>
                {formularios.map((f) => (
                  <option key={f} value={f} style={{ background: '#1e293b' }}>{f}</option>
                ))}
              </select>
            )}
          </div>

          {/* Botones */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              onClick={onBack}
              style={{
                padding: '12px 24px', borderRadius: 10, border: `1px solid ${T.border}`,
                background: 'transparent', color: T.textDim, fontFamily: T.fontSans,
                fontSize: 14, cursor: 'pointer', fontWeight: 500,
              }}
            >
              ← Volver
            </button>
            <button
              onClick={onStart}
              disabled={!value}
              style={{
                padding: '12px 32px', borderRadius: 10, border: 'none',
                background: value ? `linear-gradient(135deg, ${T.blue}, #6366f1)` : T.bgCard,
                color: value ? '#fff' : T.textDim, fontFamily: T.fontSans,
                fontSize: 15, cursor: value ? 'pointer' : 'default',
                fontWeight: 600, boxShadow: value ? `0 4px 20px rgba(59,130,246,0.4)` : 'none',
                transition: 'all 0.2s',
              }}
            >
              Iniciar transmisión →
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  DASHBOARD COMPLETO
// ═══════════════════════════════════════════════════════════════════════════════
function DashboardScreen({ formulario, reportes, analisis, preguntas, reloj, onVolver }) {
  const sin = !analisis || analisis.totalAuditorias === 0;

  return (
    <>
      <style>{`
        @keyframes livePulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
          50% { opacity: 0.6; box-shadow: 0 0 0 6px rgba(239,68,68,0); }
        }
        @keyframes feedIn {
          from { opacity: 0; transform: translateX(16px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .feed-item { animation: feedIn 0.4s ease both; }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>

      <div style={{
        minHeight: '100vh', background: T.bg, color: T.text,
        fontFamily: T.fontSans, padding: '20px 24px', display: 'flex',
        flexDirection: 'column', gap: 18,
      }}>

        {/* ── HEADER ── */}
        <Header formulario={formulario} reloj={reloj} onVolver={onVolver} />

        {/* ── FILA KPIs ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          <KpiCard label="Auditorías" value={sin ? '—' : analisis.totalAuditorias} color={T.blue} />
          <KpiCard label="Puntaje Promedio" value={sin ? '—' : `${analisis.puntajePromedio}%`} color={T.green} />
          <KpiCard label="Conformes" value={sin ? '—' : analisis.totalConformes} color={T.amber} />
          <KpiCard label="No Conformes" value={sin ? '—' : analisis.totalNoConformes} color={T.red} />
        </div>

        {/* ── FILA MEDIA ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, flex: 1 }}>
          {/* Panel izquierdo — Barras por pregunta */}
          <PanelCard title="Análisis por pregunta">
            {sin ? (
              <Vacio />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', maxHeight: 280 }}>
                {analisis.analisisPorPregunta.map((p) => (
                  <BarraPregunta key={p.id} pregunta={p} />
                ))}
              </div>
            )}
          </PanelCard>

          {/* Panel derecho — Feed + Donut */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <PanelCard title="Últimas auditorías" style={{ flex: 1 }}>
              {sin ? (
                <Vacio />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {reportes.slice(-5).reverse().map((r) => (
                    <FeedItem key={r.id} reporte={r} />
                  ))}
                </div>
              )}
            </PanelCard>

            <PanelCard title="Distribución global" style={{ flex: 1 }}>
              {sin ? <Vacio /> : <DonutChart distribucion={analisis.distribucion} />}
            </PanelCard>
          </div>
        </div>

        {/* ── FILA INFERIOR ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          <PanelCard title="Auditorías por empresa">
            {sin ? <Vacio /> : <BarrasEmpresas empresaCounts={analisis.empresaCounts} />}
          </PanelCard>

          <PanelCard title="Tendencia de puntaje promedio">
            {sin ? <Vacio /> : <TendenciaLine tendencia={analisis.tendencia} />}
          </PanelCard>
        </div>

      </div>
    </>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────
function Header({ formulario, reloj, onVolver }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 20px', background: T.bgCard, borderRadius: 14,
      border: `1px solid ${T.border}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 10,
          background: `linear-gradient(135deg, ${T.blue}, #6366f1)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: 15, color: '#fff', flexShrink: 0,
        }}>CA</div>
        <div>
          <div style={{ fontSize: 13, color: T.textDim, fontWeight: 500, letterSpacing: 1, textTransform: 'uppercase' }}>
            ControlAudit — Congreso en Vivo
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginTop: 2 }}>
            {formulario}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        {/* Badge EN VIVO */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7,
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 20, padding: '5px 14px',
        }}>
          <div style={{
            width: 9, height: 9, borderRadius: '50%', background: T.red,
            animation: 'livePulse 1.5s infinite',
          }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: T.red, letterSpacing: 1.5 }}>EN VIVO</span>
        </div>

        {/* Reloj */}
        <div style={{ fontFamily: T.fontMono, fontSize: 22, fontWeight: 600, color: T.text, letterSpacing: 2 }}>
          {reloj}
        </div>

        {/* Botón volver */}
        <button
          onClick={onVolver}
          style={{
            padding: '7px 16px', borderRadius: 8, border: `1px solid ${T.border}`,
            background: 'transparent', color: T.textDim, fontFamily: T.fontSans,
            fontSize: 13, cursor: 'pointer', fontWeight: 500,
          }}
        >
          Cambiar
        </button>
      </div>
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, color }) {
  return (
    <div style={{
      background: T.bgCard, borderRadius: 14, padding: '18px 22px',
      border: `1px solid ${T.border}`, borderTop: `2px solid ${color}`,
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <span style={{ fontSize: 12, color: T.textDim, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.8 }}>
        {label}
      </span>
      <span style={{ fontFamily: T.fontMono, fontSize: 40, fontWeight: 600, color, lineHeight: 1 }}>
        {value}
      </span>
    </div>
  );
}

// ─── Panel Card genérico ──────────────────────────────────────────────────────
function PanelCard({ title, children, style }) {
  return (
    <div style={{
      background: T.bgCard, borderRadius: 14, padding: '18px 20px',
      border: `1px solid ${T.border}`, ...style,
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: T.textDim, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

// ─── Vacío ─────────────────────────────────────────────────────────────────────
function Vacio() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 80, color: T.textDim, fontSize: 14 }}>
      Esperando auditorías...
    </div>
  );
}

// ─── Barra segmentada por pregunta ────────────────────────────────────────────
function BarraPregunta({ pregunta }) {
  const { texto, porcentajes, conteo } = pregunta;
  const segmentos = [
    { key: 'Conforme',        color: T.green },
    { key: 'Necesita mejora', color: T.amber },
    { key: 'No conforme',     color: T.red   },
    { key: 'No aplica',       color: T.gray  },
  ];

  return (
    <div>
      <div style={{ fontSize: 12, color: T.textDim, marginBottom: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {texto}
      </div>
      <div style={{ display: 'flex', height: 20, borderRadius: 6, overflow: 'hidden', gap: 1 }}>
        {segmentos.map(({ key, color }) => {
          const pct = parseFloat(porcentajes[key]) || 0;
          if (pct === 0) return null;
          return (
            <div
              key={key}
              title={`${key}: ${conteo[key]} (${pct.toFixed(0)}%)`}
              style={{
                width: `${pct}%`, background: color, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 600, color: 'rgba(0,0,0,0.7)',
                transition: 'width 0.8s ease', overflow: 'hidden',
                minWidth: pct > 10 ? undefined : 0,
              }}
            >
              {pct > 10 ? `${pct.toFixed(0)}%` : ''}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Feed item ────────────────────────────────────────────────────────────────
function FeedItem({ reporte }) {
  const nombre = getNombreAuditor(reporte);
  const empresa = getNombreEmpresa(reporte);
  const score = reporte.puntaje;
  const hora = formatHora(reporte.fechaCreacion);

  return (
    <div className="feed-item" style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 12px', borderRadius: 10,
      background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}`,
    }}>
      {/* Avatar */}
      <div style={{
        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
        background: `linear-gradient(135deg, ${T.blue}66, #6366f166)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 700, color: T.text,
      }}>
        {getIniciales(nombre)}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {nombre}
        </div>
        <div style={{ fontSize: 11, color: T.textDim }}>{empresa} · {hora}</div>
      </div>

      {/* Score */}
      {score != null && (
        <div style={{
          fontFamily: T.fontMono, fontSize: 18, fontWeight: 600,
          color: colorScore(score), flexShrink: 0,
        }}>
          {score}%
        </div>
      )}
    </div>
  );
}

// ─── Donut Chart ──────────────────────────────────────────────────────────────
function DonutChart({ distribucion }) {
  const labels = ['Conforme', 'Necesita mejora', 'No conforme', 'No aplica'];
  const data = labels.map((l) => distribucion[l] || 0);
  const total = data.reduce((a, b) => a + b, 0);

  const chartData = {
    labels,
    datasets: [{
      data,
      backgroundColor: [T.green, T.amber, T.red, T.gray],
      borderColor: 'transparent',
      borderWidth: 0,
      hoverOffset: 4,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.label}: ${ctx.raw} (${total > 0 ? ((ctx.raw / total) * 100).toFixed(1) : 0}%)`,
        },
      },
    },
  };

  const colors = [T.green, T.amber, T.red, T.gray];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <div style={{ position: 'relative', width: 110, height: 110, flexShrink: 0 }}>
        <Doughnut data={chartData} options={options} />
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          fontFamily: T.fontMono, fontSize: 20, fontWeight: 600, color: T.text, textAlign: 'center',
        }}>{total}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {labels.map((l, i) => {
          const v = distribucion[l] || 0;
          const pct = total > 0 ? ((v / total) * 100).toFixed(1) : 0;
          return (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: colors[i], flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: T.textDim }}>{l}</span>
              <span style={{ fontFamily: T.fontMono, fontSize: 12, color: T.text, marginLeft: 'auto', paddingLeft: 12 }}>{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Barras por empresa ───────────────────────────────────────────────────────
function BarrasEmpresas({ empresaCounts }) {
  const entries = Object.entries(empresaCounts).sort((a, b) => b[1] - a[1]);
  const max = entries[0]?.[1] || 1;
  const palette = [T.blue, '#6366f1', '#8b5cf6', '#ec4899', T.amber, T.green];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {entries.map(([empresa, count], i) => (
        <div key={empresa}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
            <span style={{ color: T.textDim, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80%' }}>{empresa}</span>
            <span style={{ fontFamily: T.fontMono, color: palette[i % palette.length], fontWeight: 600 }}>{count}</span>
          </div>
          <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 4,
              width: `${(count / max) * 100}%`,
              background: palette[i % palette.length],
              transition: 'width 0.8s ease',
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Línea de tendencia ───────────────────────────────────────────────────────
function TendenciaLine({ tendencia }) {
  const labels = tendencia.map((_, i) => `#${i + 1}`);

  const chartData = {
    labels,
    datasets: [{
      label: 'Puntaje promedio',
      data: tendencia,
      borderColor: T.blue,
      backgroundColor: `${T.blue}22`,
      borderWidth: 2,
      pointBackgroundColor: T.blue,
      pointRadius: tendencia.length <= 20 ? 4 : 2,
      fill: true,
      tension: 0.4,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: { color: T.textDim, font: { size: 10 }, maxTicksLimit: 10 },
        grid: { color: 'rgba(255,255,255,0.04)' },
        border: { color: T.border },
      },
      y: {
        min: 0, max: 100,
        ticks: { color: T.textDim, font: { size: 10 }, callback: (v) => `${v}%` },
        grid: { color: 'rgba(255,255,255,0.04)' },
        border: { color: T.border },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: { label: (ctx) => ` ${ctx.raw}%` },
      },
    },
  };

  return (
    <div style={{ height: 120 }}>
      <Line data={chartData} options={options} />
    </div>
  );
}
