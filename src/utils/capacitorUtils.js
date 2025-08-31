// src/utils/capacitorUtils.js

/**
 * Detecta si estamos en un entorno Capacitor (APK/App nativa)
 * @returns {boolean} true si estamos en Capacitor, false si estamos en web
 */
export const isCapacitor = () => {
  try {
    // Verificar si Capacitor está disponible
    return !!(window.Capacitor && window.Capacitor.isNative);
  } catch (error) {
    console.log('Error detectando Capacitor:', error);
    return false;
  }
};

/**
 * Detecta si estamos en Android específicamente
 * @returns {boolean} true si estamos en Android
 */
export const isAndroid = () => {
  try {
    if (isCapacitor()) {
      // En Capacitor, verificar la plataforma
      return window.Capacitor.getPlatform() === 'android';
    }
    // En web, verificar User Agent
    return /Android/i.test(navigator.userAgent);
  } catch (error) {
    console.log('Error detectando Android:', error);
    return false;
  }
};

/**
 * Detecta si estamos en iOS específicamente
 * @returns {boolean} true si estamos en iOS
 */
export const isIOS = () => {
  try {
    if (isCapacitor()) {
      return window.Capacitor.getPlatform() === 'ios';
    }
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  } catch (error) {
    console.log('Error detectando iOS:', error);
    return false;
  }
};

/**
 * Obtiene información del dispositivo
 * @returns {Object} Información del dispositivo
 */
export const getDeviceInfo = () => {
  return {
    isCapacitor: isCapacitor(),
    isAndroid: isAndroid(),
    isIOS: isIOS(),
    isWeb: !isCapacitor(),
    userAgent: navigator.userAgent,
    platform: isCapacitor() ? window.Capacitor.getPlatform() : 'web'
  };
};

/**
 * Verifica si el navegador soporta popups
 * @returns {boolean} true si soporta popups
 */
export const supportsPopups = () => {
  try {
    // En Capacitor, los popups no funcionan bien
    if (isCapacitor()) {
      return false;
    }
    
    // En web, verificar si el navegador soporta popups
    const testPopup = window.open('', '_blank', 'width=1,height=1');
    if (testPopup) {
      testPopup.close();
      return true;
    }
    return false;
  } catch (error) {
    console.log('Error verificando soporte de popups:', error);
    return false;
  }
};

/**
 * Obtiene la configuración recomendada para autenticación
 * @returns {Object} Configuración de autenticación
 */
export const getAuthConfig = () => {
  const deviceInfo = getDeviceInfo();
  
  return {
    useRedirect: deviceInfo.isCapacitor || !supportsPopups(),
    usePopup: !deviceInfo.isCapacitor && supportsPopups(),
    platform: deviceInfo.platform,
    deviceInfo
  };
};
