import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  Chip,
  Button,
  Divider,
  Tabs,
  Tab,
  Paper,
  Stack,
  CircularProgress,
  IconButton
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Edit as EditIcon,
  CalendarMonth as CalendarIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { registrosAsistenciaService } from '../../../../services/registrosAsistenciaService';
import { capacitacionService } from '../../../../services/capacitacionService';
import { useAuth } from '../../../context/AuthContext';

/* ===================== Utils ===================== */

const formatDate = (date) => {
  if (!date) return 'N/A';
  try {
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

/* ===================== Tab Panels ===================== */

/**
 * Tab: Resumen
 * Muestra estadísticas calculadas desde registrosAsistencia
 */
const TabResumen = ({ capacitacionId, userId }) => {
  const [stats, setStats] = useState({
    totalRegistros: 0,
    totalEmpleados: 0,
    totalEvidencias: 0,
    loading: true
  });

  useEffect(() => {
    if (!capacitacionId || !userId) {
      setStats(prev => ({ ...prev, loading: false }));
      return;
    }

    let mounted = true;

    const loadStats = async () => {
      try {
        const [registros, empleadosUnicos, imagenes] = await Promise.all([
          registrosAsistenciaService.getRegistrosByCapacitacion(userId, capacitacionId),
          registrosAsistenciaService.getEmpleadosUnicosByCapacitacion(userId, capacitacionId),
          registrosAsistenciaService.getImagenesByCapacitacion(userId, capacitacionId)
        ]);

        if (mounted) {
          setStats({
            totalRegistros: registros.length,
            totalEmpleados: empleadosUnicos.length,
            totalEvidencias: imagenes.length,
            loading: false
          });
        }
      } catch (error) {
        console.error('Error cargando resumen:', error);
        if (mounted) {
          setStats(prev => ({ ...prev, loading: false }));
        }
      }
    };

    loadStats();
    return () => { mounted = false; };
  }, [capacitacionId, userId]);

  if (stats.loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Resumen de Asistencia
      </Typography>
      
      <Stack spacing={2}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Total de Registros
          </Typography>
          <Typography variant="h4">
            {stats.totalRegistros}
          </Typography>
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Empleados Únicos
          </Typography>
          <Typography variant="h4">
            {stats.totalEmpleados}
          </Typography>
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Total de Evidencias
          </Typography>
          <Typography variant="h4">
            {stats.totalEvidencias}
          </Typography>
        </Paper>
      </Stack>
    </Box>
  );
};

/**
 * Tab: Registros de Asistencia
 * Lista de registros con empleados e imágenes asociadas
 */
const TabRegistros = ({ capacitacionId, userId }) => {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!capacitacionId || !userId) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const loadRegistros = async () => {
      try {
        const data = await registrosAsistenciaService.getRegistrosByCapacitacion(
          userId,
          capacitacionId
        );

        if (mounted) {
          setRegistros(data);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error cargando registros:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadRegistros();
    return () => { mounted = false; };
  }, [capacitacionId, userId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (registros.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="text.secondary">
          No hay registros de asistencia para esta capacitación
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Registros de Asistencia ({registros.length})
      </Typography>

      <Stack spacing={2}>
        {registros.map((registro) => (
          <Paper key={registro.id} sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="subtitle2">
                Registro del {formatDate(registro.fecha)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ID: {registro.id}
              </Typography>
            </Box>

            <Divider sx={{ my: 1 }} />

            <Box sx={{ mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Empleados: {registro.empleadoIds?.length || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Evidencias: {registro.imagenes?.length || 0}
              </Typography>
            </Box>

            {/* TODO: Resolver datos desde empleadosService */}
            {registro.empleadoIds && registro.empleadoIds.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  IDs: {registro.empleadoIds.join(', ')}
                </Typography>
              </Box>
            )}
          </Paper>
        ))}
      </Stack>
    </Box>
  );
};

/**
 * Tab: Evidencias
 * Grilla de imágenes con contexto del registro
 */
const TabEvidencias = ({ capacitacionId, userId }) => {
  const [imagenes, setImagenes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!capacitacionId || !userId) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const loadEvidencias = async () => {
      try {
        const data = await registrosAsistenciaService.getImagenesByCapacitacion(
          userId,
          capacitacionId
        );

        if (mounted) {
          setImagenes(data);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error cargando evidencias:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadEvidencias();
    return () => { mounted = false; };
  }, [capacitacionId, userId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (imagenes.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="text.secondary">
          No hay evidencias para esta capacitación
        </Typography>
      </Box>
    );
  }

  const handleDescargar = (imagen) => {
    const shareToken = imagen.shareToken;
    
    if (!shareToken) {
      console.warn('Imagen sin shareToken:', imagen);
      return;
    }

    // URL de descarga de ControlFile
    const downloadUrl = `https://files.controldoc.app/api/shares/${shareToken}/download`;
    
    // Abrir en nueva pestaña para forzar descarga
    window.open(downloadUrl, '_blank');
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Evidencias ({imagenes.length})
      </Typography>

      <Stack spacing={2}>
        {imagenes.map((imagen, index) => {
          const shareToken = imagen.shareToken;
          const tieneShareToken = shareToken && typeof shareToken === 'string' && shareToken.trim() !== '';

          return (
            <Paper key={imagen.id || index} sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {imagen.nombre || `Imagen ${index + 1}`}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDate(imagen.createdAt)}
                </Typography>
              </Box>

              <Divider sx={{ my: 1 }} />

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Registro ID: {imagen.registroId || 'N/A'}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  Fecha registro: {formatDate(imagen.registroFecha)}
                </Typography>
                {imagen.empleadoIds && imagen.empleadoIds.length > 0 && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    Empleados asociados: {imagen.empleadoIds.length}
                  </Typography>
                )}
              </Box>

              {/* Botón de descarga */}
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                {tieneShareToken ? (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleDescargar(imagen)}
                  >
                    Descargar
                  </Button>
                ) : (
                  <Chip
                    label="No disponible"
                    size="small"
                    color="default"
                    variant="outlined"
                  />
                )}
              </Box>
            </Paper>
          );
        })}
      </Stack>
    </Box>
  );
};

/**
 * Tab: Empleados
 * Tabla de empleados con conteo de asistencias
 */
const TabEmpleados = ({ capacitacionId, userId }) => {
  const [empleadosData, setEmpleadosData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!capacitacionId || !userId) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const loadEmpleados = async () => {
      try {
        // Obtener empleados únicos
        const empleadoIds = await registrosAsistenciaService.getEmpleadosUnicosByCapacitacion(
          userId,
          capacitacionId
        );

        // Obtener registros para contar asistencias por empleado
        const registros = await registrosAsistenciaService.getRegistrosByCapacitacion(
          userId,
          capacitacionId
        );

        // Contar asistencias por empleado
        const conteoAsistencias = {};
        registros.forEach(reg => {
          if (reg.empleadoIds) {
            reg.empleadoIds.forEach(empId => {
              conteoAsistencias[empId] = (conteoAsistencias[empId] || 0) + 1;
            });
          }
        });

        // Formatear datos
        const empleadosConConteo = empleadoIds.map(empId => ({
          id: empId,
          asistencias: conteoAsistencias[empId] || 0
        }));

        if (mounted) {
          setEmpleadosData(empleadosConConteo);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error cargando empleados:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadEmpleados();
    return () => { mounted = false; };
  }, [capacitacionId, userId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (empleadosData.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="text.secondary">
          No hay empleados registrados en esta capacitación
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Empleados ({empleadosData.length})
      </Typography>

      <Stack spacing={1}>
        {empleadosData.map((emp) => (
          <Paper key={emp.id} sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  ID: {emp.id}
                </Typography>
                {/* TODO: Resolver datos desde empleadosService */}
              </Box>
              <Chip
                label={`${emp.asistencias} registro${emp.asistencias !== 1 ? 's' : ''}`}
                size="small"
                color="primary"
                variant="outlined"
              />
            </Box>
          </Paper>
        ))}
      </Stack>
    </Box>
  );
};

/* ===================== Main Component ===================== */

/**
 * Panel lateral de detalle de capacitación
 * Muestra información completa desde registrosAsistencia
 */
const CapacitacionDetailPanel = ({
  open,
  onClose,
  capacitacionId,
  onRegistrarAsistencia,
  onMarcarCompletada,
  onEditarPlan,
  onRealizarCapacitacion
}) => {
  const { userProfile } = useAuth();
  const [capacitacion, setCapacitacion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (!open || !capacitacionId || !userProfile?.uid) {
      setCapacitacion(null);
      setLoading(false);
      return;
    }

    let mounted = true;

    const loadCapacitacion = async () => {
      try {
        const data = await capacitacionService.getCapacitacionById(
          userProfile.uid,
          capacitacionId,
          false // No calcular empleados aquí, se hace en tabs
        );

        if (mounted) {
          setCapacitacion(data);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error cargando capacitación:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadCapacitacion();
    return () => { mounted = false; };
  }, [open, capacitacionId, userProfile?.uid]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const renderAcciones = () => {
    if (!capacitacion) return null;

    if (capacitacion.estado === 'plan_anual') {
      return (
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => {
              onEditarPlan?.(capacitacion.originalPlan || capacitacion);
              onClose();
            }}
          >
            Editar Plan
          </Button>
          <Button
            size="small"
            variant="contained"
            startIcon={<CalendarIcon />}
            onClick={() => {
              onRealizarCapacitacion?.(capacitacion.originalPlan || capacitacion);
              onClose();
            }}
          >
            Realizar
          </Button>
        </Stack>
      );
    }

    if (capacitacion.estado === 'activa') {
      return (
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant="contained"
            onClick={() => {
              onRegistrarAsistencia?.(capacitacionId);
              onClose();
            }}
          >
            Registrar Asistencia
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<CheckCircleIcon />}
            onClick={() => {
              onMarcarCompletada?.(capacitacionId);
              onClose();
            }}
          >
            Completar
          </Button>
        </Stack>
      );
    }

    return null;
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 600, md: 700 },
          maxWidth: '90vw'
        }
      }}
    >
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : !capacitacion ? (
        <Box sx={{ p: 3 }}>
          <Typography color="error">
            Capacitación no encontrada
          </Typography>
        </Box>
      ) : (
        <>
          {/* Header */}
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                  {capacitacion.nombre}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <Chip
                    label={capacitacion.estado || 'N/A'}
                    color={getEstadoColor(capacitacion.estado)}
                    size="small"
                  />
                  {capacitacion.tipo && (
                    <Chip
                      label={capacitacion.tipo}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Box>
              </Box>
              <IconButton onClick={onClose} size="small">
                <CloseIcon />
              </IconButton>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Información básica */}
            <Stack spacing={1}>
              <Typography variant="body2">
                <strong>Fecha:</strong> {formatDate(capacitacion.fechaRealizada)}
              </Typography>
              <Typography variant="body2">
                <strong>Instructor:</strong> {capacitacion.instructor || 'N/A'}
              </Typography>
              {capacitacion.descripcion && (
                <Typography variant="body2" color="text.secondary">
                  {capacitacion.descripcion}
                </Typography>
              )}
            </Stack>

            {/* Acciones */}
            <Box sx={{ mt: 2 }}>
              {renderAcciones()}
            </Box>
          </Box>

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={handleTabChange}>
              <Tab label="Resumen" id="tab-resumen" />
              <Tab label="Registros" id="tab-registros" />
              <Tab label="Evidencias" id="tab-evidencias" />
              <Tab label="Empleados" id="tab-empleados" />
            </Tabs>
          </Box>

          {/* Tab Content */}
          <Box sx={{ flex: 1, overflowY: 'auto' }}>
            {activeTab === 0 && (
              <TabResumen
                capacitacionId={capacitacionId}
                userId={userProfile?.uid}
              />
            )}
            {activeTab === 1 && (
              <TabRegistros
                capacitacionId={capacitacionId}
                userId={userProfile?.uid}
              />
            )}
            {activeTab === 2 && (
              <TabEvidencias
                capacitacionId={capacitacionId}
                userId={userProfile?.uid}
              />
            )}
            {activeTab === 3 && (
              <TabEmpleados
                capacitacionId={capacitacionId}
                userId={userProfile?.uid}
              />
            )}
          </Box>
        </>
      )}
    </Drawer>
  );
};

export default CapacitacionDetailPanel;
