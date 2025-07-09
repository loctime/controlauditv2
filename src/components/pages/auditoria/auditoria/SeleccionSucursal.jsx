// components/SeleccionSucursal.js
import React from "react";
import { FormControl, InputLabel, MenuItem, Select, Typography, Paper, Box } from "@mui/material";
import { LocationOn, Business } from "@mui/icons-material";

const SeleccionSucursal = ({ sucursales, sucursalSeleccionada, onChange }) => (
  <Paper elevation={1} sx={{ p: 2, height: '100%' }}>
    <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mb: 2 }}>
      Seleccionar Ubicación
    </Typography>
    
    <FormControl fullWidth size="large">
      <InputLabel sx={{ fontSize: '1.1rem' }}>Ubicación</InputLabel>
      <Select 
        value={sucursalSeleccionada} 
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
          <Box display="flex" alignItems="center">
            <Business sx={{ mr: 2, color: 'primary.main' }} />
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              Casa Central
            </Typography>
          </Box>
        </MenuItem>
        {sucursales.map((sucursal) => (
          <MenuItem key={sucursal.id} value={sucursal.nombre} sx={{ py: 1.5 }}>
            <Box display="flex" alignItems="center">
              <LocationOn sx={{ mr: 2, color: 'secondary.main' }} />
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                Sucursal: {sucursal.nombre}
              </Typography>
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  </Paper>
);

export default SeleccionSucursal;