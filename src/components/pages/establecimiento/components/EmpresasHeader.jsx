import React from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';

/**
 * Header de gestión de empresas — versión simplificada
 */
const EmpresasHeader = React.memo(({
  totalEmpresas,
  isSmallMobile,
  onVerificar,
  verificando,
  onAddEmpresa,
  canCreateEmpresa = false
}) => (
  <Box sx={{
    display: 'flex',
    flexDirection: isSmallMobile ? 'column' : 'row',
    alignItems: isSmallMobile ? 'flex-start' : 'center',
    justifyContent: 'space-between',
    mb: 3,
    gap: 2
  }}>
    <Typography
      variant={isSmallMobile ? 'h5' : 'h4'}
      component="h1"
      sx={{ fontWeight: 700, color: 'text.primary' }}
    >
      Empresas ({totalEmpresas || 0})
    </Typography>

    <Box sx={{
      display: 'flex',
      gap: 1,
      flexWrap: 'wrap',
      justifyContent: isSmallMobile ? 'flex-start' : 'flex-end'
    }}>
      <Button
        variant="outlined"
        onClick={onVerificar}
        disabled={verificando}
        startIcon={verificando ? <CircularProgress size={16} /> : null}
        size={isSmallMobile ? 'small' : 'medium'}
      >
        {verificando ? 'Verificando...' : 'Verificar'}
      </Button>

      {canCreateEmpresa && (
        <Button
          variant="contained"
          onClick={onAddEmpresa}
          size={isSmallMobile ? 'small' : 'medium'}
        >
          + Agregar empresa
        </Button>
      )}
    </Box>
  </Box>
));

EmpresasHeader.displayName = 'EmpresasHeader';

export default EmpresasHeader;





