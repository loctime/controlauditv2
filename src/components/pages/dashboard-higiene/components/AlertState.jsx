import React from 'react';
import { Alert, Box, Typography, Button } from '@mui/material';
import { Business as BusinessIcon } from '@mui/icons-material';

/**
 * Componente reutilizable para estados del dashboard
 * Optimizado con React.memo
 */
const AlertState = React.memo(({ 
  severity, 
  message, 
  actionLabel, 
  actionUrl,
  icon = <BusinessIcon />
}) => {
  return (
    <Alert severity={severity} sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="body1">
          {message}
        </Typography>
        {actionLabel && actionUrl && (
          <Button
            variant="contained"
            size="small"
            onClick={() => window.location.href = actionUrl}
          >
            {actionLabel}
          </Button>
        )}
      </Box>
    </Alert>
  );
});

AlertState.displayName = 'AlertState';

export default AlertState;

