import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Divider,
  useTheme
} from '@mui/material';

/**
 * Componente auxiliar para campos de formulario
 */
const FormField = ({ label, name, type = 'text', value, onChange, placeholder, min, max, helperText, required }) => {
  const theme = useTheme();
  
  return (
    <Box>
      <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
        {label}
      </Typography>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        min={min}
        max={max}
        required={required}
        style={{
          width: '100%',
          padding: '10px 12px',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: '6px',
          fontSize: '14px'
        }}
      />
      {helperText && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          {helperText}
        </Typography>
      )}
    </Box>
  );
};

/**
 * Modal unificado para crear/editar sucursal
 */
const SucursalFormModal = ({
  open,
  onClose,
  formData,
  onChange,
  onSubmit,
  isEditing = false
}) => {
  const theme = useTheme();

  if (!open) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <Paper
        sx={{ 
          p: 3, 
          maxWidth: 700, 
          width: '90%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          {isEditing ? 'Editar Sucursal' : 'Agregar Sucursal'}
        </Typography>
        <Box sx={{ 
          overflowY: 'auto', 
          overflowX: 'hidden',
          pr: 1,
          '&::-webkit-scrollbar': { width: '8px' },
          '&::-webkit-scrollbar-track': { backgroundColor: '#f1f1f1', borderRadius: '4px' },
          '&::-webkit-scrollbar-thumb': { 
            backgroundColor: '#c1c1c1', 
            borderRadius: '4px',
            '&:hover': { backgroundColor: '#a8a8a8' }
          },
        }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Información General */}
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: '#111827' }}>
                📋 Información General
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormField
                    label="Nombre *"
                    name="nombre"
                    value={formData.nombre}
                    onChange={onChange}
                    placeholder="Nombre de la sucursal"
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormField
                    label="Dirección"
                    name="direccion"
                    value={formData.direccion}
                    onChange={onChange}
                    placeholder="Dirección de la sucursal"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormField
                    label="Teléfono"
                    name="telefono"
                    value={formData.telefono}
                    onChange={onChange}
                    placeholder="Teléfono de la sucursal"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormField
                    label="Horas Semanales"
                    name="horasSemanales"
                    type="number"
                    value={formData.horasSemanales}
                    onChange={onChange}
                    placeholder="40"
                    min="1"
                    max="168"
                    helperText="Por defecto: 40 horas"
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider />

            {/* Metas de Auditorías */}
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: '#111827' }}>
                📊 Metas de Auditorías
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormField
                    label="Target Mensual"
                    name="targetMensual"
                    type="number"
                    value={formData.targetMensual}
                    onChange={onChange}
                    placeholder="0"
                    min="0"
                    helperText="Auditorías objetivo para este mes"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormField
                    label="Target Anual"
                    name="targetAnualAuditorias"
                    type="number"
                    value={formData.targetAnualAuditorias}
                    onChange={onChange}
                    placeholder="12"
                    min="0"
                    helperText="Auditorías objetivo para el año"
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider />

            {/* Metas de Capacitaciones */}
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: '#111827' }}>
                📚 Metas de Capacitaciones
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormField
                    label="Target Mensual"
                    name="targetMensualCapacitaciones"
                    type="number"
                    value={formData.targetMensualCapacitaciones}
                    onChange={onChange}
                    placeholder="1"
                    min="0"
                    helperText="Capacitaciones objetivo para este mes"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormField
                    label="Target Anual"
                    name="targetAnualCapacitaciones"
                    type="number"
                    value={formData.targetAnualCapacitaciones}
                    onChange={onChange}
                    placeholder="12"
                    min="0"
                    helperText="Capacitaciones objetivo para el año"
                  />
                </Grid>
              </Grid>
            </Box>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, mt: 3, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Button
            variant="contained"
            onClick={onSubmit}
            sx={{ flex: 1 }}
          >
            {isEditing ? 'Actualizar' : 'Crear'}
          </Button>
          <Button
            variant="outlined"
            onClick={onClose}
            sx={{ flex: 1 }}
          >
            Cancelar
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default SucursalFormModal;
