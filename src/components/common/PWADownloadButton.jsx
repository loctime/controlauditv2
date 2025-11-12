import React, { useState, useEffect } from 'react';
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
  const [bottomOffset, setBottomOffset] = useState(16);

  // Detectar altura de la barra de navegación de Edge
  useEffect(() => {
    if (!isMobile) return;

    const isEdge = navigator.userAgent.includes('Edg');
    if (!isEdge) return;

    // Calcular altura de la barra de navegación
    const calculateNavbarHeight = () => {
      // Usar visualViewport API si está disponible (mejor para móvil)
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const clientHeight = document.documentElement.clientHeight;
      
      // La diferencia indica la altura de las barras del navegador
      const navbarHeight = Math.max(0, window.innerHeight - clientHeight);
      
      // Edge suele tener una barra de navegación de ~40-60px cuando está visible
      // Altura mínima para Edge: ~50px cuando la barra está visible
      const edgeNavbarHeight = navbarHeight > 0 ? Math.max(50, navbarHeight) : 50;
      
      // Usar safe-area-inset-bottom si está disponible
      const safeAreaBottom = parseInt(
        getComputedStyle(document.documentElement)
          .getPropertyValue('env(safe-area-inset-bottom)') || '0', 
        10
      );
      
      // Offset base + altura de barra Edge + safe area
      return Math.max(16 + edgeNavbarHeight, safeAreaBottom + 50);
    };

    // Calcular offset inicial
    const updateOffset = () => {
      setBottomOffset(calculateNavbarHeight());
    };

    updateOffset();

    // Recalcular cuando cambia el tamaño del viewport (barra aparece/desaparece)
    const handleViewportChange = () => {
      // Pequeño delay para que el navegador actualice las dimensiones
      setTimeout(updateOffset, 100);
    };

    // Usar visualViewport API si está disponible (mejor para móvil)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
      window.visualViewport.addEventListener('scroll', handleViewportChange);
    } else {
      window.addEventListener('resize', handleViewportChange);
    }

    // También escuchar cambios en la orientación
    window.addEventListener('orientationchange', handleViewportChange);

    // Escuchar cambios en el scroll (la barra puede ocultarse al hacer scroll)
    let scrollTimeout;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(handleViewportChange, 150);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
        window.visualViewport.removeEventListener('scroll', handleViewportChange);
      } else {
        window.removeEventListener('resize', handleViewportChange);
      }
      window.removeEventListener('orientationchange', handleViewportChange);
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [isMobile]);

  // No mostrar si no se puede instalar o no estamos en la página de inicio
  if (!canInstall || location.pathname !== '/') {
    return null;
  }

  // Calcular bottom dinámico usando safe-area-inset-bottom
  const isEdge = navigator.userAgent.includes('Edg');
  const dynamicBottom = isEdge && isMobile 
    ? bottomOffset 
    : `calc(16px + env(safe-area-inset-bottom, 0px))`;
  
  const dynamicBottomInfo = isEdge && isMobile 
    ? bottomOffset + 64 
    : `calc(80px + env(safe-area-inset-bottom, 0px))`;

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
            bottom: dynamicBottom,
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
            bottom: dynamicBottomInfo,
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
