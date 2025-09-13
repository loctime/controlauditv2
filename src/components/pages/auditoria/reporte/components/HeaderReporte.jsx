import React from 'react';
import { Box, Typography } from '@mui/material';

const HeaderReporte = ({ empresa, sucursal, formulario, fecha, nombreAuditor }) => {
  return (
    <Box sx={{ 
      mb: 3, 
      p: 2, 
      bgcolor: 'background.paper', 
      borderRadius: 2, 
      border: '1px solid',
      borderColor: 'divider',
      boxShadow: 1
    }}>
      <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
        📊 Datos del Reporte
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1, mb: 2 }}>
        <Typography variant="body2"><b>🏢 Empresa:</b> {empresa.nombre}</Typography>
        <Typography variant="body2"><b>📍 Sucursal:</b> {sucursal || 'Casa Central'}</Typography>
        <Typography variant="body2"><b>📋 Formulario:</b> {formulario.nombre}</Typography>
        <Typography variant="body2"><b>📅 Fecha:</b> {fecha}</Typography>
        <Typography variant="body2"><b>👤 Auditor:</b> {nombreAuditor}</Typography>
      </Box>
    </Box>
  );
};

export default HeaderReporte;
