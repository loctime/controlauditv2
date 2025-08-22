import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box,
  useTheme,
  useMediaQuery,
  alpha
} from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ReportesPage from './ReportesPage';

// Componente wrapper para reportes en APK con navegación
const ReportesAPK = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const isAuditoria = location.pathname === '/' || location.pathname === '/auditoria';
  const isReportes = location.pathname === '/reportes';

  const handleNavigateToReportes = () => {
    navigate('/reportes');
  };

  const handleNavigateToAuditoria = () => {
    navigate('/');
  };

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      overflow: 'hidden',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header de navegación */}
      <AppBar 
        position="static" 
        sx={{ 
          bgcolor: theme.palette.primary.main,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          // Agregar padding superior para separar de la barra de estado
          pt: isMobile ? 'env(safe-area-inset-top, 20px)' : 0,
          // Agregar altura explícita para que se vea el cambio
          height: isMobile ? '100px' : '90px',
          minHeight: isMobile ? '100px' : '90px'
        }}
      >
        <Toolbar sx={{ 
          minHeight: isMobile ? '100px' : '90px', // Reducido a la mitad
          px: isMobile ? 3 : 4, // Aumentado padding horizontal
          py: isMobile ? 2 : 2.5, // Aumentado padding vertical
          // Agregar padding superior adicional para móvil
          paddingTop: isMobile ? 'calc(env(safe-area-inset-top, 20px) + 16px)' : undefined,
          // Cambiar layout para poner botones abajo
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'stretch'
        }}>
          {/* Título en la parte superior */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            flex: 1
          }}>
            <Typography 
              variant={isMobile ? "h4" : "h3"}
              sx={{ 
                fontWeight: 600,
                fontSize: isMobile ? '1.3rem' : '1.6rem',
                textAlign: 'center'
              }}
            >
              ControlAudit
            </Typography>
          </Box>
          
          {/* Botones en la parte inferior */}
          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <Button
              variant={isAuditoria ? "contained" : "outlined"}
              startIcon={<AssignmentIcon />}
              onClick={handleNavigateToAuditoria}
              sx={{
                minWidth: 'auto',
                px: isMobile ? 2 : 3, // Aumentado padding horizontal
                py: isMobile ? 1 : 1.5, // Aumentado padding vertical
                fontSize: isMobile ? '0.75rem' : '0.85rem', // Aumentado ligeramente
                bgcolor: isAuditoria ? 'white' : 'transparent',
                color: isAuditoria ? 'primary.main' : 'white',
                borderColor: 'white',
                borderRadius: 2,
                '&:hover': {
                  bgcolor: isAuditoria ? alpha(theme.palette.common.white, 0.9) : alpha(theme.palette.common.white, 0.1)
                }
              }}
            >
              {isMobile ? 'Auditoría' : 'Nueva Auditoría'}
            </Button>
            
            <Button
              variant={isReportes ? "contained" : "outlined"}
              startIcon={<AssessmentIcon />}
              onClick={handleNavigateToReportes}
              sx={{
                minWidth: 'auto',
                px: isMobile ? 2 : 3, // Aumentado padding horizontal
                py: isMobile ? 1 : 1.5, // Aumentado padding vertical
                fontSize: isMobile ? '0.75rem' : '0.85rem', // Aumentado ligeramente
                bgcolor: isReportes ? 'white' : 'transparent',
                color: isReportes ? 'primary.main' : 'white',
                borderColor: 'white',
                borderRadius: 2,
                '&:hover': {
                  bgcolor: isReportes ? alpha(theme.palette.common.white, 0.9) : alpha(theme.palette.common.white, 0.1)
                }
              }}
            >
              {isMobile ? 'Reportes' : 'Ver Reportes'}
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Contenido principal */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <ReportesPage />
      </Box>
    </div>
  );
};

export default ReportesAPK;
