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

export default function CongresoResponder() {
  const navigate = useNavigate();
  const [estado, setEstado] = useState('iniciando');
  const [mensajeError, setMensajeError] = useState('');
  const [formulario, setFormulario] = useState(null);
  const [respuestas, setRespuestas] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const inicializadoRef = useRef(false);

  useEffect(() => {
    if (inicializadoRef.current) return;
    inicializadoRef.current = true;

    const inicializar = async () => {
      try {
        // Esperar a que firebase resuelva el estado de auth inicial.
        await new Promise((resolve) => {
          const unsub = onAuthStateChanged(auth, () => {
            unsub();
            resolve();
          });
        });

        // Loguear como cuenta del congreso si no es la activa.
        if (auth.currentUser?.email !== CONGRESO_CONFIG.EMAIL) {
          await signInWithEmailAndPassword(
            auth,
            CONGRESO_CONFIG.EMAIL,
            CONGRESO_CONFIG.PASSWORD
          );
        }

        const ownerId = auth.currentUser?.uid;
        if (!ownerId) throw new Error('No se pudo iniciar sesión.');

        // Buscar el formulario del congreso por nombre.
        const formulariosRef = collection(
          dbAudit,
          ...firestoreRoutesCore.formularios(ownerId)
        );
        const q = query(formulariosRef, where('nombre', '==', CONGRESO_CONFIG.FORM_NAME));
        const snap = await getDocs(q);
        if (snap.empty) {
          throw new Error(
            `No se encontró el formulario "${CONGRESO_CONFIG.FORM_NAME}".`
          );
        }
        const doc = snap.docs[0];
        const data = { id: doc.id, ...doc.data() };
        const secciones = Array.isArray(data.secciones) ? data.secciones : [];
        if (secciones.length === 0) throw new Error('El formulario no tiene secciones.');

        setFormulario(data);
        setRespuestas(
          secciones.map((s) => Array((s.preguntas || []).length).fill(''))
        );
        setEstado('listo');
      } catch (err) {
        setMensajeError(err?.message || 'Error inesperado al cargar el formulario.');
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

      const reportesRef = collection(
        dbAudit,
        ...firestoreRoutesCore.reportes(ownerId)
      );
      await addDoc(reportesRef, reporte);

      // Cerrar sesión y mandar a gracias.
      await auth.signOut().catch(() => {});
      navigate('/congreso/gracias', { replace: true });
    } catch (err) {
      setMensajeError(err?.message || 'No se pudo guardar la respuesta.');
      setEstado('error');
    } finally {
      setEnviando(false);
    }
  };

  if (estado === 'iniciando') {
    return <Pantalla mensaje="Cargando formulario..." />;
  }

  if (estado === 'error') {
    return (
      <Pantalla
        mensaje={mensajeError}
        accion={
          <button onClick={() => window.location.reload()} style={btnPrimario}>
            Reintentar
          </button>
        }
      />
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
