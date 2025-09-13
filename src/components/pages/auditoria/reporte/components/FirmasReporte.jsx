import React from 'react';
import { Box, Typography } from '@mui/material';

const FirmasReporte = ({ 
  reporte, 
  firmaResponsableFinal, 
  nombreAuditor 
}) => {
  return (
    <Box mt={3} display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={4} justifyContent="center" alignItems="flex-start">
      <Box flex={1} textAlign="center">
        <Typography variant="subtitle1" color="primary" fontWeight={600} gutterBottom>
          Firma del Auditor
        </Typography>
        {reporte.firmaAuditor && typeof reporte.firmaAuditor === 'string' && reporte.firmaAuditor.length > 10 ? (
          <Box sx={{ border: '2px solid', borderColor: 'info.main', borderRadius: 1, p: 2, mb: 2, maxWidth: 300 }}>
            <img
              src={reporte.firmaAuditor}
              alt="Firma del auditor"
              style={{ maxWidth: '100%', maxHeight: '100px', objectFit: 'contain' }}
            />
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No hay firma registrada.
          </Typography>
        )}
        <Typography variant="body2" sx={{ mt: 1 }}>
          {nombreAuditor}
        </Typography>
      </Box>
      
      <Box flex={1} textAlign="center">
        <Typography variant="subtitle1" color="primary" fontWeight={600} gutterBottom>
          Firma de la Empresa
        </Typography>
        {firmaResponsableFinal && typeof firmaResponsableFinal === 'string' && firmaResponsableFinal.length > 10 ? (
          <Box sx={{ border: '2px solid', borderColor: 'success.main', borderRadius: 1, p: 2, mb: 2, maxWidth: 300 }}>
            <img
              src={firmaResponsableFinal}
              alt="Firma de la empresa"
              style={{ maxWidth: '100%', maxHeight: '100px', objectFit: 'contain' }}
            />
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No hay firma registrada.
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default FirmasReporte;
