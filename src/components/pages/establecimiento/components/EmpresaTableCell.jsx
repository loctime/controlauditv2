import React from 'react';
import { Box, Typography, alpha } from '@mui/material';

/**
 * Celda clicable con estadísticas
 */
const EmpresaTableCell = React.memo(({
  icon: Icon,
  value,
  color,
  onClick,
  theme
}) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1,
      cursor: 'pointer',
      '&:hover': {
        backgroundColor: alpha(theme.palette[color].main, 0.1),
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
));

EmpresaTableCell.displayName = 'EmpresaTableCell';

export default EmpresaTableCell;

