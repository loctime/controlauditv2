import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Button,
  Grid,
  Box,
  CircularProgress,
  Alert,
  Paper,
  TextField,
  MenuItem,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useAuth } from '@/components/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { auditoriaManualService } from '../../../services/auditoriaManualService';
import AuditoriaManualForm from './components/AuditoriaManualForm';
import AuditoriaManualCard from './components/AuditoriaManualCard';
import { Timestamp } from 'firebase/firestore';
import Swal from 'sweetalert2';

/**
 * Componente principal para gestión de auditorías manuales
 */
export default function AuditoriasManuales() {
  const { userProfile, userEmpresas, userSucursales } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [auditorias, setAuditorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingAuditoria, setEditingAuditoria] = useState(null);

  // Filtros
  const [filterEmpresa, setFilterEmpresa] = useState('');
  const [filterSucursal, setFilterSucursal] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterFechaDesde, setFilterFechaDesde] = useState('');
  const [filterFechaHasta, setFilterFechaHasta] = useState('');

  // Sucursales filtradas por empresa
  const sucursalesFiltradas = filterEmpresa
    ? (userSucursales || []).filter(s => s.empresaId === filterEmpresa)
    : [];

  useEffect(() => {
    if (userProfile?.ownerId) {
      loadAuditorias();
    }
  }, [userProfile?.ownerId, filterEmpresa, filterSucursal, filterEstado, filterFechaDesde, filterFechaHasta]);

  // Auto-seleccionar empresa si solo hay una
  useEffect(() => {
    if (userEmpresas && userEmpresas.length === 1 && !filterEmpresa) {
      setFilterEmpresa(userEmpresas[0].id);
    }
  }, [userEmpresas, filterEmpresa]);

  const loadAuditorias = async () => {
    if (!userProfile?.ownerId) return;

    setLoading(true);
    setError(null);

    try {
      const filters = {};

      if (filterEmpresa) {
        filters.empresaId = filterEmpresa;
      }

      if (filterSucursal) {
        filters.sucursalId = filterSucursal;
      }

      if (filterEstado) {
        filters.estado = filterEstado;
      }

      if (filterFechaDesde) {
        filters.fechaDesde = Timestamp.fromDate(new Date(filterFechaDesde));
      }

      if (filterFechaHasta) {
        filters.fechaHasta = Timestamp.fromDate(new Date(filterFechaHasta));
      }

      const data = await auditoriaManualService.obtenerAuditoriasManuales(
        userProfile.ownerId,
        filters
      );

      setAuditorias(data);
    } catch (err) {
      console.error('Error al cargar auditorías:', err);
      setError('Error al cargar las auditorías manuales');
    } finally {
      setLoading(false);
    }
  };

  const handleNewAuditoria = () => {
    setEditingAuditoria(null);
    setFormOpen(true);
  };

  const handleEdit = (auditoriaId) => {
    const auditoria = auditorias.find(a => a.id === auditoriaId);
    if (auditoria) {
      setEditingAuditoria(auditoria);
      setFormOpen(true);
    }
  };

  const handleVer = (auditoriaId) => {
    navigate(`/auditorias-manuales/${auditoriaId}`);
  };

  const handleCerrar = async (auditoriaId) => {
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

    try {
      await auditoriaManualService.cerrarAuditoriaManual(
        userProfile.ownerId,
        auditoriaId,
        userProfile
      );

      await loadAuditorias();

      Swal.fire({
        icon: 'success',
        title: 'Auditoría cerrada',
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
    }
  };

  const handleSave = () => {
    setFormOpen(false);
    setEditingAuditoria(null);
    loadAuditorias();
  };

  if (!userProfile?.ownerId) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="warning">Cargando información del usuario...</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: isMobile ? 2 : 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Auditorías Manuales
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleNewAuditoria}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5568d3 0%, #65408b 100%)',
              }
            }}
          >
            Nueva Auditoría Manual
          </Button>
        </Box>

        {/* Filtros */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                select
                label="Empresa"
                value={filterEmpresa}
                onChange={(e) => {
                  setFilterEmpresa(e.target.value);
                  setFilterSucursal(''); // Limpiar sucursal al cambiar empresa
                }}
                size="small"
              >
                <MenuItem value="">Todas</MenuItem>
                {(userEmpresas || []).map((empresa) => (
                  <MenuItem key={empresa.id} value={empresa.id}>
                    {empresa.nombre}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                select
                label="Sucursal"
                value={filterSucursal}
                onChange={(e) => setFilterSucursal(e.target.value)}
                size="small"
                disabled={!filterEmpresa}
              >
                <MenuItem value="">Todas</MenuItem>
                {sucursalesFiltradas.map((sucursal) => (
                  <MenuItem key={sucursal.id} value={sucursal.id}>
                    {sucursal.nombre}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                select
                label="Estado"
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
                size="small"
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="abierta">Abierta</MenuItem>
                <MenuItem value="cerrada">Cerrada</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                type="date"
                label="Fecha Desde"
                value={filterFechaDesde}
                onChange={(e) => setFilterFechaDesde(e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                type="date"
                label="Fecha Hasta"
                value={filterFechaHasta}
                onChange={(e) => setFilterFechaHasta(e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>
          </Grid>
        </Paper>
      </Box>

      {/* Contenido */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : auditorias.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            No hay auditorías manuales
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Crea tu primera auditoría manual usando el botón "Nueva Auditoría Manual"
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleNewAuditoria}
          >
            Crear Auditoría Manual
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {auditorias.map((auditoria) => (
            <Grid item xs={12} sm={6} md={4} key={auditoria.id}>
              <AuditoriaManualCard
                auditoria={auditoria}
                onVer={handleVer}
                onEditar={handleEdit}
                onCerrar={handleCerrar}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Dialog de formulario */}
      {formOpen && (
        <AuditoriaManualForm
          open={formOpen}
          onClose={() => {
            setFormOpen(false);
            setEditingAuditoria(null);
          }}
          onSave={handleSave}
          auditoria={editingAuditoria}
        />
      )}
    </Container>
  );
}
