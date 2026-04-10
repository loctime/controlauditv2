import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../../../firebaseControlFile';
import { useAuth } from '@/components/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, PointElement, LineElement, Filler,
} from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Filler);

// ─── Tema ──────────────────────────────────────────────────────────────────────
const T = {
  bg:       '#eef2f7',
  bgCard:   '#ffffff',
  border:   '#d1dbe8',
  blue:     '#1d4ed8',
  green:    '#15803d',
  amber:    '#b45309',
  red:      '#b91c1c',
  purple:   '#7c3aed',
  gray:     '#475569',
  text:     '#0f172a',
  textDim:  '#475569',
  shadow:   '0 2px 8px rgba(0,0,0,0.10)',
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

const extraerPreguntas = (secciones) => {
  const preguntas = [];
  if (!secciones || !Array.isArray(secciones)) return preguntas;
  secciones.forEach((sec, sIdx) => {
    if (sec.preguntas && Array.isArray(sec.preguntas)) {
      sec.preguntas.forEach((p, pIdx) => {
        const texto = typeof p === 'string' ? p : p?.texto || p?.text || `Pregunta ${pIdx + 1}`;
        preguntas.push({ id: `preg-${sIdx+1}-${pIdx+1}`, texto, seccion: sec.nombre || `Sección ${sIdx+1}`, seccionIndex: sIdx, preguntaIndex: pIdx });
      });
    }
  });
  return preguntas;
};

// Obtiene la respuesta de un reporte para una pregunta específica.
// Soporta dos formatos: array 2D (respuestas[seccion][pregunta]) y objeto con claves string.
const getRespuesta = (r, preg) => {
  if (!r.respuestas) return null;
  if (Array.isArray(r.respuestas)) {
    const v = r.respuestas[preg.seccionIndex]?.[preg.preguntaIndex];
    return typeof v === 'string' ? v.trim() : null;
  }
  // Fallback: objeto con claves string
  const altKeys = [
    preg.id,
    `preg-${preg.seccionIndex+1}-${preg.preguntaIndex+1}`,
    `pregunta_${preg.seccionIndex+1}_${preg.preguntaIndex+1}`,
    `seccion_${preg.seccionIndex}_pregunta_${preg.preguntaIndex}`,
    `${preg.seccionIndex+1}-${preg.preguntaIndex+1}`,
  ];
  for (const k of altKeys) { if (r.respuestas[k]) return r.respuestas[k].trim(); }
  return null;
};

const calcularAnalisis = (reportes, preguntas) => {
  let totalConformes = 0, totalNoConformes = 0, totalMejora = 0, totalNoAplica = 0;
  let totalPuntaje = 0, conteoPuntaje = 0;
  const empresaCounts = {};

  reportes.forEach((r) => {
    let conf = 0, noConf = 0, mejora = 0, noAplica = 0, puntajeR = 0;
    if (r.respuestas) {
      // Array 2D → aplanar
      const flat = Array.isArray(r.respuestas)
        ? r.respuestas.flat().filter(v => typeof v === 'string')
        : Object.values(r.respuestas).filter(v => typeof v === 'string');
      flat.forEach((v) => {
        const s = v.trim();
        if (s === 'Conforme') conf++;
        else if (s === 'No conforme') noConf++;
        else if (s === 'Necesita mejora') mejora++;
        else if (s === 'No aplica') noAplica++;
      });
      const tot = conf + noConf;
      if (tot > 0) puntajeR = Math.round((conf / tot) * 100);
    }
    totalConformes += r.respuestasConformes ?? conf;
    totalNoConformes += r.respuestasNoConformes ?? noConf;
    totalMejora += mejora;
    totalNoAplica += noAplica;
    if (r.puntaje != null) { totalPuntaje += r.puntaje; conteoPuntaje++; }
    else if (puntajeR > 0) { totalPuntaje += puntajeR; conteoPuntaje++; }
    const emp = getNombreEmpresa(r);
    empresaCounts[emp] = (empresaCounts[emp] || 0) + 1;
  });

  const analisisPorPregunta = preguntas.map((preg) => {
    const conteo = { Conforme: 0, 'No conforme': 0, 'Necesita mejora': 0, 'No aplica': 0, 'Sin responder': 0 };
    reportes.forEach((r) => {
      const resp = getRespuesta(r, preg);
      if (resp && conteo.hasOwnProperty(resp)) conteo[resp]++;
      else conteo['Sin responder']++;
    });
    const totalR = Object.values(conteo).reduce((s, v) => s + v, 0);
    return { ...preg, conteo, totalRespuestas: totalR, porcentajes: Object.fromEntries(Object.entries(conteo).map(([k, v]) => [k, totalR > 0 ? (v/totalR*100) : 0])) };
  });

  let acum = 0;
  const tendencia = reportes.map((r, i) => { acum += r.puntaje ?? 0; return parseFloat((acum/(i+1)).toFixed(1)); });

  return {
    totalAuditorias: reportes.length,
    puntajePromedio: conteoPuntaje > 0 ? (totalPuntaje/conteoPuntaje).toFixed(1) : 0,
    totalConformes, totalNoConformes, totalMejora, totalNoAplica,
    analisisPorPregunta,
    distribucion: { Conforme: totalConformes, 'No conforme': totalNoConformes, 'Necesita mejora': totalMejora, 'No aplica': totalNoAplica },
    empresaCounts, tendencia,
  };
};

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

  useEffect(() => {
    const tick = () => setReloj(new Date().toLocaleTimeString('es-AR', { hour:'2-digit', minute:'2-digit', second:'2-digit' }));
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!userProfile?.ownerId) return;
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'apps','auditoria','owners',userProfile.ownerId,'reportes'));
        const nombres = new Set();
        snap.forEach((doc) => { const n = getNombreFormulario(doc.data()); if (n) nombres.add(n); });
        setFormulariosDisponibles([...nombres].sort());
      } finally { setLoadingForms(false); }
    })();
  }, [userProfile?.ownerId]);

  useEffect(() => {
    if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
    if (!formularioSeleccionado || !userProfile?.ownerId) return;
    const col = collection(db, 'apps','auditoria','owners',userProfile.ownerId,'reportes');
    let active = true;
    const tryQ = (campo) => new Promise((res, rej) => {
      const q = query(col, where(campo, '==', formularioSeleccionado));
      const u = onSnapshot(q, (snap) => res({snap,u,campo}), (err) => { u(); rej(err); });
    });
    (async () => {
      let resultado = null;
      for (const campo of ['formularioNombre','nombreForm','formulario']) {
        try { resultado = await tryQ(campo); if (resultado.snap.size > 0) break; resultado.u(); resultado = null; } catch(_) {}
      }
      if (!active) return;
      if (!resultado) { resultado = await tryQ('formularioNombre').catch(()=>null); }
      if (!active || !resultado) return;
      resultado.u();
      const q = query(col, where(resultado.campo,'==',formularioSeleccionado));
      const unsub = onSnapshot(q, (snap) => {
        if (!active) return;
        const docs = []; let pregs = [];
        snap.forEach((d) => { const r={id:d.id,...d.data()}; docs.push(r); if (pregs.length===0 && r.secciones) pregs=extraerPreguntas(r.secciones); });
        setReportes(docs);
        if (docs.length > 0 && pregs.length > 0) setAnalisis(calcularAnalisis(docs, pregs));
        else setAnalisis(null);
      });
      unsubRef.current = unsub;
    })();
    return () => { active=false; if (unsubRef.current) { unsubRef.current(); unsubRef.current=null; } };
  }, [formularioSeleccionado, userProfile?.ownerId]);

  if (!formularioSeleccionado) {
    return <SelectorScreen formularios={formulariosDisponibles} loading={loadingForms} value={formularioTmp} onChange={setFormularioTmp} onStart={() => { if (formularioTmp) setFormularioSeleccionado(formularioTmp); }} onBack={() => navigate('/reporte')} />;
  }
  return <DashboardScreen formulario={formularioSeleccionado} analisis={analisis} reloj={reloj} onVolver={() => { setFormularioSeleccionado(null); setFormularioTmp(''); setReportes([]); setAnalisis(null); }} />;
}

// ─── Selector ─────────────────────────────────────────────────────────────────
function SelectorScreen({ formularios, loading, value, onChange, onStart, onBack }) {
  return (
    <>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}.fu{animation:fadeUp .4s ease both}`}</style>
      <div style={{ minHeight:'100vh', background:T.bg, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:T.fontSans, padding:32 }}>
        <div className="fu" style={{ textAlign:'center', maxWidth:460, width:'100%' }}>
          <div style={{ width:72, height:72, borderRadius:18, background:`linear-gradient(135deg,${T.blue},#6366f1)`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', boxShadow:`0 8px 32px ${T.blue}55` }}>
            <span style={{ color:'#fff', fontSize:26, fontWeight:700 }}>CA</span>
          </div>
          <h1 style={{ color:T.text, fontSize:26, fontWeight:700, margin:'0 0 6px' }}>ControlAudit</h1>
          <p style={{ color:T.textDim, fontSize:15, margin:'0 0 36px' }}>Seleccioná el formulario del congreso</p>
          <div style={{ marginBottom:20 }}>
            {loading ? <p style={{ color:T.textDim }}>Cargando formularios...</p> : (
              <select value={value} onChange={(e)=>onChange(e.target.value)} style={{ width:'100%', padding:'13px 16px', borderRadius:10, border:`1.5px solid ${T.border}`, background:T.bgCard, color:value?T.text:T.textDim, fontSize:15, fontFamily:T.fontSans, outline:'none', cursor:'pointer', boxShadow:T.shadow }}>
                <option value="">— Elegí un formulario —</option>
                {formularios.map((f)=><option key={f} value={f}>{f}</option>)}
              </select>
            )}
          </div>
          <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
            <button onClick={onBack} style={{ padding:'11px 22px', borderRadius:10, border:`1.5px solid ${T.border}`, background:'transparent', color:T.textDim, fontFamily:T.fontSans, fontSize:14, cursor:'pointer', fontWeight:500 }}>← Volver</button>
            <button onClick={onStart} disabled={!value} style={{ padding:'11px 28px', borderRadius:10, border:'none', background:value?`linear-gradient(135deg,${T.blue},#6366f1)`:T.border, color:value?'#fff':T.textDim, fontFamily:T.fontSans, fontSize:15, cursor:value?'pointer':'default', fontWeight:600, boxShadow:value?`0 4px 16px ${T.blue}55`:'none', transition:'all .2s' }}>Iniciar transmisión →</button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function DashboardScreen({ formulario, analisis, reloj, onVolver }) {
  const sin = !analisis || analisis.totalAuditorias === 0;

  return (
    <>
      <style>{`
        @keyframes livePulse{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(185,28,28,.5)}50%{opacity:.7;box-shadow:0 0 0 7px rgba(185,28,28,0)}}
        @keyframes fadeSlideIn{from{opacity:0;transform:translateX(30px)}to{opacity:1;transform:translateX(0)}}
        @keyframes progresoTiempo{from{width:0%}to{width:100%}}
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-thumb{background:${T.border};border-radius:3px}
      `}</style>
      <div style={{ minHeight:'100vh', background:T.bg, color:T.text, fontFamily:T.fontSans, padding:'16px 20px', display:'flex', flexDirection:'column', gap:14 }}>

        {/* HEADER */}
        <Header formulario={formulario} reloj={reloj} onVolver={onVolver} />

        {/* FILA SUPERIOR: 6 KPIs + Donut */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr) 280px', gap:12, alignItems:'stretch' }}>
          <KpiCard label="Auditorías"      value={sin?'—':analisis.totalAuditorias}  color={T.blue}   />
          <KpiCard label="Puntaje Prom."   value={sin?'—':`${analisis.puntajePromedio}%`} color="#0e7490" />
          <KpiCard label="Conformes"       value={sin?'—':analisis.totalConformes}    color={T.green}  />
          <KpiCard label="No Conformes"    value={sin?'—':analisis.totalNoConformes}  color={T.red}    />
          <KpiCard label="Nec. Mejora"     value={sin?'—':analisis.totalMejora}       color={T.amber}  />
          <KpiCard label="No Aplica"       value={sin?'—':analisis.totalNoAplica}     color={T.gray}   />
          <div style={{ background:T.bgCard, borderRadius:14, padding:'14px 18px', border:`1px solid ${T.border}`, boxShadow:T.shadow, borderTop:`3px solid #6366f1` }}>
            <div style={{ fontSize:10, fontWeight:700, color:T.textDim, textTransform:'uppercase', letterSpacing:1, marginBottom:10 }}>Distribución</div>
            {sin ? <Vacio small /> : <DonutChart distribucion={analisis.distribucion} />}
          </div>
        </div>

        {/* GRILLA DE PREGUNTAS */}
        <PanelCard title="Respuestas por pregunta">
          {sin ? <Vacio /> : <GridPreguntas analisisPorPregunta={analisis.analisisPorPregunta} />}
        </PanelCard>

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
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px', background:T.bgCard, borderRadius:14, border:`1px solid ${T.border}`, boxShadow:T.shadow, borderLeft:`4px solid ${T.blue}` }}>
      <div style={{ display:'flex', alignItems:'center', gap:14 }}>
        <div style={{ width:40, height:40, borderRadius:10, background:`linear-gradient(135deg,${T.blue},#6366f1)`, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:14, color:'#fff', flexShrink:0 }}>CA</div>
        <div>
          <div style={{ fontSize:10, color:T.textDim, fontWeight:700, letterSpacing:1.2, textTransform:'uppercase' }}>ControlAudit — Congreso en Vivo</div>
          <div style={{ fontSize:17, fontWeight:700, color:T.text, marginTop:1 }}>{formulario}</div>
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:18 }}>
        <div style={{ display:'flex', alignItems:'center', gap:7, background:'rgba(185,28,28,.08)', border:'1.5px solid rgba(185,28,28,.25)', borderRadius:20, padding:'5px 14px' }}>
          <div style={{ width:9, height:9, borderRadius:'50%', background:T.red, animation:'livePulse 1.5s infinite' }} />
          <span style={{ fontSize:12, fontWeight:700, color:T.red, letterSpacing:1.5 }}>EN VIVO</span>
        </div>
        <div style={{ fontFamily:T.fontMono, fontSize:20, fontWeight:700, color:T.text, letterSpacing:2 }}>{reloj}</div>
        <button onClick={onVolver} style={{ padding:'6px 14px', borderRadius:8, border:`1.5px solid ${T.border}`, background:'transparent', color:T.textDim, fontFamily:T.fontSans, fontSize:13, cursor:'pointer', fontWeight:500 }}>Cambiar</button>
      </div>
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, color }) {
  return (
    <div style={{ background:T.bgCard, borderRadius:14, padding:'14px 18px', border:`1px solid ${T.border}`, borderTop:`3px solid ${color}`, boxShadow:T.shadow }}>
      <div style={{ fontSize:10, color:T.textDim, fontWeight:700, textTransform:'uppercase', letterSpacing:.8, marginBottom:8 }}>{label}</div>
      <div style={{ fontFamily:T.fontMono, fontSize:34, fontWeight:700, color, lineHeight:1 }}>{value}</div>
    </div>
  );
}

// ─── Panel Card ───────────────────────────────────────────────────────────────
function PanelCard({ title, children, style }) {
  return (
    <div style={{ background:T.bgCard, borderRadius:14, padding:'16px 18px', border:`1px solid ${T.border}`, boxShadow:T.shadow, ...style }}>
      <div style={{ fontSize:10, fontWeight:700, color:T.textDim, textTransform:'uppercase', letterSpacing:1, marginBottom:14, paddingBottom:8, borderBottom:`1px solid ${T.border}` }}>{title}</div>
      {children}
    </div>
  );
}

// ─── Vacío ─────────────────────────────────────────────────────────────────────
function Vacio({ small }) {
  return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:small?40:70, color:T.textDim, fontSize:13 }}>Esperando...</div>;
}

// ─── Tipos de respuesta ───────────────────────────────────────────────────────
const TIPOS = [
  { key:'Conforme',        color:T.green,  label:'Conforme'      },
  { key:'No conforme',     color:T.red,    label:'No conforme'   },
  { key:'Necesita mejora', color:T.amber,  label:'Nec. mejora'   },
  { key:'No aplica',       color:T.gray,   label:'No aplica'     },
];

// ─── Grid de Preguntas ────────────────────────────────────────────────────────
function GridPreguntas({ analisisPorPregunta }) {
  const [paginaActual, setPaginaActual] = useState(0);
  const preguntasPorPagina = 6;
  const totalPaginas = Math.ceil(analisisPorPregunta.length / preguntasPorPagina);

  useEffect(() => {
    const interval = setInterval(() => {
      setPaginaActual(prev => (prev + 1) % totalPaginas);
    }, 8000);
    return () => clearInterval(interval);
  }, [totalPaginas]);

  const preguntasVisibles = analisisPorPregunta.slice(
    paginaActual * preguntasPorPagina,
    (paginaActual + 1) * preguntasPorPagina
  );

  const irPagina = (direccion) => {
    if (direccion === 'anterior') {
      setPaginaActual(prev => prev === 0 ? totalPaginas - 1 : prev - 1);
    } else {
      setPaginaActual(prev => (prev + 1) % totalPaginas);
    }
  };

  return (
    <div>
      {/* Navegación */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <button
          onClick={() => irPagina('anterior')}
          style={{
            padding:'6px 12px',
            borderRadius:6,
            border:`1px solid ${T.border}`,
            background:'transparent',
            color:T.textDim,
            fontSize:12,
            cursor:'pointer',
            fontWeight:500
          }}
        >
          ← Anterior
        </button>
        <span style={{ fontSize:13, color:T.textDim, fontWeight:600 }}>
          Página {paginaActual + 1} de {totalPaginas}
        </span>
        <button
          onClick={() => irPagina('siguiente')}
          style={{
            padding:'6px 12px',
            borderRadius:6,
            border:`1px solid ${T.border}`,
            background:'transparent',
            color:T.textDim,
            fontSize:12,
            cursor:'pointer',
            fontWeight:500
          }}
        >
          Siguiente →
        </button>
      </div>

      {/* Grilla de cards */}
      <div style={{
        display:'grid',
        gridTemplateColumns:'repeat(3, 1fr)',
        gridTemplateRows:'repeat(2, 1fr)',
        gap:14,
        minHeight:280
      }}>
        {preguntasVisibles.map((pregunta, idx) => (
          <PreguntaCard key={`${paginaActual}-${idx}`} pregunta={pregunta} />
        ))}
      </div>
    </div>
  );
}

// ─── Card de Pregunta Individual ───────────────────────────────────────────────────
function PreguntaCard({ pregunta }) {
  const { texto, conteo, totalRespuestas, seccion } = pregunta;
  
  // Determinar color predominante para el borde superior
  const tiposConCount = [
    { key:'Conforme', color:T.green },
    { key:'No conforme', color:T.red },
    { key:'Necesita mejora', color:T.amber },
    { key:'No aplica', color:T.gray }
  ];
  
  const predominante = tiposConCount.reduce((max, tipo) => {
    const count = conteo[tipo.key] || 0;
    const maxCount = conteo[max.key] || 0;
    return count > maxCount ? tipo : max;
  }, tiposConCount[0]);

  // Datos para el gráfico de torta
  const labels = ['Conforme','No conforme','Nec. mejora','No aplica'];
  const dataKeys = ['Conforme','No conforme','Necesita mejora','No aplica'];
  const data = dataKeys.map((l) => conteo[l] || 0);
  const colors = [T.green, T.red, T.amber, T.gray];

  const chartData = { labels, datasets:[{ data, backgroundColor:colors, borderColor:'#fff', borderWidth:2, hoverOffset:4 }] };
  const options = {
    responsive:true, maintainAspectRatio:false, cutout:'60%',
    plugins: { legend:{display:false}, tooltip:{enabled:false} },
  };

  return (
    <div style={{
      background:T.bgCard,
      borderRadius:14,
      padding:12,
      border:`1px solid ${T.border}`,
      boxShadow:T.shadow,
      borderTop:`3px solid ${predominante.color}`,
      display:'flex',
      flexDirection:'column',
      height:'100%'
    }}>
      {/* Sección */}
      <div style={{
        fontSize:10,
        color:T.blue,
        fontWeight:700,
        textTransform:'uppercase',
        letterSpacing:.8,
        marginBottom:6
      }}>
        {seccion}
      </div>

      {/* Texto de la pregunta */}
      <div style={{
        fontSize:13,
        fontWeight:600,
        color:T.text,
        lineHeight:1.3,
        marginBottom:12,
        display:'-webkit-box',
        WebkitLineClamp:2,
        WebkitBoxOrient:'vertical',
        overflow:'hidden'
      }}>
        {texto}
      </div>

      {/* Gráfico de torta */}
      <div style={{
        display:'flex',
        justifyContent:'center',
        alignItems:'center',
        marginBottom:8,
        flex:1
      }}>
        <div style={{ position:'relative', width:90, height:90 }}>
          <Doughnut data={chartData} options={options} />
        </div>
      </div>

      {/* Total de respuestas */}
      <div style={{
        fontSize:11,
        color:T.textDim,
        textAlign:'center',
        fontFamily:T.fontMono,
        fontWeight:600
      }}>
        {totalRespuestas} respuestas
      </div>
    </div>
  );
}

// ─── Donut ─────────────────────────────────────────────────────────────────────
function DonutChart({ distribucion }) {
  const labels = ['Conforme','No conforme','Nec. mejora','No aplica'];
  const dataKeys = ['Conforme','No conforme','Necesita mejora','No aplica'];
  const data = dataKeys.map((l) => distribucion[l] || 0);
  const total = data.reduce((a,b) => a+b, 0);
  const colors = [T.green, T.red, T.amber, T.gray];

  const chartData = { labels, datasets:[{ data, backgroundColor:colors, borderColor:'#fff', borderWidth:2, hoverOffset:4 }] };
  const options = {
    responsive:true, maintainAspectRatio:false, cutout:'68%',
    plugins: { legend:{display:false}, tooltip:{callbacks:{label:(ctx)=>` ${ctx.label}: ${ctx.raw}`}} },
  };

  return (
    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
      <div style={{ position:'relative', width:80, height:80, flexShrink:0 }}>
        <Doughnut data={chartData} options={options} />
        <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', fontFamily:T.fontMono, fontSize:15, fontWeight:700, color:T.text }}>{total}</div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
        {labels.map((l, i) => {
          const v = data[i];
          const pct = total > 0 ? ((v/total)*100).toFixed(0) : 0;
          return (
            <div key={l} style={{ display:'flex', alignItems:'center', gap:5 }}>
              <div style={{ width:8, height:8, borderRadius:2, background:colors[i], flexShrink:0 }} />
              <span style={{ fontSize:11, color:T.textDim, minWidth:80 }}>{l}</span>
              <span style={{ fontFamily:T.fontMono, fontSize:11, fontWeight:700, color:colors[i] }}>{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Tendencia ────────────────────────────────────────────────────────────────
function TendenciaLine({ tendencia }) {
  const chartData = {
    labels: tendencia.map((_,i) => `#${i+1}`),
    datasets:[{ label:'Puntaje promedio', data:tendencia, borderColor:T.blue, backgroundColor:`${T.blue}18`, borderWidth:2.5, pointBackgroundColor:T.blue, pointRadius:tendencia.length<=20?4:2, fill:true, tension:.4 }],
  };
  const options = {
    responsive:true, maintainAspectRatio:false,
    scales: {
      x: { ticks:{color:T.textDim,font:{size:11},maxTicksLimit:12}, grid:{color:'#eef2f7'}, border:{color:T.border} },
      y: { min:0, max:100, ticks:{color:T.textDim,font:{size:11},callback:(v)=>`${v}%`}, grid:{color:'#eef2f7'}, border:{color:T.border} },
    },
    plugins:{ legend:{display:false}, tooltip:{callbacks:{label:(ctx)=>` ${ctx.raw}%`}} },
  };
  return <div style={{ height:110 }}><Line data={chartData} options={options} /></div>;
}
