import React from 'react';
import { Box, Typography, alpha, useTheme } from '@mui/material';

/**
 * Celda clicable con estadísticas
 */
const EmpresaTableCell = React.memo(({
  icon: Icon,
  value,
  color,
  onClick
}) => {
  const theme = useTheme();
  
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        cursor: 'pointer',
        '&:hover': {
          backgroundColor: alpha(theme.palette[color]?.main || theme.palette.primary.main, 0.1),
          borderRadius: 1
        },
        p: 1,
        borderRadius: 1,
        transition: 'all 0.2s ease'
      }}
      onClick={onClick}
    >
      <Icon color={color} fontSize="small" />
      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
        {value}
      </Typography>
    </Box>
  );
});

EmpresaTableCell.displayName = 'EmpresaTableCell';

export default EmpresaTableCell;

