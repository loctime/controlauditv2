// src/components/pages/admin/components/AuditoriaSinVincularCard.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, Chip, CircularProgress, Divider, Typography } from '@mui/material';
import { CheckCircle, Person, Print, Visibility } from '@mui/icons-material';
import { doc, getDoc } from 'firebase/firestore';
import { dbAudit } from '../../../../firebaseControlFile';
import { firestoreRoutesCore } from '../../../../core/firestore/firestoreRoutes.core';
import { useAuth } from '@/components/context/AuthContext';
import EstadisticasChartSimple from '../../auditoria/reporte/EstadisticasChartSimple';
import ReporteDetallePro from '../../auditoria/reporte/ReporteDetallePro';

const AuditoriaSinVincularCard = ({ agenda, onCompletar }) => {
  const { userProfile } = useAuth();
  const [reporte, setReporte] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const reporteRef = useRef(null);

  useEffect(() => {
    const fetchReporte = async () => {
      if (!agenda.reporteSinVincular || !userProfile?.ownerId) {
        setLoading(false);
        return;
      }
      try {
        const reporteDoc = await getDoc(
          doc(dbAudit, ...firestoreRoutesCore.reporte(userProfile.ownerId, agenda.reporteSinVincular))
        );
        if (reporteDoc.exists()) {
          setReporte({ id: reporteDoc.id, ...reporteDoc.data() });
        }
      } catch (e) {
        // silencioso — mostramos igual la info básica de la agenda
      } finally {
        setLoading(false);
      }
    };
    fetchReporte();
  }, [agenda.reporteSinVincular, userProfile?.ownerId]);

  const quien = reporte?.nombreInspector || reporte?.creadoPorEmail || agenda.encargado?.displayName || agenda.usuarioNombre || '—';

  const cuando = (() => {
    const ts = reporte?.fechaCreacion || reporte?.timestamp;
    if (!ts) return agenda.fecha || '—';
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
  })();

  const conteo = reporte?.estadisticas?.conteo;

  const handlePrint = () => {
    setOpenModal(true);
    // Pequeño delay para que el modal monte y el ref esté disponible
    setTimeout(() => reporteRef.current?.printReport(), 800);
  };

  return (
    <Box sx={{ mb: 1.5 }}>
      {/* Encabezado de la auditoría */}
      <Box display="flex" alignItems="center" flexWrap="wrap" gap={1} mb={0.5}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {agenda.empresa}
          {agenda.sucursal ? ` — ${agenda.sucursal}` : ''}
        </Typography>
        <Typography variant="body2" color="text.secondary">·</Typography>
        <Typography variant="body2">{agenda.formulario}</Typography>
        {agenda.fecha && (
          <>
            <Typography variant="body2" color="text.secondary">·</Typography>
            <Chip label={agenda.fecha} size="small" variant="outlined" />
          </>
        )}
      </Box>

      {/* Quién y cuándo */}
      <Box display="flex" alignItems="center" gap={0.5} mb={1}>
        <Person fontSize="small" color="action" />
        <Typography variant="caption" color="text.secondary">
          {quien}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mx: 0.5 }}>·</Typography>
        <Typography variant="caption" color="text.secondary">
          {cuando}
        </Typography>
      </Box>

      {/* Mini gráfico o spinner */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={1}>
          <CircularProgress size={20} />
        </Box>
      ) : conteo ? (
        <Box sx={{ maxWidth: 420, mb: 1 }}>
          <EstadisticasChartSimple estadisticas={conteo} height={160} />
        </Box>
      ) : null}

      <Divider sx={{ my: 1 }} />

      {/* Acciones */}
      <Box display="flex" flexWrap="wrap" gap={1}>
        {reporte && (
          <>
            <Button
              size="small"
              variant="outlined"
              color="warning"
              startIcon={<Visibility />}
              onClick={() => setOpenModal(true)}
            >
              Ver reporte
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="warning"
              startIcon={<Print />}
              onClick={handlePrint}
            >
              Imprimir
            </Button>
          </>
        )}
        <Button
          size="small"
          variant="outlined"
          color="warning"
          startIcon={<CheckCircle />}
          onClick={() => onCompletar(agenda.id)}
        >
          Marcar completada
        </Button>
      </Box>

      {/* Modal de reporte completo */}
      {reporte && (
        <ReporteDetallePro
          ref={reporteRef}
          open={openModal}
          onClose={() => setOpenModal(false)}
          reporte={reporte}
          modo="modal"
        />
      )}
    </Box>
  );
};

export default AuditoriaSinVincularCard;
