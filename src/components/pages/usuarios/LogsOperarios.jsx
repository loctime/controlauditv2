import React, { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Collapse,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TablePagination
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { collection, getDocs, query, orderBy, limit, where, addDoc } from 'firebase/firestore';
import { db } from '../../../firebaseAudit';

// Configuración de tipos de acciones
const TIPOS_ACCIONES = {
  crear: { label: 'Crear', color: 'success', icon: <CheckCircleIcon /> },
  editar: { label: 'Editar', color: 'info', icon: <InfoIcon /> },
  eliminar: { label: 'Eliminar', color: 'error', icon: <ErrorIcon /> },
  ver: { label: 'Ver', color: 'default', icon: <InfoIcon /> },
  login: { label: 'Inicio de Sesión', color: 'primary', icon: <PersonIcon /> },
  logout: { label: 'Cerrar Sesión', color: 'warning', icon: <WarningIcon /> },
  general: { label: 'General', color: 'default', icon: <SettingsIcon /> }
};

// Configuración de entidades
const ENTIDADES = {
  usuario: { label: 'Usuario', icon: <PersonIcon /> },
  empresa: { label: 'Empresa', icon: <BusinessIcon /> },
  auditoria: { label: 'Auditoría', icon: <AssessmentIcon /> },
  formulario: { label: 'Formulario', icon: <SettingsIcon /> }
};

const LogsOperarios = () => {
  const { role, userProfile } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usuarios, setUsuarios] = useState({});
  const [filtros, setFiltros] = useState({
    busqueda: '',
    tipo: 'todos',
    entidad: 'todas',
    severidad: 'todas',
    fechaDesde: '',
    fechaHasta: ''
  });
  const [expandedRows, setExpandedRows] = useState({});
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(200);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const logsRef = collection(db, 'logs_operarios');
      let qLogs;
      
      // Filtrar logs según el rol del usuario actual
      if (role === 'supermax') {
        // Super administradores ven todos los logs
        qLogs = query(logsRef, orderBy('fecha', 'desc'), limit(400));
      } else if (role === 'max') {
        // Clientes administradores ven sus logs y los de sus operarios
        // Primero obtener los IDs de sus operarios
        const usuariosRef = collection(db, 'apps', 'audit', 'users');
        const qOperarios = query(usuariosRef, where('clienteAdminId', '==', userProfile?.uid));
        const snapshotOperarios = await getDocs(qOperarios);
        const operariosIds = snapshotOperarios.docs.map(doc => doc.id);
        
        // Agregar el propio ID del administrador
        const todosLosIds = [userProfile?.uid, ...operariosIds];
        
        // Crear consulta con filtro de usuarios
        qLogs = query(
          logsRef, 
          where('userId', 'in', todosLosIds),
          orderBy('fecha', 'desc'), 
          limit(400)
        );
      } else {
        // Operarios ven solo sus propios logs
        qLogs = query(
          logsRef, 
          where('userId', '==', userProfile?.uid),
          orderBy('fecha', 'desc'), 
          limit(400)
        );
      }
      
      const snapshot = await getDocs(qLogs);
      const logsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLogs(logsData);

      // Obtener información de usuarios para mostrar nombres
      const usuariosRef = collection(db, 'apps', 'audit', 'users');
      const usuariosSnapshot = await getDocs(usuariosRef);
      const usuariosData = {};
      usuariosSnapshot.docs.forEach(doc => {
        usuariosData[doc.id] = doc.data();
      });
      setUsuarios(usuariosData);
    } catch (e) {
      console.error('Error al cargar logs:', e);
      toast.error('Error al cargar logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Verificar permisos multi-tenant
  if (role !== 'max' && role !== 'supermax') {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Acceso restringido solo para administradores (max) y super administradores (supermax).
        </Alert>
      </Box>
    );
  }

  // Handlers para paginación
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Filtrar logs según los filtros aplicados
  const logsFiltrados = logs.filter(log => {
    // Filtro de búsqueda
    if (filtros.busqueda) {
      const busqueda = filtros.busqueda.toLowerCase();
      const usuarioNombre = usuarios[log.userId]?.displayName || log.userId;
      const accion = log.accion.toLowerCase();
      const detalles = JSON.stringify(log.detalles).toLowerCase();

      if (!usuarioNombre.toLowerCase().includes(busqueda) &&
          !accion.includes(busqueda) &&
          !detalles.includes(busqueda)) {
        return false;
      }
    }

    // Filtro por tipo
    if (filtros.tipo !== 'todos' && log.tipo !== filtros.tipo) {
      return false;
    }

    // Filtro por entidad
    if (filtros.entidad !== 'todas' && log.entidad !== filtros.entidad) {
      return false;
    }

    // Filtro por severidad
    if (filtros.severidad !== 'todas' && log.severidad !== filtros.severidad) {
      return false;
    }

    // Filtro por fecha
    if (filtros.fechaDesde) {
      const fechaDesde = new Date(filtros.fechaDesde);
      const fechaLog = log.fecha?.toDate?.() || new Date(log.timestamp);
      if (fechaLog < fechaDesde) return false;
    }

    if (filtros.fechaHasta) {
      const fechaHasta = new Date(filtros.fechaHasta);
      const fechaLog = log.fecha?.toDate?.() || new Date(log.timestamp);
      if (fechaLog > fechaHasta) return false;
    }

    return true;
  });

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
  };

  const toggleExpandedRow = (logId) => {
    setExpandedRows(prev => ({
      ...prev,
      [logId]: !prev[logId]
    }));
  };

  const getSeveridadColor = (severidad) => {
    switch (severidad) {
      case 'alta': return 'error';
      case 'media': return 'warning';
      case 'baja': return 'info';
      default: return 'default';
    }
  };

  const getTipoAccion = (log) => {
    const tipo = log.tipo || 'general';
    return TIPOS_ACCIONES[tipo] || TIPOS_ACCIONES.general;
  };

  const getEntidadInfo = (log) => {
    const entidad = log.entidad;
    return ENTIDADES[entidad] || { label: 'Desconocida', icon: <InfoIcon /> };
  };

  const formatFecha = (fecha) => {
    if (fecha?.toDate) {
      return fecha.toDate().toLocaleString('es-ES');
    }
    if (fecha) {
      return new Date(fecha).toLocaleString('es-ES');
    }
    return 'N/A';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Logs del Sistema
        </Typography>
        <IconButton onClick={fetchLogs} disabled={loading}>
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Filtros */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 2 }}>
          <Typography variant="h6" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1, fontSize: '1rem' }}>
            <FilterIcon />
            Filtros
          </Typography>
          <Grid container spacing={1.5}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                label="Buscar"
                value={filtros.busqueda}
                onChange={(e) => handleFiltroChange('busqueda', e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={filtros.tipo}
                  onChange={(e) => handleFiltroChange('tipo', e.target.value)}
                  label="Tipo"
                >
                  <MenuItem value="todos">Todos</MenuItem>
                  {Object.entries(TIPOS_ACCIONES).map(([key, value]) => (
                    <MenuItem key={key} value={key}>
                      {value.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Entidad</InputLabel>
                <Select
                  value={filtros.entidad}
                  onChange={(e) => handleFiltroChange('entidad', e.target.value)}
                  label="Entidad"
                >
                  <MenuItem value="todas">Todas</MenuItem>
                  {Object.entries(ENTIDADES).map(([key, value]) => (
                    <MenuItem key={key} value={key}>
                      {value.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Severidad</InputLabel>
                <Select
                  value={filtros.severidad}
                  onChange={(e) => handleFiltroChange('severidad', e.target.value)}
                  label="Severidad"
                >
                  <MenuItem value="todas">Todas</MenuItem>
                  <MenuItem value="alta">Alta</MenuItem>
                  <MenuItem value="media">Media</MenuItem>
                  <MenuItem value="baja">Baja</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={1}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Desde"
                value={filtros.fechaDesde}
                onChange={(e) => handleFiltroChange('fechaDesde', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={1}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Hasta"
                value={filtros.fechaHasta}
                onChange={(e) => handleFiltroChange('fechaHasta', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Estadísticas */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total de Logs
                </Typography>
                <Typography variant="h4">
                  {logsFiltrados.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Últimas 24h
                </Typography>
                <Typography variant="h4">
                  {logsFiltrados.filter(log => {
                    const fecha = log.fecha?.toDate?.() || new Date(log.timestamp);
                    return fecha > new Date(Date.now() - 24 * 60 * 60 * 1000);
                  }).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Acciones Críticas
                </Typography>
                <Typography variant="h4" color="error">
                  {logsFiltrados.filter(log => log.severidad === 'alta').length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Usuarios Activos
                </Typography>
                <Typography variant="h4" color="primary">
                  {new Set(logsFiltrados.map(log => log.userId)).size}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Tabla de Logs */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Usuario</TableCell>
                  <TableCell>Acción</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Entidad</TableCell>
                  <TableCell>Severidad</TableCell>
                  <TableCell>Detalles</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logsFiltrados
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((log) => {
                const tipoAccion = getTipoAccion(log);
                const entidadInfo = getEntidadInfo(log);
                const usuarioNombre = usuarios[log.userId]?.displayName || log.userId;

                return (
                  <React.Fragment key={log.id}>
                    <TableRow
                      hover
                      onClick={() => toggleExpandedRow(log.id)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>{formatFecha(log.fecha)}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PersonIcon fontSize="small" />
                          {usuarioNombre}
                        </Box>
                      </TableCell>
                      <TableCell>{log.accion}</TableCell>
                      <TableCell>
                        <Chip
                          icon={tipoAccion.icon}
                          label={tipoAccion.label}
                          color={tipoAccion.color}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {entidadInfo.icon}
                          {entidadInfo.label}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {log.severidad && (
                          <Chip
                            label={log.severidad.toUpperCase()}
                            color={getSeveridadColor(log.severidad)}
                            size="small"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <IconButton size="small">
                          <ExpandMoreIcon
                            sx={{
                              transform: expandedRows[log.id] ? 'rotate(180deg)' : 'rotate(0deg)',
                              transition: 'transform 0.2s'
                            }}
                          />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                        <Collapse in={expandedRows[log.id]} timeout="auto" unmountOnExit>
                          <Box sx={{ margin: 1 }}>
                            <Box sx={{ p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                              <Typography variant="subtitle2" gutterBottom sx={{ mb: 2 }}>
                                📋 Detalles del Log
                              </Typography>
                                <Grid container spacing={2}>
                                  <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2" gutterBottom color="primary">
                                      ℹ️ Información del Sistema
                                    </Typography>
                                    <Box sx={{ pl: 1 }}>
                                      <Typography variant="body2" sx={{ mb: 1 }}>
                                        <strong>Navegador:</strong> {log.browser || 'N/A'}
                                      </Typography>
                                      <Typography variant="body2" sx={{ mb: 1 }}>
                                        <strong>URL:</strong> {log.currentUrl || 'N/A'}
                                      </Typography>
                                      <Typography variant="body2" sx={{ mb: 1 }}>
                                        <strong>Referrer:</strong> {log.referrer || 'N/A'}
                                      </Typography>
                                      <Typography variant="body2">
                                        <strong>Session ID:</strong> {log.sessionId || 'N/A'}
                                      </Typography>
                                    </Box>
                                  </Grid>
                                  <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2" gutterBottom color="primary">
                                      🔍 Detalles de la Acción
                                    </Typography>
                                    <Box sx={{ pl: 1 }}>
                                    {log.detalles && Object.keys(log.detalles).length > 0 ? (
                                      <Box sx={{
                                        backgroundColor: 'white',
                                        p: 1.5,
                                        borderRadius: 1,
                                        border: '1px solid',
                                        borderColor: 'grey.300',
                                        maxHeight: 150,
                                        overflow: 'auto'
                                      }}>
                                        {Object.entries(log.detalles).map(([key, value]) => (
                                          <Typography key={key} variant="body2" sx={{ mb: 0.5 }}>
                                            <strong>{key}:</strong> {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                          </Typography>
                                        ))}
                                      </Box>
                                    ) : (
                                      <Typography variant="body2" color="textSecondary">
                                        No hay detalles adicionales
                                      </Typography>
                                    )}
                                    </Box>
                                  </Grid>
                              </Grid>
                            </Box>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                );
              })}
              {logsFiltrados.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body1" color="textSecondary">
                      No hay logs que coincidan con los filtros aplicados.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* Paginación */}
          <TablePagination
            component="div"
            count={logsFiltrados.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[200]}
            labelRowsPerPage="Registros por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          />
        </Box>
      )}
    </Box>
  );
};

// Función para registrar acciones de usuario
export const logUserAction = async (action, detalles = {}) => {
  try {
    const { userProfile } = useAuth();
    
    if (!userProfile?.uid) {
      console.warn('No se pudo registrar la acción: usuario no autenticado');
      return;
    }

    // Obtener información del navegador y sesión
    const browserInfo = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine
    };

    const logData = {
      userId: userProfile.uid,
      userEmail: userProfile.email,
      userName: userProfile.displayName || userProfile.email,
      action: action,
      detalles: detalles,
      timestamp: new Date().toISOString(),
      fecha: new Date(),
      browser: browserInfo.userAgent,
      currentUrl: window.location.href,
      referrer: document.referrer,
      sessionId: sessionStorage.getItem('sessionId') || Math.random().toString(36).substring(2),
      tipo: 'general',
      entidad: 'sistema',
      severidad: 'media'
    };

    // Determinar tipo y entidad basado en la acción
    if (action.includes('crear') || action.includes('create')) {
      logData.tipo = 'crear';
    } else if (action.includes('editar') || action.includes('edit') || action.includes('update')) {
      logData.tipo = 'editar';
    } else if (action.includes('eliminar') || action.includes('delete') || action.includes('remove')) {
      logData.tipo = 'eliminar';
      logData.severidad = 'alta';
    } else if (action.includes('login') || action.includes('logout')) {
      logData.tipo = action.includes('login') ? 'login' : 'logout';
      logData.entidad = 'usuario';
    }

    // Determinar entidad basada en los detalles
    if (detalles.empresaId || action.includes('empresa')) {
      logData.entidad = 'empresa';
    } else if (detalles.auditoriaId || action.includes('auditoria')) {
      logData.entidad = 'auditoria';
    } else if (detalles.usuarioId || action.includes('usuario')) {
      logData.entidad = 'usuario';
    }

    // Guardar en Firestore
    const logsRef = collection(db, 'logs_operarios');
    await addDoc(logsRef, logData);

    console.log('Acción registrada:', action, logData);
  } catch (error) {
    console.error('Error al registrar acción:', error);
  }
};

export default LogsOperarios; 