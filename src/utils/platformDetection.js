// src/utils/platformDetection.js
// Detección robusta de plataforma para Capacitor

// Función principal para detectar la plataforma
export const detectPlatform = () => {
  if (typeof window === 'undefined') {
    return 'Unknown';
  }

  console.log('🔍 Detectando plataforma...');
  console.log('- window.Capacitor:', !!window.Capacitor);
  console.log('- window.Capacitor.isNative:', window.Capacitor?.isNative);
  console.log('- window.Capacitor.getPlatform:', typeof window.Capacitor?.getPlatform);
  console.log('- navigator.userAgent:', navigator.userAgent);
  console.log('- window.location.hostname:', window.location.hostname);
  console.log('- window.location.protocol:', window.location.protocol);

  // ✅ PRIORIDAD 1: Verificar Capacitor nativo
  if (window.Capacitor && window.Capacitor.isNative) {
    console.log('📱 Capacitor nativo detectado');
    return 'APK';
  }

  // ✅ PRIORIDAD 2: Verificar Capacitor en general
  if (window.Capacitor) {
    console.log('📱 Capacitor detectado');
    return 'APK';
  }

  // ✅ PRIORIDAD 3: Verificar por User Agent específico de Android
  if (/Android/i.test(navigator.userAgent)) {
    console.log('📱 Android detectado por User Agent');
    return 'APK';
  }

  // ✅ PRIORIDAD 4: Verificar por User Agent móvil
  if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    console.log('📱 iOS detectado por User Agent');
    return 'Mobile Web';
  }

  // ✅ PRIORIDAD 5: Verificar por hostname
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('🌐 Localhost detectado');
    return 'Local Development';
  }

  // ✅ PRIORIDAD 6: Verificar por protocolo
  if (window.location.protocol === 'file:') {
    console.log('📱 Protocolo file: detectado (posible APK)');
    return 'APK';
  }

  console.log('🌐 Navegador web detectado');
  return 'Desktop Web';
};

// Función para verificar si estamos en APK
export const isAPK = () => {
  const platform = detectPlatform();
  return platform === 'APK';
};

// Función para verificar si estamos en Capacitor
export const isCapacitor = () => {
  return typeof window !== 'undefined' && !!window.Capacitor;
};

// Función para obtener información detallada de la plataforma
export const getPlatformInfo = () => {
  return {
    platform: detectPlatform(),
    isAPK: isAPK(),
    isCapacitor: isCapacitor(),
    userAgent: navigator.userAgent,
    hostname: window.location.hostname,
    protocol: window.location.protocol,
    hasCapacitor: typeof window !== 'undefined' && !!window.Capacitor,
    capacitorVersion: window.Capacitor?.getVersion?.(),
    capacitorPlatform: window.Capacitor?.getPlatform?.()
  };
};

export default detectPlatform;
