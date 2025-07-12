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
  Stack
} from "@mui/material";
import { 
  CalendarToday, 
  Add, 
  CheckCircle, 
  Schedule, 
  LocationOn,
  Description,
  Delete
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
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {auditoria.empresa}
                  </Typography>
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