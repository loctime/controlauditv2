import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../../../firebaseControlFile';
import { useAuth } from '@/components/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, PointElement, LineElement, Filler,
} from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';
import { CONGRESO_CONFIG } from '../../../config/congreso';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Filler);

// ─── Tema Dark / Stand ─────────────────────────────────────────────────────────
const T = {
  bg:       '#0f172a', // Fondo principal oscuro
  bgCard:   '#1e293b', // Fondo de tarjetas
  border:   '#334155',
  blue:     '#3b82f6', // Azul brillante
  green:    '#10b981', // Esmeralda
  amber:    '#f59e0b',
  red:      '#ef4444',
  purple:   '#8b5cf6',
  gray:     '#94a3b8',
  text:     '#f8fafc', // Texto blanco
  textDim:  '#cbd5e1',
  shadow:   '0 10px 25px rgba(0,0,0,0.5)',
  fontSans: "'Space Grotesk', sans-serif",
  fontMono: "'JetBrains Mono', monospace",
};

// ─── Helpers de Procesamiento ─────────────────────────────────────────────────
// (Mantenemos los tuyos originales y agregamos lógica para los nuevos campos)
const getNombreFormulario = (r) => r.formularioNombre || r.nombreForm || (typeof r.formulario === 'object' ? r.formulario?.nombre : r.formulario) || null;
const getNombreEmpresa = (r) => r.empresaNombre || (typeof r.empresa === 'object' ? r.empresa?.nombre : r.empresa) || 'Empresa';

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

const normalizeRespuestas = (respuestas) => {
  if (!respuestas) return null;
  if (Array.isArray(respuestas) && respuestas.length > 0 && typeof respuestas[0] === 'object' && Array.isArray(respuestas[0].valores)) {
    return respuestas.map((s) => s?.valores || []);
  }
  return respuestas;
};

const getRespuesta = (r, preg) => {
  const respuestas = normalizeRespuestas(r.respuestas);
  if (!respuestas) return null;
  if (Array.isArray(respuestas)) {
    const v = respuestas[preg.seccionIndex]?.[preg.preguntaIndex];
    return typeof v === 'string' ? v.trim() : null;
  }
  return null;
};

const calcularAnalisis = (reportes, preguntas) => {
  let totalConformes = 0, totalNoConformes = 0, totalMejora = 0, totalNoAplica = 0;
  let totalPuntaje = 0, conteoPuntaje = 0;
  
  // Nuevas métricas
  let actitudPositiva = 0, condicionPositiva = 0, totalClasificaciones = 0;
  let todasLasImagenes = [];
  let todasLasAcciones = [];

  reportes.forEach((r) => {
    let conf = 0, noConf = 0, mejora = 0, noAplica = 0, puntajeR = 0;
    const respuestasNorm = normalizeRespuestas(r.respuestas);
    
    if (respuestasNorm) {
      const flat = Array.isArray(respuestasNorm) ? respuestasNorm.flat().filter(v => typeof v === 'string') : Object.values(respuestasNorm).filter(v => typeof v === 'string');
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

    // Procesar Clasificaciones (Actitud / Condición)
    if (r.clasificaciones && Array.isArray(r.clasificaciones)) {
        r.clasificaciones.flat().forEach(c => {
            if (c) {
                if (c.actitud) actitudPositiva++;
                if (c.condicion) condicionPositiva++;
                totalClasificaciones++;
            }
        });
    }

    // Procesar Imágenes
    if (r.imagenes && Array.isArray(r.imagenes)) {
        r.imagenes.flat().flat().forEach(img => {
            if (img) todasLasImagenes.push(img);
        });
    }

    // Procesar Acciones Requeridas
    if (r.accionesRequeridas && Array.isArray(r.accionesRequeridas)) {
        r.accionesRequeridas.flat().forEach(acc => {
            if (acc && acc.trim() !== '') todasLasAcciones.push(acc);
        });
    }
  });

  const analisisPorPregunta = preguntas.map((preg) => {
    const conteo = { Conforme: 0, 'No conforme': 0, 'Necesita mejora': 0, 'No aplica': 0 };
    reportes.forEach((r) => {
      const resp = getRespuesta(r, preg);
      if (resp && conteo.hasOwnProperty(resp)) conteo[resp]++;
    });
    const totalR = Object.values(conteo).reduce((s, v) => s + v, 0);
    return { ...preg, conteo, totalRespuestas: totalR };
  });

  let acum = 0;
  const tendencia = reportes.map((r, i) => { acum += r.puntaje ?? 0; return parseFloat((acum/(i+1)).toFixed(1)); });

  return {
    totalAuditorias: reportes.length,
    puntajePromedio: conteoPuntaje > 0 ? (totalPuntaje/conteoPuntaje).toFixed(1) : 0,
    totalConformes, totalNoConformes, totalMejora, totalNoAplica,
    analisisPorPregunta,
    distribucion: { Conforme: totalConformes, 'No conforme': totalNoConformes, 'Necesita mejora': totalMejora, 'No aplica': totalNoAplica },
    tendencia,
    actitudPct: totalClasificaciones > 0 ? Math.round((actitudPositiva/totalClasificaciones)*100) : 0,
    condicionPct: totalClasificaciones > 0 ? Math.round((condicionPositiva/totalClasificaciones)*100) : 0,
    imagenes: todasLasImagenes.slice(-10), // Últimas 10 imágenes
    acciones: todasLasAcciones.slice(-5)   // Últimas 5 acciones
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
export default function CongresoLiveDashboard() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const unsubRef = useRef(null);
  const [formularioSeleccionado, setFormularioSeleccionado] = useState(CONGRESO_CONFIG.FORM_NAME); // Forzamos el del congreso para el stand
  const [reportes, setReportes] = useState([]);
  const [analisis, setAnalisis] = useState(null);
  const [reloj, setReloj] = useState('');

  useEffect(() => {
    const tick = () => setReloj(new Date().toLocaleTimeString('es-AR', { hour:'2-digit', minute:'2-digit', second:'2-digit' }));
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!formularioSeleccionado || !userProfile?.ownerId) return;
    const col = collection(db, 'apps','auditoria','owners',userProfile.ownerId,'reportes');
    const q = query(col, where('formulario.nombre', '==', formularioSeleccionado)); // Ajusta el campo según como guardes
    
    const unsub = onSnapshot(q, (snap) => {
      const docs = []; let pregs = [];
      snap.forEach((d) => { 
        const r={id:d.id,...d.data()}; 
        docs.push(r); 
        if (pregs.length===0 && r.secciones) pregs=extraerPreguntas(r.secciones); 
      });
      setReportes(docs);
      if (docs.length > 0 && pregs.length > 0) setAnalisis(calcularAnalisis(docs, pregs));
      else setAnalisis(null);
    });
    unsubRef.current = unsub;
    return () => unsub();
  }, [formularioSeleccionado, userProfile?.ownerId]);

  return <DashboardScreen formulario={formularioSeleccionado} analisis={analisis} reloj={reloj} />;
}

// ─── Dashboard UI ─────────────────────────────────────────────────────────────
function DashboardScreen({ formulario, analisis, reloj }) {
  const sin = !analisis || analisis.totalAuditorias === 0;

  return (
    <>
      <style>{`
        body { background: ${T.bg}; margin: 0; }
        @keyframes livePulse{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(239,68,68,.5)}50%{opacity:.7;box-shadow:0 0 0 10px rgba(239,68,68,0)}}
        @keyframes scrollUp { 0% { transform: translateY(0); } 100% { transform: translateY(-50%); } }
        ::-webkit-scrollbar{width:6px} ::-webkit-scrollbar-thumb{background:${T.border};border-radius:3px}
      `}</style>
      <div style={{ minHeight:'100vh', background:T.bg, color:T.text, fontFamily:T.fontSans, padding:'20px 24px', display:'flex', flexDirection:'column', gap:20 }}>

        {/* HEADER */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 24px', background:T.bgCard, borderRadius:16, border:`1px solid ${T.border}`, boxShadow:T.shadow }}>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <div style={{ width:48, height:48, borderRadius:12, background:`linear-gradient(135deg,${T.blue},${T.purple})`, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:18, color:'#fff', boxShadow:`0 0 20px ${T.blue}44` }}>CA</div>
            <div>
              <div style={{ fontSize:12, color:T.blue, fontWeight:700, letterSpacing:2, textTransform:'uppercase' }}>Live Dashboard</div>
              <div style={{ fontSize:22, fontWeight:700, color:T.text }}>{formulario}</div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:24 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(239,68,68,.1)', border:`1px solid ${T.red}55`, borderRadius:20, padding:'6px 16px' }}>
              <div style={{ width:10, height:10, borderRadius:'50%', background:T.red, animation:'livePulse 1.5s infinite' }} />
              <span style={{ fontSize:14, fontWeight:700, color:T.red, letterSpacing:2 }}>LIVE</span>
            </div>
            <div style={{ fontFamily:T.fontMono, fontSize:26, fontWeight:700, color:T.text, letterSpacing:2 }}>{reloj}</div>
          </div>
        </div>

        {/* FILA 1: KPIs PRINCIPALES */}
        <div style={{ display:'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap:16 }}>
          <KpiCard label="Auditorías Totales" value={sin?'—':analisis.totalAuditorias} color={T.blue} />
          <KpiCard label="Puntaje Promedio"   value={sin?'—':`${analisis.puntajePromedio}%`} color={T.green} />
          <KpiCard label="Actitud Positiva"   value={sin?'—':`${analisis.actitudPct}%`} color={T.purple} />
          <KpiCard label="Condición Segura"   value={sin?'—':`${analisis.condicionPct}%`} color={T.amber} />
          <div style={{ background:T.bgCard, borderRadius:16, padding:'16px', border:`1px solid ${T.border}`, boxShadow:T.shadow, display:'flex', alignItems:'center', justifyContent:'space-between', gap:10 }}>
            <div>
                <div style={{ fontSize:11, fontWeight:700, color:T.textDim, textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>Escanea para Auditar</div>
                <div style={{ fontSize:12, color:T.blue, fontWeight:600 }}>¡Participá ahora!</div>
            </div>
            <div style={{ background:'#fff', padding:6, borderRadius:8 }}>
              <QRCodeSVG value={CONGRESO_CONFIG.PUBLIC_URL} size={70} level="M" />
            </div>
          </div>
        </div>

        {/* FILA 2: CONTENIDO DIVIDIDO */}
        <div style={{ display:'grid', gridTemplateColumns: '2fr 1fr 1fr', gap:16, flex:1 }}>
          
          {/* Columna 1: Preguntas (Scroll Automático) */}
          <PanelCard title="Estado por Pregunta" style={{ flex:1 }}>
            {sin ? <Vacio /> : <GridPreguntas analisisPorPregunta={analisis.analisisPorPregunta} />}
          </PanelCard>

          {/* Columna 2: Gráfico General y Acciones Requeridas */}
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
             <PanelCard title="Distribución Global">
              {sin ? <Vacio /> : <DonutChart distribucion={analisis.distribucion} />}
             </PanelCard>
             <PanelCard title="Acciones Requeridas" style={{ flex:1, overflow:'hidden' }}>
                {sin || analisis.acciones.length === 0 ? <Vacio label="No hay acciones" /> : (
                    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                        {analisis.acciones.map((acc, i) => (
                            <div key={i} style={{ background:'rgba(245,158,11,0.1)', borderLeft:`3px solid ${T.amber}`, padding:'10px 12px', borderRadius:'0 8px 8px 0', fontSize:13, color:T.text }}>
                                {acc}
                            </div>
                        ))}
                    </div>
                )}
             </PanelCard>
          </div>

          {/* Columna 3: Galería de Imágenes en Vivo */}
          <PanelCard title="Evidencia Visual (Live)" style={{ overflow:'hidden', padding:0 }}>
             {sin || !analisis.imagenes || analisis.imagenes.length === 0 ? <div style={{padding:20}}><Vacio label="Esperando fotos..." /></div> : (
                <div style={{ height:'100%', overflow:'hidden', position:'relative', background:'#000' }}>
                    <div style={{ display:'flex', flexDirection:'column', gap:2, animation: analisis.imagenes.length > 2 ? 'scrollUp 20s linear infinite' : 'none' }}>
                        {/* Duplicamos el array para el scroll infinito */}
                        {[...analisis.imagenes, ...analisis.imagenes].map((img, i) => (
                            <img key={i} src={img} alt="Evidencia" style={{ width:'100%', height:200, objectFit:'cover', opacity:0.8, transition:'opacity 0.3s' }} />
                        ))}
                    </div>
                    {/* Sombra difuminada para que no se corte feo arriba y abajo */}
                    <div style={{ position:'absolute', top:0, left:0, right:0, height:40, background:`linear-gradient(to bottom, ${T.bgCard}, transparent)` }}/>
                    <div style={{ position:'absolute', bottom:0, left:0, right:0, height:40, background:`linear-gradient(to top, ${T.bgCard}, transparent)` }}/>
                </div>
             )}
          </PanelCard>
        </div>

      </div>
    </>
  );
}

// ─── Componentes UI Internos ──────────────────────────────────────────────────
function KpiCard({ label, value, color }) {
  return (
    <div style={{ background:T.bgCard, borderRadius:16, padding:'20px', border:`1px solid ${T.border}`, borderBottom:`4px solid ${color}`, boxShadow:T.shadow, position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:-20, right:-20, width:80, height:80, background:color, opacity:0.1, borderRadius:'50%', filter:'blur(20px)' }} />
      <div style={{ fontSize:12, color:T.textDim, fontWeight:700, textTransform:'uppercase', letterSpacing:1, marginBottom:10 }}>{label}</div>
      <div style={{ fontFamily:T.fontMono, fontSize:42, fontWeight:800, color:'#fff', lineHeight:1 }}>{value}</div>
    </div>
  );
}

function PanelCard({ title, children, style }) {
  return (
    <div style={{ background:T.bgCard, borderRadius:16, padding:'20px', border:`1px solid ${T.border}`, boxShadow:T.shadow, display:'flex', flexDirection:'column', ...style }}>
      {title && <div style={{ fontSize:12, fontWeight:800, color:T.textDim, textTransform:'uppercase', letterSpacing:1.5, marginBottom:16 }}>{title}</div>}
      {children}
    </div>
  );
}

function Vacio({ label = "Esperando datos..." }) {
  return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:T.gray, fontSize:14, fontFamily:T.fontMono }}>_ {label}</div>;
}

// ─── Gráficos ─────────────────────────────────────────────────────────────────
function DonutChart({ distribucion }) {
  const labels = ['Conforme','No conforme','Mejora','N/A'];
  const data = [distribucion['Conforme']||0, distribucion['No conforme']||0, distribucion['Necesita mejora']||0, distribucion['No aplica']||0];
  const colors = [T.green, T.red, T.amber, T.gray];

  const chartData = { labels, datasets:[{ data, backgroundColor:colors, borderColor:T.bgCard, borderWidth:3, hoverOffset:4 }] };
  const options = { responsive:true, maintainAspectRatio:false, cutout:'75%', plugins: { legend:{display:false} } };

  return (
    <div style={{ height:180, position:'relative' }}>
        <Doughnut data={chartData} options={options} />
        <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', textAlign:'center' }}>
            <div style={{ fontSize:10, color:T.textDim, textTransform:'uppercase', letterSpacing:1 }}>Total</div>
            <div style={{ fontSize:24, fontWeight:800, color:'#fff' }}>{data.reduce((a,b)=>a+b,0)}</div>
        </div>
    </div>
  );
}

function GridPreguntas({ analisisPorPregunta }) {
  // Mostramos solo las primeras 6 para que entre bien en pantalla, o puedes hacer un carrusel
  const visibles = analisisPorPregunta.slice(0, 6); 

  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:16, height:'100%' }}>
      {visibles.map((p, i) => {
         const max = Math.max(p.conteo['Conforme'], p.conteo['No conforme'], p.conteo['Necesita mejora'], 1);
         return (
            <div key={i} style={{ background:'rgba(255,255,255,0.03)', border:`1px solid ${T.border}`, borderRadius:12, padding:14, display:'flex', flexDirection:'column' }}>
                <div style={{ fontSize:11, color:T.blue, fontWeight:700, marginBottom:6 }}>{p.seccion.toUpperCase()}</div>
                <div style={{ fontSize:14, fontWeight:600, color:T.text, marginBottom:14, flex:1, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{p.texto}</div>
                
                {/* Mini Barras Horizontales */}
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    <Barra label="CONF" val={p.conteo['Conforme']} max={max} color={T.green} />
                    <Barra label="NO C" val={p.conteo['No conforme']} max={max} color={T.red} />
                </div>
            </div>
         )
      })}
    </div>
  );
}

function Barra({ label, val, max, color }) {
    const width = val > 0 ? `${(val/max)*100}%` : '0%';
    return (
        <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:10, fontFamily:T.fontMono, color:T.textDim }}>
            <div style={{ width:30 }}>{label}</div>
            <div style={{ flex:1, height:6, background:T.border, borderRadius:3, overflow:'hidden' }}>
                <div style={{ width, height:'100%', background:color, borderRadius:3, transition:'width 0.5s' }} />
            </div>
            <div style={{ width:15, textAlign:'right', color:'#fff', fontWeight:700 }}>{val}</div>
        </div>
    )
}