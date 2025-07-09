import React from "react";
import { FormControl, InputLabel, MenuItem, Select, Typography, Paper, Box } from "@mui/material";
import { Description } from "@mui/icons-material";

const SeleccionFormulario = ({ formularios, formularioSeleccionadoId, onChange, disabled = false }) => (
  <Paper elevation={1} sx={{ p: 2, height: '100%' }}>
    <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mb: 2 }}>
      Seleccionar Formulario
    </Typography>
    
    <FormControl fullWidth size="large" disabled={disabled}>
      <InputLabel sx={{ fontSize: '1.1rem' }}>Formulario</InputLabel>
      <Select 
        value={formularioSeleccionadoId} 
        onChange={onChange}
        sx={{ 
          minHeight: '56px',
          '& .MuiSelect-select': {
            fontSize: '1rem',
            padding: '16px 14px'
          }
        }}
      >
        <MenuItem value="" sx={{ py: 1.5 }}>
          <em>Seleccione un formulario</em>
        </MenuItem>
        {formularios.map((formulario) => (
          <MenuItem key={formulario.id} value={formulario.id} sx={{ py: 1.5 }}>
            <Box display="flex" alignItems="center">
              <Description sx={{ mr: 2, color: 'primary.main' }} />
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {formulario.nombre}
              </Typography>
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  </Paper>
);

export default SeleccionFormulario;
