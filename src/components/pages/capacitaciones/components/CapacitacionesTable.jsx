import React, { useState, useEffect, useRef } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Box,
  Typography,
  useMediaQuery,
  useTheme,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  PhotoCamera as PhotoCameraIcon,
  CheckCircle as CheckCircleIcon,
  Edit as EditIcon,
  CalendarMonth as CalendarIcon,
  MoreVert as MoreVertIcon,
  PersonAdd as PersonAddIcon
} from '@mui/icons-material';
import { registrosAsistenciaService } from '../../../../services/registrosAsistenciaService';
import { useAuth } from '../../../context/AuthContext';

/* ===================== Utils ===================== */

const formatDate = (date) => {
  if (!date) return 'N/A';
  try {
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return 'N/A';
  }
};

const getEstadoColor = (estado) => {
  const e = (estado || '').toLowerCase();
  if (e === 'completada') return 'success';
  if (e === 'activa') return 'warning';
  if (e === 'plan_anual') return 'info';
  return 'default';
};

const formatEstadoLabel = (estado = '') =>
  estado.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());

/* ===================== Presentational ===================== */

const AsistentesCell = ({ count }) => (
  <Typography variant="body2">{count}</Typography>
);

const EvidenciasCell = ({ count }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
    <PhotoCameraIcon fontSize="small" color="action" />
    <Typography variant="body2">{count}</Typography>
  </Box>
);

/* ===================== Main ===================== */

const CapacitacionesTable = ({
  capacitaciones = [],
  onSelectCapacitacion,
  onRegistrarAsistencia,
  onMarcarCompletada,
  onEditarPlan,
  onRealizarCapacitacion,
  selectedEmpresa = '',
  selectedSucursal = '',
  empresas = [],
  sucursales = [],
  loading = false,
  refreshKey = 0 // Key para forzar refresh del cache
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { userProfile } = useAuth();

  /* ✅ FIX: cache centralizado */
  const statsCache = useRef({});
  const evidenciasCache = useRef({});
  const [ready, setReady] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedCapacitacion, setSelectedCapacitacion] = useState(null);

  useEffect(() => {
    if (!userProfile?.uid || capacitaciones.length === 0) {
      setReady(false);
      return;
    }

    let mounted = true;

    const loadAll = async () => {
      // Limpiar cache de capacitaciones que ya no están en la lista
      // ⚠️ IMPORTANTE: Convertir a string para comparación consistente
      const currentIds = new Set(capacitaciones.map(c => String(c.id)));
      Object.keys(statsCache.current).forEach(id => {
        if (!currentIds.has(id)) delete statsCache.current[id];
      });
      Object.keys(evidenciasCache.current).forEach(id => {
        if (!currentIds.has(id)) delete evidenciasCache.current[id];
      });

      for (const cap of capacitaciones) {
        const capIdStr = String(cap.id);
        
        // ⚠️ IMPORTANTE: Si refreshKey cambió, forzar refresh del cache (invalidar y recargar)
        const shouldRefresh = refreshKey > 0;
        
        // Si debe refrescar, limpiar el cache primero
        if (shouldRefresh) {
          delete statsCache.current[capIdStr];
          delete evidenciasCache.current[capIdStr];
        }
        
        if (!statsCache.current[capIdStr]) {
          console.log('[CapacitacionesTable] Cargando stats para:', capIdStr, { shouldRefresh, refreshKey });
          const empleados = await registrosAsistenciaService.getEmpleadosUnicosByCapacitacion(
            userProfile.uid,
            capIdStr
          );
          statsCache.current[capIdStr] = empleados.length;
          console.log('[CapacitacionesTable] Stats cargados:', { 
            capId: capIdStr, 
            empleados: empleados.length,
            empleadosData: empleados 
          });
        }

        if (!evidenciasCache.current[capIdStr]) {
          console.log('[CapacitacionesTable] Cargando evidencias para:', capIdStr, { shouldRefresh, refreshKey });
          const imgs = await registrosAsistenciaService.getImagenesByCapacitacion(
            userProfile.uid,
            capIdStr
          );
          evidenciasCache.current[capIdStr] = imgs.length;
          console.log('[CapacitacionesTable] Evidencias cargadas:', { 
            capId: capIdStr, 
            imagenes: imgs.length,
            imagenesData: imgs 
          });
        }
      }

      if (mounted) setReady(true);
    };

    loadAll();
    return () => { mounted = false; };
  }, [capacitaciones, userProfile?.uid, refreshKey]); // ⚠️ Agregar refreshKey para forzar refresh

  if (loading || !ready) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (capacitaciones.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">
          No hay capacitaciones para mostrar
        </Typography>
      </Paper>
    );
  }

  const handleMenuOpen = (e, cap) => {
    e.stopPropagation();
    setMenuAnchor(e.currentTarget);
    setSelectedCapacitacion(cap);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedCapacitacion(null);
  };

  const renderAcciones = (cap) => {
    const hasMenuActions = cap.estado === 'activa' || cap.estado === 'plan_anual';

    return (
      <Stack direction="row" spacing={0.5} alignItems="center">
        <Button 
          size="small" 
          variant="text"
          onClick={(e) => {
            e.stopPropagation();
            onSelectCapacitacion?.(cap.id);
          }}
        >
          Entrar
        </Button>
        {hasMenuActions && (
          <IconButton
            size="small"
            onClick={(e) => handleMenuOpen(e, cap)}
            sx={{ ml: 0.5 }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        )}
      </Stack>
    );
  };

  const renderMenu = () => {
    if (!selectedCapacitacion) return null;

    return (
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
      >
        {selectedCapacitacion.estado === 'activa' && (
          <>
            <MenuItem
              onClick={(e) => {
                e.stopPropagation();
                handleMenuClose();
                onRegistrarAsistencia?.(selectedCapacitacion.id);
              }}
            >
              <PersonAddIcon fontSize="small" sx={{ mr: 1 }} />
              Registrar asistencia
            </MenuItem>
            <MenuItem
              onClick={(e) => {
                e.stopPropagation();
                handleMenuClose();
                onMarcarCompletada?.(selectedCapacitacion.id);
              }}
            >
              <CheckCircleIcon fontSize="small" sx={{ mr: 1 }} />
              Completar capacitación
            </MenuItem>
          </>
        )}
        {selectedCapacitacion.estado === 'plan_anual' && (
          <>
            <MenuItem
              onClick={(e) => {
                e.stopPropagation();
                handleMenuClose();
                onEditarPlan?.(selectedCapacitacion.originalPlan || selectedCapacitacion);
              }}
            >
              <EditIcon fontSize="small" sx={{ mr: 1 }} />
              Editar
            </MenuItem>
            <MenuItem
              onClick={(e) => {
                e.stopPropagation();
                handleMenuClose();
                onRealizarCapacitacion?.(selectedCapacitacion.originalPlan || selectedCapacitacion);
              }}
            >
              <CalendarIcon fontSize="small" sx={{ mr: 1 }} />
              Realizar
            </MenuItem>
          </>
        )}
      </Menu>
    );
  };

  const renderRow = (cap) => {
    const empresa = empresas.find(e => e.id === cap.empresaId)?.nombre || 'N/A';
    const sucursal = sucursales.find(s => s.id === cap.sucursalId)?.nombre || 'N/A';
    // ⚠️ IMPORTANTE: Usar string para acceder al cache (debe coincidir con cómo se guarda)
    const capIdStr = String(cap.id);

    return (
      <TableRow key={cap.id} hover>
        <TableCell>
          <Typography variant="subtitle2" fontWeight={600}>
            {cap.nombre}
          </Typography>
        </TableCell>
        {!selectedEmpresa && (
          <TableCell>
            <Typography variant="body2" color="text.secondary">
              {empresa}
            </Typography>
          </TableCell>
        )}
        {!selectedEmpresa && !selectedSucursal && (
          <TableCell>
            <Typography variant="body2" color="text.secondary">
              {sucursal}
            </Typography>
          </TableCell>
        )}
        <TableCell>
          <Chip label={formatEstadoLabel(cap.estado)} size="small" color={getEstadoColor(cap.estado)} />
        </TableCell>
        <TableCell>
          <Typography variant="body2" color="text.secondary">
            {formatDate(cap.fechaRealizada)}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2" color="text.secondary">
            {cap.instructor || 'N/A'}
          </Typography>
        </TableCell>
        <TableCell align="center">
          <AsistentesCell count={statsCache.current[capIdStr] || 0} />
        </TableCell>
        <TableCell align="center">
          <EvidenciasCell count={evidenciasCache.current[capIdStr] || 0} />
        </TableCell>
        <TableCell onClick={(e) => e.stopPropagation()}>
          {renderAcciones(cap)}
        </TableCell>
      </TableRow>
    );
  };

  if (!isMobile) {
    return (
      <>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Nombre</strong></TableCell>
                {!selectedEmpresa && <TableCell><strong>Empresa</strong></TableCell>}
                {!selectedEmpresa && !selectedSucursal && <TableCell><strong>Sucursal</strong></TableCell>}
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell><strong>Fecha</strong></TableCell>
                <TableCell><strong>Instructor</strong></TableCell>
                <TableCell align="center"><strong>Asist</strong></TableCell>
                <TableCell align="center"><strong>Evid</strong></TableCell>
                <TableCell><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {capacitaciones.map(renderRow)}
            </TableBody>
          </Table>
        </TableContainer>
        {renderMenu()}
      </>
    );
  }

  /* Mobile */
  return (
    <>
      <Box>
        {capacitaciones.map(cap => {
          const empresa = empresas.find(e => e.id === cap.empresaId)?.nombre || 'N/A';
          const sucursal = sucursales.find(s => s.id === cap.sucursalId)?.nombre || 'N/A';
          // ⚠️ IMPORTANTE: Usar string para acceder al cache (debe coincidir con cómo se guarda)
          const capIdStr = String(cap.id);
          
          return (
            <Accordion key={cap.id}>
              <AccordionSummary 
                expandIcon={<ExpandMoreIcon />}
              >
                <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {cap.nombre}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                      <Chip
                        label={formatEstadoLabel(cap.estado || 'N/A')}
                        size="small"
                        color={getEstadoColor(cap.estado)}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(cap.fechaRealizada)}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">
                      {statsCache.current[capIdStr] || 0}
                    </Typography>
                    <EvidenciasCell count={evidenciasCache.current[capIdStr] || 0} />
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Instructor:</strong> {cap.instructor || 'N/A'}
                    </Typography>
                    {!selectedEmpresa && (
                      <Typography variant="body2" color="text.secondary">
                        <strong>Empresa:</strong> {empresa}
                      </Typography>
                    )}
                    {!selectedEmpresa && !selectedSucursal && (
                      <Typography variant="body2" color="text.secondary">
                        <strong>Sucursal:</strong> {sucursal}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }} onClick={(e) => e.stopPropagation()}>
                    {renderAcciones(cap)}
                  </Box>
                </Box>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Box>
      {renderMenu()}
    </>
  );
};

export default CapacitacionesTable;
