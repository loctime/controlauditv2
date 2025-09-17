import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Typography, 
  Box,
  useTheme,
  useMediaQuery,
  alpha
} from '@mui/material';
import { Download, Close } from '@mui/icons-material';

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
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
      
      // Mostrar el diálogo de instalación después de un delay
      setTimeout(() => {
        if (!isInstalled) {
          setShowInstallDialog(true);
        }
      }, 3000);
    };

    // Escuchar cuando se instala la PWA
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallDialog(false);
      setDeferredPrompt(null);
      
      // Actualizar el manifest con el tenant
      updateManifestWithTenant();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isInstalled]);

  const updateManifestWithTenant = () => {
    const tenant = localStorage.getItem('tenant');
    if (tenant) {
      // Actualizar el nombre de la app con el tenant
      const manifest = {
        name: `ControlAudit - ${tenant}`,
        short_name: `ControlAudit`,
        description: `Sistema de control y gestión de auditorías para ${tenant}`,
        start_url: '/',
        display: 'standalone',
        background_color: '#1976d2',
        theme_color: '#1976d2',
        orientation: 'portrait-primary',
        icons: [
          {
            src: '/loguitoaudit.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/loguitoaudit.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        categories: ['business', 'productivity'],
        lang: 'es',
        dir: 'ltr',
        scope: '/',
        prefer_related_applications: false
      };

      // Crear un blob con el manifest actualizado
      const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
      const manifestURL = URL.createObjectURL(manifestBlob);
      
      // Actualizar el link del manifest
      const manifestLink = document.querySelector('link[rel="manifest"]');
      if (manifestLink) {
        manifestLink.href = manifestURL;
      }
      
      // También actualizar el título de la página
      document.title = `ControlAudit - ${tenant}`;
    }
  };

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
      setShowInstallDialog(false);
    }
  };

  const handleClose = () => {
    setShowInstallDialog(false);
  };

  if (isInstalled) {
    return null;
  }

  return (
    <Dialog
      open={showInstallDialog}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 3,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
          border: `1px solid ${alpha(theme.palette.divider, 0.2)}`
        }
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <img 
            src="/loguitoaudit.png" 
            alt="ControlAudit" 
            style={{ width: 48, height: 48 }}
          />
          <Typography variant="h5" component="h2" sx={{ fontWeight: 700, color: 'primary.main' }}>
            Instalar ControlAudit
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ textAlign: 'center', py: 3 }}>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
          📱 Instala ControlAudit en tu dispositivo para un acceso más rápido y una mejor experiencia.
        </Typography>
        
        <Box sx={{ 
          bgcolor: alpha(theme.palette.primary.main, 0.1), 
          borderRadius: 2, 
          p: 2, 
          mb: 2 
        }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
            ✅ Acceso directo desde el escritorio
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
            ✅ Funciona sin conexión a internet
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
            ✅ Notificaciones push
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
            ✅ Experiencia de app nativa
          </Typography>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 3, pt: 0, gap: 2 }}>
        <Button
          onClick={handleClose}
          variant="outlined"
          startIcon={<Close />}
          sx={{ 
            flex: 1,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600
          }}
        >
          Ahora no
        </Button>
        <Button
          onClick={handleInstall}
          variant="contained"
          startIcon={<Download />}
          sx={{ 
            flex: 1,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            '&:hover': {
              background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`
            }
          }}
        >
          Instalar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PWAInstallPrompt;
