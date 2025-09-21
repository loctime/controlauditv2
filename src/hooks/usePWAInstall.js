import { useState, useEffect } from 'react';

export const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showButton, setShowButton] = useState(false);

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
      
      try {
        // Intentar abrir en Edge
        window.open(edgeUrl, '_blank');
        
        // Mostrar mensaje al usuario
        alert(
          '🚀 Abriendo en Microsoft Edge para mejor experiencia!\n\n' +
          'Edge maneja mejor:\n' +
          '• ✅ Modo offline\n' +
          '• ✅ Instalación de PWA\n' +
          '• ✅ Cache de datos\n\n' +
          'Si no se abre automáticamente, copia la URL y ábrela en Edge.'
        );
        
        // También intentar el prompt normal como fallback
        if (deferredPrompt) {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          
          if (outcome === 'accepted') {
            console.log('PWA instalada en Chrome como fallback');
          } else {
            console.log('PWA no instalada en Chrome');
          }
          
          setDeferredPrompt(null);
          setShowButton(false);
        }
      } catch (error) {
        console.warn('No se pudo abrir Edge, usando instalación normal:', error);
        
        // Fallback a instalación normal
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
