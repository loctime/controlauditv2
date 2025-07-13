// src/components/pages/admin/components/AuditoriasDelDia.jsx
import React from "react";
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
  Chip
} from "@mui/material";
import { 
  CalendarToday, 
  Add, 
  CheckCircle, 
  Schedule, 
  LocationOn,
  Description,
  Delete,
  Person,
  PersonOff
} from "@mui/icons-material";
import { IconButton } from "@mui/material";

const AuditoriasDelDia = ({ 
  selectedDate, 
  auditoriasDelDia, 
  onAgendar, 
  onCompletar, 
  onEliminar,
  canAgendarAuditorias = true // ✅ Prop para validar permisos
}) => {
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
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CalendarToday color="primary" />
          Auditorías del {selectedDate ? selectedDate.toLocaleDateString() : 'día seleccionado'}
        </Typography>
        {selectedDate && canAgendarAuditorias && (
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<Add />}
            onClick={() => onAgendar(selectedDate.toISOString().split('T')[0])}
            sx={{ fontSize: '0.85rem' }}
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
        <Box textAlign="center" py={2}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            No hay auditorías agendadas para este día
          </Typography>
          {canAgendarAuditorias && (
            <Button
              variant="outlined"
              color="primary"
              startIcon={<Add />}
              onClick={() => onAgendar(selectedDate.toISOString().split('T')[0])}
              sx={{ mt: 1 }}
            >
              Agendar Primera Auditoría
            </Button>
          )}
        </Box>
      ) : (
        <List>
          {auditoriasDelDia.map((auditoria) => (
            <ListItem key={auditoria.id} divider>
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
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
                  <Box>
                    <Typography variant="body1" sx={{ mt: 1 }}>
                      <LocationOn sx={{ fontSize: '1rem', mr: 0.5, verticalAlign: 'middle' }} />
                      {auditoria.sucursal || 'Casa Central'}
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 0.5 }}>
                      <Schedule sx={{ fontSize: '1rem', mr: 0.5, verticalAlign: 'middle' }} />
                      {auditoria.hora}
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 0.5 }}>
                      <Description sx={{ fontSize: '1rem', mr: 0.5, verticalAlign: 'middle' }} />
                      {auditoria.formulario}
                    </Typography>
                    
                    {/* Información del encargado */}
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      {auditoria.encargado ? (
                        <>
                          <Avatar sx={{ width: 20, height: 20, fontSize: '0.7rem' }}>
                            {getInicialUsuario(auditoria.encargado)}
                          </Avatar>
                          <Typography variant="body2" color="text.secondary">
                            <Person sx={{ fontSize: '0.9rem', mr: 0.5, verticalAlign: 'middle' }} />
                            {getNombreUsuario(auditoria.encargado)}
                            {getEmailUsuario(auditoria.encargado) && (
                              <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                                {' '}({getEmailUsuario(auditoria.encargado)})
                              </span>
                            )}
                          </Typography>
                        </>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <PersonOff sx={{ fontSize: '0.9rem' }} />
                          Sin encargado asignado
                        </Typography>
                      )}
                    </Box>
                    
                    {auditoria.descripcion && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                        "{auditoria.descripcion}"
                      </Typography>
                    )}
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                <Stack direction="row" spacing={1}>
                  {auditoria.estado === 'agendada' && (
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      startIcon={<CheckCircle />}
                      onClick={() => onCompletar(auditoria.id)}
                    >
                      Completar
                    </Button>
                  )}
                  <IconButton
                    color="error"
                    onClick={() => onEliminar(auditoria.id)}
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
    </Paper>
  );
};

export default AuditoriasDelDia; 