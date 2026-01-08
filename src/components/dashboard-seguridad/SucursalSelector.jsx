import React from 'react';
import { 
  FormControl, 
  Select, 
  MenuItem, 
  Box, 
  Typography,
  Chip
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';

export default function SucursalSelector({ 
  sucursales, 
  selectedSucursal, 
  onSucursalChange,
  compact = false,
  embedded = false
}) {
  const isNavbarMode = embedded || compact;
  const showLabel = !embedded;

  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: isNavbarMode ? 0.75 : 2,
      backgroundColor: 'white',
      padding: isNavbarMode ? '2px 8px' : '8px 12px',
      borderRadius: isNavbarMode ? '6px' : '12px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      height: isNavbarMode ? 30 : 'auto',
      minHeight: isNavbarMode ? 30 : 'auto',
      width: isNavbarMode ? { xs: '100%', sm: 280, md: 300 } : '100%',
      maxWidth: isNavbarMode ? 320 : 'none'
    }}>
      {!isNavbarMode && (
        <BusinessIcon sx={{ color: '#667eea', fontSize: 24 }} />
      )}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {showLabel && (
          <Typography 
            variant="caption" 
            sx={{ 
              display: 'block', 
              color: '#6b7280',
              fontWeight: 500,
              mb: 0.5,
              fontSize: '0.75rem'
            }}
          >
            Sucursal
          </Typography>
        )}
        <FormControl fullWidth size="small">
          <Select
            value={sucursales?.length ? (selectedSucursal || 'todas') : 'no-sucursales'}
            onChange={(e) => onSucursalChange(e.target.value)}
            aria-label="Seleccionar sucursal"
            disabled={!sucursales || sucursales.length === 0}
            displayEmpty
            renderValue={(val) => {
              if (!sucursales || sucursales.length === 0 || val === 'no-sucursales') {
                return 'No hay sucursales';
              }
              const found = sucursales.find(s => s.id === val);
              return found?.nombre || 'Sucursal';
            }}
            sx={{
              height: isNavbarMode ? 26 : 32,
              minHeight: isNavbarMode ? 26 : 32,
              '& .MuiOutlinedInput-notchedOutline': {
                border: 'none'
              },
              '& .MuiSelect-select': {
                padding: isNavbarMode ? '0 8px' : '0 10px',
                paddingRight: isNavbarMode ? '24px !important' : '28px !important',
                fontWeight: 600,
                color: '#111827',
                fontSize: isNavbarMode ? '0.80rem' : '0.85rem',
                lineHeight: isNavbarMode ? '26px' : '32px'
              },
              '& .MuiSelect-icon': {
                fontSize: isNavbarMode ? '18px' : '20px',
                right: isNavbarMode ? 4 : 6
              }
            }}
          >
            <MenuItem value="no-sucursales" disabled>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 500,
                  fontSize: '0.80rem'
                }}
              >
                No hay sucursales
              </Typography>
            </MenuItem>
            <MenuItem value="todas">
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 600, 
                  fontStyle: 'italic',
                  fontSize: isNavbarMode ? '0.80rem' : '0.85rem'
                }}
              >
                Todas las sucursales
              </Typography>
            </MenuItem>
            {sucursales?.map((sucursal) => (
              <MenuItem key={sucursal.id} value={sucursal.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 600,
                      fontSize: isNavbarMode ? '0.80rem' : '0.85rem'
                    }}
                  >
                    {sucursal.nombre}
                  </Typography>
                  {sucursal.empresaId && !isNavbarMode && (
                    <Chip 
                      label={sucursal.empresaId} 
                      size="small" 
                      sx={{ 
                        height: '20px',
                        fontSize: '0.7rem',
                        backgroundColor: '#f3f4f6'
                      }}
                    />
                  )}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    </Box>
  );
}

