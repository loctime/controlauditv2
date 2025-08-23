// components/SeleccionSucursal.js
import React from "react";
import { 
  FormControl, 
  InputLabel, 
  MenuItem, 
  Select, 
  Box, 
  Typography, 
  Card,
  CardContent,
  Chip,
  useTheme,
  alpha,
  useMediaQuery
} from "@mui/material";
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BusinessIcon from '@mui/icons-material/Business';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const SeleccionSucursal = ({ sucursales, sucursalSeleccionada, onChange }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleChange = (event) => {
    onChange(event);
  };

  // Determinar si hay una ubicación seleccionada para aplicar estilos verdes
  const hasSelectedSucursal = !!sucursalSeleccionada;

  return (
    <Box sx={{ mb: isMobile ? 0.25 : 1 }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: isMobile ? 0.5 : 1.5,
        mb: isMobile ? 0.25 : 1.5
      }}>
        <Box sx={{ 
          p: isMobile ? 0.25 : 1, 
          borderRadius: '50%', 
          bgcolor: hasSelectedSucursal 
            ? alpha(theme.palette.success.main, 0.08)
            : alpha(theme.palette.primary.main, 0.08),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {hasSelectedSucursal ? (
            <CheckCircleIcon 
              color="success" 
              sx={{ fontSize: isMobile ? 14 : 20 }} 
            />
          ) : (
            <LocationOnIcon 
              color="primary" 
              sx={{ fontSize: isMobile ? 14 : 20 }} 
            />
          )}
        </Box>
                 
      </Box>
      
      <FormControl 
        fullWidth 
        size="large"
        sx={{ 
                     '& .MuiInputBase-root': {
             fontSize: isMobile ? '0.8rem' : '0.9rem',
             height: isMobile ? '32px' : '48px',
             minHeight: isMobile ? '32px' : '48px',
             // Aplicar estilos verdes cuando hay ubicación seleccionada
             ...(hasSelectedSucursal && {
               backgroundColor: alpha(theme.palette.success.main, 0.02),
               borderColor: theme.palette.success.main,
               '&:hover': {
                 borderColor: theme.palette.success.main,
                 backgroundColor: alpha(theme.palette.success.main, 0.04)
               },
               '&.Mui-focused': {
                 borderColor: theme.palette.success.main,
                 backgroundColor: alpha(theme.palette.success.main, 0.06)
               }
             })
           },
          '& .MuiInputLabel-root': {
            ...(hasSelectedSucursal && {
              color: theme.palette.success.main,
              '&.Mui-focused': {
                color: theme.palette.success.main
              }
            })
          }
        }}
      >
        <InputLabel 
          sx={{ 
            fontSize: isMobile ? '0.75rem' : '0.875rem', 
            fontWeight: 500,
            '&.Mui-focused': {
              fontSize: isMobile ? '0.65rem' : '0.75rem'
            }
          }}
        >
          Ubicación
        </InputLabel>
                 <Select
           value={sucursalSeleccionada}
           onChange={handleChange}
           sx={{ 
             height: isMobile ? '32px' : '48px',
             minHeight: isMobile ? '32px' : '48px',
             '& .MuiSelect-select': {
               fontSize: isMobile ? '0.8rem' : '0.9rem',
               padding: isMobile ? '6px 12px' : '12px 14px'
             },
             '&:hover .MuiOutlinedInput-notchedOutline': {
               borderColor: hasSelectedSucursal ? theme.palette.success.main : theme.palette.primary.main,
             },
             '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
               borderColor: hasSelectedSucursal ? theme.palette.success.main : theme.palette.primary.main,
               borderWidth: 2,
             }
           }}
         >
          <MenuItem value="">
            <em>Casa Central</em>
          </MenuItem>
          {sucursales.map((sucursal) => (
            <MenuItem key={sucursal.id} value={sucursal.nombre} sx={{ py: 1.5 }}>
              <Box display="flex" alignItems="center" sx={{ width: '100%' }}>
                <LocationOnIcon color="primary" sx={{ mr: 2 }} />
                <Box flex={1}>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {sucursal.nombre}
                  </Typography>
                  
                </Box>
                
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default SeleccionSucursal;