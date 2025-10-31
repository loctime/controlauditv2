import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { ReportProblem as AccidenteIcon, Warning as IncidenteIcon } from '@mui/icons-material';

/**
 * Header de Accidentes
 */
const AccidentesHeader = React.memo(({
  onCrearAccidente,
  onCrearIncidente,
  canCreate,
  isSmallMobile
}) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <AccidenteIcon sx={{ fontSize: 40, color: 'error.main' }} />
      <Typography variant="h4" sx={{ fontWeight: 700 }}>
        Accidentes e Incidentes
      </Typography>
    </Box>
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
      <Button
        variant="contained"
        color="error"
        startIcon={<AccidenteIcon />}
        onClick={onCrearAccidente}
        disabled={!canCreate}
        size={isSmallMobile ? 'small' : 'medium'}
      >
        Nuevo Accidente
      </Button>
      <Button
        variant="contained"
        color="warning"
        startIcon={<IncidenteIcon />}
        onClick={onCrearIncidente}
        disabled={!canCreate}
        size={isSmallMobile ? 'small' : 'medium'}
      >
        Nuevo Incidente
      </Button>
    </Box>
  </Box>
));

AccidentesHeader.displayName = 'AccidentesHeader';

export default AccidentesHeader;

