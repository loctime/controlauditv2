import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Grid,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  PhotoCamera as PhotoCameraIcon
} from '@mui/icons-material';
import { useAuth } from '@/components/context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { auditoriaManualService } from '../../../../services/auditoriaManualService';
import AuditoriaManualForm from './AuditoriaManualForm';
import AuditoriaManualEvidencias from './AuditoriaManualEvidencias';
import Swal from 'sweetalert2';

/**
 * Vista detalle de una auditoría manual
 */
export default function AuditoriaManualDetalle() {
  const { auditoriaId } = useParams();
  const { userProfile, userEmpresas, userSucursales } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [auditoria, setAuditoria] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (auditoriaId && userProfile?.ownerId) {
      loadAuditoria();
    }
  }, [auditoriaId, userProfile?.ownerId]);

  const loadAuditoria = async () => {
    if (!userProfile?.ownerId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await auditoriaManualService.obtenerAuditoriaManual(
        userProfile.ownerId,
        auditoriaId
      );

      if (!data) {
        setError('Auditoría no encontrada');
      } else {
        setAuditoria(data);
      }
    } catch (err) {
      console.error('Error al cargar auditoría:', err);
      setError('Error al cargar la auditoría');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditOpen(true);
  };

  const handleClose = async () => {
    if (!userProfile?.ownerId) return;

    const result = await Swal.fire({
      title: '¿Cerrar auditoría?',
      text: 'Una vez cerrada, no se podrán agregar más evidencias ni editar la información',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, cerrar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    setClosing(true);

    try {
      await auditoriaManualService.cerrarAuditoriaManual(
        userProfile.ownerId,
        auditoriaId,
        userProfile
      );

      await loadAuditoria();

      Swal.fire({
        icon: 'success',
        title: 'Auditoría cerrada',
        text: 'La auditoría se ha cerrado correctamente',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      console.error('Error al cerrar auditoría:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'No se pudo cerrar la auditoría'
      });
    } finally {
      setClosing(false);
    }
  };

  const handleSave = () => {
    setEditOpen(false);
    loadAuditoria();
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      return date.toDate ? date.toDate().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) : new Date(date).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  const getEmpresaNombre = () => {
    if (!auditoria?.empresaId || !userEmpresas) return 'N/A';
    const empresa = userEmpresas.find(e => e.id === auditoria.empresaId);
    return empresa?.nombre || 'N/A';
  };

  const getSucursalNombre = () => {
    if (!auditoria?.sucursalId || !userSucursales) return null;
    const sucursal = userSucursales.find(s => s.id === auditoria.sucursalId);
    return sucursal?.nombre || null;
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !auditoria) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error || 'Auditoría no encontrada'}</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/auditorias-manuales')}
          sx={{ mt: 2 }}
        >
          Volver
        </Button>
      </Container>
    );
  }

  const isCerrada = auditoria.estado === 'cerrada';

  return (
    <Container maxWidth="lg" sx={{ py: isMobile ? 2 : 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/auditorias-manuales')}
          sx={{ mb: 2 }}
        >
          Volver
        </Button>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ mb: 1 }}>
              {auditoria.nombre}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              <Chip
                label={isCerrada ? 'Cerrada' : 'Abierta'}
                color={isCerrada ? 'success' : 'warning'}
                size="small"
              />
              {getSucursalNombre() && (
                <Chip
                  label={getSucursalNombre()}
                  variant="outlined"
                  size="small"
                />
              )}
            </Box>
          </Box>

          {!isCerrada && (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={handleEdit}
              >
                Editar
              </Button>
              <Button
                variant="contained"
                startIcon={<CheckCircleIcon />}
                onClick={handleClose}
                disabled={closing}
                color="success"
              >
                {closing ? <CircularProgress size={20} /> : 'Cerrar Auditoría'}
              </Button>
            </Box>
          )}
        </Box>
      </Box>

      {/* Información principal */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Información
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Empresa
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {getEmpresaNombre()}
            </Typography>
          </Grid>

          {getSucursalNombre() && (
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Sucursal
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {getSucursalNombre()}
              </Typography>
            </Grid>
          )}

          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Fecha
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {formatDate(auditoria.fecha)}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Auditor
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {auditoria.auditor}
            </Typography>
          </Grid>

          {auditoria.observaciones && (
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                Observaciones
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
                {auditoria.observaciones}
              </Typography>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Evidencias */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">
            Evidencias
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PhotoCameraIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {auditoria.evidenciasCount || 0} evidencia(s)
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <AuditoriaManualEvidencias
          auditoriaId={auditoriaId}
          empresaId={auditoria.empresaId}
          sucursalId={auditoria.sucursalId}
          disabled={isCerrada}
        />
      </Paper>

      {/* Dialog de edición */}
      {editOpen && (
        <AuditoriaManualForm
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onSave={handleSave}
          auditoria={auditoria}
        />
      )}
    </Container>
  );
}
