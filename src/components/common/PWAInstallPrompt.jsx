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
      
      // No mostrar diálogo automático - solo el botón flotante
      // setTimeout(() => {
      //   if (!isInstalled) {
      //     setShowInstallDialog(true);
      //   }
      // }, 3000);
    };

    // Escuchar cuando se instala la PWA
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallDialog(false);
      setDeferredPrompt(null);
      
      // Actualizar el manifest con el tenant
      updateManifestWithTenant();
    };

    // Escuchar evento personalizado para mostrar información
    const handleShowPWAInfo = () => {
      setShowInstallDialog(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('showPWAInfo', handleShowPWAInfo);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('showPWAInfo', handleShowPWAInfo);
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
        manifestLink.href = manifestURL + '?v=' + Date.now();
      }
      
      // También actualizar el título de la página
      document.title = `ControlAudit - ${tenant}`;
    }
  };

  // Función para abrir tienda de aplicaciones
  const openAppStore = () => {
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    if (isAndroid) {
      // Usar el enlace directo de Google Play Store
      const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.microsoft.emmx';
      
      // Intentar abrir directamente en Google Play Store
      window.open(playStoreUrl, '_blank');
    } else if (isIOS) {
      // Para iOS, usar el esquema de App Store
      const appStoreUrl = 'itms-apps://itunes.apple.com/app/id1288723196';
      const appStoreWebUrl = 'https://apps.apple.com/app/microsoft-edge/id1288723196';
      
      try {
        window.location.href = appStoreUrl;
        // Fallback después de un tiempo
        setTimeout(() => {
          window.open(appStoreWebUrl, '_blank');
        }, 2000);
      } catch (error) {
        window.open(appStoreWebUrl, '_blank');
      }
    } else {
      alert('Para instalar Edge, visita: https://www.microsoft.com/edge');
    }
  };

  // Función para instalar en Chrome
  const installInChrome = async () => {
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
    } else {
      alert('Para instalar esta app, usa el menú de tu navegador:\n\n• Chrome: Menú ⋮ > Instalar app\n• Edge: Menú ⋯ > Aplicaciones > Instalar esta aplicación\n• Safari: Compartir > Añadir a pantalla de inicio');
      setShowInstallDialog(false);
    }
  };

  const handleInstall = async () => {
    // Detectar navegador
    const isEdge = navigator.userAgent.includes('Edg');
    const isChrome = navigator.userAgent.includes('Chrome') && !navigator.userAgent.includes('Edg');
    
    console.log('=== INSTALACIÓN DESDE MODAL ===');
    console.log('Navegador actual:', isEdge ? 'Edge' : isChrome ? 'Chrome' : 'Otro');
    
    if (isChrome) {
      // Si es Chrome, redirigir a Edge
      const currentUrl = window.location.href;
      const edgeUrl = `microsoft-edge:${currentUrl}`;
      
      // Detectar si es móvil
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      console.log('Dispositivo móvil detectado:', isMobile);
      
      if (isMobile) {
        // En móvil, mostrar opciones al usuario
        const userChoice = confirm(
          '📱 ¿Cómo quieres instalar la app?\n\n' +
          '✅ Edge (Recomendado):\n' +
          '• Mejor experiencia offline\n' +
          '• Navegación automática\n' +
          '• Memoria de datos optimizada\n\n' +
          '✅ Chrome (Actual):\n' +
          '• Instalación directa\n' +
          '• Sin cambios de navegador\n\n' +
          'Aceptar = Instalar Edge\n' +
          'Cancelar = Usar Chrome'
        );
        
        if (userChoice) {
          // Usuario quiere Edge - verificar si está instalado primero
          const edgeInstalled = confirm(
            '📱 ¿Tienes Microsoft Edge instalado en tu dispositivo?\n\n' +
            '• Sí = Te abriré la app en Edge\n' +
            '• No = Te llevaré a instalarlo'
          );
          
          if (edgeInstalled) {
            // Intentar abrir en Edge usando diferentes métodos
            try {
              // Método 1: Intentar con esquema personalizado
              const iframe = document.createElement('iframe');
              iframe.style.display = 'none';
              iframe.src = edgeUrl;
              document.body.appendChild(iframe);
              
              setShowInstallDialog(false);
              
              setTimeout(() => {
                document.body.removeChild(iframe);
                // Si llegamos aquí, Edge no se abrió
                alert(
                  '❌ No se pudo abrir Edge automáticamente.\n\n' +
                  'Por favor:\n' +
                  '1. Abre Edge manualmente\n' +
                  '2. Ve a: auditoria.controldoc.app\n' +
                  '3. Instala la PWA desde Edge'
                );
              }, 2000);
              
            } catch (error) {
              console.warn('No se pudo abrir Edge:', error);
              setShowInstallDialog(false);
              alert(
                '❌ No se pudo abrir Edge automáticamente.\n\n' +
                'Por favor:\n' +
                '1. Abre Edge manualmente\n' +
                '2. Ve a: auditoria.controldoc.app\n' +
                '3. Instala la PWA desde Edge'
              );
            }
          } else {
            // Edge no está instalado, ofrecer instalarlo
            const installEdge = confirm(
              '📱 Edge no está instalado\n\n' +
              '¿Quieres instalarlo desde la tienda?\n\n' +
              '• Sí = Abrir tienda de aplicaciones\n' +
              '• No = Usar Chrome directamente'
            );
            
            if (installEdge) {
              openAppStore();
            } else {
              installInChrome();
            }
          }
        } else {
          // Usuario prefiere Chrome
          installInChrome();
        }
      } else {
        // En escritorio, mostrar opciones al usuario
        const userChoice = confirm(
          '💻 ¿Cómo quieres instalar la app?\n\n' +
          '✅ Edge (Recomendado):\n' +
          '• Mejor experiencia offline\n' +
          '• Instalación de PWA optimizada\n' +
          '• Cache de datos mejorado\n\n' +
          '✅ Chrome (Actual):\n' +
          '• Instalación directa\n' +
          '• Sin cambios de navegador\n\n' +
          'Aceptar = Abrir en Edge\n' +
          'Cancelar = Usar Chrome'
        );
        
        if (userChoice) {
          // Usuario quiere Edge
          try {
            window.open(edgeUrl, '_blank');
            setShowInstallDialog(false);
            
            alert(
              '🚀 Abriendo en Microsoft Edge para mejor experiencia!\n\n' +
              'Si no se abre automáticamente, copia la URL y ábrela en Edge.'
            );
            
          } catch (error) {
            console.warn('No se pudo abrir Edge:', error);
            // Edge no está disponible, ofrecer instalarlo
            const installEdge = confirm(
              '💻 Edge no está disponible\n\n' +
              '¿Quieres instalarlo?\n\n' +
              '• Sí = Abrir página de descarga\n' +
              '• No = Usar Chrome directamente'
            );
            
            if (installEdge) {
              window.open('https://www.microsoft.com/edge', '_blank');
            } else {
              installInChrome();
            }
          }
        } else {
          // Usuario prefiere Chrome
          installInChrome();
        }
      }
    } else {
      // Si es Edge o otro navegador, proceder con instalación normal
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
      } else {
        // Fallback para navegadores que no soportan beforeinstallprompt
        alert('Para instalar esta app, usa el menú de tu navegador:\n\n• Chrome: Menú ⋮ > Instalar app\n• Edge: Menú ⋯ > Aplicaciones > Instalar esta aplicación\n• Safari: Compartir > Añadir a pantalla de inicio');
        setShowInstallDialog(false);
      }
    }
  };

  const handleClose = () => {
    setShowInstallDialog(false);
  };

  // Solo mostrar si no está instalado Y se solicita explícitamente
  if (isInstalled || !showInstallDialog) {
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
          borderRadius: isMobile ? 0 : 2,
          backgroundColor: theme.palette.background.paper,
          border: `2px solid ${theme.palette.primary.main}`,
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
        }
      }}
    >
      <DialogTitle sx={{ 
        textAlign: 'center', 
        pb: 2,
        backgroundColor: theme.palette.primary.main,
        color: 'white',
        borderRadius: '8px 8px 0 0'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <img 
            src="/loguitoaudit.png" 
            alt="ControlAudit" 
            style={{ width: 40, height: 40, filter: 'brightness(0) invert(1)' }}
          />
          <Typography variant="h5" component="h2" sx={{ fontWeight: 700, color: 'white' }}>
            Instalar ControlAudit
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ textAlign: 'center', py: 3, px: 3 }}>
        <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.6, color: theme.palette.text.primary }}>
          📱 Instala ControlAudit en tu dispositivo para un acceso más rápido y una mejor experiencia.
        </Typography>
        
        <Box sx={{ 
          backgroundColor: theme.palette.grey[100],
          borderRadius: 2, 
          p: 2, 
          mb: 2,
          border: `1px solid ${theme.palette.grey[300]}`
        }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.primary, mb: 1 }}>
            ✅ Acceso directo desde el escritorio
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.primary, mb: 1 }}>
            ✅ Funciona sin conexión a internet
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.primary, mb: 1 }}>
            ✅ Notificaciones push
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
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
            fontWeight: 600,
            borderColor: theme.palette.grey[400],
            color: theme.palette.text.primary,
            '&:hover': {
              borderColor: theme.palette.grey[600],
              backgroundColor: theme.palette.grey[50]
            }
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
            backgroundColor: theme.palette.primary.main,
            '&:hover': {
              backgroundColor: theme.palette.primary.dark
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
