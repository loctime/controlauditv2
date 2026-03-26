export const isPWAInstalled = () => {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isIOSStandalone = window.navigator.standalone === true;
  return isStandalone || isIOSStandalone;
};
export const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};
export const isPWAMobile = () => isPWAInstalled() && isMobileDevice();
export const shouldEnableOffline = () => {
  // Habilitar offline en móvil y también en PWA instalada de escritorio.
  // Si solo se habilita en móvil, en desktop PWA no se recupera cache al iniciar sin conexión.
  return isMobileDevice() || isPWAInstalled();
};
