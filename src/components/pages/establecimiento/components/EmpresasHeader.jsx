import React from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';

/**
 * Header de gestión de empresas
 */
const EmpresasHeader = React.memo(({
  totalEmpresas,
  isSmallMobile,
  onVerificar,
  verificando,
  onNavigateToAccidentes,
  onAddEmpresa
}) => (
  <Box sx={{
    display: 'flex',
    flexDirection: isSmallMobile ? 'column' : 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    mb: 4,
    gap: 2
  }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <BusinessIcon sx={{ fontSize: isSmallMobile ? 32 : 40, color: 'primary.main' }} />
      <Typography
        variant={isSmallMobile ? "h5" : "h4"}
        sx={{
          fontWeight: 700,
          color: 'primary.main',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}
      >
        Gestión de Empresas ({totalEmpresas || 0})
      </Typography>
    </Box>

    <Box sx={{
      display: 'flex',
      gap: 1,
      flexWrap: 'wrap',
      justifyContent: isSmallMobile ? 'center' : 'flex-end'
    }}>
      <Button
        variant="outlined"
        onClick={onVerificar}
        disabled={verificando}
        startIcon={verificando ? <CircularProgress size={16} /> : <ExpandMoreIcon />}
        size={isSmallMobile ? "small" : "medium"}
      >
        {verificando ? "Verificando..." : "Verificar"}
      </Button>
      <Button
        variant="outlined"
        color="error"
        onClick={onNavigateToAccidentes}
        startIcon={<ReportProblemIcon />}
        size={isSmallMobile ? "small" : "medium"}
      >
        Accidentes
      </Button>
      <Button
        variant="contained"
        onClick={onAddEmpresa}
        startIcon={<BusinessIcon />}
        size={isSmallMobile ? "small" : "medium"}
      >
        Agregar Empresa
      </Button>
    </Box>
  </Box>
));

EmpresasHeader.displayName = 'EmpresasHeader';

export default EmpresasHeader;



