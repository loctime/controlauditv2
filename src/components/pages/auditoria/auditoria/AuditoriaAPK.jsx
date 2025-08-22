import React, { useState } from 'react';
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
import Auditoria from './Auditoria';

// Componente wrapper para auditoría en APK con navegación
const AuditoriaAPK = () => {
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
           height: isMobile ? '120px' : '110px',
           minHeight: isMobile ? '120px' : '110px'
         }}
       >
         <Toolbar sx={{ 
           minHeight: isMobile ? '120px' : '110px', // Aumentado un poco
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
             flex: 1,
             // Agregar margen superior para evitar la cámara frontal
             mt: isMobile ? 2 : 0
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
             gap: 1.5, // Reducido el gap entre botones
             justifyContent: 'center',
             alignItems: 'center',
             mb: isMobile ? 1 : 0 // Agregar margen inferior para subirlos
           }}>
             <Button
               variant={isAuditoria ? "contained" : "outlined"}
               startIcon={<AssignmentIcon />}
               onClick={handleNavigateToAuditoria}
               sx={{
                 minWidth: 'auto',
                 px: isMobile ? 1.5 : 2.5, // Reducido padding horizontal
                 py: isMobile ? 0.75 : 1, // Reducido padding vertical
                 fontSize: isMobile ? '0.7rem' : '0.8rem', // Reducido tamaño de fuente
                 bgcolor: isAuditoria ? 'white' : 'transparent',
                 color: isAuditoria ? 'primary.main' : 'white',
                 borderColor: 'white',
                 borderRadius: 1.5, // Reducido border radius
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
                 px: isMobile ? 1.5 : 2.5, // Reducido padding horizontal
                 py: isMobile ? 0.75 : 1, // Reducido padding vertical
                 fontSize: isMobile ? '0.7rem' : '0.8rem', // Reducido tamaño de fuente
                 bgcolor: isReportes ? 'white' : 'transparent',
                 color: isReportes ? 'primary.main' : 'white',
                 borderColor: 'white',
                 borderRadius: 1.5, // Reducido border radius
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
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <Auditoria />
      </Box>
    </div>
  );
};

export default AuditoriaAPK;
