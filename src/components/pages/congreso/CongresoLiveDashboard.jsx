import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../../../firebaseControlFile';
import { useAuth } from '@/components/context/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { CONGRESO_CONFIG } from '../../../config/congreso';

ChartJS.register(ArcElement, Tooltip, Legend);

// ─── Paleta ───────────────────────────────────────────────────────────────────
const C = {
  bg:     '#0a0e1a',
  green:  '#22c55e', greenL: '#4ade80', greenD: '#16a34a',
  red:    '#ef4444', redL:   '#f87171', redD:   '#dc2626',
  amber:  '#f59e0b', amberL: '#fbbf24', amberD: '#d97706',
  blue:   '#3b82f6', blueL:  '#60a5fa',
  cyan:   '#22d3ee',
  gray:   '#94a3b8', grayD:  '#64748b', grayDD: '#475569',
  white:  '#f8fafc',
  border: 'rgba(255,255,255,0.08)',
};

const cardStyle = (extra = {}) => ({
  background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
  borderRadius: 14,
  border: `1px solid ${C.border}`,
  ...extra,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getNombreFormulario = (r) =>
  r.formularioNombre ||
  r.nombreForm ||
  (typeof r.formulario === 'object' ? r.formulario?.nombre : r.formulario) ||
  null;

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

const normalizeRespuestas = (respuestas) => {
  if (!respuestas) return null;
  if (
    Array.isArray(respuestas) &&
    respuestas.length > 0 &&
    typeof respuestas[0] === 'object' &&
    Array.isArray(respuestas[0].valores)
  ) {
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
  let actitudPositiva = 0, condicionPositiva = 0, totalClasificaciones = 0;
  let todasLasImagenes = [];
  let todasLasAcciones = [];

  reportes.forEach((r) => {
    let conf = 0, noConf = 0, mejora = 0, noAplica = 0, puntajeR = 0;
    const respuestasNorm = normalizeRespuestas(r.respuestas);

    if (respuestasNorm) {
      const flat = Array.isArray(respuestasNorm)
        ? respuestasNorm.flat().filter((v) => typeof v === 'string')
        : Object.values(respuestasNorm).filter((v) => typeof v === 'string');
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

    if (r.clasificaciones && Array.isArray(r.clasificaciones)) {
      r.clasificaciones.flat().forEach((c) => {
        if (c) {
          if (c.actitud) actitudPositiva++;
          if (c.condicion) condicionPositiva++;
          totalClasificaciones++;
        }
      });
    }

    if (r.imagenes && Array.isArray(r.imagenes)) {
      r.imagenes.flat().flat().forEach((img) => { if (img) todasLasImagenes.push(img); });
    }

    if (r.accionesRequeridas && Array.isArray(r.accionesRequeridas)) {
      r.accionesRequeridas.flat().forEach((acc) => {
        if (acc && acc.trim() !== '') todasLasAcciones.push(acc);
      });
    }
  });

  const analisisPorPregunta = preguntas.map((preg) => {
    const conteo = { Conforme: 0, 'No conforme': 0, 'Necesita mejora': 0, 'No aplica': 0 };
    reportes.forEach((r) => {
      const resp = getRespuesta(r, preg);
      if (resp && Object.prototype.hasOwnProperty.call(conteo, resp)) conteo[resp]++;
    });
    const totalR = Object.values(conteo).reduce((s, v) => s + v, 0);
    const pctNoConf = totalR > 0 ? Math.round((conteo['No conforme'] / totalR) * 100) : 0;
    return { ...preg, conteo, totalRespuestas: totalR, pctNoConf };
  });

  return {
    totalAuditorias: reportes.length,
    puntajePromedio: conteoPuntaje > 0 ? (totalPuntaje / conteoPuntaje).toFixed(1) : '0',
    totalConformes, totalNoConformes, totalMejora, totalNoAplica,
    analisisPorPregunta,
    distribucion: {
      Conforme: totalConformes,
      'No conforme': totalNoConformes,
      'Necesita mejora': totalMejora,
      'No aplica': totalNoAplica,
    },
    actitudPct: totalClasificaciones > 0 ? Math.round((actitudPositiva / totalClasificaciones) * 100) : 0,
    condicionPct: totalClasificaciones > 0 ? Math.round((condicionPositiva / totalClasificaciones) * 100) : 0,
    imagenes: todasLasImagenes.slice(-10),
    acciones: todasLasAcciones.slice(-5),
  };
};

// ─── Keyframes & Global CSS ───────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap');
  * { box-sizing: border-box; }
  body { background: #0a0e1a; margin: 0; padding: 0; }
  @keyframes livePulse {
    0%,100% { box-shadow: 0 0 20px rgba(239,68,68,.6); }
    50%      { box-shadow: 0 0 35px rgba(239,68,68,0.9); }
  }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.15} }
  @keyframes shimmerSpin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
  @keyframes scrollUp { 0%{transform:translateY(0)} 100%{transform:translateY(-50%)} }
  @keyframes ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
`;

// ═══════════════════════════════════════════════════════════════════════════════
export default function CongresoLiveDashboard() {
  const { userProfile } = useAuth();
  const [analisis, setAnalisis] = useState(null);
  const [reloj, setReloj] = useState('');

  // Reloj en tiempo real
  useEffect(() => {
    const tick = () =>
      setReloj(new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // BUG FIX 1: Query defensiva multi-campo
  useEffect(() => {
    if (!userProfile?.ownerId) return;
    const formulario = CONGRESO_CONFIG.FORM_NAME;
    const col = collection(db, 'apps', 'auditoria', 'owners', userProfile.ownerId, 'reportes');
    let unsubscribe;

    const setupSubscription = async () => {
      // Probar cada campo en orden, quedarse con el que devuelva resultados
      const fields = ['formularioNombre', 'nombreForm', 'formulario'];
      let foundField = null;

      for (const field of fields) {
        try {
          const snap = await getDocs(query(col, where(field, '==', formulario)));
          if (!snap.empty) { foundField = field; break; }
        } catch (_) {}
      }

      // Si ningún campo coincide, traer todo y filtrar client-side
      const q = foundField
        ? query(col, where(foundField, '==', formulario))
        : query(col);

      unsubscribe = onSnapshot(q, (snap) => {
        const docs = [];
        let pregs = [];
        snap.forEach((d) => {
          const r = { id: d.id, ...d.data() };
          if (!foundField && getNombreFormulario(r) !== formulario) return;
          docs.push(r);
          if (pregs.length === 0 && r.secciones) pregs = extraerPreguntas(r.secciones);
        });
        if (docs.length > 0 && pregs.length > 0) {
          setAnalisis(calcularAnalisis(docs, pregs));
        } else {
          setAnalisis(null);
        }
      });
    };

    setupSubscription();
    return () => { if (unsubscribe) unsubscribe(); };
  }, [userProfile?.ownerId]);

  return <DashboardScreen analisis={analisis} reloj={reloj} />;
}

// ─── Pantalla principal ───────────────────────────────────────────────────────
function DashboardScreen({ analisis, reloj }) {
  const sin = !analisis || analisis.totalAuditorias === 0;

  // BUG FIX 2: Paginación rotativa — una pregunta a la vez, rota cada 8 segundos
  const [pregIdx, setPregIdx] = useState(0);
  const preguntas = analisis?.analisisPorPregunta || [];

  useEffect(() => {
    if (preguntas.length === 0) return;
    const id = setInterval(() => setPregIdx((prev) => (prev + 1) % preguntas.length), 8000);
    return () => clearInterval(id);
  }, [preguntas.length]);

  // Reset al llegar nuevas auditorías
  useEffect(() => { setPregIdx(0); }, [analisis?.totalAuditorias]);

  const preguntaActual = preguntas[pregIdx] || null;

  const top5Alertas = [...preguntas]
    .filter((p) => p.totalRespuestas > 0)
    .sort((a, b) => b.pctNoConf - a.pctNoConf)
    .slice(0, 5);

  const tickerMsgs = sin
    ? [{ texto: 'Esperando auditorías en vivo...', color: C.grayD }]
    : generarTickerMsgs(analisis, preguntas, preguntaActual);

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{
        minHeight: '100vh',
        background: [
          'radial-gradient(ellipse at top left, rgba(29,78,216,0.15) 0%, transparent 50%)',
          'radial-gradient(ellipse at bottom right, rgba(124,58,237,0.15) 0%, transparent 50%)',
          C.bg,
        ].join(', '),
        color: C.white,
        fontFamily: "'Inter', sans-serif",
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        padding: '16px 20px 0',
      }}>

        {/* HEADER */}
        <HeaderBar reloj={reloj} />

        {/* KPIs — scoreboard de 6 columnas */}
        <KpiRow analisis={analisis} sin={sin} />

        {/* CUERPO — 3 columnas */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr 380px', gap: 14, flex: 1, minHeight: 0 }}>
          <PreguntaDelMomento
            pregunta={preguntaActual}
            pregIdx={pregIdx}
            totalPregs={preguntas.length}
            sin={sin}
          />
          <Top5Alertas alertas={top5Alertas} sin={sin} />
          <ColDerecha analisis={analisis} sin={sin} />
        </div>

        {/* TICKER INFERIOR */}
        <TickerInferior mensajes={tickerMsgs} />
      </div>
    </>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────
function HeaderBar({ reloj }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 24px',
      background: 'linear-gradient(90deg, rgba(29,78,216,0.2), rgba(124,58,237,0.2))',
      borderRadius: 14,
      border: `1px solid ${C.border}`,
      borderLeft: '4px solid #ef4444',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 10,
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Bebas Neue', cursive", fontSize: 20, color: '#fff',
          boxShadow: '0 0 20px rgba(59,130,246,0.4)',
        }}>CA</div>
        <div>
          <div style={{
            fontFamily: "'Bebas Neue', cursive", fontSize: 28,
            letterSpacing: 2, color: C.white, lineHeight: 1,
          }}>
            {CONGRESO_CONFIG.FORM_NAME}
          </div>
          <div style={{ fontSize: 11, color: C.gray, letterSpacing: 2, textTransform: 'uppercase', marginTop: 2 }}>
            Congreso SeguraMente 2026 · Live Dashboard
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(239,68,68,0.15)',
          border: '1px solid rgba(239,68,68,0.4)',
          borderRadius: 20, padding: '6px 18px',
          animation: 'livePulse 1.5s ease-in-out infinite',
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
          <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 18, color: '#ef4444', letterSpacing: 3 }}>
            LIVE
          </span>
        </div>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 24, fontWeight: 700, color: C.white, letterSpacing: 2,
        }}>
          {reloj}
        </div>
      </div>
    </div>
  );
}

// ─── KPI Row ──────────────────────────────────────────────────────────────────
function KpiRow({ analisis, sin }) {
  const v = (val) => sin ? '—' : String(val);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr 1fr 1fr 1.6fr', gap: 12 }}>
      <KpiCard label="Participantes" value={v(analisis?.totalAuditorias)} color={C.blueL} />
      <KpiCard label="Score Prom."   value={sin ? '—' : `${analisis.puntajePromedio}%`} color={C.cyan} />
      <KpiCard label="Conformes"     value={v(analisis?.totalConformes)} color={C.greenL} />
      <KpiCard label="No Conf."      value={v(analisis?.totalNoConformes)} color={C.redL} />
      <KpiCard label="Mejora"        value={v(analisis?.totalMejora)} color={C.amberL} />
      <QrHero />
    </div>
  );
}

function KpiCard({ label, value, color }) {
  return (
    <div style={{
      ...cardStyle({ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 8 }),
      borderTop: `3px solid ${color}`,
    }}>
      <div style={{ fontSize: 10, color: C.gray, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600 }}>
        {label}
      </div>
      <div style={{
        fontFamily: "'Bebas Neue', cursive",
        fontSize: 64, lineHeight: 1, color: C.white, letterSpacing: 1,
        textShadow: `0 0 25px ${color}88`,
      }}>
        {value}
      </div>
    </div>
  );
}

function QrHero() {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #22c55e, #16a34a)',
      borderRadius: 14,
      padding: '18px 20px',
      boxShadow: '0 0 40px rgba(34,197,94,0.4)',
      display: 'flex', alignItems: 'center', gap: 16,
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Shimmer rotatorio */}
      <div style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', pointerEvents: 'none' }}>
        <div style={{
          width: '100%', height: '100%',
          background: 'conic-gradient(from 0deg, transparent 0deg, rgba(255,255,255,0.12) 90deg, transparent 180deg)',
          animation: 'shimmerSpin 4s linear infinite',
        }} />
      </div>

      {/* QR */}
      <div style={{ background: '#fff', padding: 8, borderRadius: 10, flexShrink: 0, position: 'relative', zIndex: 1 }}>
        <QRCodeSVG value={CONGRESO_CONFIG.PUBLIC_URL} size={110} level="M" />
      </div>

      {/* CTA Text */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 2 }}>Escaneá y</div>
        <div style={{
          fontFamily: "'Bebas Neue', cursive", fontSize: 32,
          color: '#fff', lineHeight: 1, letterSpacing: 1,
        }}>
          SUMATE<br />AL LIVE
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 6 }}>
          Tu auditoría en pantalla
        </div>
      </div>
    </div>
  );
}

// ─── Pregunta del Momento ─────────────────────────────────────────────────────
function PreguntaDelMomento({ pregunta, pregIdx, totalPregs, sin }) {
  const base = cardStyle({ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 });

  if (sin || !pregunta) {
    return (
      <div style={base}>
        <Label>Pregunta del Momento</Label>
        <Vacio />
      </div>
    );
  }

  const { conteo, totalRespuestas, texto, seccion } = pregunta;
  const maxVal = Math.max(
    conteo['Conforme'], conteo['No conforme'], conteo['Necesita mejora'], conteo['No aplica'], 1
  );

  const barras = [
    { label: 'Conforme', val: conteo['Conforme'],        color: C.green, colorD: C.greenD },
    { label: 'No Conf.', val: conteo['No conforme'],     color: C.red,   colorD: C.redD   },
    { label: 'Mejora',   val: conteo['Necesita mejora'], color: C.amber, colorD: C.amberD },
    { label: 'N/A',      val: conteo['No aplica'],       color: C.gray,  colorD: C.grayD  },
  ];

  return (
    <div style={base}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Label>Pregunta del Momento</Label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(251,191,36,0.15)',
            border: '1px solid rgba(251,191,36,0.4)',
            borderRadius: 20, padding: '4px 12px',
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.amberL, animation: 'blink 1s infinite' }} />
            <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 14, color: C.amberL, letterSpacing: 2 }}>
              AHORA
            </span>
          </div>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.grayD }}>
            {pregIdx + 1}/{totalPregs}
          </span>
        </div>
      </div>

      <div style={{ fontSize: 11, color: C.blueL, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
        {seccion}
      </div>

      <div style={{ fontSize: 18, fontWeight: 700, color: C.white, lineHeight: 1.4, flex: 1 }}>
        {texto}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {barras.map(({ label, val, color, colorD }) => {
          const pct = totalRespuestas > 0 ? Math.round((val / totalRespuestas) * 100) : 0;
          const w = `${(val / maxVal) * 100}%`;
          return (
            <div key={label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: C.gray, fontWeight: 600 }}>{label}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.white }}>{pct}%</span>
              </div>
              <div style={{ height: 26, background: 'rgba(255,255,255,0.05)', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{
                  width: val > 0 ? w : '2px',
                  height: '100%',
                  background: `linear-gradient(90deg, ${colorD}, ${color})`,
                  boxShadow: val > 0 ? `0 0 15px ${color}66` : 'none',
                  borderRadius: 6,
                  transition: 'width 0.6s ease',
                  display: 'flex', alignItems: 'center', paddingLeft: 10,
                }}>
                  {val > 0 && (
                    <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 18, color: '#fff' }}>{val}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Top 5 Alertas ────────────────────────────────────────────────────────────
function Top5Alertas({ alertas, sin }) {
  const badgeColor = (pct) => pct > 50 ? C.red : pct > 30 ? C.amber : C.green;
  const rankColor  = (i)   => i === 0 ? C.red : i === 1 ? '#f97316' : C.white;

  return (
    <div style={cardStyle({ padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 })}>
      <Label>Top 5 Alertas</Label>

      {sin || alertas.length === 0 ? (
        <Vacio label="Sin datos suficientes" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {alertas.map((alerta, idx) => (
            <div key={alerta.id} style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              padding: '12px 14px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: 10, border: `1px solid ${C.border}`,
            }}>
              {/* Número de ranking */}
              <div style={{
                fontFamily: "'Bebas Neue', cursive",
                fontSize: 34, color: rankColor(idx), lineHeight: 1,
                minWidth: 26, flexShrink: 0,
                textShadow: idx < 2 ? `0 0 15px ${rankColor(idx)}` : 'none',
              }}>
                {idx + 1}
              </div>

              {/* Texto */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 13, color: C.white, fontWeight: 600, lineHeight: 1.3,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  overflow: 'hidden', marginBottom: 4,
                }}>
                  {alerta.texto}
                </div>
                <div style={{ fontSize: 10, color: C.grayD }}>{alerta.seccion}</div>
              </div>

              {/* Badge % */}
              <div style={{
                background: `${badgeColor(alerta.pctNoConf)}22`,
                border: `1px solid ${badgeColor(alerta.pctNoConf)}55`,
                borderRadius: 8, padding: '4px 10px',
                textAlign: 'center', flexShrink: 0,
              }}>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 16, fontWeight: 700, color: badgeColor(alerta.pctNoConf),
                }}>
                  {alerta.pctNoConf}%
                </div>
                <div style={{ fontSize: 9, color: C.grayD, letterSpacing: 1 }}>NO CONF</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Columna Derecha ──────────────────────────────────────────────────────────
function ColDerecha({ analisis, sin }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Donut */}
      <div style={cardStyle({ padding: '16px' })}>
        <Label>Distribución Global</Label>
        <div style={{ marginTop: 10 }}>
          {sin ? <Vacio /> : <DonutChart distribucion={analisis.distribucion} />}
        </div>
      </div>

      {/* Galería con scroll infinito */}
      <div style={{ ...cardStyle(), overflow: 'hidden', flex: 1, minHeight: 160 }}>
        <div style={{ padding: '12px 16px 8px' }}><Label>Evidencia Visual</Label></div>
        {sin || !analisis?.imagenes?.length ? (
          <div style={{ padding: 16 }}><Vacio label="Esperando fotos..." /></div>
        ) : (
          <div style={{ height: 200, overflow: 'hidden', position: 'relative' }}>
            <div style={{
              display: 'flex', flexDirection: 'column', gap: 2,
              animation: analisis.imagenes.length > 2 ? 'scrollUp 20s linear infinite' : 'none',
            }}>
              {[...analisis.imagenes, ...analisis.imagenes].map((img, i) => (
                <img key={i} src={img} alt="Evidencia"
                  style={{ width: '100%', height: 150, objectFit: 'cover' }} />
              ))}
            </div>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 30, background: 'linear-gradient(to bottom, rgba(10,14,26,0.85), transparent)' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 30, background: 'linear-gradient(to top, rgba(10,14,26,0.85), transparent)' }} />
          </div>
        )}
      </div>

      {/* Acciones requeridas */}
      <div style={{ ...cardStyle({ padding: '14px 16px' }), borderLeft: `3px solid ${C.amber}` }}>
        <Label>Acciones Requeridas</Label>
        <div style={{ marginTop: 10 }}>
          {sin || !analisis?.acciones?.length ? (
            <Vacio label="Sin acciones" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {analisis.acciones.map((acc, i) => (
                <div key={i} style={{
                  background: 'rgba(245,158,11,0.08)',
                  borderLeft: `2px solid ${C.amber}`,
                  padding: '8px 10px', borderRadius: '0 6px 6px 0',
                  fontSize: 12, color: C.white, lineHeight: 1.4,
                }}>
                  {acc}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Donut Chart ──────────────────────────────────────────────────────────────
function DonutChart({ distribucion }) {
  const data = [
    distribucion['Conforme'] || 0,
    distribucion['No conforme'] || 0,
    distribucion['Necesita mejora'] || 0,
    distribucion['No aplica'] || 0,
  ];
  const total = data.reduce((a, b) => a + b, 0);

  const chartData = {
    labels: ['Conforme', 'No conforme', 'Mejora', 'N/A'],
    datasets: [{
      data,
      backgroundColor: [C.green, C.red, C.amber, C.grayD],
      borderColor: 'rgba(10,14,26,0.9)',
      borderWidth: 3,
      hoverOffset: 4,
    }],
  };
  const options = {
    responsive: true, maintainAspectRatio: false, cutout: '75%',
    plugins: { legend: { display: false }, tooltip: { enabled: true } },
  };

  return (
    <div style={{ height: 160, position: 'relative' }}>
      <Doughnut data={chartData} options={options} />
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)', textAlign: 'center', pointerEvents: 'none',
      }}>
        <div style={{ fontSize: 9, color: C.gray, textTransform: 'uppercase', letterSpacing: 1 }}>Total</div>
        <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 30, color: C.white, lineHeight: 1 }}>
          {total}
        </div>
      </div>
    </div>
  );
}

// ─── Ticker Inferior ──────────────────────────────────────────────────────────
function generarTickerMsgs(analisis, preguntas, preguntaActual) {
  const msgs = [];

  msgs.push({ texto: `Auditor #${analisis.totalAuditorias} acaba de sumarse`, color: C.greenL });
  msgs.push({ texto: `Score sube a ${analisis.puntajePromedio}%`, color: C.amberL });

  if (analisis.totalConformes > 0)
    msgs.push({ texto: `${analisis.totalConformes} respuestas Conformes registradas`, color: C.greenL });

  if (analisis.totalNoConformes > 0)
    msgs.push({ texto: `${analisis.totalNoConformes} No Conformes detectados`, color: C.redL });

  if (preguntaActual)
    msgs.push({ texto: `Pregunta activa: "${preguntaActual.texto.substring(0, 55)}"`, color: C.blueL });

  const peor = [...preguntas]
    .filter((p) => p.totalRespuestas > 0)
    .sort((a, b) => b.pctNoConf - a.pctNoConf)[0];
  if (peor && peor.pctNoConf > 0)
    msgs.push({ texto: `Nueva alerta en "${peor.texto.substring(0, 40)}..." → ${peor.pctNoConf}% No Conformes`, color: C.redL });

  if (analisis.acciones?.length > 0)
    msgs.push({ texto: `Acción requerida: ${analisis.acciones[analisis.acciones.length - 1].substring(0, 60)}`, color: C.amberL });

  msgs.push({
    texto: `${analisis.totalAuditorias} empresa${analisis.totalAuditorias !== 1 ? 's' : ''} completaron su auditoría`,
    color: C.greenL,
  });

  return msgs;
}

function TickerInferior({ mensajes }) {
  const items = [...mensajes, ...mensajes];

  return (
    <div style={{
      background: '#000',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      display: 'flex', alignItems: 'center',
      height: 44, flexShrink: 0,
      margin: '0 -20px',
      overflow: 'hidden',
    }}>
      {/* Label fijo */}
      <div style={{
        background: '#ef4444', padding: '0 16px', height: '100%',
        display: 'flex', alignItems: 'center', flexShrink: 0,
      }}>
        <span style={{
          fontFamily: "'Bebas Neue', cursive", fontSize: 16,
          color: '#fff', letterSpacing: 2, whiteSpace: 'nowrap',
        }}>
          ⚡ FEED EN VIVO
        </span>
      </div>

      {/* Contenido que scrollea */}
      <div style={{ overflow: 'hidden', flex: 1 }}>
        <div style={{
          display: 'inline-flex', animation: 'ticker 35s linear infinite', whiteSpace: 'nowrap',
        }}>
          {items.map((msg, i) => (
            <span key={i} style={{
              color: msg.color,
              fontFamily: "'Inter', sans-serif",
              fontSize: 14, fontWeight: 600,
              paddingLeft: 24, paddingRight: 24,
            }}>
              {msg.texto}
              <span style={{ color: 'rgba(255,255,255,0.2)', marginLeft: 20 }}>◆</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Shared UI ────────────────────────────────────────────────────────────────
function Label({ children }) {
  return (
    <div style={{ fontSize: 10, color: C.gray, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600 }}>
      {children}
    </div>
  );
}

function Vacio({ label = 'Esperando datos...' }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px 0', color: C.grayD,
      fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
    }}>
      _ {label}
    </div>
  );
}
