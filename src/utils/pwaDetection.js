/**
 * Utilidades para detectar si estamos en PWA móvil
 */

/**
 * Detecta si la aplicación está instalada como PWA
 */
export const isPWAInstalled = () => {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isIOSStandalone = window.navigator.standalone === true;
  return isStandalone || isIOSStandalone;
};

/**
 * Detecta si estamos en un dispositivo móvil
 */
export const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

/**
 * Detecta si estamos en PWA móvil (la combinación que necesitamos para offline)
 * Solo en este caso habilitamos funcionalidad offline
 */
export const isPWAMobile = () => {
  return isPWAInstalled() && isMobileDevice();
};

/**
 * Determina si debemos habilitar funcionalidad offline
 * Solo en PWA móvil instalada
 */
export const shouldEnableOffline = () => {
  return isPWAMobile();
};

