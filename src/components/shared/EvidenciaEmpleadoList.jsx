// src/components/shared/EvidenciaEmpleadoList.jsx

import React from 'react';
import {
  Box,
  Typography,
  Button,
  Popover,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';

/**
 * Componente para mostrar lista compacta de empleados asociados a una evidencia
 * 
 * @param {Array} empleados - Array de empleados del registro completo { id, nombre }
 * @param {Array<string>} evidenciaEmpleadoIds - IDs de empleados específicos de la evidencia (opcional)
 * @param {number} maxVisible - Número máximo de empleados a mostrar antes de colapsar (default: 2)
 */
const EvidenciaEmpleadoList = ({
  empleados = [],
  evidenciaEmpleadoIds = null,
  maxVisible = 2
}) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  // Si no hay empleados, no mostrar nada
  if (!empleados || empleados.length === 0) {
    return null;
  }

  // Determinar qué empleados corresponden a la evidencia
  // Si evidenciaEmpleadoIds no existe → todos los empleados corresponden
  const empleadosConEstado = empleados.map(emp => {
    const corresponde = evidenciaEmpleadoIds === null || evidenciaEmpleadoIds === undefined
      ? true // Si no hay evidenciaEmpleadoIds, todos corresponden
      : evidenciaEmpleadoIds.includes(emp.id);
    
    return {
      ...emp,
      corresponde
    };
  });

  // Separar empleados que corresponden y que no corresponden
  const empleadosCorresponden = empleadosConEstado.filter(emp => emp.corresponde);
  const empleadosNoCorresponden = empleadosConEstado.filter(emp => !emp.corresponde);

  // Empleados visibles (mostrar solo los que corresponden en la vista compacta)
  const empleadosVisibles = empleadosCorresponden.slice(0, maxVisible);
  const restoEmpleados = empleadosCorresponden.slice(maxVisible);
  const totalRestantes = restoEmpleados.length + empleadosNoCorresponden.length;

  const handleClick = (event) => {
    event.stopPropagation(); // Evitar que se propague el click de la imagen
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
          minHeight: 'auto' // No aumentar altura de la fila
        }}
      >
        {/* Empleados visibles */}
        {empleadosVisibles.map((emp) => (
          <Box
            key={emp.id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5
            }}
          >
            <CheckCircleIcon
              sx={{
                fontSize: 14,
                color: 'success.main',
                flexShrink: 0
              }}
            />
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.7rem',
                lineHeight: 1.2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1
              }}
            >
              {emp.nombre || `Empleado ${emp.id}`}
            </Typography>
          </Box>
        ))}

        {/* Botón "Ver más" si hay más empleados */}
        {totalRestantes > 0 && (
          <Button
            size="small"
            variant="text"
            onClick={handleClick}
            sx={{
              minWidth: 'auto',
              p: 0,
              fontSize: '0.7rem',
              textTransform: 'none',
              color: 'primary.main',
              justifyContent: 'flex-start',
              '&:hover': {
                backgroundColor: 'transparent',
                textDecoration: 'underline'
              }
            }}
          >
            Ver {totalRestantes} más
          </Button>
        )}
      </Box>

      {/* Popover con lista completa */}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left'
        }}
        PaperProps={{
          sx: {
            maxWidth: 300,
            maxHeight: 400,
            mt: 0.5
          }
        }}
      >
        <Box sx={{ p: 1 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            Empleados ({empleadosConEstado.length})
          </Typography>
          
          <List dense sx={{ maxHeight: 350, overflow: 'auto', p: 0 }}>
            {/* Empleados que corresponden */}
            {empleadosCorresponden.length > 0 && (
              <>
                {empleadosCorresponden.map((emp) => (
                  <ListItem key={emp.id} sx={{ py: 0.5, px: 1 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <CheckCircleIcon sx={{ fontSize: 18, color: 'success.main' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                          {emp.nombre || `Empleado ${emp.id}`}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </>
            )}

            {/* Separador si hay empleados que no corresponden */}
            {empleadosNoCorresponden.length > 0 && empleadosCorresponden.length > 0 && (
              <Box sx={{ borderTop: '1px solid', borderColor: 'divider', my: 0.5 }} />
            )}

            {/* Empleados que NO corresponden */}
            {empleadosNoCorresponden.length > 0 && (
              <>
                {empleadosNoCorresponden.map((emp) => (
                  <ListItem key={emp.id} sx={{ py: 0.5, px: 1 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <CancelIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                          {emp.nombre || `Empleado ${emp.id}`}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </>
            )}
          </List>

          {/* Resumen */}
          <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                label={`${empleadosCorresponden.length} corresponden`}
                size="small"
                color="success"
                variant="outlined"
                icon={<CheckCircleIcon />}
              />
              {empleadosNoCorresponden.length > 0 && (
                <Chip
                  label={`${empleadosNoCorresponden.length} no corresponden`}
                  size="small"
                  variant="outlined"
                  icon={<CancelIcon />}
                />
              )}
            </Box>
          </Box>
        </Box>
      </Popover>
    </>
  );
};

export default EvidenciaEmpleadoList;
