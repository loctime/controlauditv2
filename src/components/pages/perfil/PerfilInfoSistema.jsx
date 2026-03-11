import logger from '@/utils/logger';
import React from 'react';
import { Box } from '@mui/material';
import InfoSistema from './InfoSistema';
const PerfilInfoSistema = () => {
  // Log de depuración
  logger.debug('[PerfilInfoSistema] render');
  return (
    <Box sx={{ p: 3 }}>
      <InfoSistema />
    </Box>
  );
};

export default PerfilInfoSistema;
