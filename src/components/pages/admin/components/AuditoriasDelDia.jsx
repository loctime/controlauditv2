// src/components/pages/admin/components/AuditoriasDelDia.jsx
import React, { useState } from "react";
import { 
  Typography, 
  Box, 
  Paper, 
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Stack,
  Avatar,
  Chip,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from "@mui/material";
import {
  CalendarToday,
  Add,
  PlayArrow,
  Schedule,
  LocationOn,
  Description,
  Delete,
  Person,
  PersonOff
} from "@mui/icons-material";
import { IconButton } from "@mui/material";
import { useNavigate } from "react-router-dom";

const AuditoriasDelDia = ({ 
  selectedDate, 
  auditoriasDelDia, 
  onAgendar, 
  onCompletar, 
  onEliminar,
  canAgendarAuditorias = true // Prop para validar permisos
}) => {
  const navigate = useNavigate();
  const [confirmarEliminar, setConfirmarEliminar] = useState({ abierto: false, auditoriaId: null, empresa: '' });
  // Función para obtener el nombre del usuario
  const getNombreUsuario = (encargado) => {
    if (!encargado) return null;
    return typeof encargado === 'object' ? encargado.displayName || encargado.email : encargado;
  };

  // Función para obtener el email del usuario
  const getEmailUsuario = (encargado) => {
    if (!encargado) return null;
    return typeof encargado === 'object' ? encargado.email : null;
  };

  // Función para obtener la inicial del usuario
  const getInicialUsuario = (encargado) => {
    if (!encargado) return '';
    const nombre = getNombreUsuario(encargado);
    return nombre ? nombre.charAt(0).toUpperCase() : '';
  };

  return (
    <Paper elevation={2} sx={{ 
      p: { xs: 1.5, sm: 2 }, 
      mb: 2,
      borderRadius: { xs: 1, sm: 2 }
    }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1} sx={{ 
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 1, sm: 0 },
        alignItems: { xs: 'stretch', sm: 'center' }
      }}>
        <Typography variant="h6" sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          fontSize: { xs: '0.95rem', sm: '1.1rem' }
        }}>
          <CalendarToday color="primary" sx={{ fontSize: '1rem' }} />
          Auditorías del {selectedDate ? selectedDate.toLocaleDateString() : 'día seleccionado'}
        </Typography>
        {selectedDate && canAgendarAuditorias && (
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<Add />}
            onClick={() => onAgendar(selectedDate.toISOString().split('T')[0])}
            sx={{ 
              fontSize: { xs: '0.75rem', sm: '0.85rem' },
              px: { xs: 2, sm: 2 },
              borderRadius: '20px',
              minWidth: { xs: 'auto', sm: 'auto' }
            }}
          >
            Agendar
          </Button>
        )}
      </Box>
      
      {!selectedDate ? (
        <Typography variant="body2" color="text.secondary">
          Selecciona una fecha en el calendario para ver las auditorías
        </Typography>
      ) : auditoriasDelDia.length === 0 ? (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: 2,
          py: 1.5,
          px: 2
        }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: 1,
            textAlign: 'center'
          }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              No hay auditorías agendadas para este día
            </Typography>
            {canAgendarAuditorias && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<Add />}
                onClick={() => onAgendar(selectedDate.toISOString().split('T')[0])}
                sx={{ 
                  borderRadius: '20px',
                  px: 3,
                  py: 1,
                  fontSize: '0.9rem',
                  fontWeight: 500
                }}
              >
                Agendar Primera Auditoría
              </Button>
            )}
          </Box>
        </Box>
      ) : (
        <List>
          {auditoriasDelDia.map((auditoria) => (
            <ListItem key={auditoria.id} divider>
              <ListItemText
                sx={{ paddingRight: { xs: 11, sm: 20 } }}
                primary={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '0.95rem' }}>
                      {auditoria.empresa}
                    </Typography>
                    {/* Chip de estado */}
                    <Chip 
                      label={auditoria.estado === 'agendada' ? 'Agendada' : 'Completada'} 
                      size="small" 
                      color={auditoria.estado === 'agendada' ? 'warning' : 'success'} 
                      variant="outlined"
                      sx={{ fontSize: '0.7rem' }}
                    />
                  </Box>
                }
                secondary={
                  <Grid container spacing={1}>
                    <Grid item xs={7}>
                      <Typography variant="body2" sx={{ mt: 0.3 }} component="div">
                        <LocationOn sx={{ fontSize: '0.85rem', mr: 0.5, verticalAlign: 'middle' }} />
                        {auditoria.sucursal || 'Casa Central'}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.3 }} component="div">
                        <Schedule sx={{ fontSize: '0.85rem', mr: 0.5, verticalAlign: 'middle' }} />
                        {auditoria.hora}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.3 }} component="div">
                        <Description sx={{ fontSize: '0.85rem', mr: 0.5, verticalAlign: 'middle' }} />
                        {auditoria.formulario}
                      </Typography>
                    </Grid>
                    <Grid item xs={5}>
                      {/* Información del encargado */}
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mt: 0.3 }}>
                        {auditoria.encargado ? (
                          <>
                            <Avatar sx={{ width: 20, height: 20, fontSize: '0.7rem' }}>
                              {getInicialUsuario(auditoria.encargado)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" color="text.secondary" component="div">
                                <Person sx={{ fontSize: '0.85rem', mr: 0.5, verticalAlign: 'middle' }} />
                                {getNombreUsuario(auditoria.encargado)}
                              </Typography>
                              {getEmailUsuario(auditoria.encargado) && (
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', opacity: 0.7 }} component="div">
                                  ({getEmailUsuario(auditoria.encargado)})
                                </Typography>
                              )}
                            </Box>
                          </>
                        ) : (
                          <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }} component="div">
                            <PersonOff sx={{ fontSize: '0.85rem' }} />
                            Sin encargado
                          </Typography>
                        )}
                      </Box>
                      {auditoria.descripcion && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3, fontStyle: 'italic' }} component="div">
                          "{auditoria.descripcion}"
                        </Typography>
                      )}
                    </Grid>
                  </Grid>
                }
              />
              <ListItemSecondaryAction>
                <Stack direction="row" spacing={1}>
                  {auditoria.estado === 'agendada' && (
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      startIcon={<PlayArrow />}
                      onClick={() => {
                        navigate('/auditoria', {
                          state: {
                            empresa: auditoria.empresa,
                            empresaId: auditoria.empresaId,
                            sucursal: auditoria.sucursal,
                            formularioId: auditoria.formularioId,
                            auditoriaId: auditoria.id,
                            fecha: auditoria.fecha
                          }
                        });
                      }}
                    >
                      Ir a completar
                    </Button>
                  )}
                  <IconButton
                    color="error"
                    size="small"
                    onClick={() => setConfirmarEliminar({ abierto: true, auditoriaId: auditoria.id, empresa: auditoria.empresa })}
                    title="Eliminar"
                  >
                    <Delete />
                  </IconButton>
                </Stack>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}
      
      {/* Modal de confirmación para eliminar */}
      <Dialog 
        open={confirmarEliminar.abierto} 
        onClose={() => setConfirmarEliminar({ abierto: false, auditoriaId: null, empresa: '' })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" color="error" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Delete />
            Confirmar eliminación
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            ¿Estás seguro que deseas eliminar la siguiente auditoría agendada?
          </Typography>
          <Box sx={{ 
            backgroundColor: 'grey.50', 
            p: 2, 
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'grey.200'
          }}>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              <strong>Empresa:</strong> {confirmarEliminar.empresa}
            </Typography>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              <strong>Sucursal:</strong> {auditoriasDelDia.find(a => a.id === confirmarEliminar.auditoriaId)?.sucursal || 'Casa Central'}
            </Typography>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              <strong>Formulario:</strong> {auditoriasDelDia.find(a => a.id === confirmarEliminar.auditoriaId)?.formulario}
            </Typography>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              <strong>Fecha:</strong> {selectedDate ? selectedDate.toLocaleDateString() : ''}
            </Typography>
            <Typography variant="body2">
              <strong>Hora:</strong> {auditoriasDelDia.find(a => a.id === confirmarEliminar.auditoriaId)?.hora}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Esto solo eliminará la auditoría de la agenda, puedes volver a crearla cuando quieras.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={() => setConfirmarEliminar({ abierto: false, auditoriaId: null, empresa: '' })}
            variant="outlined"
          >
            Cancelar
          </Button>
          <Button 
            onClick={() => {
              onEliminar(confirmarEliminar.auditoriaId);
              setConfirmarEliminar({ abierto: false, auditoriaId: null, empresa: '' });
            }}
            variant="contained"
            color="error"
            startIcon={<Delete />}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default AuditoriasDelDia;