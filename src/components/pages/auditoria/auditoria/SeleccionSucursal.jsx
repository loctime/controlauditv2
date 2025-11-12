// components/SeleccionSucursal.js
import React, { useEffect, useRef, useState } from "react";
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

const SeleccionSucursal = ({ sucursales, sucursalSeleccionada, onChange, autoOpen = false, isMobile: isMobileProp = false }) => {
  const theme = useTheme();
  const isMobileHook = useMediaQuery(theme.breakpoints.down('sm'));
  const isMobile = isMobileProp || isMobileHook;
  const selectRef = useRef(null);
  const containerRef = useRef(null);
  const hasOpenedRef = useRef(false);
  const [selectOpen, setSelectOpen] = useState(false);

  const handleChange = (event) => {
    onChange(event);
    setSelectOpen(false);
  };

  // Determinar si hay una ubicación seleccionada para aplicar estilos verdes
  const hasSelectedSucursal = !!sucursalSeleccionada;

  // Abrir automáticamente el selector y hacer scroll en móvil
  useEffect(() => {
    // Resetear el flag cuando cambia la empresa (sucursalSeleccionada se resetea)
    if (!sucursalSeleccionada) {
      hasOpenedRef.current = false;
      setSelectOpen(false);
    }
  }, [sucursalSeleccionada]);

  useEffect(() => {
    if (autoOpen && !hasSelectedSucursal && !hasOpenedRef.current && selectRef.current) {
      hasOpenedRef.current = true;
      
      // Pequeño delay para asegurar que el componente esté renderizado
      setTimeout(() => {
        // Abrir el selector usando el estado
        setSelectOpen(true);
        
        // Hacer scroll en móvil
        if (isMobile && containerRef.current) {
          setTimeout(() => {
            containerRef.current.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center' 
            });
          }, 300);
        }
      }, 100);
    }
  }, [autoOpen, hasSelectedSucursal, isMobile]);

  return (
    <Box ref={containerRef} sx={{ mb: isMobile ? 0.25 : 1 }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: isMobile ? 0.5 : 2,
        mb: isMobile ? 0.5 : 2
      }}>
        <Box sx={{ 
          p: isMobile ? 0.5 : 1.5, 
          borderRadius: '50%', 
          bgcolor: hasSelectedSucursal 
            ? alpha(theme.palette.success.main, 0.1)
            : alpha(theme.palette.primary.main, 0.1),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {hasSelectedSucursal ? (
            <CheckCircleIcon 
              color="success" 
              sx={{ fontSize: isMobile ? 16 : 24 }} 
            />
          ) : (
            <LocationOnIcon 
              color="primary" 
              sx={{ fontSize: isMobile ? 16 : 24 }} 
            />
          )}
        </Box>
        <Typography 
          variant={isMobile ? "body2" : "h6"} 
          sx={{ 
            fontWeight: 600, 
            color: hasSelectedSucursal ? 'success.main' : 'text.primary',
            fontSize: isMobile ? '0.8rem' : undefined
          }}
        >
          {hasSelectedSucursal ? 'Ubicación Seleccionada' : 'Seleccionar Ubicación'}
        </Typography>
      </Box>
      
      <FormControl 
        ref={selectRef}
        fullWidth 
        size="large"
        sx={{ 
          '& .MuiInputBase-root': {
            fontSize: isMobile ? '0.875rem' : '1rem',
            minHeight: isMobile ? '36px' : '56px',
            // Aplicar estilos verdes cuando hay ubicación seleccionada
            ...(hasSelectedSucursal && {
              backgroundColor: alpha(theme.palette.success.main, 0.05),
              borderColor: theme.palette.success.main,
              '&:hover': {
                borderColor: theme.palette.success.main,
                backgroundColor: alpha(theme.palette.success.main, 0.08)
              },
              '&.Mui-focused': {
                borderColor: theme.palette.success.main,
                backgroundColor: alpha(theme.palette.success.main, 0.1)
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
            fontSize: isMobile ? '0.875rem' : '1.1rem', 
            fontWeight: 500,
            '&.Mui-focused': {
              fontSize: isMobile ? '0.75rem' : '0.875rem'
            }
          }}
        >
          Ubicación
        </InputLabel>
        <Select
          ref={selectRef}
          value={sucursalSeleccionada}
          onChange={handleChange}
          open={selectOpen}
          onOpen={() => setSelectOpen(true)}
          onClose={() => setSelectOpen(false)}
          aria-label="Seleccionar ubicación o sucursal para la auditoría"
          sx={{ 
            minHeight: isMobile ? '40px' : '56px',
            '& .MuiSelect-select': {
              fontSize: isMobile ? '0.875rem' : '1rem',
              padding: isMobile ? '8px 14px' : '16px 14px'
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
                  <Typography variant="caption" color="textSecondary">
                    Sucursal
                  </Typography>
                </Box>
                <Chip 
                  label="Sucursal" 
                  size="small" 
                  color="primary" 
                  variant="outlined"
                />
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default SeleccionSucursal;