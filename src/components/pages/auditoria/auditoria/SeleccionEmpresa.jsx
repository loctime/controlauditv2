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
    mb: isMobile ? 1.5 : 3,
    p: isMobile ? 2 : 3,
    borderRadius: 2,
    bgcolor: 'background.paper',
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    overflow: 'hidden',
    minHeight: isMobile ? '100px' : '120px',
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

  return (
    <Box>
      {/* Selección de Empresa */}
      <Box sx={mobileBoxStyle}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: isMobile ? 1 : 2,
          mb: isMobile ? 1.5 : 2
        }}>
          <Box sx={{ 
            p: isMobile ? 1 : 1.5, 
            borderRadius: '50%', 
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <BusinessIcon 
              color="primary" 
              sx={{ fontSize: isMobile ? 20 : 24 }} 
            />
          </Box>
          <Typography 
            variant={isMobile ? "body1" : "h6"} 
            sx={{ fontWeight: 600, color: 'text.primary' }}
          >
            Seleccionar Empresa
          </Typography>
        </Box>
        
        <FormControl 
          fullWidth 
          sx={{ 
            mt: isMobile ? 1 : 2,
            '& .MuiInputBase-root': {
              fontSize: isMobile ? '0.875rem' : '1rem',
              minHeight: isMobile ? '48px' : '56px'
            }
          }}
        >
          <InputLabel 
            sx={{ 
              fontSize: isMobile ? '0.875rem' : '1rem',
              '&.Mui-focused': {
                fontSize: isMobile ? '0.75rem' : '0.875rem'
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
                  maxHeight: 10000, // Altura máxima muy grande
                  minWidth: 600,    // Ancho mínimo más amplio
                  maxWidth: '90vw', // Ancho máximo relativo a la pantalla
                  width: 'auto',    // Ancho automático
                  '& .MuiMenuItem-root': {
                    py: 2.5,        // Más espacio vertical entre items
                    px: 3,          // Más espacio horizontal
                    minHeight: 60,  // Altura mínima de cada item
                    fontSize: '1rem' // Tamaño de fuente
                  }
                }
              },
              anchorOrigin: { vertical: 'bottom', horizontal: 'left' },
              transformOrigin: { vertical: 'top', horizontal: 'left' },
              slotProps: {
                paper: {
                  sx: {
                    maxHeight: 10000, // Corregido para ser consistente
                    overflow: 'auto',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)', // Sombra más pronunciada
                    border: '1px solid rgba(0,0,0,0.1)' // Borde sutil
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
                  gap: 2,
                  py: isMobile ? 1.5 : 2,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.08)
                  },
                  '&.Mui-selected': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.12),
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.16)
                    }
                  }
                }}
              >
                {empresa.logo && empresa.logo.trim() !== "" ? (
                  <Avatar
                    src={empresa.logo}
                    alt={`${empresa.nombre} logo`}
                    sx={{ 
                      width: isMobile ? 32 : 40, 
                      height: isMobile ? 32 : 40,
                      border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`
                    }}
                  />
                ) : (
                  <Avatar 
                    sx={{ 
                      width: isMobile ? 32 : 40, 
                      height: isMobile ? 32 : 40,
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: theme.palette.primary.main,
                      fontSize: isMobile ? '0.875rem' : '1rem'
                    }}
                  >
                    {empresa.nombre.charAt(0).toUpperCase()}
                  </Avatar>
                )}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontWeight: 500,
                      fontSize: isMobile ? '0.875rem' : '1rem',
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

      {/* Empresa Seleccionada */}
      {empresaSeleccionadaLocal && (
        <Box sx={{
          ...mobileBoxStyle,
          background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)}, ${alpha(theme.palette.success.main, 0.05)})`,
          border: `2px solid ${alpha(theme.palette.success.main, 0.2)}`
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
              bgcolor: alpha(theme.palette.success.main, 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CheckCircleIcon 
                color="success" 
                sx={{ fontSize: isMobile ? 20 : 24 }} 
              />
            </Box>
            <Typography 
              variant={isMobile ? "body1" : "h6"} 
              sx={{ fontWeight: 600, color: 'success.main' }}
            >
              Empresa Seleccionada
            </Typography>
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: isMobile ? 1.5 : 2,
            pl: isMobile ? 3.5 : 4.5
          }}>
            {empresaSeleccionadaLocal.logo && empresaSeleccionadaLocal.logo.trim() !== "" ? (
              <Avatar
                src={empresaSeleccionadaLocal.logo}
                alt={`${empresaSeleccionadaLocal.nombre} logo`}
                sx={{ 
                  width: isMobile ? 40 : 48, 
                  height: isMobile ? 40 : 48,
                  border: `2px solid ${alpha(theme.palette.success.main, 0.2)}`
                }}
              />
            ) : (
              <Avatar 
                sx={{ 
                  width: isMobile ? 40 : 48, 
                  height: isMobile ? 40 : 48,
                  bgcolor: alpha(theme.palette.success.main, 0.2),
                  color: theme.palette.success.main,
                  fontSize: isMobile ? '1rem' : '1.25rem'
                }}
              >
                {empresaSeleccionadaLocal.nombre.charAt(0).toUpperCase()}
              </Avatar>
            )}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography 
                variant={isMobile ? "body1" : "h6"} 
                sx={{ 
                  fontWeight: 600,
                  color: 'success.main',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden'
                }}
              >
                {empresaSeleccionadaLocal.nombre}
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ 
                  fontSize: isMobile ? '0.875rem' : '1rem',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden'
                }}
              >
                {empresaSeleccionadaLocal.direccion || 'Sin dirección'}
              </Typography>
            </Box>
            <Chip 
              label="Activa" 
              color="success" 
              size={isMobile ? "small" : "medium"}
              sx={{ 
                fontSize: isMobile ? '0.75rem' : '0.875rem',
                fontWeight: 500
              }}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default SeleccionEmpresa;
