import React from 'react';
import { Box } from '@mui/material';
import ConfiguracionFirma from './ConfiguracionFirma';

const PerfilFirma = () => {
  // Log de depuración
  console.debug('[PerfilFirma] render');
  return (
    <Box sx={{ p: 3 }}>
      <ConfiguracionFirma />
    </Box>
  );
};

export default PerfilFirma;
