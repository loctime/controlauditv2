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
      // Intentar abrir Google Play Store directamente
      const playStoreUrl = 'market://details?id=com.microsoft.emmx';
      const playStoreWebUrl = 'https://play.google.com/store/apps/details?id=com.microsoft.emmx';
      
      // Crear un enlace temporal para probar si la app está instalada
      const link = document.createElement('a');
      link.href = playStoreUrl;
      link.style.display = 'none';
      document.body.appendChild(link);
      
      try {
        link.click();
        // Si no se abre la app, abrir la web
        setTimeout(() => {
          window.open(playStoreWebUrl, '_blank');
        }, 1000);
      } catch (error) {
        // Fallback a la web
        window.open(playStoreWebUrl, '_blank');
      } finally {
        document.body.removeChild(link);
      }
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
        setShowButton(false);
      } else {
        console.log('PWA no instalada por el usuario');
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
      
      console.log('=== PWA INSTALL CHECK ===');
      console.log('isStandalone:', isStandalone);
      console.log('isIOSStandalone:', isIOSStandalone);
      console.log('display-mode:', window.matchMedia('(display-mode: standalone)').matches);
      console.log('navigator.standalone:', window.navigator.standalone);
      
      if (isStandalone || isIOSStandalone) {
        setIsInstalled(true);
        console.log('App ya está instalada');
        return;
      }
      console.log('App NO está instalada');
    };

    checkIfInstalled();

    // Escuchar el evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      console.log('=== BEFORE INSTALL PROMPT ===');
      console.log('Evento recibido:', e);
      e.preventDefault();
      setDeferredPrompt(e);
      setShowButton(true);
      console.log('Prompt disponible, mostrando botón');
    };

    // Escuchar cuando se instala la PWA
    const handleAppInstalled = () => {
      console.log('=== APP INSTALLED ===');
      setIsInstalled(true);
      setShowButton(false);
      setDeferredPrompt(null);
    };

    // Verificar si el evento ya se disparó
    console.log('=== PWA HOOK INIT ===');
    console.log('Service Worker disponible:', 'serviceWorker' in navigator);
    console.log('Manifest disponible:', !!document.querySelector('link[rel="manifest"]'));

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
    
    console.log('=== INSTALACIÓN PWA ===');
    console.log('Navegador actual:', isEdge ? 'Edge' : isChrome ? 'Chrome' : 'Otro');
    
    if (isChrome) {
      // Si es Chrome, redirigir a Edge
      console.log('Redirigiendo a Edge para mejor experiencia...');
      
      // Crear URL para Edge con la misma página
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
          'Aceptar = Probar Edge\n' +
          'Cancelar = Instalar en Chrome'
        );
        
        if (userChoice) {
          // Usuario quiere Edge - intentar abrir
          try {
            window.open(edgeUrl, '_blank');
            
            // Verificar si Edge se abrió correctamente
            setTimeout(() => {
              const edgeInstalled = confirm(
                '🚀 ¿Se abrió Edge correctamente?\n\n' +
                '• Sí = Instala la PWA desde Edge\n' +
                '• No = Edge no está instalado'
              );
              
              if (!edgeInstalled) {
                // Edge no está instalado, ofrecer instalarlo
                const installEdge = confirm(
                  '📱 Edge no está instalado\n\n' +
                  '¿Quieres instalarlo desde la tienda?\n\n' +
                  '• Sí = Abrir tienda de aplicaciones\n' +
                  '• No = Instalar en Chrome'
                );
                
                if (installEdge) {
                  openAppStore();
                } else {
                  installInChrome();
                }
              }
            }, 1000);
            
          } catch (error) {
            console.warn('No se pudo abrir Edge:', error);
            // Edge no está disponible, ofrecer instalarlo
            const installEdge = confirm(
              '📱 Edge no está disponible\n\n' +
              '¿Quieres instalarlo desde la tienda?\n\n' +
              '• Sí = Abrir tienda de aplicaciones\n' +
              '• No = Instalar en Chrome'
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
          'Cancelar = Instalar en Chrome'
        );
        
        if (userChoice) {
          // Usuario quiere Edge
          try {
            window.open(edgeUrl, '_blank');
            
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
              '• No = Instalar en Chrome'
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
      // Si es Edge o otro navegador, usar instalación normal
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
    }
  };

  const handleShowInfo = () => {
    // Detectar navegador
    const isEdge = navigator.userAgent.includes('Edg');
    const isChrome = navigator.userAgent.includes('Chrome') && !navigator.userAgent.includes('Edg');
    
    console.log('=== INFO PWA ===');
    console.log('Navegador actual:', isEdge ? 'Edge' : isChrome ? 'Chrome' : 'Otro');
    
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
          console.warn('No se pudo abrir Edge:', error);
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
