import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { auth, dbAudit } from '../../../firebaseControlFile';
import { firestoreRoutesCore } from '../../../core/firestore/firestoreRoutes.core';
import { CONGRESO_CONFIG } from '../../../config/congreso';
import PreguntasYSeccion from '../auditoria/auditoria/PreguntasYSeccion';
import AuditoriaService from '../auditoria/auditoriaService';

const T = {
  bg: '#eef2f7',
  bgCard: '#ffffff',
  border: '#d1dbe8',
  blue: '#1d4ed8',
  text: '#0f172a',
  textDim: '#475569',
  shadow: '0 2px 8px rgba(0,0,0,0.10)',
  fontSans: "'Space Grotesk', sans-serif",
};

const matrizVacia = (secciones, valor) =>
  secciones.map((s) => Array((s.preguntas || []).length).fill(valor));

export default function CongresoResponder() {
  const navigate = useNavigate();
  const [estado, setEstado] = useState('iniciando');
  const [mensajeError, setMensajeError] = useState('');
  const [formulario, setFormulario] = useState(null);
  const [ownerId, setOwnerId] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const respuestasRef = useRef([]);
  const comentariosRef = useRef([]);
  const imagenesRef = useRef([]);
  const clasificacionesRef = useRef([]);
  const accionesRequeridasRef = useRef([]);

  const inicializadoRef = useRef(false);

  useEffect(() => {
    if (inicializadoRef.current) return;
    inicializadoRef.current = true;

    const inicializar = async () => {
      try {
        await new Promise((resolve) => {
          const unsub = onAuthStateChanged(auth, () => {
            unsub();
            resolve();
          });
        });

        if (auth.currentUser?.email !== CONGRESO_CONFIG.EMAIL) {
          await signInWithEmailAndPassword(
            auth,
            CONGRESO_CONFIG.EMAIL,
            CONGRESO_CONFIG.PASSWORD
          );
        }

        const uid = auth.currentUser?.uid;
        if (!uid) throw new Error('No se pudo iniciar sesión.');

        const formulariosRef = collection(
          dbAudit,
          ...firestoreRoutesCore.formularios(uid)
        );
        const q = query(formulariosRef, where('nombre', '==', CONGRESO_CONFIG.FORM_NAME));
        const snap = await getDocs(q);
        if (snap.empty) {
          throw new Error(
            `No se encontró el formulario "${CONGRESO_CONFIG.FORM_NAME}".`
          );
        }
        const docSnap = snap.docs[0];
        const data = { id: docSnap.id, ...docSnap.data() };
        const secciones = Array.isArray(data.secciones) ? data.secciones : [];
        if (secciones.length === 0) throw new Error('El formulario no tiene secciones.');

        respuestasRef.current = matrizVacia(secciones, '');
        comentariosRef.current = matrizVacia(secciones, '');
        imagenesRef.current = secciones.map((s) =>
          Array((s.preguntas || []).length).fill(null).map(() => [])
        );
        clasificacionesRef.current = secciones.map((s) =>
          Array((s.preguntas || []).length)
            .fill(null)
            .map(() => ({ condicion: false, actitud: false }))
        );
        accionesRequeridasRef.current = matrizVacia(secciones, null);

        setOwnerId(uid);
        setFormulario(data);
        setEstado('listo');
      } catch (err) {
        const codigo = err?.code ? `[${err.code}] ` : '';
        setMensajeError(`${codigo}${err?.message || 'Error inesperado al cargar el formulario.'}`);
        setEstado('error');
      }
    };

    inicializar();
  }, []);

  const todasContestadas = () => {
    const r = respuestasRef.current;
    return r.length > 0 && r.every((s) => s.every((v) => v && v.trim() !== ''));
  };

  const enviar = async () => {
    if (enviando) return;
    if (!todasContestadas()) {
      setMensajeError('Faltan preguntas por contestar.');
      return;
    }
    setEnviando(true);
    setMensajeError('');
    try {
      const uid = ownerId || auth.currentUser?.uid;
      if (!uid) throw new Error('Sesión perdida.');

      const datosAuditoria = {
        empresa: { id: 'congreso', nombre: CONGRESO_CONFIG.EVENTO_LABEL },
        formulario: { id: formulario.id, nombre: CONGRESO_CONFIG.FORM_NAME },
        sucursal: 'Stand',
        secciones: formulario.secciones,
        respuestas: respuestasRef.current,
        comentarios: comentariosRef.current,
        imagenes: imagenesRef.current,
        clasificaciones: clasificacionesRef.current,
        accionesRequeridas: accionesRequeridasRef.current,
      };

      const userProfile = {
        uid,
        ownerId: uid,
        email: CONGRESO_CONFIG.EMAIL,
        displayName: 'Congreso',
      };

      await AuditoriaService.guardarAuditoriaOnline(datosAuditoria, userProfile);

      await auth.signOut().catch(() => {});
      navigate('/congreso/gracias', { replace: true });
    } catch (err) {
      const codigo = err?.code ? `[${err.code}] ` : '';
      setMensajeError(`${codigo}${err?.message || 'No se pudo guardar la respuesta.'}`);
    } finally {
      setEnviando(false);
    }
  };

  const seccionesObj = useMemo(() => {
    if (!formulario?.secciones) return {};
    return formulario.secciones.reduce((acc, s, idx) => {
      acc[idx] = s;
      return acc;
    }, {});
  }, [formulario]);

  if (estado === 'iniciando') {
    return <Pantalla mensaje="Cargando formulario..." cargando />;
  }

  if (estado === 'error' && !formulario) {
    return (
      <Pantalla
        mensaje={mensajeError}
        accion={
          <Button variant="contained" onClick={() => window.location.reload()}>
            Reintentar
          </Button>
        }
      />
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: T.bg,
        fontFamily: T.fontSans,
        p: { xs: '16px 12px 96px', sm: '20px 16px 96px' },
        color: T.text,
      }}
    >
      <Box sx={{ maxWidth: 760, mx: 'auto' }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography
            sx={{
              fontSize: 11,
              letterSpacing: 1.5,
              color: T.textDim,
              textTransform: 'uppercase',
              fontWeight: 700,
              mb: 0.5,
            }}
          >
            {CONGRESO_CONFIG.EVENTO_LABEL}
          </Typography>
          <Typography sx={{ fontSize: 22, fontWeight: 700 }}>
            {formulario.nombre}
          </Typography>
        </Box>

        <Box
          sx={{
            background: T.bgCard,
            borderRadius: 2,
            border: `1px solid ${T.border}`,
            boxShadow: T.shadow,
            p: { xs: 1.5, sm: 2 },
          }}
        >
          <PreguntasYSeccion
            secciones={seccionesObj}
            respuestasExistentes={respuestasRef.current}
            comentariosExistentes={comentariosRef.current}
            imagenesExistentes={imagenesRef.current}
            clasificacionesExistentes={clasificacionesRef.current}
            accionesRequeridasExistentes={accionesRequeridasRef.current}
            ownerId={ownerId}
            guardarRespuestas={(next) => { respuestasRef.current = next; }}
            guardarComentario={(next) => { comentariosRef.current = next; }}
            guardarImagenes={(next) => { imagenesRef.current = next; }}
            guardarClasificaciones={(next) => { clasificacionesRef.current = next; }}
            guardarAccionesRequeridas={(next) => { accionesRequeridasRef.current = next; }}
          />
        </Box>

        {mensajeError && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography color="error" sx={{ fontSize: 14 }}>
              {mensajeError}
            </Typography>
          </Box>
        )}

        <Box
          sx={{
            position: 'sticky',
            bottom: 14,
            display: 'flex',
            justifyContent: 'center',
            mt: 2,
          }}
        >
          <Button
            onClick={enviar}
            disabled={enviando}
            variant="contained"
            size="large"
            sx={{
              minWidth: 240,
              borderRadius: 3,
              background: `linear-gradient(135deg,${T.blue},#6366f1)`,
              boxShadow: `0 6px 20px ${T.blue}55`,
              fontWeight: 700,
              textTransform: 'none',
              fontSize: 16,
              '&:hover': {
                background: `linear-gradient(135deg,${T.blue},#6366f1)`,
                opacity: 0.95,
              },
            }}
          >
            {enviando ? 'Enviando...' : 'Enviar auditoría'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

function Pantalla({ mensaje, accion, cargando = false }) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: T.bg,
        fontFamily: T.fontSans,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2.5,
        color: T.text,
        textAlign: 'center',
      }}
    >
      <Box sx={{ maxWidth: 420 }}>
        {cargando && (
          <Box sx={{ mb: 2 }}>
            <CircularProgress size={28} />
          </Box>
        )}
        <Typography sx={{ fontSize: 16, mb: 2, color: T.textDim }}>
          {mensaje}
        </Typography>
        {accion}
      </Box>
    </Box>
  );
}
