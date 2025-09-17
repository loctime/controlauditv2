import React from 'react';
import { 
  Fab, 
  Tooltip, 
  useTheme,
  useMediaQuery,
  alpha
} from '@mui/material';
import { Download, GetApp, Info } from '@mui/icons-material';
import { useLocation } from 'react-router-dom';
import { usePWAInstall } from '../../hooks/usePWAInstall';

const PWADownloadButton = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const { canInstall, handleInstall, handleShowInfo } = usePWAInstall();

  // No mostrar si no se puede instalar o no estamos en la página de inicio
  if (!canInstall || location.pathname !== '/') {
    return null;
  }

  return (
    <>
      <Tooltip 
        title="Instalar ControlAudit" 
        placement="right"
        arrow
      >
        <Fab
          onClick={handleInstall}
          size={isMobile ? "medium" : "small"}
          sx={{
            position: 'fixed',
            bottom: 16,
            left: 16,
            zIndex: 1000,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            color: 'white',
            boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
            '&:hover': {
              background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
              transform: 'scale(1.1)',
              boxShadow: `0 6px 25px ${alpha(theme.palette.primary.main, 0.6)}`,
            },
            transition: 'all 0.3s ease',
            '& .MuiSvgIcon-root': {
              fontSize: isMobile ? '1.5rem' : '1.2rem'
            }
          }}
          aria-label="Instalar ControlAudit"
        >
          <GetApp />
        </Fab>
      </Tooltip>
      
      <Tooltip 
        title="Más información" 
        placement="right"
        arrow
      >
        <Fab
          onClick={handleShowInfo}
          size="small"
          sx={{
            position: 'fixed',
            bottom: 80,
            left: 16,
            zIndex: 1000,
            background: alpha(theme.palette.primary.main, 0.1),
            color: theme.palette.primary.main,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
            '&:hover': {
              background: alpha(theme.palette.primary.main, 0.2),
              transform: 'scale(1.05)',
            },
            transition: 'all 0.3s ease',
            '& .MuiSvgIcon-root': {
              fontSize: '1rem'
            }
          }}
          aria-label="Información PWA"
        >
          <Info />
        </Fab>
      </Tooltip>
    </>
  );
};

export default PWADownloadButton;
