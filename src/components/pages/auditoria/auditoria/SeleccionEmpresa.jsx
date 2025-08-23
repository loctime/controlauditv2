import React, { useState, useEffect } from "react";
import { 
  FormControl, 
  InputLabel, 
  MenuItem, 
  Select, 
  Box, 
  Typography, 
  Avatar,
  Chip,
  useTheme,
  useMediaQuery,
  alpha
} from "@mui/material";
import BusinessIcon from '@mui/icons-material/Business';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';

const SeleccionEmpresa = ({ empresas, empresaSeleccionada, onChange }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('xs'));
  const [empresaSeleccionadaLocal, setEmpresaSeleccionadaLocal] = useState(empresaSeleccionada);

  const mobileBoxStyle = {
    mb: isMobile ? 0.25 : 1,
    p: isMobile ? 0.75 : 2,
    borderRadius: 1.5,
    bgcolor: 'background.paper',
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    overflow: 'hidden',
    height: isMobile ? '50px' : '100px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between'
  };

  useEffect(() => {
    setEmpresaSeleccionadaLocal(empresaSeleccionada);
  }, [empresaSeleccionada]);

  const handleChange = (event) => {
    const selectedEmpresa = empresas.find((empresa) => empresa.nombre === event.target.value);
    setEmpresaSeleccionadaLocal(selectedEmpresa);
    onChange(selectedEmpresa);
  };

  // Determinar si hay una empresa seleccionada para aplicar estilos verdes
  const hasSelectedEmpresa = !!empresaSeleccionadaLocal;

  return (
    <Box>
      {/* Selección de Empresa */}
      <Box sx={mobileBoxStyle}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: isMobile ? 0.5 : 1.5,
          mb: isMobile ? 0.25 : 1.5
        }}>
          <Box sx={{ 
            p: isMobile ? 0.25 : 1, 
            borderRadius: '50%', 
            bgcolor: hasSelectedEmpresa 
              ? alpha(theme.palette.success.main, 0.08)
              : alpha(theme.palette.primary.main, 0.08),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {hasSelectedEmpresa ? (
              <CheckCircleIcon 
                color="success" 
                sx={{ fontSize: isMobile ? 14 : 20 }} 
              />
            ) : (
              <BusinessIcon 
                color="primary" 
                sx={{ fontSize: isMobile ? 14 : 20 }} 
              />
            )}
          </Box>
                     <Typography 
             variant={isMobile ? "body2" : "h6"} 
             sx={{ 
               fontWeight: 600, 
               color: hasSelectedEmpresa ? 'success.main' : 'text.primary',
               fontSize: isMobile ? '0.75rem' : undefined,
               minWidth: isMobile ? '120px' : '140px',
               textAlign: 'left'
             }}
           >
             {hasSelectedEmpresa ? 'Empresa Seleccionada' : 'Seleccionar Empresa'}
           </Typography>
        </Box>
        
        <FormControl 
          fullWidth 
          sx={{ 
            mt: isMobile ? 0.25 : 1.5,
                         '& .MuiInputBase-root': {
               fontSize: isMobile ? '0.8rem' : '0.9rem',
               height: isMobile ? '32px' : '48px',
               minHeight: isMobile ? '32px' : '48px',
               // Aplicar estilos verdes cuando hay empresa seleccionada
               ...(hasSelectedEmpresa && {
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
              ...(hasSelectedEmpresa && {
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
              '&.Mui-focused': {
                fontSize: isMobile ? '0.65rem' : '0.75rem'
              }
            }}
          >
            Empresa
          </InputLabel>
          <Select
            value={empresaSeleccionadaLocal ? empresaSeleccionadaLocal.nombre : ""}
            onChange={handleChange}
            label="Empresa"
            MenuProps={{
              PaperProps: {
                sx: {
                  maxHeight: isMobile ? 300 : 400,
                  minWidth: isMobile ? '90vw' : 400,
                  maxWidth: '90vw',
                  width: 'auto',
                  '& .MuiMenuItem-root': {
                    py: isMobile ? 1 : 1.5,
                    px: isMobile ? 1.5 : 2,
                    minHeight: isMobile ? 40 : 50,
                    fontSize: isMobile ? '0.8rem' : '0.9rem'
                  }
                }
              },
              anchorOrigin: { vertical: 'bottom', horizontal: 'left' },
              transformOrigin: { vertical: 'top', horizontal: 'left' },
              slotProps: {
                paper: {
                  sx: {
                    maxHeight: isMobile ? 300 : 400,
                    overflow: 'auto',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                    border: '1px solid rgba(0,0,0,0.08)'
                  }
                }
              }
            }}
          >
            <MenuItem value="">
              <em>Seleccione una empresa</em>
            </MenuItem>
            {empresas.map((empresa) => (
              <MenuItem 
                key={empresa.nombre} 
                value={empresa.nombre} 
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: isMobile ? 1 : 1.5,
                  py: isMobile ? 0.75 : 1,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.06)
                  },
                  '&.Mui-selected': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.12)
                    }
                  }
                }}
              >
                {empresa.logo && empresa.logo.trim() !== "" ? (
                  <Avatar
                    src={empresa.logo}
                    alt={`${empresa.nombre} logo`}
                    sx={{ 
                      width: isMobile ? 24 : 32, 
                      height: isMobile ? 24 : 32,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`
                    }}
                  />
                ) : (
                  <Avatar 
                    sx={{ 
                      width: isMobile ? 24 : 32, 
                      height: isMobile ? 24 : 32,
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                      color: theme.palette.primary.main,
                      fontSize: isMobile ? '0.7rem' : '0.875rem'
                    }}
                  >
                    {empresa.nombre.charAt(0).toUpperCase()}
                  </Avatar>
                )}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontWeight: 600,
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden'
                    }}
                  >
                    {empresa.nombre}
                  </Typography>
                  
                </Box>
               
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Información adicional */}
      {empresas.length === 0 && (
        <Box sx={{
          ...mobileBoxStyle,
          background: alpha(theme.palette.warning.main, 0.1),
          border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: isMobile ? 1 : 2,
            mb: isMobile ? 1 : 2
          }}>
            <Box sx={{ 
              p: isMobile ? 1 : 1.5, 
              borderRadius: '50%', 
              bgcolor: alpha(theme.palette.warning.main, 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <WarningIcon 
                color="warning" 
                sx={{ fontSize: isMobile ? 20 : 24 }} 
              />
            </Box>
            <Typography 
              variant={isMobile ? "body1" : "h6"} 
              sx={{ fontWeight: 600, color: 'text.primary' }}
            >
              No hay empresas disponibles
            </Typography>
          </Box>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ 
              pl: isMobile ? 3.5 : 4.5,
              fontSize: isMobile ? '0.875rem' : '1rem'
            }}
          >
            Contacta a tu administrador para agregar empresas.
          </Typography>
        </Box>
      )}


    </Box>
  );
};

export default SeleccionEmpresa;
