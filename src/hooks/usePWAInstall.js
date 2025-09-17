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
