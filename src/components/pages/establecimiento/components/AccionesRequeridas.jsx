import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Stack,
  Collapse
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
  PlayArrow as PlayArrowIcon,
  Comment as CommentIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import AccionesRequeridasService from '../../../../services/accionesRequeridasService';
import { useAuth } from '../../../context/AuthContext';
import { dbAudit } from '../../../../firebaseControlFile';
import { firestoreRoutesCore } from '../../../../core/firestore/firestoreRoutes.core';
import { doc, collection } from 'firebase/firestore';
import dayjs from 'dayjs';

const AccionesRequeridas = ({ sucursalId, sucursalNombre }) => {
  const { userProfile } = useAuth();
  const [acciones, setAcciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('todas');
  const [accionSeleccionada, setAccionSeleccionada] = useState(null);
  const [dialogAbierto, setDialogAbierto] = useState(false);
  const [dialogTipo, setDialogTipo] = useState('estado'); // 'estado', 'comentario', 'modificacion'
  const [textoDialog, setTextoDialog] = useState('');
  const [accionesExpandidas, setAccionesExpandidas] = useState(new Set());

  useEffect(() => {
    if (sucursalId) {
      cargarAcciones();
    }
  }, [sucursalId, filtroEstado]);

  const cargarAcciones = async () => {
    if (!sucursalId) return;
    
    setLoading(true);
    try {
      if (!userProfile?.ownerId) {
        throw new Error('ownerId no disponible');
      }
      const ownerId = userProfile.ownerId;
      const sucursalDocRef = doc(dbAudit, ...firestoreRoutesCore.sucursal(ownerId, sucursalId));
      const accionesCollectionRef = collection(sucursalDocRef, 'acciones_requeridas');
      
      const filtros = filtroEstado !== 'todas' ? { estado: filtroEstado } : {};
      const accionesData = await AccionesRequeridasService.obtenerAccionesPorSucursal(accionesCollectionRef, filtros);
      setAcciones(accionesData);
    } catch (error) {
      console.error('Error cargando acciones requeridas:', error);
    } finally {
      setLoading(false);
    }
  };

  const obtenerColorEstado = (estado) => {
    switch (estado) {
      case 'pendiente':
        return 'warning';
      case 'en_proceso':
        return 'info';
      case 'completada':
        return 'success';
      case 'cancelada':
        return 'error';
      default:
        return 'default';
    }
  };

  const obtenerIconoEstado = (estado) => {
    switch (estado) {
      case 'pendiente':
        return <PendingIcon />;
      case 'en_proceso':
        return <PlayArrowIcon />;
      case 'completada':
        return <CheckCircleIcon />;
      case 'cancelada':
        return <CancelIcon />;
      default:
        return null;
    }
  };

  const obtenerTextoEstado = (estado) => {
    switch (estado) {
      case 'pendiente':
        return 'Pendiente';
      case 'en_proceso':
        return 'En Proceso';
      case 'completada':
        return 'Completada';
      case 'cancelada':
        return 'Cancelada';
      default:
        return estado;
    }
  };

  const estaVencida = (fechaVencimiento) => {
    if (!fechaVencimiento) return false;
    const fecha = fechaVencimiento.toDate ? fechaVencimiento.toDate() : new Date(fechaVencimiento);
    return fecha < new Date() && fecha.getTime() !== 0;
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    const fechaObj = fecha.toDate ? fecha.toDate() : new Date(fecha);
    return dayjs(fechaObj).format('DD/MM/YYYY');
  };

  const handleCambiarEstado = (accion) => {
    setAccionSeleccionada(accion);
    setDialogTipo('estado');
    setTextoDialog('');
    setDialogAbierto(true);
  };

  const handleAgregarComentario = (accion) => {
    setAccionSeleccionada(accion);
    setDialogTipo('comentario');
    setTextoDialog('');
    setDialogAbierto(true);
  };

  const handleGuardarDialog = async () => {
    if (!accionSeleccionada || !textoDialog.trim()) return;

    try {
      if (!userProfile?.ownerId) {
        throw new Error('ownerId no disponible');
      }
      
      const ownerId = userProfile.ownerId;
      const sucursalDocRef = doc(dbAudit, ...firestoreRoutesCore.sucursal(ownerId, sucursalId));
      const accionesCollectionRef = collection(sucursalDocRef, 'acciones_requeridas');
      const accionDocRef = doc(accionesCollectionRef, accionSeleccionada.id);
      
      if (dialogTipo === 'estado') {
        await AccionesRequeridasService.actualizarEstadoAccion(
          accionDocRef,
          textoDialog,
          ownerId,
          userProfile?.displayName || userProfile?.email,
          null
        );
      } else if (dialogTipo === 'comentario') {
        await AccionesRequeridasService.agregarComentarioAccion(
          accionDocRef,
          textoDialog,
          ownerId,
          userProfile?.displayName || userProfile?.email
        );
      }

      setDialogAbierto(false);
      setTextoDialog('');
      setAccionSeleccionada(null);
      await cargarAcciones();
    } catch (error) {
      console.error('Error guardando:', error);
      alert('Error al guardar. Por favor, intente nuevamente.');
    }
  };

  const toggleExpandirAccion = (accionId) => {
    const nuevasExpandidas = new Set(accionesExpandidas);
    if (nuevasExpandidas.has(accionId)) {
      nuevasExpandidas.delete(accionId);
    } else {
      nuevasExpandidas.add(accionId);
    }
    setAccionesExpandidas(nuevasExpandidas);
  };

  if (!sucursalId) {
    return (
      <Alert severity="info">
        Seleccione una sucursal para ver las acciones requeridas
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Acciones Requeridas - {sucursalNombre}
        </Typography>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Filtrar por estado</InputLabel>
          <Select
            value={filtroEstado}
            label="Filtrar por estado"
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <MenuItem value="todas">Todas</MenuItem>
            <MenuItem value="pendiente">Pendientes</MenuItem>
            <MenuItem value="en_proceso">En Proceso</MenuItem>
            <MenuItem value="completada">Completadas</MenuItem>
            <MenuItem value="cancelada">Canceladas</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : acciones.length === 0 ? (
        <Alert severity="info">
          No hay acciones requeridas {filtroEstado !== 'todas' ? `con estado "${obtenerTextoEstado(filtroEstado)}"` : ''}
        </Alert>
      ) : (
        <Stack spacing={2}>
          {acciones.map((accion) => {
            const expandida = accionesExpandidas.has(accion.id);
            const vencida = estaVencida(accion.fechaVencimiento);
            
            return (
              <Card key={accion.id} variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Pregunta: {accion.preguntaTexto}
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                        {accion.accionTexto}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                        <Chip
                          icon={obtenerIconoEstado(accion.estado)}
                          label={obtenerTextoEstado(accion.estado)}
                          color={obtenerColorEstado(accion.estado)}
                          size="small"
                        />
                        {vencida && accion.estado !== 'completada' && accion.estado !== 'cancelada' && (
                          <Chip
                            icon={<WarningIcon />}
                            label="Vencida"
                            color="error"
                            size="small"
                          />
                        )}
                        {accion.fechaVencimiento && (
                          <Chip
                            label={`Vence: ${formatearFecha(accion.fechaVencimiento)}`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                        <Chip
                          label={`Creada: ${formatearFecha(accion.fechaCreacion)}`}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => toggleExpandirAccion(accion.id)}
                    >
                      {expandida ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </Box>

                  <Collapse in={expandida}>
                    <Box sx={{ mt: 2 }}>
                      <Divider sx={{ mb: 2 }} />
                      
                      {accion.comentarios && accion.comentarios.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Comentarios ({accion.comentarios.length})
                          </Typography>
                          <List dense>
                            {accion.comentarios.map((comentario, idx) => (
                              <ListItem key={idx}>
                                <ListItemText
                                  primary={comentario.texto}
                                  secondary={`${comentario.usuarioNombre || 'Usuario'} - ${formatearFecha(comentario.fecha)}`}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      )}

                      {accion.modificaciones && accion.modificaciones.length > 0 && (
                        <Box>
                          <Typography variant="subtitle2" gutterBottom>
                            Modificaciones ({accion.modificaciones.length})
                          </Typography>
                          <List dense>
                            {accion.modificaciones.map((modificacion, idx) => (
                              <ListItem key={idx}>
                                <ListItemText
                                  primary={modificacion.texto}
                                  secondary={`${modificacion.usuarioNombre || 'Usuario'} - ${formatearFecha(modificacion.fecha)}`}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      )}
                    </Box>
                  </Collapse>
                </CardContent>
                <CardActions>
                  {accion.estado !== 'completada' && accion.estado !== 'cancelada' && (
                    <>
                      <Button
                        size="small"
                        startIcon={<PlayArrowIcon />}
                        onClick={() => handleCambiarEstado(accion)}
                      >
                        Cambiar Estado
                      </Button>
                      <Button
                        size="small"
                        startIcon={<CommentIcon />}
                        onClick={() => handleAgregarComentario(accion)}
                      >
                        Agregar Comentario
                      </Button>
                    </>
                  )}
                </CardActions>
              </Card>
            );
          })}
        </Stack>
      )}

      {/* Dialog para cambiar estado o agregar comentario */}
      <Dialog open={dialogAbierto} onClose={() => setDialogAbierto(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogTipo === 'estado' ? 'Cambiar Estado' : 'Agregar Comentario'}
        </DialogTitle>
        <DialogContent>
          {dialogTipo === 'estado' ? (
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Nuevo Estado</InputLabel>
              <Select
                value={textoDialog}
                label="Nuevo Estado"
                onChange={(e) => setTextoDialog(e.target.value)}
              >
                <MenuItem value="pendiente">Pendiente</MenuItem>
                <MenuItem value="en_proceso">En Proceso</MenuItem>
                <MenuItem value="completada">Completada</MenuItem>
                <MenuItem value="cancelada">Cancelada</MenuItem>
              </Select>
            </FormControl>
          ) : (
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Comentario"
              value={textoDialog}
              onChange={(e) => setTextoDialog(e.target.value)}
              sx={{ mt: 2 }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogAbierto(false)}>Cancelar</Button>
          <Button
            onClick={handleGuardarDialog}
            variant="contained"
            disabled={!textoDialog.trim()}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AccionesRequeridas;

