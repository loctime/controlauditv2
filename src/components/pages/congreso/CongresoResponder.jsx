import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, dbAudit } from '../../../firebaseControlFile';
import { firestoreRoutesCore } from '../../../core/firestore/firestoreRoutes.core';
import { CONGRESO_CONFIG } from '../../../config/congreso';

const T = {
  bg: '#eef2f7',
  bgCard: '#ffffff',
  border: '#d1dbe8',
  blue: '#1d4ed8',
  green: '#15803d',
  amber: '#b45309',
  red: '#b91c1c',
  gray: '#475569',
  text: '#0f172a',
  textDim: '#475569',
  shadow: '0 2px 8px rgba(0,0,0,0.10)',
  fontSans: "'Space Grotesk', sans-serif",
};

const OPCIONES = [
  { v: 'Conforme', c: T.green },
  { v: 'No conforme', c: T.red },
  { v: 'Necesita mejora', c: T.amber },
  { v: 'No aplica', c: T.gray },
];

const getTextoPregunta = (p, idx) =>
  typeof p === 'string' ? p : p?.texto || p?.text || `Pregunta ${idx + 1}`;

const safeStringify = (v) => {
  try {
    if (typeof v === 'string') return v;
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
};

export default function CongresoResponder() {
  const navigate = useNavigate();
  const [estado, setEstado] = useState('iniciando');
  const [mensajeError, setMensajeError] = useState('');
  const [formulario, setFormulario] = useState(null);
  const [respuestas, setRespuestas] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [debugLogs, setDebugLogs] = useState([]);
  const [showDebug, setShowDebug] = useState(true);
  const inicializadoRef = useRef(false);

  const log = (msg, extra) => {
    const hora = new Date().toLocaleTimeString('es-AR', { hour12: false });
    const linea = extra !== undefined ? `${msg} → ${safeStringify(extra)}` : msg;
    setDebugLogs((prev) => [...prev, `[${hora}] ${linea}`]);
  };

  // Capturar errores globales que se escapan de los try/catch para que aparezcan en pantalla.
  useEffect(() => {
    const onErr = (e) => {
      const src = e?.error?.message || e?.message || 'error desconocido';
      log('window.onerror', src);
    };
    const onRej = (e) => {
      const r = e?.reason;
      const msg = r?.code ? `${r.code}: ${r.message}` : r?.message || String(r);
      log('unhandledrejection', msg);
    };
    window.addEventListener('error', onErr);
    window.addEventListener('unhandledrejection', onRej);
    return () => {
      window.removeEventListener('error', onErr);
      window.removeEventListener('unhandledrejection', onRej);
    };
  }, []);

  useEffect(() => {
    if (inicializadoRef.current) return;
    inicializadoRef.current = true;

    const inicializar = async () => {
      try {
        log('1. Esperando estado inicial de auth');
        // Esperar a que firebase resuelva el estado de auth inicial.
        await new Promise((resolve) => {
          const unsub = onAuthStateChanged(auth, () => {
            unsub();
            resolve();
          });
        });
        log('2. Auth inicial resuelto', { user: auth.currentUser?.email || 'ninguno' });

        // Loguear como cuenta del congreso si no es la activa.
        if (auth.currentUser?.email !== CONGRESO_CONFIG.EMAIL) {
          log('3. Iniciando sesión como', CONGRESO_CONFIG.EMAIL);
          const cred = await signInWithEmailAndPassword(
            auth,
            CONGRESO_CONFIG.EMAIL,
            CONGRESO_CONFIG.PASSWORD
          );
          log('4. Login OK', { uid: cred.user.uid });
        } else {
          log('3. Ya había sesión activa del congreso');
        }

        const ownerId = auth.currentUser?.uid;
        if (!ownerId) throw new Error('No se pudo iniciar sesión (currentUser null).');
        log('5. ownerId', ownerId);

        // Verificar custom claims (si la regla las requiere la lectura/escritura fallará con permission-denied).
        try {
          const tokenResult = await auth.currentUser.getIdTokenResult();
          log('6. Claims', {
            role: tokenResult.claims.role,
            appId: tokenResult.claims.appId,
            ownerId: tokenResult.claims.ownerId,
          });
        } catch (e) {
          log('6. Claims ERROR', e?.message);
        }

        // Buscar el formulario del congreso por nombre.
        log('7. Buscando formulario por nombre', CONGRESO_CONFIG.FORM_NAME);
        const formulariosRef = collection(
          dbAudit,
          ...firestoreRoutesCore.formularios(ownerId)
        );
        const q = query(formulariosRef, where('nombre', '==', CONGRESO_CONFIG.FORM_NAME));
        const snap = await getDocs(q);
        log('8. Query resuelta', { size: snap.size });

        if (snap.empty) {
          throw new Error(
            `No se encontró el formulario "${CONGRESO_CONFIG.FORM_NAME}".`
          );
        }
        const doc = snap.docs[0];
        const data = { id: doc.id, ...doc.data() };
        const secciones = Array.isArray(data.secciones) ? data.secciones : [];
        if (secciones.length === 0) throw new Error('El formulario no tiene secciones.');
        log('9. Formulario cargado', {
          id: data.id,
          secciones: secciones.length,
          preguntas: secciones.reduce((a, s) => a + (s.preguntas?.length || 0), 0),
        });

        setFormulario(data);
        setRespuestas(
          secciones.map((s) => Array((s.preguntas || []).length).fill(''))
        );
        setEstado('listo');
        log('10. Listo para responder');
      } catch (err) {
        const codigo = err?.code ? `[${err.code}] ` : '';
        const mensaje = `${codigo}${err?.message || 'Error inesperado al cargar el formulario.'}`;
        log('ERROR', mensaje);
        setMensajeError(mensaje);
        setEstado('error');
      }
    };

    inicializar();
  }, []);

  const setRespuesta = (sIdx, pIdx, valor) => {
    setRespuestas((prev) => {
      const next = prev.map((s) => [...s]);
      next[sIdx][pIdx] = valor;
      return next;
    });
  };

  const todasContestadas = () =>
    respuestas.length > 0 && respuestas.every((s) => s.every((v) => v !== ''));

  const enviar = async () => {
    if (!todasContestadas() || enviando) return;
    setEnviando(true);
    try {
      const ownerId = auth.currentUser?.uid;
      if (!ownerId) throw new Error('Sesión perdida.');
      log('E1. Enviando', { ownerId });

      const flat = respuestas.flat();
      const conformes = flat.filter((v) => v === 'Conforme').length;
      const noConformes = flat.filter((v) => v === 'No conforme').length;
      const necesitaMejora = flat.filter((v) => v === 'Necesita mejora').length;
      const noAplica = flat.filter((v) => v === 'No aplica').length;
      const denominador = conformes + noConformes;
      const puntaje = denominador > 0 ? Math.round((conformes / denominador) * 100) : 0;

      const reporte = {
        formularioId: formulario.id,
        formularioNombre: CONGRESO_CONFIG.FORM_NAME,
        nombreForm: CONGRESO_CONFIG.FORM_NAME,
        secciones: formulario.secciones,
        respuestas, // 2D array compatible con CongresoLiveDashboard
        respuestasConformes: conformes,
        respuestasNoConformes: noConformes,
        respuestasNecesitaMejora: necesitaMejora,
        respuestasNoAplica: noAplica,
        puntaje,
        empresaNombre: CONGRESO_CONFIG.EVENTO_LABEL,
        sucursal: 'Stand',
        ownerId,
        usuarioId: ownerId,
        creadoPor: ownerId,
        creadoPorEmail: CONGRESO_CONFIG.EMAIL,
        estado: 'completada',
        origen: 'congreso-qr',
        timestamp: serverTimestamp(),
        fechaCreacion: new Date().toISOString(),
      };

      log('E2. Guardando reporte en Firestore');
      const reportesRef = collection(
        dbAudit,
        ...firestoreRoutesCore.reportes(ownerId)
      );
      const docRef = await addDoc(reportesRef, reporte);
      log('E3. Reporte guardado', { id: docRef.id });

      // Cerrar sesión y mandar a gracias.
      await auth.signOut().catch(() => {});
      navigate('/congreso/gracias', { replace: true });
    } catch (err) {
      const codigo = err?.code ? `[${err.code}] ` : '';
      const mensaje = `${codigo}${err?.message || 'No se pudo guardar la respuesta.'}`;
      log('ENVIAR ERROR', mensaje);
      setMensajeError(mensaje);
      setEstado('error');
    } finally {
      setEnviando(false);
    }
  };

  const debug = (
    <DebugPanel
      estado={estado}
      logs={debugLogs}
      visible={showDebug}
      onToggle={() => setShowDebug((v) => !v)}
    />
  );

  if (estado === 'iniciando') {
    return (
      <>
        {debug}
        <Pantalla mensaje="Cargando formulario..." />
      </>
    );
  }

  if (estado === 'error') {
    return (
      <>
        {debug}
        <Pantalla
          mensaje={mensajeError}
          accion={
            <button onClick={() => window.location.reload()} style={btnPrimario}>
              Reintentar
            </button>
          }
        />
      </>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: T.bg,
        fontFamily: T.fontSans,
        padding: '20px 14px 80px',
        color: T.text,
      }}
    >
      {debug}
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <header style={{ textAlign: 'center', marginBottom: 24 }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: 1.5,
              color: T.textDim,
              textTransform: 'uppercase',
              fontWeight: 700,
              marginBottom: 6,
            }}
          >
            {CONGRESO_CONFIG.EVENTO_LABEL}
          </div>
          <h1 style={{ fontSize: 22, margin: 0, fontWeight: 700 }}>
            {formulario.nombre}
          </h1>
        </header>

        {formulario.secciones.map((sec, sIdx) => (
          <section
            key={sIdx}
            style={{
              background: T.bgCard,
              borderRadius: 14,
              border: `1px solid ${T.border}`,
              boxShadow: T.shadow,
              padding: '16px 16px 8px',
              marginBottom: 16,
            }}
          >
            <h2
              style={{
                fontSize: 13,
                color: T.blue,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: 0.8,
                margin: '0 0 12px',
              }}
            >
              {sec.nombre || `Sección ${sIdx + 1}`}
            </h2>
            {(sec.preguntas || []).map((p, pIdx) => (
              <div
                key={pIdx}
                style={{
                  padding: '12px 0',
                  borderTop: pIdx === 0 ? 'none' : `1px solid ${T.border}`,
                }}
              >
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    marginBottom: 10,
                    lineHeight: 1.35,
                  }}
                >
                  {pIdx + 1}. {getTextoPregunta(p, pIdx)}
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 6,
                  }}
                >
                  {OPCIONES.map(({ v, c }) => {
                    const activo = respuestas[sIdx][pIdx] === v;
                    return (
                      <button
                        key={v}
                        onClick={() => setRespuesta(sIdx, pIdx, v)}
                        style={{
                          padding: '11px 8px',
                          borderRadius: 10,
                          border: `2px solid ${activo ? c : T.border}`,
                          background: activo ? c : '#fff',
                          color: activo ? '#fff' : T.text,
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontFamily: T.fontSans,
                          transition: 'all .15s',
                        }}
                      >
                        {v}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>
        ))}

        <div
          style={{
            position: 'sticky',
            bottom: 14,
            display: 'flex',
            justifyContent: 'center',
            paddingTop: 8,
          }}
        >
          <button
            onClick={enviar}
            disabled={!todasContestadas() || enviando}
            style={{
              ...btnPrimario,
              minWidth: 240,
              opacity: !todasContestadas() || enviando ? 0.55 : 1,
              cursor: !todasContestadas() || enviando ? 'default' : 'pointer',
            }}
          >
            {enviando ? 'Enviando...' : 'Enviar auditoría'}
          </button>
        </div>
      </div>
    </div>
  );
}

const btnPrimario = {
  padding: '14px 28px',
  borderRadius: 12,
  border: 'none',
  background: `linear-gradient(135deg,${T.blue},#6366f1)`,
  color: '#fff',
  fontSize: 16,
  fontWeight: 700,
  fontFamily: T.fontSans,
  boxShadow: `0 6px 20px ${T.blue}55`,
};

function DebugPanel({ estado, logs, visible, onToggle }) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: 'rgba(15,23,42,0.94)',
        color: '#e2e8f0',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        padding: '6px 10px',
        borderBottom: '2px solid #1d4ed8',
        maxHeight: visible ? '40vh' : 26,
        overflow: 'auto',
        transition: 'max-height .2s',
      }}
    >
      <div
        onClick={onToggle}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <span>
          <strong style={{ color: '#93c5fd' }}>DEBUG</strong> · estado:{' '}
          {estado} · logs: {logs.length}
        </span>
        <span style={{ color: '#64748b' }}>{visible ? '▲ ocultar' : '▼ ver'}</span>
      </div>
      {visible && (
        <div style={{ marginTop: 6, lineHeight: 1.45, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {logs.length === 0 ? (
            <div style={{ color: '#64748b' }}>Sin logs aún...</div>
          ) : (
            logs.map((l, i) => <div key={i}>{l}</div>)
          )}
        </div>
      )}
    </div>
  );
}

function Pantalla({ mensaje, accion }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: T.bg,
        fontFamily: T.fontSans,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        color: T.text,
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: 420 }}>
        <p style={{ fontSize: 16, marginBottom: 18, color: T.textDim }}>{mensaje}</p>
        {accion}
      </div>
    </div>
  );
}
