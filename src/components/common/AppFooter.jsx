import React from 'react';
import { Box, Typography, Link } from '@mui/material';
import { useTheme } from '@mui/material/styles';

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
        {['Guía de uso', 'Soporte', 'Contacto'].map((label) => (
          <Link key={label} href="#" underline="hover" variant="caption" color="text.secondary">
            {label}
          </Link>
        ))}
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