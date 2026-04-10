import React, { useState, useEffect, useRef } from 'react';
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

// ─── Tema claro ────────────────────────────────────────────────────────────────
const T = {
  bg:       '#f1f5f9',
  bgCard:   '#ffffff',
  border:   '#e2e8f0',
  blue:     '#2563eb',
  green:    '#16a34a',
  amber:    '#d97706',
  red:      '#dc2626',
  gray:     '#94a3b8',
  text:     '#0f172a',
  textDim:  '#64748b',
  shadow:   '0 1px 4px rgba(0,0,0,0.08)',
  fontSans: "'Space Grotesk', sans-serif",
  fontMono: "'JetBrains Mono', monospace",
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
const getNombreFormulario = (r) =>
  r.formularioNombre ||
  r.nombreForm ||
  (typeof r.formulario === 'object' ? r.formulario?.nombre : r.formulario) ||
  null;

const getNombreEmpresa = (r) =>
  r.empresaNombre ||
  (typeof r.empresa === 'object' ? r.empresa?.nombre : r.empresa) ||
  'Empresa';

// ─── Extractor de preguntas ────────────────────────────────────────────────────
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
  const empresaCounts = {};

  reportes.forEach((r) => {
    let conf = 0, noConf = 0, puntajeR = 0;
    if (r.respuestas && Object.keys(r.respuestas).length > 0) {
      Object.values(r.respuestas).forEach((resp) => {
        if (typeof resp !== 'string') return;
        const v = resp.trim();
        if (v === 'Conforme') conf++;
        else if (v === 'No conforme') noConf++;
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

  // Distribución global
  const distribucion = {
    Conforme: totalConformes,
    'No conforme': totalNoConformes,
    'Necesita mejora': analisisPorPregunta.reduce((s, p) => s + p.conteo['Necesita mejora'], 0),
    'No aplica': analisisPorPregunta.reduce((s, p) => s + p.conteo['No aplica'], 0),
  };

  // Tendencia
  let acum = 0;
  const tendencia = reportes.map((r, i) => {
    acum += r.puntaje ?? 0;
    return parseFloat((acum / (i + 1)).toFixed(1));
  });

  return {
    totalAuditorias: reportes.length,
    puntajePromedio: conteoPuntaje > 0 ? (totalPuntaje / conteoPuntaje).toFixed(1) : 0,
    totalConformes,
    totalNoConformes,
    analisisPorPregunta,
    distribucion,
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
  const [reloj, setReloj] = useState('');

  // Reloj
  useEffect(() => {
    const tick = () => setReloj(new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Cargar lista de formularios
  useEffect(() => {
    if (!userProfile?.ownerId) return;
    (async () => {
      try {
        const col = collection(db, 'apps', 'auditoria', 'owners', userProfile.ownerId, 'reportes');
        const snap = await getDocs(col);
        const nombres = new Set();
        snap.forEach((doc) => { const n = getNombreFormulario(doc.data()); if (n) nombres.add(n); });
        setFormulariosDisponibles([...nombres].sort());
      } finally {
        setLoadingForms(false);
      }
    })();
  }, [userProfile?.ownerId]);

  // Listener tiempo real
  useEffect(() => {
    if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
    if (!formularioSeleccionado || !userProfile?.ownerId) return;

    const col = collection(db, 'apps', 'auditoria', 'owners', userProfile.ownerId, 'reportes');
    const campos = ['formularioNombre', 'nombreForm', 'formulario'];
    let active = true;

    const tryQuery = (campo) => new Promise((resolve, reject) => {
      const q = query(col, where(campo, '==', formularioSeleccionado));
      const unsub = onSnapshot(q, (snap) => resolve({ snap, unsub, campo }), (err) => { unsub(); reject(err); });
    });

    (async () => {
      let resultado = null;
      for (const campo of campos) {
        try {
          resultado = await tryQuery(campo);
          if (resultado.snap.size > 0) break;
          resultado.unsub(); resultado = null;
        } catch (_) { /* probar siguiente */ }
      }
      if (!active) return;
      if (!resultado) { resultado = await tryQuery('formularioNombre').catch(() => null); }
      if (!active || !resultado) return;
      resultado.unsub();

      const q = query(col, where(resultado.campo, '==', formularioSeleccionado));
      const unsub = onSnapshot(q, (snap) => {
        if (!active) return;
        const docs = []; let pregs = [];
        snap.forEach((d) => {
          const r = { id: d.id, ...d.data() };
          docs.push(r);
          if (pregs.length === 0 && r.secciones) pregs = extraerPreguntas(r.secciones);
        });
        setReportes(docs);
        if (docs.length > 0 && pregs.length > 0) setAnalisis(calcularAnalisis(docs, pregs));
        else setAnalisis(null);
      });
      unsubRef.current = unsub;
    })();

    return () => { active = false; if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; } };
  }, [formularioSeleccionado, userProfile?.ownerId]);

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

  return (
    <DashboardScreen
      formulario={formularioSeleccionado}
      analisis={analisis}
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
      <style>{`@keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} } .fu{animation:fadeUp .4s ease both}`}</style>
      <div style={{ minHeight:'100vh', background:T.bg, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:T.fontSans, padding:32 }}>
        <div className="fu" style={{ textAlign:'center', maxWidth:460, width:'100%' }}>
          <div style={{ width:72, height:72, borderRadius:18, background:`linear-gradient(135deg,${T.blue},#6366f1)`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', boxShadow:`0 8px 32px ${T.blue}44` }}>
            <span style={{ color:'#fff', fontSize:26, fontWeight:700 }}>CA</span>
          </div>
          <h1 style={{ color:T.text, fontFamily:T.fontSans, fontSize:26, fontWeight:700, margin:'0 0 6px' }}>ControlAudit</h1>
          <p style={{ color:T.textDim, fontSize:15, margin:'0 0 36px' }}>Seleccioná el formulario del congreso</p>

          <div style={{ marginBottom:20 }}>
            {loading ? (
              <p style={{ color:T.textDim }}>Cargando formularios...</p>
            ) : (
              <select value={value} onChange={(e) => onChange(e.target.value)} style={{
                width:'100%', padding:'13px 16px', borderRadius:10, border:`1.5px solid ${T.border}`,
                background:T.bgCard, color:value ? T.text : T.textDim, fontSize:15,
                fontFamily:T.fontSans, outline:'none', cursor:'pointer', boxShadow:T.shadow,
              }}>
                <option value="">— Elegí un formulario —</option>
                {formularios.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            )}
          </div>

          <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
            <button onClick={onBack} style={{ padding:'11px 22px', borderRadius:10, border:`1.5px solid ${T.border}`, background:'transparent', color:T.textDim, fontFamily:T.fontSans, fontSize:14, cursor:'pointer', fontWeight:500 }}>
              ← Volver
            </button>
            <button onClick={onStart} disabled={!value} style={{ padding:'11px 28px', borderRadius:10, border:'none', background:value?`linear-gradient(135deg,${T.blue},#6366f1)`:T.border, color:value?'#fff':T.textDim, fontFamily:T.fontSans, fontSize:15, cursor:value?'pointer':'default', fontWeight:600, boxShadow:value?`0 4px 16px ${T.blue}44`:'none', transition:'all .2s' }}>
              Iniciar transmisión →
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
function DashboardScreen({ formulario, analisis, reloj, onVolver }) {
  const sin = !analisis || analisis.totalAuditorias === 0;
  return (
    <>
      <style>{`
        @keyframes livePulse { 0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(220,38,38,.4)} 50%{opacity:.6;box-shadow:0 0 0 6px rgba(220,38,38,0)} }
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:${T.border};border-radius:2px}
      `}</style>
      <div style={{ minHeight:'100vh', background:T.bg, color:T.text, fontFamily:T.fontSans, padding:'18px 22px', display:'flex', flexDirection:'column', gap:16 }}>

        {/* HEADER */}
        <Header formulario={formulario} reloj={reloj} onVolver={onVolver} />

        {/* KPIs */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
          <KpiCard label="Auditorías" value={sin?'—':analisis.totalAuditorias} color={T.blue} />
          <KpiCard label="Puntaje Promedio" value={sin?'—':`${analisis.puntajePromedio}%`} color={T.green} />
          <KpiCard label="Conformes" value={sin?'—':analisis.totalConformes} color={T.amber} />
          <KpiCard label="No Conformes" value={sin?'—':analisis.totalNoConformes} color={T.red} />
        </div>

        {/* FILA MEDIA: Preguntas (ancho) + columna lateral */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:16, flex:1 }}>

          {/* Preguntas */}
          <PanelCard title="Respuestas por pregunta">
            {sin ? <Vacio /> : (
              <div style={{ display:'flex', flexDirection:'column', gap:20, overflowY:'auto', maxHeight:440, paddingRight:4 }}>
                {analisis.analisisPorPregunta.map((p) => <PreguntaChart key={p.id} pregunta={p} />)}
              </div>
            )}
          </PanelCard>

          {/* Columna lateral */}
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <PanelCard title="Distribución global">
              {sin ? <Vacio /> : <DonutChart distribucion={analisis.distribucion} />}
            </PanelCard>
            <PanelCard title="Por empresa">
              {sin ? <Vacio /> : <BarrasEmpresas empresaCounts={analisis.empresaCounts} />}
            </PanelCard>
          </div>
        </div>

        {/* TENDENCIA */}
        <PanelCard title="Tendencia de puntaje promedio">
          {sin ? <Vacio /> : <TendenciaLine tendencia={analisis.tendencia} />}
        </PanelCard>

      </div>
    </>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────
function Header({ formulario, reloj, onVolver }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', background:T.bgCard, borderRadius:14, border:`1px solid ${T.border}`, boxShadow:T.shadow }}>
      <div style={{ display:'flex', alignItems:'center', gap:14 }}>
        <div style={{ width:42, height:42, borderRadius:10, background:`linear-gradient(135deg,${T.blue},#6366f1)`, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:14, color:'#fff', flexShrink:0 }}>CA</div>
        <div>
          <div style={{ fontSize:11, color:T.textDim, fontWeight:600, letterSpacing:1, textTransform:'uppercase' }}>ControlAudit — Congreso en Vivo</div>
          <div style={{ fontSize:16, fontWeight:700, color:T.text, marginTop:2 }}>{formulario}</div>
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:18 }}>
        <div style={{ display:'flex', alignItems:'center', gap:7, background:'rgba(220,38,38,.07)', border:'1px solid rgba(220,38,38,.2)', borderRadius:20, padding:'5px 14px' }}>
          <div style={{ width:9, height:9, borderRadius:'50%', background:T.red, animation:'livePulse 1.5s infinite' }} />
          <span style={{ fontSize:12, fontWeight:700, color:T.red, letterSpacing:1.5 }}>EN VIVO</span>
        </div>
        <div style={{ fontFamily:T.fontMono, fontSize:20, fontWeight:600, color:T.text, letterSpacing:2 }}>{reloj}</div>
        <button onClick={onVolver} style={{ padding:'7px 16px', borderRadius:8, border:`1.5px solid ${T.border}`, background:'transparent', color:T.textDim, fontFamily:T.fontSans, fontSize:13, cursor:'pointer', fontWeight:500 }}>
          Cambiar
        </button>
      </div>
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, color }) {
  return (
    <div style={{ background:T.bgCard, borderRadius:14, padding:'18px 22px', border:`1px solid ${T.border}`, borderTop:`3px solid ${color}`, boxShadow:T.shadow }}>
      <div style={{ fontSize:11, color:T.textDim, fontWeight:600, textTransform:'uppercase', letterSpacing:.8, marginBottom:8 }}>{label}</div>
      <div style={{ fontFamily:T.fontMono, fontSize:40, fontWeight:700, color, lineHeight:1 }}>{value}</div>
    </div>
  );
}

// ─── Panel Card ───────────────────────────────────────────────────────────────
function PanelCard({ title, children, style }) {
  return (
    <div style={{ background:T.bgCard, borderRadius:14, padding:'18px 20px', border:`1px solid ${T.border}`, boxShadow:T.shadow, ...style }}>
      <div style={{ fontSize:11, fontWeight:700, color:T.textDim, textTransform:'uppercase', letterSpacing:1, marginBottom:16 }}>{title}</div>
      {children}
    </div>
  );
}

// ─── Vacío ─────────────────────────────────────────────────────────────────────
function Vacio() {
  return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:80, color:T.textDim, fontSize:14 }}>Esperando auditorías...</div>;
}

// ─── Gráfico por pregunta (barras horizontales con conteos) ───────────────────
const TIPOS = [
  { key: 'Conforme',         color: T.green,  label: 'Conforme'  },
  { key: 'No conforme',      color: T.red,    label: 'No conforme' },
  { key: 'Necesita mejora',  color: T.amber,  label: 'Necesita mejora' },
  { key: 'No aplica',        color: T.gray,   label: 'No aplica' },
];

function PreguntaChart({ pregunta }) {
  const { texto, conteo, totalRespuestas, seccion } = pregunta;
  const max = Math.max(...TIPOS.map(t => conteo[t.key] || 0), 1);

  return (
    <div style={{ borderBottom:`1px solid ${T.border}`, paddingBottom:16 }}>
      {/* Sección + texto */}
      <div style={{ fontSize:11, color:T.blue, fontWeight:600, textTransform:'uppercase', letterSpacing:.6, marginBottom:4 }}>{seccion}</div>
      <div style={{ fontSize:15, fontWeight:600, color:T.text, marginBottom:12, lineHeight:1.4 }}>{texto}</div>

      {/* Barras con conteos */}
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {TIPOS.map(({ key, color, label }) => {
          const val = conteo[key] || 0;
          const pct = totalRespuestas > 0 ? (val / totalRespuestas * 100) : 0;
          const barWidth = max > 0 ? (val / max * 100) : 0;
          return (
            <div key={key} style={{ display:'grid', gridTemplateColumns:'130px 1fr 48px', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:13, color:T.textDim, fontWeight:500, textAlign:'right', whiteSpace:'nowrap' }}>{label}</span>
              <div style={{ height:22, background:'#f1f5f9', borderRadius:6, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${barWidth}%`, background:color, borderRadius:6, transition:'width .8s ease', display:'flex', alignItems:'center', justifyContent:'flex-end', paddingRight:6 }}>
                  {barWidth > 20 && <span style={{ fontSize:11, fontWeight:700, color:'#fff' }}>{pct.toFixed(0)}%</span>}
                </div>
              </div>
              <span style={{ fontFamily:T.fontMono, fontSize:16, fontWeight:700, color, textAlign:'left' }}>{val}</span>
            </div>
          );
        })}
      </div>
      {/* Total */}
      <div style={{ marginTop:8, fontSize:12, color:T.textDim }}>
        Total de respuestas: <strong style={{ color:T.text }}>{totalRespuestas}</strong>
      </div>
    </div>
  );
}

// ─── Donut ─────────────────────────────────────────────────────────────────────
function DonutChart({ distribucion }) {
  const labels = ['Conforme', 'Necesita mejora', 'No conforme', 'No aplica'];
  const data = labels.map((l) => distribucion[l] || 0);
  const total = data.reduce((a, b) => a + b, 0);
  const colors = [T.green, T.amber, T.red, T.gray];

  const chartData = {
    labels,
    datasets: [{ data, backgroundColor: colors, borderColor: '#fff', borderWidth: 2, hoverOffset: 4 }],
  };
  const options = {
    responsive: true, maintainAspectRatio: false, cutout: '70%',
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.raw} (${total > 0 ? ((ctx.raw/total)*100).toFixed(1) : 0}%)` } },
    },
  };

  return (
    <div style={{ display:'flex', alignItems:'center', gap:16 }}>
      <div style={{ position:'relative', width:100, height:100, flexShrink:0 }}>
        <Doughnut data={chartData} options={options} />
        <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', fontFamily:T.fontMono, fontSize:18, fontWeight:700, color:T.text, textAlign:'center' }}>{total}</div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
        {labels.map((l, i) => {
          const v = distribucion[l] || 0;
          const pct = total > 0 ? ((v/total)*100).toFixed(0) : 0;
          return (
            <div key={l} style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ width:10, height:10, borderRadius:2, background:colors[i], flexShrink:0 }} />
              <span style={{ fontSize:12, color:T.textDim }}>{l}</span>
              <span style={{ fontFamily:T.fontMono, fontSize:12, fontWeight:700, color:colors[i], marginLeft:'auto', paddingLeft:8 }}>{pct}%</span>
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
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      {entries.map(([empresa, count], i) => (
        <div key={empresa}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4 }}>
            <span style={{ color:T.textDim, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'80%' }}>{empresa}</span>
            <span style={{ fontFamily:T.fontMono, color:palette[i%palette.length], fontWeight:700 }}>{count}</span>
          </div>
          <div style={{ height:8, background:'#f1f5f9', borderRadius:4, overflow:'hidden' }}>
            <div style={{ height:'100%', borderRadius:4, width:`${(count/max)*100}%`, background:palette[i%palette.length], transition:'width .8s ease' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Tendencia ────────────────────────────────────────────────────────────────
function TendenciaLine({ tendencia }) {
  const chartData = {
    labels: tendencia.map((_, i) => `#${i + 1}`),
    datasets: [{
      label: 'Puntaje promedio',
      data: tendencia,
      borderColor: T.blue,
      backgroundColor: `${T.blue}18`,
      borderWidth: 2,
      pointBackgroundColor: T.blue,
      pointRadius: tendencia.length <= 20 ? 4 : 2,
      fill: true,
      tension: 0.4,
    }],
  };
  const options = {
    responsive: true, maintainAspectRatio: false,
    scales: {
      x: { ticks: { color:T.textDim, font:{size:10}, maxTicksLimit:12 }, grid: { color:'#f1f5f9' }, border: { color:T.border } },
      y: { min:0, max:100, ticks: { color:T.textDim, font:{size:10}, callback:(v)=>`${v}%` }, grid: { color:'#f1f5f9' }, border: { color:T.border } },
    },
    plugins: { legend: { display:false }, tooltip: { callbacks: { label:(ctx)=>` ${ctx.raw}%` } } },
  };
  return <div style={{ height:110 }}><Line data={chartData} options={options} /></div>;
}
