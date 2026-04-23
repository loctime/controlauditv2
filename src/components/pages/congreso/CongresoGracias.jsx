import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from 'firebase/auth';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { auth, dbAudit } from '../../../firebaseControlFile';
import { firestoreRoutesCore } from '../../../core/firestore/firestoreRoutes.core';
import { CONGRESO_CONFIG } from '../../../config/congreso';

const T = {
  bg: '#eef2f7',
  bgCard: '#ffffff',
  border: '#d1dbe8',
  blue: '#1d4ed8',
  green: '#15803d',
  text: '#0f172a',
  textDim: '#475569',
  shadow: '0 2px 12px rgba(0,0,0,0.10)',
  fontSans: "'Space Grotesk', sans-serif",
  fontMono: "'JetBrains Mono', monospace",
};

// Calcula puntaje a partir de los campos del reporte (con fallback al array
// 2D de respuestas si los conteos no están guardados).
const puntajeReporte = (r) => {
  if (typeof r.puntaje === 'number') return r.puntaje;
  let conf = r.respuestasConformes;
  let noConf = r.respuestasNoConformes;
  if (typeof conf !== 'number' || typeof noConf !== 'number') {
    const flat = Array.isArray(r.respuestas) ? r.respuestas.flat() : [];
    conf = flat.filter((v) => v === 'Conforme').length;
    noConf = flat.filter((v) => v === 'No conforme').length;
  }
  const total = conf + noConf;
  return total > 0 ? Math.round((conf / total) * 100) : null;
};

export default function CongresoGracias() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, promedio: null });
  const [estado, setEstado] = useState('cargando');

  useEffect(() => {
    let unsub = null;
    let cancelado = false;

    const cargar = async () => {
      try {
        await new Promise((resolve) => {
          const u = onAuthStateChanged(auth, () => {
            u();
            resolve();
          });
        });

        // Login silencioso solo para LEER stats; cerramos sesión al desmontar.
        if (auth.currentUser?.email !== CONGRESO_CONFIG.EMAIL) {
          await signInWithEmailAndPassword(
            auth,
            CONGRESO_CONFIG.EMAIL,
            CONGRESO_CONFIG.PASSWORD
          );
        }
        if (cancelado) return;

        const ownerId = auth.currentUser?.uid;
        if (!ownerId) throw new Error('No se pudo iniciar sesión.');

        const reportesRef = collection(
          dbAudit,
          ...firestoreRoutesCore.reportes(ownerId)
        );
        const q = query(
          reportesRef,
          where('formularioNombre', '==', CONGRESO_CONFIG.FORM_NAME)
        );

        unsub = onSnapshot(
          q,
          (snap) => {
            const reportes = snap.docs.map((d) => d.data());
            const puntajes = reportes
              .map(puntajeReporte)
              .filter((p) => typeof p === 'number');
            const promedio =
              puntajes.length > 0
                ? Math.round(
                    puntajes.reduce((a, b) => a + b, 0) / puntajes.length
                  )
                : null;
            setStats({ total: reportes.length, promedio });
            setEstado('listo');
          },
          () => setEstado('listo')
        );
      } catch {
        setEstado('listo');
      }
    };

    cargar();

    return () => {
      cancelado = true;
      if (unsub) unsub();
      // Cerrar sesión del congreso al salir para no dejar la cuenta cacheada.
      signOut(auth).catch(() => {});
    };
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: T.bg,
        fontFamily: T.fontSans,
        color: T.text,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        style={{
          maxWidth: 460,
          width: '100%',
          background: T.bgCard,
          borderRadius: 18,
          border: `1px solid ${T.border}`,
          boxShadow: T.shadow,
          padding: '32px 26px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: `linear-gradient(135deg,${T.green},#22c55e)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 18px',
            color: '#fff',
            fontSize: 30,
            fontWeight: 700,
          }}
        >
          ✓
        </div>

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
        <h1 style={{ fontSize: 26, margin: '0 0 10px', fontWeight: 700 }}>
          ¡Gracias por participar!
        </h1>
        <p
          style={{
            color: T.textDim,
            fontSize: 15,
            lineHeight: 1.5,
            margin: '0 0 24px',
          }}
        >
          Tu auditoría fue registrada correctamente.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
            marginBottom: 24,
          }}
        >
          <Stat
            label="Auditorías"
            value={estado === 'cargando' ? '…' : stats.total}
            color={T.blue}
          />
          <Stat
            label="Puntaje prom."
            value={
              estado === 'cargando'
                ? '…'
                : stats.promedio == null
                ? '—'
                : `${stats.promedio}%`
            }
            color={T.green}
          />
        </div>

        <div
          style={{
            background: '#f8fafc',
            border: `1px solid ${T.border}`,
            borderRadius: 12,
            padding: '14px 16px',
            fontSize: 14,
            lineHeight: 1.5,
            color: T.text,
            marginBottom: 22,
          }}
        >
          Podés ver el detalle de los resultados en vivo en la pantalla del
          stand <strong>ControlDoc</strong>.
        </div>

        <button
          onClick={() => navigate('/congreso/responder', { replace: true })}
          style={{
            padding: '12px 24px',
            borderRadius: 10,
            border: `1.5px solid ${T.border}`,
            background: 'transparent',
            color: T.textDim,
            fontFamily: T.fontSans,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Responder de nuevo
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div
      style={{
        background: T.bgCard,
        borderRadius: 12,
        border: `1px solid ${T.border}`,
        borderTop: `3px solid ${color}`,
        padding: '14px 10px',
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: T.textDim,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: 0.8,
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: T.fontMono,
          fontSize: 28,
          fontWeight: 700,
          color,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
    </div>
  );
}
