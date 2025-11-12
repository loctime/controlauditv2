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
  alpha,
  Alert,
  CircularProgress
} from "@mui/material";
import BusinessIcon from '@mui/icons-material/Business';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';

const SeleccionEmpresa = ({ empresas, empresaSeleccionada, onChange }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('xs'));
  const [empresaSeleccionadaLocal, setEmpresaSeleccionadaLocal] = useState(empresaSeleccionada);
  const [debugInfo, setDebugInfo] = useState(null);

  // Verificar cache disponible
  useEffect(() => {
    const checkCache = async () => {
      try {
        // Verificar localStorage
        const localCache = localStorage.getItem('complete_user_cache');
        if (localCache) {
          const cacheData = JSON.parse(localCache);
          setDebugInfo({
            hasLocalStorage: true,
            empresasInCache: cacheData.empresas?.length || 0,
            userId: cacheData.userId
          });
        } else {
          setDebugInfo({
            hasLocalStorage: false,
            empresasInCache: 0
          });
        }
      } catch (e) {
        setDebugInfo({ error: e.message });
      }
    };
    checkCache();
  }, [empresas]);

  const mobileBoxStyle = {
    mb: isMobile ? 0.25 : 1,
    p: isMobile ? 1 : 3,
    borderRadius: 2,
    bgcolor: 'background.paper',
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    overflow: 'hidden',
    minHeight: isMobile ? '60px' : '120px',
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
          gap: isMobile ? 0.5 : 2,
          mb: isMobile ? 0.5 : 2
        }}>
          <Box sx={{ 
            p: isMobile ? 0.5 : 1.5, 
            borderRadius: '50%', 
            bgcolor: hasSelectedEmpresa 
              ? alpha(theme.palette.success.main, 0.1)
              : alpha(theme.palette.primary.main, 0.1),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {hasSelectedEmpresa ? (
              <CheckCircleIcon 
                color="success" 
                sx={{ fontSize: isMobile ? 16 : 24 }} 
              />
            ) : (
              <BusinessIcon 
                color="primary" 
                sx={{ fontSize: isMobile ? 16 : 24 }} 
              />
            )}
          </Box>
          <Typography 
            variant={isMobile ? "body2" : "h6"} 
            sx={{ 
              fontWeight: 600, 
              color: hasSelectedEmpresa ? 'success.main' : 'text.primary',
              fontSize: isMobile ? '0.8rem' : undefined
            }}
          >
            {hasSelectedEmpresa ? 'Empresa Seleccionada' : 'Seleccionar Empresa'}
          </Typography>
        </Box>
        
        <FormControl 
          fullWidth 
          sx={{ 
            mt: isMobile ? 0.25 : 2,
            '& .MuiInputBase-root': {
              fontSize: isMobile ? '0.875rem' : '1rem',
              minHeight: isMobile ? '36px' : '56px',
              // Aplicar estilos verdes cuando hay empresa seleccionada
              ...(hasSelectedEmpresa && {
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
            aria-label="Seleccionar empresa para la auditoría"
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
                key={empresa.id || empresa.nombre} 
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
                      fontWeight: 600,
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden'
                    }}
                  >
                    {empresa.nombre}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ 
                      fontSize: '0.875rem',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden'
                    }}
                  >
                    {empresa.direccion || 'Sin dirección'}
                  </Typography>
                </Box>
                {empresa.activa && (
                  <Chip 
                    label="Activa" 
                    color="success" 
                    size="small"
                    sx={{ 
                      fontSize: '0.75rem',
                      fontWeight: 500
                    }}
                  />
                )}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Información adicional */}
      {empresas.length === 0 && (
        <>
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
                fontSize: isMobile ? '0.875rem' : '1rem',
                mb: 2
              }}
            >
              Contacta a tu administrador para agregar empresas.
            </Typography>
            
            {/* Debug info */}
            {debugInfo && (
              <Alert 
                severity={debugInfo.hasLocalStorage && debugInfo.empresasInCache > 0 ? "info" : "warning"}
                icon={<InfoIcon />}
                sx={{ mt: 2 }}
              >
                <Typography variant="body2" fontWeight="bold">
                  Debug Info:
                </Typography>
                <Typography variant="caption" component="div">
                  • Empresas recibidas: {empresas.length}
                </Typography>
                {debugInfo.hasLocalStorage && (
                  <Typography variant="caption" component="div">
                    • Cache localStorage: {debugInfo.empresasInCache} empresas
                  </Typography>
                )}
                {debugInfo.userId && (
                  <Typography variant="caption" component="div">
                    • UserId en cache: {debugInfo.userId}
                  </Typography>
                )}
                {debugInfo.error && (
                  <Typography variant="caption" color="error" component="div">
                    • Error: {debugInfo.error}
                  </Typography>
                )}
                {!navigator.onLine && (
                  <Typography variant="caption" color="warning" component="div" sx={{ mt: 1 }}>
                    ⚠️ Modo offline detectado
                  </Typography>
                )}
              </Alert>
            )}
          </Box>
        </>
      )}


    </Box>
  );
};

export default SeleccionEmpresa;
