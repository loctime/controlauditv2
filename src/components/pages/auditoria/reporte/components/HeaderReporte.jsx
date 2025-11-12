import React from 'react';
import { Box, Typography, Divider } from '@mui/material';
import { Work, LocationOn, Build, SupervisorAccount, People } from '@mui/icons-material';

const HeaderReporte = ({ empresa, sucursal, formulario, fecha, nombreAuditor, datosReporte = {} }) => {
  const tieneDatosAdicionales = datosReporte?.tareaObservada || datosReporte?.lugarSector || 
                                 datosReporte?.equiposInvolucrados || datosReporte?.supervisor || 
                                 datosReporte?.numeroTrabajadores;

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
        <Typography variant="body2"><b>🏢 Empresa:</b> {empresa?.nombre || 'No especificada'}</Typography>
        <Typography variant="body2"><b>📍 Sucursal:</b> {sucursal || 'Casa Central'}</Typography>
        <Typography variant="body2"><b>📋 Formulario:</b> {formulario?.nombre || 'No especificado'}</Typography>
        <Typography variant="body2"><b>📅 Fecha:</b> {fecha}</Typography>
        <Typography variant="body2"><b>👤 Auditor:</b> {nombreAuditor}</Typography>
      </Box>

      {/* Información Adicional del Reporte */}
      {tieneDatosAdicionales && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" gutterBottom sx={{ color: 'primary.main', fontWeight: 600, mb: 1.5 }}>
            Información Adicional del Reporte
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1 }}>
            {datosReporte?.tareaObservada && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Work sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2">
                  <b>Tarea Observada:</b> {datosReporte.tareaObservada}
                </Typography>
              </Box>
            )}
            {datosReporte?.lugarSector && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2">
                  <b>Lugar / Sector:</b> {datosReporte.lugarSector}
                </Typography>
              </Box>
            )}
            {datosReporte?.equiposInvolucrados && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Build sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2">
                  <b>Equipo/s Involucrado:</b> {datosReporte.equiposInvolucrados}
                </Typography>
              </Box>
            )}
            {datosReporte?.supervisor && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SupervisorAccount sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2">
                  <b>Supervisor:</b> {datosReporte.supervisor}
                </Typography>
              </Box>
            )}
            {datosReporte?.numeroTrabajadores && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <People sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2">
                  <b>N° de Trabajadores:</b> {datosReporte.numeroTrabajadores}
                </Typography>
              </Box>
            )}
          </Box>
        </>
      )}
    </Box>
  );
};

export default HeaderReporte;
