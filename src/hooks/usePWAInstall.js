import logger from '@/utils/logger';
import { useState, useEffect } from 'react';
export const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showButton, setShowButton] = useState(false);

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
        logger.debug('PWA instalada por el usuario');
        setShowButton(false);
      } else {
        logger.debug('PWA no instalada por el usuario');
      }
      
      setDeferredPrompt(null);
      setShowButton(false);
    } else {
      alert('Para instalar esta app, usa el menú de tu navegador:\n\n• Chrome: Menú ⋮ > Instalar app\n• Edge: Menú ⋯ > Aplicaciones > Instalar esta aplicación\n• Safari: Compartir > Añadir a pantalla de inicio');
      setShowButton(false);
    }
  };

  useEffect(() => {
    // Verificar si ya está instalado
    const checkIfInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = window.navigator.standalone === true;
      
      logger.debug('=== PWA INSTALL CHECK ===');
      logger.debug('isStandalone:', isStandalone);
      logger.debug('isIOSStandalone:', isIOSStandalone);
      logger.debug('display-mode:', window.matchMedia('(display-mode: standalone)').matches);
      logger.debug('navigator.standalone:', window.navigator.standalone);
      
      if (isStandalone || isIOSStandalone) {
        setIsInstalled(true);
        logger.debug('App ya está instalada');
        return;
      }
      logger.debug('App NO está instalada');
    };

    checkIfInstalled();

    // Escuchar el evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      logger.debug('=== BEFORE INSTALL PROMPT ===');
      logger.debug('Evento recibido:', e);
      e.preventDefault();
      setDeferredPrompt(e);
      setShowButton(true);
      logger.debug('Prompt disponible, mostrando botón');
    };

    // Escuchar cuando se instala la PWA
    const handleAppInstalled = () => {
      logger.debug('=== APP INSTALLED ===');
      setIsInstalled(true);
      setShowButton(false);
      setDeferredPrompt(null);
    };

    // Verificar si el evento ya se disparó
    logger.debug('=== PWA HOOK INIT ===');
    logger.debug('Service Worker disponible:', 'serviceWorker' in navigator);
    logger.debug('Manifest disponible:', !!document.querySelector('link[rel="manifest"]'));

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    // Detectar navegador
    const isEdge = navigator.userAgent.includes('Edg');
    const isChrome = navigator.userAgent.includes('Chrome') && !navigator.userAgent.includes('Edg');
    
    if (isChrome) {
      // Si es Chrome, redirigir a Edge
      logger.debug('Redirigiendo a Edge para mejor experiencia...');
      
      // Crear URL para Edge con la misma página
      const currentUrl = window.location.href;
      const edgeUrl = `microsoft-edge:${currentUrl}`;
      
      // Detectar si es móvil
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobile) {
        // En móvil, mostrar mensaje simple y claro
        const userChoice = confirm(
          '📱 Instalar en Edge para un correcto funcionamiento\n\n' +
          'Aceptar = Abrir en Edge (o ir a tienda)\n' +
          'Cancelar = Continuar en actual'
        );
        
        if (userChoice) {
          // Usuario quiere Edge - mostrar loader mientras verifica
          const loader = document.createElement('div');
          loader.innerHTML = `
            <div style="
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: rgba(0,0,0,0.7);
              display: flex;
              justify-content: center;
              align-items: center;
              z-index: 9999;
              font-family: Arial, sans-serif;
            ">
              <div style="
                background: white;
                padding: 30px;
                border-radius: 10px;
                text-align: center;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
              ">
                <div style="
                  width: 40px;
                  height: 40px;
                  border: 4px solid #f3f3f3;
                  border-top: 4px solid #1976d2;
                  border-radius: 50%;
                  animation: spin 1s linear infinite;
                  margin: 0 auto 20px;
                "></div>
                <p style="margin: 0; font-size: 16px; color: #333;">
                  Verificando Edge...
                </p>
              </div>
            </div>
            <style>
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            </style>
          `;
          document.body.appendChild(loader);
          
          // Intentar abrir Edge
          try {
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = edgeUrl;
            document.body.appendChild(iframe);
            
            setTimeout(() => {
              document.body.removeChild(iframe);
              document.body.removeChild(loader);
              
              // Si no se abrió Edge, ofrecer ir a tienda
              const goToStore = confirm(
                '¿Ir a la tienda para instalar Edge?'
              );
              if (goToStore) {
                openAppStore();
              }
            }, 2000);
            
          } catch (error) {
            // Si hay error, quitar loader y ir directamente a tienda
            document.body.removeChild(loader);
            openAppStore();
          }
        } else {
          // Usuario prefiere continuar en Chrome
          installInChrome();
        }
      } else {
        // En escritorio, mostrar mensaje simple y claro
        const userChoice = confirm(
          '💻 Instalar en Edge para un correcto funcionamiento\n\n' +
          'Aceptar = Abrir en Edge\n' +
          'Cancelar = Continuar en actual'
        );
        
        if (userChoice) {
          // Usuario quiere Edge
          try {
            window.open(edgeUrl, '_blank');
          } catch (error) {
            logger.warn('No se pudo abrir Edge:', error);
            // Si no se puede abrir Edge, ir a descarga
            window.open('https://www.microsoft.com/edge', '_blank');
          }
        } else {
          // Usuario prefiere continuar en Chrome
          installInChrome();
        }
      }
    } else {
      // Si es Edge o otro navegador, usar instalación normal
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          logger.debug('PWA instalada por el usuario');
        } else {
          logger.debug('PWA no instalada por el usuario');
        }
        
        setDeferredPrompt(null);
        setShowButton(false);
      }
    }
  };

  const handleShowInfo = () => {
    // Detectar navegador
    const isEdge = navigator.userAgent.includes('Edg');
    const isChrome = navigator.userAgent.includes('Chrome') && !navigator.userAgent.includes('Edg');
    
    if (isChrome) {
      // Si es Chrome, mostrar información sobre Edge y opción de redirigir
      const userWantsEdge = confirm(
        'Para la mejor experiencia offline, te recomendamos usar Microsoft Edge.\n\n' +
        'Edge maneja mejor:\n' +
        '• Modo offline\n' +
        '• Instalación de PWA\n' +
        '• Cache de datos\n\n' +
        '¿Quieres abrir la app en Edge?'
      );
      
      if (userWantsEdge) {
        const currentUrl = window.location.href;
        const edgeUrl = `microsoft-edge:${currentUrl}`;
        
        try {
          window.open(edgeUrl, '_blank');
          alert('La app se abrirá en Microsoft Edge para mejor experiencia offline.');
        } catch (error) {
          logger.warn('No se pudo abrir Edge:', error);
          alert('No se pudo abrir Edge. Usando la información normal de la app.');
          window.dispatchEvent(new CustomEvent('showPWAInfo'));
        }
      } else {
        // Mostrar información normal
        window.dispatchEvent(new CustomEvent('showPWAInfo'));
      }
    } else {
      // Si es Edge o otro navegador, mostrar información normal
      window.dispatchEvent(new CustomEvent('showPWAInfo'));
    }
  };

  // Para testing: forzar mostrar botón si no está instalado
  const canInstall = !isInstalled && (showButton || deferredPrompt || true); // true para testing

  return {
    deferredPrompt,
    isInstalled,
    showButton,
    handleInstall,
    handleShowInfo,
    canInstall
  };
};
