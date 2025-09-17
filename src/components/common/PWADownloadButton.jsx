import React, { useState, useEffect } from 'react';
import { 
  Fab, 
  Tooltip, 
  useTheme,
  useMediaQuery,
  alpha
} from '@mui/material';
import { Download, GetApp, Info } from '@mui/icons-material';

const PWADownloadButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    // Verificar si ya está instalado
    const checkIfInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches || 
          window.navigator.standalone === true) {
        setIsInstalled(true);
        return;
      }
    };

    checkIfInstalled();

    // Escuchar el evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowButton(true);
    };

    // Escuchar cuando se instala la PWA
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowButton(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('PWA instalada por el usuario');
      } else {
        console.log('PWA no instalada por el usuario');
      }
      
      setDeferredPrompt(null);
      setShowButton(false);
    }
  };

  const handleShowInfo = () => {
    // Disparar evento personalizado para mostrar el diálogo
    window.dispatchEvent(new CustomEvent('showPWAInfo'));
  };

  // No mostrar si ya está instalado o no hay prompt disponible
  if (isInstalled || !showButton || !deferredPrompt) {
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
