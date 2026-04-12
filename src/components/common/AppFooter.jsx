import React from 'react';
import { Box, Typography, Link } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Link as RouterLink } from 'react-router-dom';

const AppFooter = () => {
  const theme = useTheme();

  return (
    <Box
      component="footer"
      sx={{
        borderTop: `0.5px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper,
        px: 3,
        py: 1.5,
        minHeight: 48,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 1.5,
        mt: 'auto',
      }}
    >
      <Typography variant="caption" color="text.secondary">
        <Box component="span" fontWeight={500} color="text.primary">ControlAudit</Box>
        {' '}© 2025 — Todos los derechos reservados
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
        <Link
          component={RouterLink}
          to="/terminos"
          underline="hover"
          variant="caption"
          color="text.secondary"
        >
          Términos y Condiciones
        </Link>
        <Link
          component={RouterLink}
          to="/privacidad"
          underline="hover"
          variant="caption"
          color="text.secondary"
        >
          Política de Privacidad
        </Link>
        <Typography
          variant="caption"
          sx={{
            color: 'text.disabled',
            border: '0.5px solid',
            borderColor: 'divider',
            borderRadius: '4px',
            px: 1,
            py: 0.25,
          }}
        >
          v5.0
        </Typography>
      </Box>
    </Box>
  );
};

export default AppFooter;