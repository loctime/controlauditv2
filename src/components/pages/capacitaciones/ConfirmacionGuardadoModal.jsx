import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider
} from '@mui/material';
import {
  Business as BusinessIcon,
  Storefront as StorefrontIcon,
  School as SchoolIcon,
  People as PeopleIcon
} from '@mui/icons-material';

export default function ConfirmacionGuardadoModal({
  open,
  onClose,
  onConfirm,
  planAnual,
  capacitacion,
  empleadosSeleccionados,
  empleados
}) {
  if (!planAnual || !capacitacion) return null;

  const empleadosSeleccionadosData = empleadosSeleccionados.map(empleadoId => 
    empleados.find(e => e.id === empleadoId)
  ).filter(Boolean);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SchoolIcon color="primary" />
          <Typography variant="h6">Confirmar Guardado de Capacitación</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Información del Plan */}
          <Box>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Plan Anual:
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <BusinessIcon fontSize="small" color="primary" />
              <Typography variant="body1">
                <strong>{planAnual.nombre}</strong>
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <StorefrontIcon fontSize="small" color="primary" />
              <Typography variant="body2" color="textSecondary">
                {planAnual.sucursalNombre} - Año {planAnual.año}
              </Typography>
            </Box>
          </Box>

          <Divider />

          {/* Información de la Capacitación */}
          <Box>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Capacitación:
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SchoolIcon fontSize="small" color="primary" />
              <Typography variant="body1">
                <strong>{capacitacion.nombre}</strong>
              </Typography>
              <Chip label={capacitacion.mes} color="primary" size="small" />
            </Box>
          </Box>

          <Divider />

          {/* Lista de Empleados */}
          <Box>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Empleados que recibirán/actualizarán registro ({empleadosSeleccionadosData.length}):
            </Typography>
            
            {empleadosSeleccionadosData.length === 0 ? (
              <Typography variant="body2" color="textSecondary" fontStyle="italic">
                No hay empleados seleccionados
              </Typography>
            ) : (
              <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                <List dense>
                  {empleadosSeleccionadosData.map((empleado, index) => (
                    <ListItem key={empleado.id} sx={{ py: 0.5 }}>
                      <ListItemText
                        primary={`${empleado.nombre} ${empleado.apellido}`}
                        secondary={`DNI: ${empleado.dni} - ${empleado.cargo}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Box>

          {/* Información adicional */}
          <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
            <Typography variant="body2" color="textSecondary">
              <strong>Nota:</strong> Esta acción actualizará el registro de asistencia para la capacitación seleccionada. 
              Los empleados que ya tenían registro previo mantendrán su fecha original, 
              mientras que los nuevos empleados tendrán la fecha actual.
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} variant="outlined">
          Cancelar
        </Button>
        <Button 
          onClick={onConfirm} 
          variant="contained" 
          color="primary"
          disabled={empleadosSeleccionadosData.length === 0}
        >
          Confirmar y Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
