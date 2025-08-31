// src/utils/authUtils.js

import { getAuthConfig } from './capacitorUtils';

/**
 * Detecta problemas de Cross-Origin y otras limitaciones de popups
 * @returns {boolean} true si hay problemas que requieren redirect
 */
export const hasPopupIssues = () => {
  try {
    // Verificar políticas de seguridad estrictas
    const hasStrictPolicy = 
      document.head.querySelector('meta[http-equiv="Cross-Origin-Opener-Policy"]') ||
      document.head.querySelector('meta[http-equiv="Cross-Origin-Embedder-Policy"]');
    
    if (hasStrictPolicy) {
      console.log('🔒 Políticas de seguridad estrictas detectadas');
      return true;
    }
    
    // Verificar si estamos en un iframe
    if (window !== window.top) {
      console.log('🖼️ Detectado iframe');
      return true;
    }
    
    // Verificar navegadores móviles
    const isMobileBrowser = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobileBrowser) {
      console.log('📱 Navegador móvil detectado');
      return true;
    }
    
    // Verificar si hay errores de Cross-Origin en la consola
    const originalError = console.error;
    let hasCrossOriginError = false;
    
    console.error = (...args) => {
      if (args.some(arg => typeof arg === 'string' && arg.includes('Cross-Origin'))) {
        hasCrossOriginError = true;
        console.log('🔒 Error de Cross-Origin detectado');
      }
      originalError.apply(console, args);
    };
    
    // Restaurar console.error después de un breve delay
    setTimeout(() => {
      console.error = originalError;
    }, 100);
    
    return hasCrossOriginError;
  } catch (error) {
    console.log('Error detectando problemas de popup:', error);
    return true; // En caso de error, usar redirect por seguridad
  }
};

/**
 * Obtiene la configuración de autenticación con detección mejorada de problemas
 * @returns {Object} Configuración de autenticación
 */
export const getImprovedAuthConfig = () => {
  const authConfig = getAuthConfig();
  const hasIssues = hasPopupIssues();
  
  // Si hay problemas detectados, forzar redirect
  if (hasIssues) {
    return {
      ...authConfig,
      useRedirect: true,
      usePopup: false,
      reason: 'Problemas de Cross-Origin o limitaciones detectadas'
    };
  }
  
  return authConfig;
};

/**
 * Función para probar si los popups funcionan correctamente
 * @returns {Promise<boolean>} true si los popups funcionan
 */
export const testPopupSupport = async () => {
  try {
    const testPopup = window.open('', '_blank', 'width=1,height=1');
    if (testPopup) {
      testPopup.close();
      return true;
    }
    return false;
  } catch (error) {
    console.log('Error probando soporte de popups:', error);
    return false;
  }
};

/**
 * Obtiene información detallada sobre el entorno de autenticación
 * @returns {Object} Información del entorno
 */
export const getAuthEnvironmentInfo = () => {
  const authConfig = getImprovedAuthConfig();
  const hasIssues = hasPopupIssues();
  const isCapacitor = authConfig.deviceInfo.isCapacitor;
  
  return {
    isCapacitor,
    hasPopupIssues: hasIssues,
    recommendedMethod: authConfig.useRedirect ? 'redirect' : 'popup',
    reason: authConfig.reason || 'Configuración estándar',
    userAgent: navigator.userAgent,
    platform: authConfig.platform,
    hasStrictPolicies: !!document.head.querySelector('meta[http-equiv="Cross-Origin-Opener-Policy"]'),
    isInIframe: window !== window.top,
    isMobileBrowser: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  };
};

